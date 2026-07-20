-- CreateTable
CREATE TABLE "JobCard" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "workCenterId" TEXT NOT NULL,
    "operationSequence" INTEGER NOT NULL,
    "operationName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "plannedMinutes" INTEGER NOT NULL,
    "actualMinutes" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "operator" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DowntimeEntry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workCenterId" TEXT NOT NULL,
    "jobCardId" TEXT,
    "reason" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DowntimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobCard_tenantId_status_idx" ON "JobCard"("tenantId", "status");

-- CreateIndex
CREATE INDEX "JobCard_tenantId_workCenterId_idx" ON "JobCard"("tenantId", "workCenterId");

-- CreateIndex
CREATE UNIQUE INDEX "JobCard_tenantId_workOrderId_operationSequence_key" ON "JobCard"("tenantId", "workOrderId", "operationSequence");

-- CreateIndex
CREATE INDEX "DowntimeEntry_tenantId_workCenterId_idx" ON "DowntimeEntry"("tenantId", "workCenterId");

-- CreateIndex
CREATE INDEX "DowntimeEntry_tenantId_jobCardId_idx" ON "DowntimeEntry"("tenantId", "jobCardId");

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_workCenterId_fkey" FOREIGN KEY ("workCenterId") REFERENCES "WorkCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DowntimeEntry" ADD CONSTRAINT "DowntimeEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DowntimeEntry" ADD CONSTRAINT "DowntimeEntry_workCenterId_fkey" FOREIGN KEY ("workCenterId") REFERENCES "WorkCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DowntimeEntry" ADD CONSTRAINT "DowntimeEntry_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
