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

        // Força bruta era barrada pela Authelia, na porta; saindo dela, é aqui.
        //
        // O limite é POR IP, e só. Uma versão anterior também bloqueava por
        // e-mail, antes de verificar a senha — e isso dava a qualquer um que
        // soubesse o e-mail do dono (está no git log, repo público) o poder de
        // errar 5 senhas a cada 15 min e trancar o único usuário para fora, de
        // qualquer IP, de graça. Trocava um ataque improvável (botnet contra
        // senha forte) por um DoS trivial.
        //
        // O que isto protege: um atacante varrendo senhas de um IP é contido, e
        // o servidor não gasta bcrypt à toa.
        // O que NÃO protege: ataque distribuído contra uma conta específica,
        // onde cada IP tenta poucas vezes. A defesa ali é a força da senha (e,
        // se um dia fizer sentido, 2FA) — não um contador que também serviria
        // para trancar o dono.
        const ip = clientIp(new Headers(request?.headers));
        const byIp = `login:ip:${ip}`;

        if (!loginLimiter.check(byIp).allowed) {
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

        // Entrou: zera o contador do IP, para erros de digitação anteriores não
        // se somarem ao uso legítimo seguinte.
        loginLimiter.reset(byIp);

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
