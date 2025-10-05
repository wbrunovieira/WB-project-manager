import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Circle, CircleDot, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default async function MyIssuesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get all issues assigned to or created by the user
  const issues = await prisma.issue.findMany({
    where: {
      OR: [
        { assigneeId: session.user.id },
        { creatorId: session.user.id },
      ],
    },
    include: {
      status: true,
      team: {
        select: {
          id: true,
          name: true,
          key: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Separate issues into assigned and created
  const assignedToMe = issues.filter((issue) => issue.assigneeId === session.user.id);
  const createdByMe = issues.filter((issue) => issue.creatorId === session.user.id);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "text-red-600";
      case "HIGH":
        return "text-orange-600";
      case "MEDIUM":
        return "text-yellow-600";
      case "LOW":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return <AlertCircle className="h-4 w-4" />;
      case "HIGH":
        return <CircleDot className="h-4 w-4" />;
      case "MEDIUM":
        return <Circle className="h-4 w-4" />;
      case "LOW":
        return <Circle className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (statusType: string) => {
    switch (statusType) {
      case "DONE":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "CANCELED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Issues</h1>
        <p className="mt-2 text-gray-600">
          {assignedToMe.length} assigned to me, {createdByMe.length} created by me
        </p>
      </div>

      {/* Assigned to Me */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Assigned to me</h2>

        {assignedToMe.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-gray-600">No issues assigned to you</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Issue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Project
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {assignedToMe.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/issues/${issue.id}`}
                        className="group flex items-center gap-2"
                      >
                        {getStatusIcon(issue.status.type)}
                        <span className="font-mono text-xs text-gray-500">
                          {issue.team.key}-{issue.identifier}
                        </span>
                        <span className="text-sm text-gray-900 group-hover:text-blue-600">
                          {issue.title}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{issue.status.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1 text-sm ${getPriorityColor(issue.priority)}`}>
                        {getPriorityIcon(issue.priority)}
                        <span>{issue.priority.replace("_", " ")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {issue.project ? (
                        <Link
                          href={`/projects/${issue.project.id}`}
                          className="text-sm text-gray-600 hover:text-blue-600"
                        >
                          {issue.project.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-400">No project</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Created by Me */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Created by me</h2>

        {createdByMe.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-gray-600">No issues created by you</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Issue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Assignee
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {createdByMe.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/issues/${issue.id}`}
                        className="group flex items-center gap-2"
                      >
                        {getStatusIcon(issue.status.type)}
                        <span className="font-mono text-xs text-gray-500">
                          {issue.team.key}-{issue.identifier}
                        </span>
                        <span className="text-sm text-gray-900 group-hover:text-blue-600">
                          {issue.title}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{issue.status.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1 text-sm ${getPriorityColor(issue.priority)}`}>
                        {getPriorityIcon(issue.priority)}
                        <span>{issue.priority.replace("_", " ")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {issue.assignee ? (
                        <span className="text-sm text-gray-600">
                          {issue.assignee.name || issue.assignee.email}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Unassigned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
