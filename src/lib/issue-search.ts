/**
 * Predicado puro de busca de issues (usado pelo filtro client-side do board).
 *
 * Normaliza o termo (trim, lowercase, remove UM `#` inicial) e casa contra
 * identifier, título, descrição e nome/email do assignee. Remover o `#` é o
 * fix do bug em que buscar "#353" nunca achava a issue #353 (o identifier é
 * armazenado como "353", sem o "#").
 */
export interface SearchableIssue {
  identifier: string | number;
  title?: string | null;
  description?: string | null;
  assignee?: { name?: string | null; email?: string | null } | null;
}

export function issueMatchesQuery(issue: SearchableIssue, query: string): boolean {
  let term = query.toLowerCase().trim();
  if (term === "") return true; // sem termo → não filtra

  // Remove um único "#" inicial: "#353" → "353".
  if (term.startsWith("#")) term = term.slice(1);
  if (term === "") return false; // "#" sozinho não casa tudo

  const identifier = issue.identifier?.toString().toLowerCase() ?? "";
  return (
    identifier.includes(term) ||
    (issue.title?.toLowerCase().includes(term) ?? false) ||
    (issue.description?.toLowerCase().includes(term) ?? false) ||
    (issue.assignee?.name?.toLowerCase().includes(term) ?? false) ||
    (issue.assignee?.email?.toLowerCase().includes(term) ?? false)
  );
}
