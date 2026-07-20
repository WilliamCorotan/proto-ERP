-- CreateTable
CREATE TABLE "WorkflowInstance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTransition" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workflowInstanceId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "fromState" TEXT NOT NULL,
    "toState" TEXT NOT NULL,
    "reason" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowTransition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowInstance_tenantId_workflowId_entity_documentId_key" ON "WorkflowInstance"("tenantId", "workflowId", "entity", "documentId");

-- CreateIndex
CREATE INDEX "WorkflowInstance_tenantId_workflowId_state_idx" ON "WorkflowInstance"("tenantId", "workflowId", "state");

-- CreateIndex
CREATE INDEX "WorkflowInstance_tenantId_entity_documentId_idx" ON "WorkflowInstance"("tenantId", "entity", "documentId");

-- CreateIndex
CREATE INDEX "WorkflowTransition_tenantId_workflowId_occurredAt_idx" ON "WorkflowTransition"("tenantId", "workflowId", "occurredAt");

-- CreateIndex
CREATE INDEX "WorkflowTransition_tenantId_entity_documentId_occurredAt_idx" ON "WorkflowTransition"("tenantId", "entity", "documentId", "occurredAt");

-- AddForeignKey
ALTER TABLE "WorkflowInstance" ADD CONSTRAINT "WorkflowInstance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_workflowInstanceId_fkey" FOREIGN KEY ("workflowInstanceId") REFERENCES "WorkflowInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
