import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectsListClient } from "@/components/projects/projects-list-client";

type Workspaces = Parameters<
  typeof ProjectsListClient
>[0]["workspacesWithProjects"];

function makeProject(id: string, name: string, sortOrder: number) {
  return {
    id,
    name,
    description: null,
    status: "IN_PROGRESS",
    sortOrder,
    startDate: null,
    targetDate: null,
    workspace: { id: "ws-1", name: "WB Digital", icon: null },
    issues: [],
  };
}

function makeWorkspaces(
  projects: ReturnType<typeof makeProject>[]
): Workspaces {
  return [{ id: "ws-1", name: "WB Digital", icon: null, projects }];
}

describe("ProjectsListClient", () => {
  it("renders the projects it receives", () => {
    render(
      <ProjectsListClient
        workspacesWithProjects={makeWorkspaces([makeProject("p1", "Alpha", 0)])}
      />
    );

    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });

  // Regression: creating a project called router.refresh(), which re-renders the server
  // component with a fresh prop, but the list kept the snapshot taken on mount — so the
  // new card only appeared after a full page reload.
  it("shows a project added by a later RSC payload without remounting", () => {
    const { rerender } = render(
      <ProjectsListClient
        workspacesWithProjects={makeWorkspaces([makeProject("p1", "Alpha", 0)])}
      />
    );

    expect(screen.queryByText("Beta")).not.toBeInTheDocument();

    rerender(
      <ProjectsListClient
        workspacesWithProjects={makeWorkspaces([
          makeProject("p1", "Alpha", 0),
          makeProject("p2", "Beta", 1),
        ])}
      />
    );

    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("drops a deleted project on the next RSC payload", () => {
    const { rerender } = render(
      <ProjectsListClient
        workspacesWithProjects={makeWorkspaces([
          makeProject("p1", "Alpha", 0),
          makeProject("p2", "Beta", 1),
        ])}
      />
    );

    rerender(
      <ProjectsListClient
        workspacesWithProjects={makeWorkspaces([makeProject("p1", "Alpha", 0)])}
      />
    );

    expect(screen.queryByText("Beta")).not.toBeInTheDocument();
  });

  it("reflects a renamed project on the next RSC payload", () => {
    const { rerender } = render(
      <ProjectsListClient
        workspacesWithProjects={makeWorkspaces([makeProject("p1", "Alpha", 0)])}
      />
    );

    rerender(
      <ProjectsListClient
        workspacesWithProjects={makeWorkspaces([
          makeProject("p1", "Alpha renamed", 0),
        ])}
      />
    );

    expect(screen.getByText("Alpha renamed")).toBeInTheDocument();
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
  });

  it("keeps rendering when the same prop identity is passed again", () => {
    const workspaces = makeWorkspaces([makeProject("p1", "Alpha", 0)]);
    const { rerender } = render(
      <ProjectsListClient workspacesWithProjects={workspaces} />
    );

    rerender(<ProjectsListClient workspacesWithProjects={workspaces} />);

    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });
});

describe("ProjectsListClient — busca", () => {
  const projects = [
    makeProject("p1", "Croche com Raquel", 0),
    makeProject("p2", "Padaria Rainha da Massa", 1),
    makeProject("p3", "The Dark Film", 2),
  ];

  async function typeSearch(value: string) {
    const input = screen.getByLabelText("Search projects by name");
    await userEvent.clear(input);
    if (value) await userEvent.type(input, value);
  }

  it("filtra os cards conforme digita, case-insensitive", async () => {
    render(<ProjectsListClient workspacesWithProjects={makeWorkspaces(projects)} />);

    await typeSearch("RAQUEL");

    expect(screen.getByText("Croche com Raquel")).toBeInTheDocument();
    expect(screen.queryByText("Padaria Rainha da Massa")).not.toBeInTheDocument();
    expect(screen.queryByText("The Dark Film")).not.toBeInTheDocument();
  });

  it("mostra o contador de resultados sobre o total", async () => {
    render(<ProjectsListClient workspacesWithProjects={makeWorkspaces(projects)} />);

    expect(screen.getByText("3 projects")).toBeInTheDocument();

    await typeSearch("da");

    expect(screen.getByText("2 of 3 projects")).toBeInTheDocument();
  });

  it("mostra estado vazio próprio quando nada casa, e o botão limpa a busca", async () => {
    render(<ProjectsListClient workspacesWithProjects={makeWorkspaces(projects)} />);

    await typeSearch("nao-existe");

    expect(screen.getByText(/No projects match/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Show all projects" }));

    expect(screen.getByText("Croche com Raquel")).toBeInTheDocument();
    expect(screen.getByText("The Dark Film")).toBeInTheDocument();
  });

  // Com filtro ativo os cards visíveis não são mais uma fatia contígua da ordem do
  // workspace, então soltar um card não teria significado — e /api/projects/reorder
  // grava sortOrder = índice sobre o array recebido.
  it("desliga o drag enquanto há busca ativa", async () => {
    const { container } = render(
      <ProjectsListClient workspacesWithProjects={makeWorkspaces(projects)} />
    );

    expect(container.querySelectorAll(".cursor-grab").length).toBe(3);

    await typeSearch("raquel");

    expect(container.querySelectorAll(".cursor-grab").length).toBe(0);
  });
});

describe("ProjectsListClient — paginação", () => {
  // PROJECTS_PER_PAGE = 12
  const many = Array.from({ length: 14 }, (_, i) =>
    makeProject(`p${i + 1}`, `Projeto ${String(i + 1).padStart(2, "0")}`, i)
  );

  it("mostra só a primeira página e navega para a próxima", async () => {
    render(<ProjectsListClient workspacesWithProjects={makeWorkspaces(many)} />);

    expect(screen.getByText("Projeto 01")).toBeInTheDocument();
    expect(screen.getByText("Projeto 12")).toBeInTheDocument();
    expect(screen.queryByText("Projeto 13")).not.toBeInTheDocument();
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Next/ }));

    expect(screen.getByText("Projeto 13")).toBeInTheDocument();
    expect(screen.getByText("Projeto 14")).toBeInTheDocument();
    expect(screen.queryByText("Projeto 01")).not.toBeInTheDocument();
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
  });

  it("desabilita Previous na primeira página e Next na última", async () => {
    render(<ProjectsListClient workspacesWithProjects={makeWorkspaces(many)} />);

    expect(screen.getByRole("button", { name: /Previous/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Next/ })).toBeEnabled();

    await userEvent.click(screen.getByRole("button", { name: /Next/ }));

    expect(screen.getByRole("button", { name: /Previous/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Next/ })).toBeDisabled();
  });

  it("não mostra controles de paginação quando cabe em uma página", () => {
    render(
      <ProjectsListClient
        workspacesWithProjects={makeWorkspaces(many.slice(0, 5))}
      />
    );

    expect(screen.queryByRole("navigation", { name: "Projects pagination" })).toBeNull();
  });

  it("busca volta para a página 1 e não deixa o usuário preso numa página que sumiu", async () => {
    render(<ProjectsListClient workspacesWithProjects={makeWorkspaces(many)} />);

    await userEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();

    // "Projeto 01" só existe na página 1; buscar por ele tem de mostrá-lo
    await userEvent.type(
      screen.getByLabelText("Search projects by name"),
      "Projeto 01"
    );

    expect(screen.getByText("Projeto 01")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Projects pagination" })).toBeNull();
  });

  it("pagina o resultado filtrado, não a lista inteira", async () => {
    render(<ProjectsListClient workspacesWithProjects={makeWorkspaces(many)} />);

    // "Projeto 1" casa 10..14 → 5 resultados (não "Projeto 01"), cabe numa página
    await userEvent.type(
      screen.getByLabelText("Search projects by name"),
      "Projeto 1"
    );

    expect(screen.getByText("5 of 14 projects")).toBeInTheDocument();
    expect(screen.getByText("Projeto 14")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Projects pagination" })).toBeNull();
  });
});
