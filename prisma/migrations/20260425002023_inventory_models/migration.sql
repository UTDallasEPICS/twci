-- CreateTable
CREATE TABLE "location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "condition" TEXT NOT NULL DEFAULT 'good',
    "status" TEXT NOT NULL DEFAULT 'available',
    "homeLocationId" TEXT NOT NULL,
    "currentLocationId" TEXT NOT NULL,
    "qrCodeUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "item_homeLocationId_fkey" FOREIGN KEY ("homeLocationId") REFERENCES "location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "item_currentLocationId_fkey" FOREIGN KEY ("currentLocationId") REFERENCES "location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "checkout_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "checkedOutBy" TEXT NOT NULL,
    "checkedOutFromLocationId" TEXT NOT NULL,
    "checkedOutAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedInBy" TEXT,
    "checkedInAtLocationId" TEXT,
    "checkedInAt" DATETIME,
    "conditionOnReturn" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "checkout_log_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "checkout_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "checkout_log_checkedOutBy_fkey" FOREIGN KEY ("checkedOutBy") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "checkout_log_checkedOutFromLocationId_fkey" FOREIGN KEY ("checkedOutFromLocationId") REFERENCES "location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "checkout_log_checkedInBy_fkey" FOREIGN KEY ("checkedInBy") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "checkout_log_checkedInAtLocationId_fkey" FOREIGN KEY ("checkedInAtLocationId") REFERENCES "location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "legalFirstName" TEXT,
    "legalLastName" TEXT,
    "preferredFirstName" TEXT,
    "preferredLastName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'employee',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_user" ("createdAt", "email", "emailVerified", "id", "image", "name", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "image", "name", "updatedAt" FROM "user";
DROP TABLE "user";
ALTER TABLE "new_user" RENAME TO "user";
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "item_homeLocationId_idx" ON "item"("homeLocationId");

-- CreateIndex
CREATE INDEX "item_currentLocationId_idx" ON "item"("currentLocationId");

-- CreateIndex
CREATE INDEX "item_status_idx" ON "item"("status");

-- CreateIndex
CREATE INDEX "checkout_log_itemId_idx" ON "checkout_log"("itemId");

-- CreateIndex
CREATE INDEX "checkout_log_userId_idx" ON "checkout_log"("userId");

-- CreateIndex
CREATE INDEX "checkout_log_checkedInAt_idx" ON "checkout_log"("checkedInAt");
