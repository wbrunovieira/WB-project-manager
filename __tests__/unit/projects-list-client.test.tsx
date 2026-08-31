import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
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
