-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feature_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "featureId" TEXT,
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
    CONSTRAINT "Issue_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Issue_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Issue_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Issue" ("assigneeId", "createdAt", "creatorId", "description", "firstResponseAt", "id", "identifier", "milestoneId", "priority", "projectId", "reopenCount", "reportedAt", "resolutionTimeMinutes", "resolvedAt", "sortOrder", "statusId", "title", "type", "updatedAt", "workspaceId") SELECT "assigneeId", "createdAt", "creatorId", "description", "firstResponseAt", "id", "identifier", "milestoneId", "priority", "projectId", "reopenCount", "reportedAt", "resolutionTimeMinutes", "resolvedAt", "sortOrder", "statusId", "title", "type", "updatedAt", "workspaceId" FROM "Issue";
DROP TABLE "Issue";
ALTER TABLE "new_Issue" RENAME TO "Issue";
CREATE INDEX "Issue_workspaceId_idx" ON "Issue"("workspaceId");
CREATE INDEX "Issue_statusId_idx" ON "Issue"("statusId");
CREATE INDEX "Issue_assigneeId_idx" ON "Issue"("assigneeId");
CREATE INDEX "Issue_projectId_idx" ON "Issue"("projectId");
CREATE INDEX "Issue_milestoneId_idx" ON "Issue"("milestoneId");
CREATE INDEX "Issue_featureId_idx" ON "Issue"("featureId");
CREATE INDEX "Issue_creatorId_idx" ON "Issue"("creatorId");
CREATE INDEX "Issue_priority_idx" ON "Issue"("priority");
CREATE INDEX "Issue_type_idx" ON "Issue"("type");
CREATE INDEX "Issue_resolvedAt_idx" ON "Issue"("resolvedAt");
CREATE UNIQUE INDEX "Issue_workspaceId_identifier_key" ON "Issue"("workspaceId", "identifier");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Feature_projectId_idx" ON "Feature"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_projectId_name_key" ON "Feature"("projectId", "name");
