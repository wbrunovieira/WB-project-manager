import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { resolveApiKey } from "@/lib/api-key";

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
      // Cada chave tem dono próprio (modelo ApiKey). A chave única de ambiente
      // ainda é aceita como ponte, porque vários agentes externos dependem
      // dela — ver src/lib/api-key.ts e a issue #3105.
      const resolved = await resolveApiKey(authHeader.substring(7));

      if (!resolved) {
        return withCors(NextResponse.json(
          { error: "Invalid API key" },
          { status: 401 }
        ));
      }

      return handler(req, resolved.userId, ctx);
    }

    // Fall back to session-based authentication
    const session = await auth();

    if (!session?.user?.id) {
      return withCors(NextResponse.json(
        { error: "Unauthorized - Please provide valid session cookie or API key in Authorization header" },
        { status: 401 }
      ));
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
