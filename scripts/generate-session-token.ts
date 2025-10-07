import { encode } from "next-auth/jwt";

async function generateToken() {
  const secret = process.env.AUTH_SECRET || "your-secret-key-here-change-in-production";

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

  console.log("\n🔑 Token de Sessão Gerado:\n");
  console.log(token);
  console.log("\n📋 Use este token no header Cookie:");
  console.log(`Cookie: next-auth.session-token=${token}`);
  console.log("\n");
}

generateToken().catch(console.error);
