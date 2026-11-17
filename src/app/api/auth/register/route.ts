import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { clientIp, registerLimiter } from "@/lib/rate-limit";

/**
 * Cadastro público é FECHADO por padrão.
 *
 * Até agora só a Authelia impedia que qualquer um na internet criasse conta
 * aqui; com o app saindo dela (#2889), esta rota passaria a ser uma porta
 * aberta. Os dados seguem protegidos — conta nova nasce sem vínculo de
 * workspace e as consultas filtram por isso —, mas o visitante ganharia sessão
 * autenticada e poderia criar workspaces no servidor alheio.
 *
 * Para liberar temporariamente (convidar alguém), defina ALLOW_REGISTRATION=true
 * e volte para false depois.
 */
function registrationAllowed(): boolean {
  return process.env.ALLOW_REGISTRATION === "true";
}

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
  try {
    if (!registrationAllowed()) {
      return NextResponse.json(
        { error: "Registration is closed" },
        { status: 403 }
      );
    }

    // Antes de qualquer trabalho: cadastro é operação rara, e um laço
    // automatizado aqui enche o banco.
    const ip = clientIp(req.headers);
    const limit = registerLimiter.check(`register:${ip}`);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const body = await req.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { name, email, password } = validated.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
