import { prisma } from "@/lib/prisma";

/**
 * Quem pode ver o quê — a regra, num lugar só.
 *
 * Antes isto estava escrito à mão em cada rota: 34 trechos em 13 arquivos,
 * todos repetindo "pega os workspaces do usuário e filtra por eles". O custo
 * aparece ao mudar a regra — basta esquecer UM arquivo para vazar dado de
 * cliente, e não há como saber se esqueceu (#3106).
 *
 * A REGRA
 * Um usuário alcança um projeto quando:
 *   a) é membro do WORKSPACE dele — acesso amplo, o caso do dono; ou
 *   b) é membro daquele PROJETO — acesso restrito, o caso do colaborador que
 *      não deve enxergar os outros projetos do workspace.
 *
 * É aditivo de propósito: ninguém que hoje enxerga algo passa a não enxergar.
 * O caminho (b) só acrescenta alcance a quem não tinha nenhum.
 */

/** Workspaces em que o usuário é membro (acesso amplo). */
export async function accessibleWorkspaceIds(userId: string): Promise<string[]> {
  const rows = await prisma.workspaceMember.findMany({
    where: { userId },
    select: { workspaceId: true },
  });
  return rows.map((r) => r.workspaceId);
}

/** Projetos concedidos um a um (acesso restrito), sem contar os do workspace. */
export async function directProjectIds(userId: string): Promise<string[]> {
  const rows = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  });
  return rows.map((r) => r.projectId);
}

export interface Scope {
  workspaceIds: string[];
  projectIds: string[];
}

export async function scopeFor(userId: string): Promise<Scope> {
  const [workspaceIds, projectIds] = await Promise.all([
    accessibleWorkspaceIds(userId),
    directProjectIds(userId),
  ]);
  return { workspaceIds, projectIds };
}

/**
 * Cláusula `where` para qualquer modelo que tenha workspaceId e projectId
 * (Issue, Milestone, Feature). Combine com os filtros da rota usando AND.
 *
 * Um usuário sem nenhum acesso recebe uma cláusula que não casa com nada — e
 * não uma lista vazia em `in`, que em alguns ORMs vira "sem filtro".
 */
export function scopeWhere(scope: Scope): Record<string, unknown> {
  const ors: Record<string, unknown>[] = [];

  if (scope.workspaceIds.length > 0) {
    ors.push({ workspaceId: { in: scope.workspaceIds } });
  }
  if (scope.projectIds.length > 0) {
    ors.push({ projectId: { in: scope.projectIds } });
  }

  // Fail closed: sem alcance nenhum, nada é retornado.
  if (ors.length === 0) return { id: { in: [] } };

  return { OR: ors };
}

/** Atalho: a cláusula de escopo do usuário, já resolvida. */
export async function scopeWhereFor(userId: string): Promise<Record<string, unknown>> {
  return scopeWhere(await scopeFor(userId));
}

/**
 * O usuário alcança este projeto?
 *
 * Usado nas rotas que recebem um projectId e precisam decidir antes de
 * escrever. Uma consulta só, em vez de carregar o projeto e comparar à mão.
 */
export async function canAccessProject(userId: string, projectId: string): Promise<boolean> {
  const direto = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
    select: { id: true },
  });
  if (direto) return true;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { workspaceId: true },
  });
  if (!project) return false;

  return canAccessWorkspace(userId, project.workspaceId);
}

/** O usuário é membro deste workspace? (acesso amplo) */
export async function canAccessWorkspace(userId: string, workspaceId: string): Promise<boolean> {
  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    select: { id: true },
  });
  return Boolean(member);
}
