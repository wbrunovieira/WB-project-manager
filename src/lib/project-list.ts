/**
 * Helpers puros da lista de projetos (busca + paginação client-side de /projects).
 *
 * Ficam fora do componente para serem testáveis: a paginação interage com o
 * drag-and-drop de reordenação, e `POST /api/projects/reorder` grava
 * `sortOrder = índice` sobre o array que recebe — mandar só a fatia visível
 * zeraria a ordem dos projetos que estão em outra página.
 */

export interface SearchableProject {
  name: string;
}

/** Quantos projetos por página em /projects. */
export const PROJECTS_PER_PAGE = 12;

/**
 * Casa o termo contra o nome do projeto (case-insensitive, substring).
 * Termo vazio/só espaços não filtra nada.
 */
export function projectMatchesQuery(
  project: SearchableProject,
  query: string
): boolean {
  const term = query.toLowerCase().trim();
  if (term === "") return true;
  return project.name.toLowerCase().includes(term);
}

/** Número de páginas para `count` itens. Sempre ≥ 1, para não existir "página 0". */
export function pageCount(count: number, perPage = PROJECTS_PER_PAGE): number {
  if (perPage <= 0) return 1;
  return Math.max(1, Math.ceil(count / perPage));
}

/**
 * Prende a página ao intervalo válido. Usado quando o filtro encolhe a lista
 * e a página atual deixa de existir (ex.: estava na 5, busca só tem 1 página).
 */
export function clampPage(page: number, totalPages: number): number {
  if (!Number.isFinite(page)) return 1;
  return Math.min(Math.max(1, Math.trunc(page)), Math.max(1, totalPages));
}

/** Fatia de uma página (1-indexed). */
export function pageSlice<T>(
  items: T[],
  page: number,
  perPage = PROJECTS_PER_PAGE
): T[] {
  const start = (clampPage(page, pageCount(items.length, perPage)) - 1) * perPage;
  return items.slice(start, start + perPage);
}
