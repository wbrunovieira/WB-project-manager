import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Resolução de chave de API para usuário.
 *
 * Antes existia UMA chave no sistema, presa a um usuário por env — quem a
 * usasse ERA aquele usuário. Isso inviabiliza colaboração: um segundo agente
 * com a chave age como o dono, e nenhuma restrição por projeto ou assignee se
 * aplica a ele (issue #3105).
 *
 * Agora cada chave é uma linha com dono próprio. A chave antiga continua
 * funcionando DE PROPÓSITO: ~15 Claudes de outros projetos dependem dela, e
 * trocar o mecanismo sem ponte derrubaria todos de uma vez. Ela sai em issue
 * separada, depois que cada um migrar.
 */

/** Grava lastUsedAt no máximo a cada 5 min — auditoria não vale um write por request. */
const USO_THROTTLE_MS = 5 * 60 * 1000;

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/** Gera uma chave nova. 32 bytes de aleatoriedade: não é adivinhável. */
export function generateApiKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

export interface ResolvedKey {
  userId: string;
  /** id da linha ApiKey, ou null quando veio da chave de ambiente (legado). */
  apiKeyId: string | null;
}

/**
 * Resolve a chave apresentada para um usuário, ou null se não vale.
 *
 * A busca é por igualdade de hash num índice único, então não há comparação
 * byte a byte a proteger: o atacante não aprende nada com o tempo de resposta,
 * ao contrário do que acontece ao comparar strings.
 */
export async function resolveApiKey(presented: string): Promise<ResolvedKey | null> {
  const legado = resolveLegacyEnvKey(presented);
  if (legado) return legado;

  const record = await prisma.apiKey.findUnique({
    where: { hash: hashApiKey(presented) },
    select: { id: true, userId: true, revokedAt: true, lastUsedAt: true },
  });

  if (!record || record.revokedAt) return null;

  await touchLastUsed(record.id, record.lastUsedAt);
  return { userId: record.userId, apiKeyId: record.id };
}

/**
 * Ponte para a chave única de ambiente.
 *
 * Mantém a comparação em tempo constante do código original: aqui a
 * verificação É byte a byte contra um segredo conhecido, então o tempo de
 * resposta vazaria o tamanho do prefixo correto.
 */
function resolveLegacyEnvKey(presented: string): ResolvedKey | null {
  const configured = process.env.API_KEY;
  const userId = process.env.API_KEY_USER_ID;
  if (!configured || !userId) return null;

  const a = crypto.createHash("sha256").update(presented).digest();
  const b = crypto.createHash("sha256").update(configured).digest();
  if (!crypto.timingSafeEqual(a, b)) return null;

  return { userId, apiKeyId: null };
}

async function touchLastUsed(id: string, lastUsedAt: Date | null): Promise<void> {
  const agora = Date.now();
  if (lastUsedAt && agora - lastUsedAt.getTime() < USO_THROTTLE_MS) return;

  // Auditoria não pode derrubar a requisição: se o write falhar, o acesso
  // legítimo continua.
  try {
    await prisma.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date(agora) },
    });
  } catch {
    // ignorado de propósito
  }
}
