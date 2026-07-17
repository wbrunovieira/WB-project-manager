/**
 * Declaração ambiente mínima para js-yaml.
 *
 * O pacote js-yaml está disponível (dep transitiva) mas @types/js-yaml não pôde
 * ser instalado neste ambiente (rede restrita). Como o `next build` typecheca
 * tudo em tsconfig `include` (**\/*.ts), declaramos aqui só o que usamos.
 * Se @types/js-yaml for instalado depois, remova este arquivo para evitar
 * conflito de declaração.
 */
declare module "js-yaml" {
  export function load(input: string): unknown;
  export function dump(obj: unknown, opts?: Record<string, unknown>): string;
}
