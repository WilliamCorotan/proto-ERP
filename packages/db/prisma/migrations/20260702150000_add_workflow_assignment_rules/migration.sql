CREATE TABLE "WorkflowAssignmentRule" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "fromState" TEXT NOT NULL,
  "toState" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "minAmount" DECIMAL(18,2),
  "maxAmount" DECIMAL(18,2),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkflowAssignmentRule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkflowAssignmentRule_tenantId_workflowId_fromState_toState_role_key"
  ON "WorkflowAssignmentRule"("tenantId", "workflowId", "fromState", "toState", "role");

CREATE INDEX "WorkflowAssignmentRule_tenantId_workflowId_fromState_toState_active_idx"
  ON "WorkflowAssignmentRule"("tenantId", "workflowId", "fromState", "toState", "active");

ALTER TABLE "WorkflowAssignmentRule"
  ADD CONSTRAINT "WorkflowAssignmentRule_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
