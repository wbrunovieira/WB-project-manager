import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withCors } from "@/lib/api-auth";
import { z } from "zod";

const bulkIssueSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  statusId: z.string(),
  projectId: z.string().optional(),
  milestoneId: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW", "NO_PRIORITY"]).optional(),
  type: z.enum(["FEATURE", "MAINTENANCE", "BUG", "IMPROVEMENT"]).default("FEATURE"),
  reportedAt: z.string().optional().transform((val) => {
    if (!val || val === "") return "";
    if (val.includes("Z") || val.match(/[+-]\d{2}:\d{2}$/)) {
      return val;
    }
    if (val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
      return `${val}:00.000Z`;
    }
    if (val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
      return `${val}.000Z`;
    }
    return val;
  }),
  labelIds: z.array(z.string()).optional(),
});

const bulkCreateSchema = z.object({
  workspaceId: z.string(),
  issues: z.array(bulkIssueSchema).min(1, "At least one issue is required").max(100, "Maximum 100 issues per request"),
});

// POST /api/issues/bulk - Create multiple issues at once
export const POST = withAuth(async (req: NextRequest, userId: string) => {
  try {
    const body = await req.json();
    console.log("Creating bulk issues with body:", body);
    const validated = bulkCreateSchema.safeParse(body);

    if (!validated.success) {
      console.log("Validation failed:", validated.error);
      const response = NextResponse.json(
        {
          error: validated.error?.issues?.[0]?.message || "Validation failed",
          details: validated.error?.issues || []
        },
        { status: 400 }
      );
      return withCors(response);
    }

    const { workspaceId, issues } = validated.data;

    // Check if user has access to workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (!workspaceMember) {
      const response = NextResponse.json(
        { error: "Access denied to workspace" },
        { status: 403 }
      );
      return withCors(response);
    }

    // Get all existing issues to determine next identifier
    const existingIssues = await prisma.issue.findMany({
      where: { workspaceId },
      select: { identifier: true },
      orderBy: { identifier: "desc" },
    });

    let nextNumber = 1;
    if (existingIssues.length > 0) {
      const identifierNumbers = existingIssues
        .map((issue) => parseInt(issue.identifier, 10))
        .filter((num) => !isNaN(num));

      if (identifierNumbers.length > 0) {
        nextNumber = Math.max(...identifierNumbers) + 1;
      }
    }

    // Create all issues in a transaction
    const createdIssues = await prisma.$transaction(async (tx) => {
      const results = [];

      for (let i = 0; i < issues.length; i++) {
        const issueData = issues[i];
        const { labelIds, reportedAt, ...data } = issueData;
        const identifier = (nextNumber + i).toString();

        const issue = await tx.issue.create({
          data: {
            ...data,
            workspaceId,
            identifier,
            creatorId: userId,
            reportedAt: reportedAt && reportedAt !== "" ? new Date(reportedAt) : undefined,
            labels: labelIds
              ? {
                  create: labelIds.map((labelId) => ({
                    labelId,
                  })),
                }
              : undefined,
          },
          include: {
            status: true,
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
                avatar: true,
              },
            },
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            labels: {
              include: {
                label: true,
              },
            },
          },
        });

        results.push(issue);
      }

      return results;
    });

    const response = NextResponse.json(
      {
        success: true,
        count: createdIssues.length,
        issues: createdIssues,
      },
      { status: 201 }
    );
    return withCors(response);
  } catch (error) {
    console.error("Error creating bulk issues:", error);
    const response = NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
    return withCors(response);
  }
});

// OPTIONS handler for CORS
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return withCors(response);
}
