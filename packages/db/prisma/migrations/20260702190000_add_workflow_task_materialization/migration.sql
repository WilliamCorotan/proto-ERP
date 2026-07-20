CREATE TABLE "WorkflowTaskRecord" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "taskKey" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "currentState" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "assigneeRoles" JSONB NOT NULL,
  "escalatedRoles" JSONB NOT NULL,
  "notificationChannels" JSONB NOT NULL,
  "dueStatus" TEXT NOT NULL,
  "dueAt" TIMESTAMP(3),
  "createdTaskAt" TIMESTAMP(3) NOT NULL,
  "assignedNotifiedAt" TIMESTAMP(3),
  "escalatedNotifiedAt" TIMESTAMP(3),
  "completedNotifiedAt" TIMESTAMP(3),
  "cancelledNotifiedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkflowTaskRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkflowTaskRecord_tenantId_taskKey_key"
  ON "WorkflowTaskRecord"("tenantId", "taskKey");

CREATE INDEX "WorkflowTaskRecord_tenantId_status_idx"
  ON "WorkflowTaskRecord"("tenantId", "status");

CREATE INDEX "WorkflowTaskRecord_tenantId_workflowId_entity_documentId_idx"
  ON "WorkflowTaskRecord"("tenantId", "workflowId", "entity", "documentId");

ALTER TABLE "WorkflowTaskRecord"
  ADD CONSTRAINT "WorkflowTaskRecord_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
