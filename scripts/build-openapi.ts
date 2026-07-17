/**
 * Gera openapi.json a partir de openapi.yaml (a fonte da verdade editável).
 *
 * A rota /api/openapi importa o JSON estaticamente para que ele seja embutido
 * no bundle standalone do Next (ler o arquivo em runtime com fs quebraria no
 * build standalone). Rode este script sempre que editar openapi.yaml:
 *
 *   pnpm openapi:build
 *
 * O gate `prebuild` (package.json) roda isto antes de `next build`, e o teste
 * __tests__/unit/openapi.test.ts falha se o JSON estiver fora de sync com o
 * YAML — garantindo que ninguém esqueça de regenerar.
 */
import fs from "node:fs";
import path from "node:path";
import { load } from "js-yaml";

const root = path.resolve(__dirname, "..");
const yamlPath = path.join(root, "openapi.yaml");
const jsonPath = path.join(root, "openapi.json");

const spec = load(fs.readFileSync(yamlPath, "utf8"));
fs.writeFileSync(jsonPath, `${JSON.stringify(spec, null, 2)}\n`);

console.log(`openapi.json gerado a partir de openapi.yaml (${yamlPath})`);
