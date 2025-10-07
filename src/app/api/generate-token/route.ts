import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Simple check - just for token generation
    // In production, you'd verify credentials properly
    if (email !== "bruno@wbdigitalsolutions.com" || password !== process.env.SEED_USER_PASSWORD) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "AUTH_SECRET not configured" }, { status: 500 });
    }

    const token = await encode({
      token: {
        id: "cmge96f1y0000wa7olxm69prv",
        email: "bruno@wbdigitalsolutions.com",
        name: "Bruno Vieira",
      },
      secret,
      salt: "authjs.session-token",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json({
      token,
      usage: {
        curl: `Cookie: next-auth.session-token=${token}`,
        header: {
          "Cookie": `next-auth.session-token=${token}`
        }
      }
    });
  } catch (error) {
    console.error("Error generating token:", error);
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
  }
}
