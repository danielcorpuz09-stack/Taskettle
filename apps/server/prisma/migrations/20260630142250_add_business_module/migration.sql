-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "circleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PRINTING_3D',
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "defaultAccountId" TEXT,
    "printerPowerW" INTEGER,
    "printerPriceMinor" INTEGER,
    "printerLifespanHr" INTEGER,
    "electricityRatePerKwhMinor" INTEGER,
    "laborRatePerHrMinor" INTEGER,
    "failurePct" REAL,
    "markupPct" REAL,
    "createdById" TEXT NOT NULL,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Business_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Business_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Business_defaultAccountId_fkey" FOREIGN KEY ("defaultAccountId") REFERENCES "WalletAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "inputs" TEXT NOT NULL,
    "materialCostMinor" INTEGER NOT NULL DEFAULT 0,
    "electricityCostMinor" INTEGER NOT NULL DEFAULT 0,
    "wearCostMinor" INTEGER NOT NULL DEFAULT 0,
    "laborCostMinor" INTEGER NOT NULL DEFAULT 0,
    "subtotalMinor" INTEGER NOT NULL DEFAULT 0,
    "failurePct" REAL NOT NULL DEFAULT 0,
    "markupPct" REAL NOT NULL DEFAULT 0,
    "finalPriceMinor" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Product_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "circleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "quantity" REAL NOT NULL DEFAULT 0,
    "unit" TEXT,
    "minimumThreshold" REAL NOT NULL DEFAULT 0,
    "location" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_STOCK',
    "unitPriceMinor" INTEGER,
    "businessId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryItem_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_InventoryItem" ("category", "circleId", "createdAt", "createdById", "description", "id", "location", "minimumThreshold", "name", "notes", "quantity", "status", "unit", "updatedAt") SELECT "category", "circleId", "createdAt", "createdById", "description", "id", "location", "minimumThreshold", "name", "notes", "quantity", "status", "unit", "updatedAt" FROM "InventoryItem";
DROP TABLE "InventoryItem";
ALTER TABLE "new_InventoryItem" RENAME TO "InventoryItem";
CREATE INDEX "InventoryItem_circleId_status_idx" ON "InventoryItem"("circleId", "status");
CREATE INDEX "InventoryItem_circleId_category_idx" ON "InventoryItem"("circleId", "category");
CREATE INDEX "InventoryItem_circleId_businessId_idx" ON "InventoryItem"("circleId", "businessId");
CREATE TABLE "new_WalletTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "circleId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EXPENSE',
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "categoryId" TEXT,
    "note" TEXT,
    "payee" TEXT,
    "transactionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "debtId" TEXT,
    "businessId" TEXT,
    "productId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WalletTransaction_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WalletTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "WalletAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WalletTransaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "WalletCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WalletTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WalletTransaction_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WalletTransaction_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WalletTransaction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WalletTransaction" ("accountId", "amountMinor", "categoryId", "circleId", "createdAt", "createdById", "currency", "debtId", "id", "note", "payee", "transactionDate", "type", "updatedAt") SELECT "accountId", "amountMinor", "categoryId", "circleId", "createdAt", "createdById", "currency", "debtId", "id", "note", "payee", "transactionDate", "type", "updatedAt" FROM "WalletTransaction";
DROP TABLE "WalletTransaction";
ALTER TABLE "new_WalletTransaction" RENAME TO "WalletTransaction";
CREATE INDEX "WalletTransaction_circleId_transactionDate_idx" ON "WalletTransaction"("circleId", "transactionDate");
CREATE INDEX "WalletTransaction_circleId_accountId_idx" ON "WalletTransaction"("circleId", "accountId");
CREATE INDEX "WalletTransaction_circleId_categoryId_idx" ON "WalletTransaction"("circleId", "categoryId");
CREATE INDEX "WalletTransaction_circleId_businessId_idx" ON "WalletTransaction"("circleId", "businessId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Business_circleId_idx" ON "Business"("circleId");

-- CreateIndex
CREATE INDEX "Product_businessId_idx" ON "Product"("businessId");
