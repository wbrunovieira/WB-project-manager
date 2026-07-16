import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Authenticate via API Key (Bearer token) or Session Cookie
 *
 * Supports two authentication methods:
 * 1. API Key: Authorization: Bearer <api-key>
 * 2. Session Cookie: Cookie: next-auth.session-token=<token>
 *
 * The route context (2nd argument the App Router passes to dynamic route
 * handlers, e.g. `{ params: Promise<{ id: string }> }`) is forwarded to the
 * handler untouched, so static and dynamic routes share the same wrapper.
 */
export function withAuth<C = unknown>(
  handler: (req: NextRequest, userId: string, ctx: C) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx: C) => {
    // Try API Key authentication first
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const apiKey = authHeader.substring(7);
      const validApiKey = process.env.API_KEY;

      // SHA-256 both sides (fixed-length buffers) and compare in constant
      // time — string equality would leak match length via timing.
      if (validApiKey) {
        const hashedKey = crypto.createHash("sha256").update(apiKey).digest();
        const validHashedKey = crypto.createHash("sha256").update(validApiKey).digest();
        if (crypto.timingSafeEqual(hashedKey, validHashedKey)) {
          const userId = process.env.API_KEY_USER_ID || "cmge96f1y0000wa7olxm69prv";
          return handler(req, userId, ctx);
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

    return handler(req, session.user.id, ctx);
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
