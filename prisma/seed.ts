import { PrismaClient, StatusType, Priority } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Get credentials from environment variables
  const userName = process.env.SEED_USER_NAME;
  const userEmail = process.env.SEED_USER_EMAIL;
  const userPassword = process.env.SEED_USER_PASSWORD;

  if (!userName || !userEmail || !userPassword) {
    throw new Error(
      "Missing seed user credentials. Please check .env file for SEED_USER_NAME, SEED_USER_EMAIL, and SEED_USER_PASSWORD"
    );
  }

  // Create user
  const hashedPassword = await bcrypt.hash(userPassword, 10);

  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      email: userEmail,
      name: userName,
      password: hashedPassword,
    },
  });

  console.log("✅ Created user:", user.name);

  // Create workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: "wb-digital" },
    update: {},
    create: {
      name: "WB Digital Solutions",
      slug: "wb-digital",
      icon: "🚀",
    },
  });

  console.log("✅ Created workspace:", workspace.name);

  // Add user to workspace as owner
  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId: workspace.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      workspaceId: workspace.id,
      role: "OWNER",
    },
  });

  console.log("✅ Added user to workspace");

  // Create default statuses
  const statuses = [
    { name: "Backlog", type: StatusType.BACKLOG, position: 0, color: "#94a3b8" },
    { name: "Todo", type: StatusType.TODO, position: 1, color: "#64748b" },
    { name: "In Progress", type: StatusType.IN_PROGRESS, position: 2, color: "#3b82f6" },
    { name: "Done", type: StatusType.DONE, position: 3, color: "#10b981" },
    { name: "Canceled", type: StatusType.CANCELED, position: 4, color: "#6b7280" },
  ];

  for (const status of statuses) {
    await prisma.status.upsert({
      where: {
        workspaceId_name: {
          workspaceId: workspace.id,
          name: status.name,
        },
      },
      update: {},
      create: {
        ...status,
        workspaceId: workspace.id,
      },
    });
  }

  console.log("✅ Created default statuses");

  // Create team
  const team = await prisma.team.upsert({
    where: {
      workspaceId_key: {
        workspaceId: workspace.id,
        key: "ENG",
      },
    },
    update: {},
    create: {
      name: "Engineering",
      key: "ENG",
      icon: "⚙️",
      workspaceId: workspace.id,
    },
  });

  console.log("✅ Created team:", team.name);

  // Add user to team
  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      teamId: team.id,
      userId: user.id,
    },
  });

  console.log("✅ Added user to team");

  // Create labels
  const labels = [
    { name: "Bug", color: "#ef4444" },
    { name: "Feature", color: "#8b5cf6" },
    { name: "Enhancement", color: "#3b82f6" },
    { name: "Documentation", color: "#10b981" },
  ];

  for (const label of labels) {
    await prisma.label.upsert({
      where: {
        workspaceId_name: {
          workspaceId: workspace.id,
          name: label.name,
        },
      },
      update: {},
      create: {
        ...label,
        workspaceId: workspace.id,
      },
    });
  }

  console.log("✅ Created labels");

  // Create project
  const project = await prisma.project.upsert({
    where: { id: "wb-project-1" },
    update: {},
    create: {
      id: "wb-project-1",
      name: "Product Launch Q1",
      description: "Launch our new product features",
      status: "IN_PROGRESS",
      workspaceId: workspace.id,
      startDate: new Date("2025-01-01"),
      targetDate: new Date("2025-03-31"),
    },
  });

  console.log("✅ Created project:", project.name);

  // Get statuses for issue creation
  const todoStatus = await prisma.status.findFirst({
    where: { workspaceId: workspace.id, type: "TODO" },
  });

  const inProgressStatus = await prisma.status.findFirst({
    where: { workspaceId: workspace.id, type: "IN_PROGRESS" },
  });

  const doneStatus = await prisma.status.findFirst({
    where: { workspaceId: workspace.id, type: "DONE" },
  });

  if (!todoStatus || !inProgressStatus || !doneStatus) {
    throw new Error("Required statuses not found");
  }

  // Create sample issues
  const issues = [
    {
      identifier: "ENG-1",
      title: "Setup authentication system",
      description: "Implement NextAuth.js with credentials provider",
      priority: Priority.HIGH,
      statusId: doneStatus.id,
      sortOrder: 1,
    },
    {
      identifier: "ENG-2",
      title: "Create database schema",
      description: "Design and implement Prisma schema for all models",
      priority: Priority.HIGH,
      statusId: doneStatus.id,
      sortOrder: 2,
    },
    {
      identifier: "ENG-3",
      title: "Build issue list view",
      description: "Create a responsive list view for issues with filtering",
      priority: Priority.URGENT,
      statusId: inProgressStatus.id,
      sortOrder: 3,
    },
    {
      identifier: "ENG-4",
      title: "Implement command palette",
      description: "Add keyboard-driven command palette using cmdk",
      priority: Priority.MEDIUM,
      statusId: todoStatus.id,
      sortOrder: 4,
    },
    {
      identifier: "ENG-5",
      title: "Add project management",
      description: "Create UI for managing projects and milestones",
      priority: Priority.MEDIUM,
      statusId: todoStatus.id,
      sortOrder: 5,
    },
  ];

  for (const issue of issues) {
    await prisma.issue.upsert({
      where: {
        teamId_identifier: {
          teamId: team.id,
          identifier: issue.identifier,
        },
      },
      update: {},
      create: {
        ...issue,
        teamId: team.id,
        projectId: project.id,
        creatorId: user.id,
        assigneeId: user.id,
      },
    });
  }

  console.log("✅ Created sample issues");

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📝 Login with your credentials from .env file");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
