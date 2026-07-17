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
 */
const API_DIR = path.join(process.cwd(), 'src', 'app', 'api');
const ALLOWLIST = ['health', 'auth/'];

function findRouteFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findRouteFiles(fullPath));
    } else if (entry.name === 'route.ts') {
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

      expect(content, `${_relPath} não pode chamar await auth() inline`).not.toMatch(
        /await\s+auth\s*\(\s*\)/
      );
      expect(content, `${_relPath} deve usar o wrapper withAuth`).toMatch(
        /withAuth/
      );
    }
  );

  test('endpoint inseguro /api/generate-token não existe', () => {
    const generateTokenDir = path.join(API_DIR, 'generate-token');
    expect(fs.existsSync(generateTokenDir)).toBe(false);
  });
});
