-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Circle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'family_history',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Circle" ("createdAt", "icon", "id", "name") SELECT "createdAt", "icon", "id", "name" FROM "Circle";
DROP TABLE "Circle";
ALTER TABLE "new_Circle" RENAME TO "Circle";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
