import { PrismaClient } from "../src/generated/prisma";
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
