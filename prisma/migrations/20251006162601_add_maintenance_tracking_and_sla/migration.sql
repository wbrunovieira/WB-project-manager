-- CreateTable
CREATE TABLE "SLAConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "firstResponseTimeHours" INTEGER NOT NULL,
    "resolutionTimeHours" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SLAConfig_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Issue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'FEATURE',
    "priority" TEXT NOT NULL DEFAULT 'NO_PRIORITY',
    "statusId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT,
    "milestoneId" TEXT,
    "creatorId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "sortOrder" REAL NOT NULL DEFAULT 0,
    "reportedAt" DATETIME,
    "firstResponseAt" DATETIME,
    "resolvedAt" DATETIME,
    "resolutionTimeMinutes" INTEGER,
    "reopenCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Issue_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Issue_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Issue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Issue_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Issue_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Issue_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Issue" ("assigneeId", "createdAt", "creatorId", "description", "id", "identifier", "milestoneId", "priority", "projectId", "sortOrder", "statusId", "title", "updatedAt", "workspaceId") SELECT "assigneeId", "createdAt", "creatorId", "description", "id", "identifier", "milestoneId", "priority", "projectId", "sortOrder", "statusId", "title", "updatedAt", "workspaceId" FROM "Issue";
DROP TABLE "Issue";
ALTER TABLE "new_Issue" RENAME TO "Issue";
CREATE INDEX "Issue_workspaceId_idx" ON "Issue"("workspaceId");
CREATE INDEX "Issue_statusId_idx" ON "Issue"("statusId");
CREATE INDEX "Issue_assigneeId_idx" ON "Issue"("assigneeId");
CREATE INDEX "Issue_projectId_idx" ON "Issue"("projectId");
CREATE INDEX "Issue_milestoneId_idx" ON "Issue"("milestoneId");
CREATE INDEX "Issue_creatorId_idx" ON "Issue"("creatorId");
CREATE INDEX "Issue_priority_idx" ON "Issue"("priority");
CREATE INDEX "Issue_type_idx" ON "Issue"("type");
CREATE INDEX "Issue_resolvedAt_idx" ON "Issue"("resolvedAt");
CREATE UNIQUE INDEX "Issue_workspaceId_identifier_key" ON "Issue"("workspaceId", "identifier");
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "type" TEXT NOT NULL DEFAULT 'DEVELOPMENT',
    "startDate" DATETIME,
    "targetDate" DATETIME,
    "workspaceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("createdAt", "description", "id", "name", "startDate", "status", "targetDate", "updatedAt", "workspaceId") SELECT "createdAt", "description", "id", "name", "startDate", "status", "targetDate", "updatedAt", "workspaceId" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE INDEX "Project_workspaceId_idx" ON "Project"("workspaceId");
CREATE INDEX "Project_status_idx" ON "Project"("status");
CREATE INDEX "Project_type_idx" ON "Project"("type");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SLAConfig_projectId_idx" ON "SLAConfig"("projectId");

-- CreateIndex
CREATE INDEX "SLAConfig_issueType_idx" ON "SLAConfig"("issueType");

-- CreateIndex
CREATE INDEX "SLAConfig_priority_idx" ON "SLAConfig"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "SLAConfig_projectId_issueType_priority_key" ON "SLAConfig"("projectId", "issueType", "priority");
