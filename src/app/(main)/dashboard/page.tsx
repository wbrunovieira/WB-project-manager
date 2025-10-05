import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get user's issues
  const issues = await prisma.issue.findMany({
    where: {
      assigneeId: session.user.id,
    },
    include: {
      status: true,
      project: true,
      labels: {
        include: {
          label: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session.user.name?.split(" ")[0]}!
        </h1>
        <p className="mt-2 text-gray-600">
          You have {issues.length} issue{issues.length !== 1 ? "s" : ""}{" "}
          assigned to you
        </p>
      </div>

      <div className="grid gap-6">
        {issues.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
            <p className="text-gray-600">No issues assigned to you yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="group flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm font-mono text-gray-500">
                    #{issue.identifier}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {issue.title}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {issue.labels.map((issueLabel) => (
                    <span
                      key={issueLabel.labelId}
                      className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `${issueLabel.label.color}20`,
                        color: issueLabel.label.color,
                      }}
                    >
                      {issueLabel.label.name}
                    </span>
                  ))}

                  <span
                    className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: `${issue.status.color}20`,
                      color: issue.status.color,
                    }}
                  >
                    {issue.status.name}
                  </span>

                  <span className="text-xs text-gray-500">
                    {issue.priority !== "NO_PRIORITY" && (
                      <span
                        className={
                          issue.priority === "URGENT"
                            ? "text-red-600"
                            : issue.priority === "HIGH"
                            ? "text-orange-600"
                            : issue.priority === "MEDIUM"
                            ? "text-blue-600"
                            : "text-gray-500"
                        }
                      >
                        {issue.priority}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
