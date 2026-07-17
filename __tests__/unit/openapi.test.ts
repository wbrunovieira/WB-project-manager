import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { load } from 'js-yaml';

/**
 * Trava da documentação OpenAPI / Swagger UI.
 *
 * 1. openapi.json (importado pela rota /api/openapi, público) deve estar em
 *    sync com openapi.yaml (a fonte da verdade editável). Falha se alguém
 *    editar o YAML e esquecer de rodar `pnpm openapi:build`.
 * 2. A spec deve ter um `path` para TODA rota de negócio em src/app/api.
 * 3. Sanidade da spec: openapi 3.1.0 + securitySchemes.bearerAuth.
 */

const ROOT = process.cwd();
const yamlPath = path.join(ROOT, 'openapi.yaml');
const jsonPath = path.join(ROOT, 'openapi.json');

const spec = load(fs.readFileSync(yamlPath, 'utf-8')) as {
  openapi: string;
  paths: Record<string, unknown>;
  components?: { securitySchemes?: Record<string, unknown> };
};

describe('spec OpenAPI', () => {
  test('openapi.json está em sync com openapi.yaml (rode `pnpm openapi:build`)', () => {
    expect(fs.existsSync(jsonPath), 'openapi.json não existe — rode `pnpm openapi:build`').toBe(true);
    const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    expect(json).toEqual(spec);
  });

  test('openapi field == 3.1.0 e securitySchemes.bearerAuth existe', () => {
    expect(spec.openapi).toBe('3.1.0');
    expect(spec.components?.securitySchemes?.bearerAuth).toBeDefined();
  });
});

// --- Cobertura: toda rota de negócio precisa aparecer na spec ----------------

const API_DIR = path.join(ROOT, 'src', 'app', 'api');
const ROUTE_FILENAMES = ['route.ts', 'route.tsx', 'route.js', 'route.mjs'];

// Rotas de infra que não documentamos como endpoint de negócio:
// - auth/[...nextauth]: catch-all do NextAuth (não é um path fixo)
// - docs / openapi: a própria infra do Swagger UI
const PATH_EXCLUDE = ['auth/[...nextauth]', 'docs', 'openapi'];

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

function routeDir(file: string): string {
  return path.relative(API_DIR, path.dirname(file)).split(path.sep).join('/');
}

/** src/app/api/issues/[id]/time → /api/issues/{id}/time */
function toSpecPath(dir: string): string {
  const converted = dir.replace(/\[([^\]]+)\]/g, '{$1}');
  return `/api/${converted}`;
}

const routeDirs = findRouteFiles(API_DIR)
  .map(routeDir)
  .filter((dir) => !PATH_EXCLUDE.includes(dir));

describe('cobertura de rotas na spec', () => {
  test.each(routeDirs)('a spec documenta /api/%s', (dir) => {
    const specPath = toSpecPath(dir);
    expect(
      Object.keys(spec.paths),
      `spec não tem o path ${specPath} (rota src/app/api/${dir}/route.ts)`
    ).toContain(specPath);
  });
});
