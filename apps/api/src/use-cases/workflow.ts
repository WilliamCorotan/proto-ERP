import type { ModuleManifest } from "@erp/core";
import {
  createWorkflowInstance,
  createWorkflowPoliciesFromManifests,
  getWorkflowActions,
  transitionWorkflow,
  type WorkflowAction,
  type WorkflowActor,
  type WorkflowDocumentRef,
  type WorkflowPolicy,
  type WorkflowTask,
  type WorkflowTransitionRecord,
} from "@erp/platform-workflow";

export type WorkflowActionsInput = {
  workflowId: string;
  document: WorkflowDocumentRef;
  currentState: string;
  amount?: number | null | undefined;
};

export type WorkflowActionsResponse = {
  workflowId: string;
  document: WorkflowDocumentRef;
  currentState: string;
  actions: WorkflowAction[];
};

export type WorkflowTransitionInput = WorkflowActionsInput & {
  targetState: string;
  reason?: string | null | undefined;
  comment?: string | null | undefined;
};

export type WorkflowTransitionResponse = {
  workflowId: string;
  document: WorkflowDocumentRef;
  previousState: string;
  currentState: string;
  transition: WorkflowTransitionRecord | null;
};

export type WorkflowInboxCandidate = {
  workflowId: string;
  document: WorkflowDocumentRef;
  currentState: string;
  title: string;
  summary: string;
  amount?: number | null | undefined;
  dueAt?: string | null | undefined;
  createdAt?: string | undefined;
};

export type WorkflowAssignmentRule = {
  id: string;
  workflowId: string;
  fromState: string;
  toState: string;
  role: string;
  delegateRole?: string | null;
  delegateStartsAt?: string | null;
  delegateEndsAt?: string | null;
  minAmount: number | null;
  maxAmount: number | null;
  active: boolean;
};

export type WorkflowEscalationRule = {
  id: string;
  workflowId: string;
  fromState: string;
  toState: string;
  targetRole: string;
  dueInHours: number;
  escalationRole: string;
  notificationChannel: "email" | "in_app" | "slack" | "webhook";
  active: boolean;
};

export type WorkflowInboxOptions = {
  assignmentRules?: WorkflowAssignmentRule[];
  escalationRules?: WorkflowEscalationRule[];
};

export type WorkflowInboxResponse = {
  generatedAt: string;
  tasks: WorkflowTask[];
};

export class WorkflowUseCases {
  private readonly workflowPolicies: WorkflowPolicy[];

  constructor(manifests: ModuleManifest[]) {
    this.workflowPolicies = createWorkflowPoliciesFromManifests(manifests);
  }

  policies(): WorkflowPolicy[] {
    return this.workflowPolicies;
  }

  actions(
    input: WorkflowActionsInput,
    actor: WorkflowActor,
    options: WorkflowInboxOptions = {},
  ): WorkflowActionsResponse {
    const policy = this.findPolicy(input.workflowId);
    this.assertDocumentMatchesPolicy(input.document, policy);

    const instance = this.createStatefulInstance(input, policy);

    return {
      workflowId: policy.definition.id,
      document: input.document,
      currentState: input.currentState,
      actions: getWorkflowActions(instance, policy, actor).filter(
        (action) =>
          assignedRolesForAction(
            input,
            action,
            actor,
            options.assignmentRules ?? [],
            new Date(),
          ).length > 0,
      ),
    };
  }

  transition(
    input: WorkflowTransitionInput,
    actor: WorkflowActor,
  ): WorkflowTransitionResponse {
    const policy = this.findPolicy(input.workflowId);
    this.assertDocumentMatchesPolicy(input.document, policy);
    const instance = this.createStatefulInstance(input, policy);
    const reason = input.comment ?? input.reason ?? null;
    const transitioned = transitionWorkflow({
      actor,
      id: `wft_${input.document.entity}_${input.document.id}_${Date.now()}`,
      instance,
      policy,
      reason,
      targetState: input.targetState,
    });

    return {
      workflowId: policy.definition.id,
      document: input.document,
      previousState: input.currentState,
      currentState: transitioned.state,
      transition: transitioned.transitions.at(-1) ?? null,
    };
  }

