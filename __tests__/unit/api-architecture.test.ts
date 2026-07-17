import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Teste de arquitetura: trava o padrão de autenticação da API.
 *
 * Toda rota de negócio em src/app/api deve usar o wrapper withAuth
 * (que aceita API key Bearer E sessão). Auth inline com `await auth()`
 * é proibido — impede regressão futura por qualquer agente/dev.
 *
 * Allowlist (rotas públicas por design):
 * - health: health check do deploy
 * - auth/: NextAuth, register, signout
 * - docs: página Swagger UI (HTML público)
 * - openapi: serve a spec OpenAPI (JSON público)
 */
const API_DIR = path.join(process.cwd(), 'src', 'app', 'api');
const ALLOWLIST = ['health', 'auth/', 'docs', 'openapi'];

const ROUTE_FILENAMES = ['route.ts', 'route.tsx', 'route.js', 'route.mjs'];

function findRouteFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findRouteFiles(fullPath));
    } else if (ROUTE_FILENAMES.includes(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

function relativeApiPath(file: string): string {
  return path.relative(API_DIR, file).split(path.sep).join('/');
}

function isAllowlisted(relPath: string): boolean {
  return ALLOWLIST.some((prefix) => relPath.startsWith(prefix));
}

describe('arquitetura da API', () => {
  const routeFiles = findRouteFiles(API_DIR);
  const businessRoutes = routeFiles.filter(
    (file) => !isAllowlisted(relativeApiPath(file))
  );

  test('encontra rotas de negócio para validar', () => {
    expect(businessRoutes.length).toBeGreaterThan(0);
  });

  test.each(businessRoutes.map((file) => [relativeApiPath(file), file]))(
    'rota %s usa withAuth e não usa auth inline',
    (_relPath, file) => {
      const content = fs.readFileSync(file, 'utf-8');

      // Qualquer import de auth de sessão é proibido em rota de negócio —
      // cobre await auth(), auth() sem await e getServerSession, que uma
      // checagem por substring da chamada deixaria passar.
      expect(
        content,
        `${_relPath} não pode importar @/lib/auth (use withAuth de @/lib/api-auth)`
      ).not.toMatch(/from\s+["']@\/lib\/auth["']/);
      expect(
        content,
        `${_relPath} não pode usar getServerSession`
      ).not.toMatch(/getServerSession/);

      // Todo método de negócio exportado deve sair embrulhado em withAuth;
      // OPTIONS (preflight CORS) é a única exceção.
      const exportedMethods = [
        ...content.matchAll(
          /export\s+(?:const|async\s+function)\s+(GET|POST|PUT|PATCH|DELETE)\b/g
        ),
      ].map((m) => m[1]);
      expect(
        exportedMethods.length,
        `${_relPath} não exporta nenhum método HTTP`
      ).toBeGreaterThan(0);

      for (const method of exportedMethods) {
        expect(
          content,
          `${_relPath}: ${method} deve ser exportado como withAuth(...) — ` +
            `"export const ${method} = withAuth"`
        ).toMatch(new RegExp(`export\\s+const\\s+${method}\\s*=\\s*withAuth`));
      }
    }
  );

  test('endpoint inseguro /api/generate-token não existe', () => {
    const generateTokenDir = path.join(API_DIR, 'generate-token');
    expect(fs.existsSync(generateTokenDir)).toBe(false);
  });
});
