-- CreateTable
CREATE TABLE "TraceMovement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "traceRecordId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "movementType" TEXT NOT NULL,
    "sourceEntity" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "direction" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TraceMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TraceMovement_tenantId_traceRecordId_occurredAt_idx" ON "TraceMovement"("tenantId", "traceRecordId", "occurredAt");

-- CreateIndex
CREATE INDEX "TraceMovement_tenantId_productId_idx" ON "TraceMovement"("tenantId", "productId");

-- CreateIndex
CREATE INDEX "TraceMovement_tenantId_sourceEntity_sourceId_idx" ON "TraceMovement"("tenantId", "sourceEntity", "sourceId");

-- CreateIndex
CREATE INDEX "TraceMovement_tenantId_movementType_idx" ON "TraceMovement"("tenantId", "movementType");

-- CreateIndex
CREATE UNIQUE INDEX "TraceMovement_tenantId_traceRecordId_movementType_sourceEnt_key" ON "TraceMovement"("tenantId", "traceRecordId", "movementType", "sourceEntity", "sourceId");

-- AddForeignKey
ALTER TABLE "TraceMovement" ADD CONSTRAINT "TraceMovement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraceMovement" ADD CONSTRAINT "TraceMovement_traceRecordId_fkey" FOREIGN KEY ("traceRecordId") REFERENCES "TraceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraceMovement" ADD CONSTRAINT "TraceMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
