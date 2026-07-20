-- CreateTable
CREATE TABLE "PickList" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickTask" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pickListId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "binId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pickedQuantity" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pickListId" TEXT NOT NULL,
    "packageCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'packed',
    "packedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "packRecordId" TEXT NOT NULL,
    "carrier" TEXT NOT NULL,
    "trackingNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'shipped',
    "shippedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PutAwayTask" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "purchaseReceiptId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "fromBinId" TEXT NOT NULL,
    "toBinId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PutAwayTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BarcodeScan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "scanType" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BarcodeScan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PickList_tenantId_status_idx" ON "PickList"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PickList_tenantId_salesOrderId_key" ON "PickList"("tenantId", "salesOrderId");

-- CreateIndex
CREATE INDEX "PickTask_tenantId_status_idx" ON "PickTask"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PickTask_tenantId_pickListId_productId_binId_key" ON "PickTask"("tenantId", "pickListId", "productId", "binId");

-- CreateIndex
CREATE INDEX "PackRecord_tenantId_status_idx" ON "PackRecord"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PackRecord_tenantId_pickListId_key" ON "PackRecord"("tenantId", "pickListId");

-- CreateIndex
CREATE UNIQUE INDEX "PackRecord_tenantId_packageCode_key" ON "PackRecord"("tenantId", "packageCode");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_packRecordId_key" ON "Shipment"("packRecordId");

-- CreateIndex
CREATE INDEX "Shipment_tenantId_status_idx" ON "Shipment"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_tenantId_packRecordId_key" ON "Shipment"("tenantId", "packRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_tenantId_trackingNumber_key" ON "Shipment"("tenantId", "trackingNumber");

-- CreateIndex
CREATE INDEX "PutAwayTask_tenantId_status_idx" ON "PutAwayTask"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PutAwayTask_tenantId_purchaseReceiptId_productId_fromBinId__key" ON "PutAwayTask"("tenantId", "purchaseReceiptId", "productId", "fromBinId", "toBinId");

-- CreateIndex
CREATE INDEX "BarcodeScan_tenantId_entity_entityId_idx" ON "BarcodeScan"("tenantId", "entity", "entityId");

-- CreateIndex
CREATE INDEX "BarcodeScan_tenantId_scanType_idx" ON "BarcodeScan"("tenantId", "scanType");

-- AddForeignKey
ALTER TABLE "PickList" ADD CONSTRAINT "PickList_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickList" ADD CONSTRAINT "PickList_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickTask" ADD CONSTRAINT "PickTask_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickTask" ADD CONSTRAINT "PickTask_pickListId_fkey" FOREIGN KEY ("pickListId") REFERENCES "PickList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickTask" ADD CONSTRAINT "PickTask_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickTask" ADD CONSTRAINT "PickTask_binId_fkey" FOREIGN KEY ("binId") REFERENCES "InventoryBin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackRecord" ADD CONSTRAINT "PackRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackRecord" ADD CONSTRAINT "PackRecord_pickListId_fkey" FOREIGN KEY ("pickListId") REFERENCES "PickList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_packRecordId_fkey" FOREIGN KEY ("packRecordId") REFERENCES "PackRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PutAwayTask" ADD CONSTRAINT "PutAwayTask_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PutAwayTask" ADD CONSTRAINT "PutAwayTask_purchaseReceiptId_fkey" FOREIGN KEY ("purchaseReceiptId") REFERENCES "PurchaseReceipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PutAwayTask" ADD CONSTRAINT "PutAwayTask_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PutAwayTask" ADD CONSTRAINT "PutAwayTask_fromBinId_fkey" FOREIGN KEY ("fromBinId") REFERENCES "InventoryBin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PutAwayTask" ADD CONSTRAINT "PutAwayTask_toBinId_fkey" FOREIGN KEY ("toBinId") REFERENCES "InventoryBin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarcodeScan" ADD CONSTRAINT "BarcodeScan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
