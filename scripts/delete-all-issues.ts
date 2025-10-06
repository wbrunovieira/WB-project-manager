import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function deleteAllIssues() {
  try {
    console.log("🗑️  Deleting all issues...");

    // Delete related records first (due to foreign key constraints)

    // 1. Delete time entries
    const timeEntriesDeleted = await prisma.timeEntry.deleteMany({});
    console.log(`✅ Deleted ${timeEntriesDeleted.count} time entries`);

    // 2. Delete comments
    const commentsDeleted = await prisma.comment.deleteMany({});
    console.log(`✅ Deleted ${commentsDeleted.count} comments`);

    // 3. Delete issue labels
    const issueLabelsDeleted = await prisma.issueLabel.deleteMany({});
    console.log(`✅ Deleted ${issueLabelsDeleted.count} issue labels`);

    // 4. Finally delete issues
    const issuesDeleted = await prisma.issue.deleteMany({});
    console.log(`✅ Deleted ${issuesDeleted.count} issues`);

    console.log("\n✨ All test issues have been deleted successfully!");
  } catch (error) {
    console.error("❌ Error deleting issues:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllIssues()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
