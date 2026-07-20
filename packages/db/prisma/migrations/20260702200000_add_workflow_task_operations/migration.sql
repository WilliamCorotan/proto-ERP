-- Adds task-local operation history for workflow task administration.
ALTER TABLE "WorkflowTaskRecord"
  ADD COLUMN IF NOT EXISTS "notificationChannels" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "dueAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "WorkflowTaskOperation" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "workflowTaskId" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "reason" TEXT,
  "details" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WorkflowTaskOperation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WorkflowTaskOperation_tenantId_workflowTaskId_createdAt_idx"
  ON "WorkflowTaskOperation"("tenantId", "workflowTaskId", "createdAt");

CREATE INDEX IF NOT EXISTS "WorkflowTaskOperation_tenantId_operation_idx"
  ON "WorkflowTaskOperation"("tenantId", "operation");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WorkflowTaskOperation_tenantId_fkey'
  ) THEN
    ALTER TABLE "WorkflowTaskOperation"
      ADD CONSTRAINT "WorkflowTaskOperation_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WorkflowTaskOperation_workflowTaskId_fkey'
  ) THEN
    ALTER TABLE "WorkflowTaskOperation"
      ADD CONSTRAINT "WorkflowTaskOperation_workflowTaskId_fkey"
      FOREIGN KEY ("workflowTaskId") REFERENCES "WorkflowTaskRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
