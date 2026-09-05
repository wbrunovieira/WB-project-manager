import { describe, test, expect } from "vitest";
import {
  PROJECTS_PER_PAGE,
  clampPage,
  pageCount,
  pageSlice,
  projectMatchesQuery,
} from "@/lib/project-list";

describe("projectMatchesQuery", () => {
  const project = { name: "Croche-com-raquel-website" };

  test("casa por substring, case-insensitive", () => {
    expect(projectMatchesQuery(project, "croche")).toBe(true);
    expect(projectMatchesQuery(project, "RAQUEL")).toBe(true);
    expect(projectMatchesQuery(project, "website")).toBe(true);
  });

  test("não casa termo ausente", () => {
    expect(projectMatchesQuery(project, "padaria")).toBe(false);
  });

  test("termo vazio ou só espaços não filtra", () => {
    expect(projectMatchesQuery(project, "")).toBe(true);
    expect(projectMatchesQuery(project, "   ")).toBe(true);
  });

  test("ignora espaços nas bordas do termo", () => {
    expect(projectMatchesQuery(project, "  raquel  ")).toBe(true);
  });
});

describe("pageCount", () => {
  test("arredonda para cima", () => {
    expect(pageCount(0, 10)).toBe(1);
    expect(pageCount(1, 10)).toBe(1);
    expect(pageCount(10, 10)).toBe(1);
    expect(pageCount(11, 10)).toBe(2);
    expect(pageCount(25, 10)).toBe(3);
  });

  test("nunca retorna 0 — lista vazia ainda é 'página 1 de 1'", () => {
    expect(pageCount(0)).toBe(1);
  });
});

describe("clampPage", () => {
  test("prende ao intervalo válido", () => {
    expect(clampPage(0, 3)).toBe(1);
    expect(clampPage(-5, 3)).toBe(1);
    expect(clampPage(2, 3)).toBe(2);
    expect(clampPage(9, 3)).toBe(3);
  });

  test("o filtro encolheu a lista: página 5 vira a última existente", () => {
    expect(clampPage(5, 1)).toBe(1);
  });

  test("valor não finito cai para 1", () => {
    expect(clampPage(NaN, 3)).toBe(1);
  });
});

describe("pageSlice", () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);

  test("fatia 1-indexed", () => {
    expect(pageSlice(items, 1, 10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(pageSlice(items, 2, 10)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(pageSlice(items, 3, 10)).toEqual([21, 22, 23, 24, 25]);
  });

  test("página fora do intervalo é presa antes de fatiar (nunca devolve vazio à toa)", () => {
    expect(pageSlice(items, 99, 10)).toEqual([21, 22, 23, 24, 25]);
    expect(pageSlice(items, 0, 10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  test("as páginas juntas cobrem a lista inteira, sem repetir nem perder item", () => {
    const total = pageCount(items.length, PROJECTS_PER_PAGE);
    const rebuilt = Array.from({ length: total }, (_, i) =>
      pageSlice(items, i + 1, PROJECTS_PER_PAGE)
    ).flat();
    expect(rebuilt).toEqual(items);
  });
});
