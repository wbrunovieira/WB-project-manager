import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Authenticate via API Key (Bearer token) or Session Cookie
 *
 * Supports two authentication methods:
 * 1. API Key: Authorization: Bearer <api-key>
 * 2. Session Cookie: Cookie: next-auth.session-token=<token>
 */
export function withAuth(
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    // Try API Key authentication first
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const apiKey = authHeader.substring(7);

      // Hash the API key to compare with stored hash
      const hashedKey = crypto.createHash("sha256").update(apiKey).digest("hex");

      // Check if API key matches environment variable
      const validApiKey = process.env.API_KEY;
      if (validApiKey) {
        const validHashedKey = crypto.createHash("sha256").update(validApiKey).digest("hex");
        if (hashedKey === validHashedKey) {
          // Use default user ID from environment or first user
          const userId = process.env.API_KEY_USER_ID || "cmge96f1y0000wa7olxm69prv";
          return handler(req, userId);
        }
      }

      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }

    // Fall back to session-based authentication
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please provide valid session cookie or API key in Authorization header" },
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
