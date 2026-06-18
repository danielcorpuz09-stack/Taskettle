-- CreateTable
CREATE TABLE "HomeAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "circleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "purchaseDate" DATETIME,
    "warrantyExpiration" DATETIME,
    "serialNumber" TEXT,
    "receiptPhotoUrls" TEXT,
    "currentValue" INTEGER,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HomeAsset_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HomeAsset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecurringExpense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "circleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'UTILITY',
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "dueDate" INTEGER,
    "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "autoPay" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "lastOccurred" DATETIME,
    "nextDue" DATETIME,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecurringExpense_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecurringExpense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "circleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT,
    "plateNumber" TEXT,
    "registrationExpiry" DATETIME,
    "insuranceExpiry" DATETIME,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vehicle_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vehicle_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "circleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "nextDueDate" DATETIME NOT NULL,
    "assigneeId" TEXT,
    "lastTaskId" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceSchedule_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "HomeAsset_circleId_category_idx" ON "HomeAsset"("circleId", "category");

-- CreateIndex
CREATE INDEX "HomeAsset_circleId_warrantyExpiration_idx" ON "HomeAsset"("circleId", "warrantyExpiration");

-- CreateIndex
CREATE INDEX "RecurringExpense_circleId_category_idx" ON "RecurringExpense"("circleId", "category");

-- CreateIndex
CREATE INDEX "RecurringExpense_circleId_nextDue_idx" ON "RecurringExpense"("circleId", "nextDue");

-- CreateIndex
CREATE INDEX "Vehicle_circleId_idx" ON "Vehicle"("circleId");

-- CreateIndex
CREATE INDEX "Vehicle_registrationExpiry_idx" ON "Vehicle"("registrationExpiry");

-- CreateIndex
CREATE INDEX "Vehicle_insuranceExpiry_idx" ON "Vehicle"("insuranceExpiry");

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_circleId_nextDueDate_idx" ON "MaintenanceSchedule"("circleId", "nextDueDate");