  inbox(
    candidates: WorkflowInboxCandidate[],
    actor: WorkflowActor,
    now = new Date().toISOString(),
    options: WorkflowInboxOptions = {},
  ): WorkflowInboxResponse {
    const tasks = candidates.flatMap((candidate): WorkflowTask[] => {
      const policy = this.findPolicy(candidate.workflowId);
      this.assertDocumentMatchesPolicy(candidate.document, policy);
      const instance = this.createStatefulInstance(candidate, policy);
      return getWorkflowActions(instance, policy, actor).flatMap((action) => {
        const createdAt = candidate.createdAt ?? now;
        const assignedRoles = assignedRolesForAction(
          candidate,
          action,
          actor,
          options.assignmentRules ?? [],
          new Date(now),
        );
        const escalation = evaluateEscalation(
          candidate,
          action,
          assignedRoles,
          options.escalationRules ?? [],
          createdAt,
          now,
        );
        const assigneeRoles = unique([
          ...assignedRoles,
          ...escalation.escalatedRoles,
        ]);
        if (assigneeRoles.length === 0) {
          return [];
        }
        return {
          id: `wftask_${candidate.workflowId}_${candidate.document.entity}_${candidate.document.id}_${action.to}`,
          workflowId: candidate.workflowId,
          document: candidate.document,
          title: candidate.title,
          summary: candidate.summary,
          currentState: candidate.currentState,
          action,
          assigneeRole: assigneeRoles[0] ?? "unassigned",
          assigneeRoles,
          assigneePermissions: action.requiredPermissions,
          dueAt: earliestDate(candidate.dueAt, escalation.dueAt),
          createdAt,
          ageHours: ageHours(createdAt, now),
          dueStatus: escalation.dueStatus,
          escalated: escalation.escalated,
          escalatedRoles: escalation.escalatedRoles,
          notificationChannels: escalation.notificationChannels,
        };
      });
    });

    return {
      generatedAt: now,
      tasks: tasks.sort(compareWorkflowTasks),
    };
  }

  private findPolicy(workflowId: string): WorkflowPolicy {
    const policy = this.workflowPolicies.find(
      (candidate) => candidate.definition.id === workflowId,
    );
    if (!policy) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    return policy;
  }

  private assertDocumentMatchesPolicy(
    document: WorkflowDocumentRef,
    policy: WorkflowPolicy,
  ) {
    if (policy.definition.entity !== document.entity) {
      throw new Error(
        `Workflow ${policy.definition.id} does not apply to ${document.entity}`,
      );
    }
  }

  private createStatefulInstance(
    input: WorkflowActionsInput,
    policy: WorkflowPolicy,
  ) {
    return {
      ...createWorkflowInstance({
        document: input.document,
        id: `wf_${input.document.entity}_${input.document.id}`,
        policy,
      }),
      state: input.currentState,
    };
  }
}

function assignedRolesForAction(
  candidate: Pick<
    WorkflowInboxCandidate,
    "workflowId" | "currentState" | "amount"
  >,
  action: WorkflowAction,
  actor: WorkflowActor,
  assignmentRules: WorkflowAssignmentRule[],
  now: Date,
): string[] {
  const rulesForTransition = assignmentRules.filter(
    (rule) =>
      rule.active &&
      rule.workflowId === candidate.workflowId &&
      rule.fromState === candidate.currentState &&
      rule.toState === action.to &&
      thresholdMatches(rule, candidate.amount),
  );

  if (rulesForTransition.length === 0) {
    return action.requiredRoles.length > 0 ? action.requiredRoles : actor.roles;
  }

  const assignedRoles = unique(
    rulesForTransition.flatMap((rule) => [
      rule.role,
      ...(delegateActive(rule, now) && rule.delegateRole
        ? [rule.delegateRole]
        : []),
    ]),
  );
  return assignedRoles.some((role) => actor.roles.includes(role))
    ? assignedRoles
    : [];
}

