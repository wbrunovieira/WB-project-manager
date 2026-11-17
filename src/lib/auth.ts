import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { clientIp, loginLimiter } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const validated = loginSchema.safeParse(credentials);

        if (!validated.success) {
          return null;
        }

        const { email, password } = validated.data;

        // Força bruta era barrada pela Authelia, na porta. Saindo dela, é aqui.
        // Duas chaves: por IP (um atacante varrendo senhas) e por e-mail (um
        // botnet distribuído martelando a MESMA conta de vários IPs). Qualquer
        // uma estourando já recusa.
        const ip = clientIp(new Headers(request?.headers));
        const byIp = `login:ip:${ip}`;
        const byEmail = `login:email:${email.toLowerCase()}`;

        if (!loginLimiter.check(byIp).allowed || !loginLimiter.check(byEmail).allowed) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        // Entrou: zera as contagens, para o uso legítimo não acumular com as
        // tentativas erradas de antes.
        loginLimiter.reset(byIp);
        loginLimiter.reset(byEmail);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
