-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "circleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT,
    "assigneeId" TEXT,
    "dueDate" DATETIME,
    "endAt" DATETIME,
    "allDay" BOOLEAN NOT NULL DEFAULT true,
    "recurrence" TEXT,
    "recurrenceUntil" DATETIME,
    "position" REAL NOT NULL DEFAULT 1024,
    "createdById" TEXT NOT NULL,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("assigneeId", "category", "circleId", "completedAt", "createdAt", "createdById", "description", "dueDate", "id", "position", "priority", "status", "title", "updatedAt") SELECT "assigneeId", "category", "circleId", "completedAt", "createdAt", "createdById", "description", "dueDate", "id", "position", "priority", "status", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_circleId_status_position_idx" ON "Task"("circleId", "status", "position");
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
