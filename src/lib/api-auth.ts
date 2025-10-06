import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function withAuth(
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return handler(req, session.user.id);
  };
}

export function withCors(response: NextResponse) {
  // Allow specific origin for credentials support
  // Note: Cannot use "*" with credentials, must specify exact origin
  const origin = process.env.ALLOWED_ORIGIN || "http://localhost:3001";

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Cookie"
  );
  return response;
}
