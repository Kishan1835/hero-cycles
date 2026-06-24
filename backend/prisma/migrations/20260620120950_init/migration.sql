-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PRICING_MANAGER', 'SALESPERSON');

-- CreateEnum
CREATE TYPE "PartCategory" AS ENUM ('FRAME', 'GEAR_SET', 'TYRE', 'BRAKE', 'SEAT', 'HANDLEBAR', 'CHAIN', 'PEDAL', 'OTHER');

-- CreateEnum
CREATE TYPE "PartStatus" AS ENUM ('ACTIVE', 'DISCONTINUED', 'DRAFT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'PRICE_CHANGE', 'LOGIN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SALESPERSON',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "PartCategory" NOT NULL,
    "status" "PartStatus" NOT NULL DEFAULT 'ACTIVE',
    "sku" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_price_history" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "changedById" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "part_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bicycle_configurations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "modelCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bicycle_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuration_parts" (
    "id" TEXT NOT NULL,
    "configurationId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "configuration_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "parts_sku_key" ON "parts"("sku");

-- CreateIndex
CREATE INDEX "parts_category_idx" ON "parts"("category");

-- CreateIndex
CREATE INDEX "parts_status_idx" ON "parts"("status");

-- CreateIndex
CREATE INDEX "part_price_history_partId_effectiveDate_idx" ON "part_price_history"("partId", "effectiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "part_price_history_partId_effectiveDate_key" ON "part_price_history"("partId", "effectiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "bicycle_configurations_modelCode_key" ON "bicycle_configurations"("modelCode");

-- CreateIndex
CREATE INDEX "bicycle_configurations_modelCode_idx" ON "bicycle_configurations"("modelCode");

-- CreateIndex
CREATE UNIQUE INDEX "configuration_parts_configurationId_partId_key" ON "configuration_parts"("configurationId", "partId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "part_price_history" ADD CONSTRAINT "part_price_history_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_price_history" ADD CONSTRAINT "part_price_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bicycle_configurations" ADD CONSTRAINT "bicycle_configurations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration_parts" ADD CONSTRAINT "configuration_parts_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "bicycle_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration_parts" ADD CONSTRAINT "configuration_parts_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
