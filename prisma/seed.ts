import { PrismaClient, StatusType } from "../src/generated/prisma";
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