function thresholdMatches(
  rule: WorkflowAssignmentRule,
  amount: number | null | undefined,
): boolean {
  if (rule.minAmount === null && rule.maxAmount === null) {
    return true;
  }
  if (amount === null || amount === undefined) {
    return false;
  }
  return (
    (rule.minAmount === null || amount >= rule.minAmount) &&
    (rule.maxAmount === null || amount <= rule.maxAmount)
  );
}

function evaluateEscalation(
  candidate: Pick<WorkflowInboxCandidate, "workflowId" | "currentState">,
  action: WorkflowAction,
  assigneeRoles: string[],
  escalationRules: WorkflowEscalationRule[],
  createdAt: string,
  now: string,
): {
  dueAt: string | null;
  dueStatus: WorkflowTask["dueStatus"];
  escalated: boolean;
  escalatedRoles: string[];
  notificationChannels: string[];
} {
  const matchingRules = escalationRules.filter(
    (rule) =>
      rule.active &&
      rule.workflowId === candidate.workflowId &&
      rule.fromState === candidate.currentState &&
      rule.toState === action.to &&
      assigneeRoles.includes(rule.targetRole),
  );
  if (matchingRules.length === 0) {
    return {
      dueAt: null,
      dueStatus: "open",
      escalated: false,
      escalatedRoles: [],
      notificationChannels: [],
    };
  }

  const nowMs = new Date(now).getTime();
  const dueDates = matchingRules.map((rule) =>
    addHours(createdAt, rule.dueInHours),
  );
  const dueAt = dueDates.sort()[0] ?? null;
  const escalatedRules = matchingRules.filter(
    (rule) => nowMs >= new Date(addHours(createdAt, rule.dueInHours)).getTime(),
  );
  const dueSoon = matchingRules.some((rule) => {
    const createdMs = new Date(createdAt).getTime();
    const dueMs = new Date(addHours(createdAt, rule.dueInHours)).getTime();
    const elapsed = nowMs - createdMs;
    return elapsed >= (dueMs - createdMs) * 0.75;
  });

  return {
    dueAt,
    dueStatus:
      escalatedRules.length > 0 ? "overdue" : dueSoon ? "due_soon" : "open",
    escalated: escalatedRules.length > 0,
    escalatedRoles: unique(escalatedRules.map((rule) => rule.escalationRole)),
    notificationChannels: unique(
      escalatedRules.map((rule) => rule.notificationChannel),
    ),
  };
}

function delegateActive(rule: WorkflowAssignmentRule, now: Date): boolean {
  if (!rule.delegateRole) {
    return false;
  }
  const startsAt = rule.delegateStartsAt
    ? new Date(rule.delegateStartsAt).getTime()
    : Number.NEGATIVE_INFINITY;
  const endsAt = rule.delegateEndsAt
    ? new Date(rule.delegateEndsAt).getTime()
    : Number.POSITIVE_INFINITY;
  const current = now.getTime();
  return current >= startsAt && current <= endsAt;
}

function addHours(value: string, hours: number): string {
  return new Date(
    new Date(value).getTime() + hours * 60 * 60 * 1000,
  ).toISOString();
}

function ageHours(createdAt: string, now: string): number {
  const age = new Date(now).getTime() - new Date(createdAt).getTime();
  return Math.max(0, Math.round((age / 3_600_000) * 10) / 10);
}

function earliestDate(
  ...values: Array<string | null | undefined>
): string | null {
  const dates = values.filter((value): value is string => Boolean(value));
  return dates.sort()[0] ?? null;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function compareWorkflowTasks(a: WorkflowTask, b: WorkflowTask) {
  const dueA = a.dueAt ?? "9999-12-31T23:59:59.999Z";
  const dueB = b.dueAt ?? "9999-12-31T23:59:59.999Z";
  return (
    dueA.localeCompare(dueB) ||
    a.title.localeCompare(b.title) ||
    a.action.label.localeCompare(b.action.label)
  );
}
