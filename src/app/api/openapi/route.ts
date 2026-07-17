import { NextResponse } from "next/server";
import { withCors } from "@/lib/api-auth";
// Import estático: o JSON é embutido no bundle standalone do Next. Ler o
// arquivo em runtime com fs quebraria no build standalone (o arquivo fonte não
// é copiado). Rode `pnpm openapi:build` após editar openapi.yaml.
import spec from "../../../../openapi.json";

// Rota pública: serve a spec OpenAPI 3.1 consumida pelo Swagger UI (/api/docs).
export async function GET() {
  return withCors(NextResponse.json(spec));
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}
