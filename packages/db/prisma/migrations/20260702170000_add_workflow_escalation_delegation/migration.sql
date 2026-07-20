ALTER TABLE "WorkflowAssignmentRule"
  ADD COLUMN "delegateRole" TEXT,
  ADD COLUMN "delegateStartsAt" TIMESTAMP(3),
  ADD COLUMN "delegateEndsAt" TIMESTAMP(3);

CREATE TABLE "WorkflowEscalationRule" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "fromState" TEXT NOT NULL,
  "toState" TEXT NOT NULL,
  "targetRole" TEXT NOT NULL,
  "dueInHours" INTEGER NOT NULL,
  "escalationRole" TEXT NOT NULL,
  "notificationChannel" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkflowEscalationRule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkflowEscalationRule_tenantId_workflowId_fromState_toState_targetRole_key"
  ON "WorkflowEscalationRule"("tenantId", "workflowId", "fromState", "toState", "targetRole");

CREATE INDEX "WorkflowEscalationRule_tenantId_workflowId_fromState_toState_active_idx"
  ON "WorkflowEscalationRule"("tenantId", "workflowId", "fromState", "toState", "active");

ALTER TABLE "WorkflowEscalationRule"
  ADD CONSTRAINT "WorkflowEscalationRule_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
