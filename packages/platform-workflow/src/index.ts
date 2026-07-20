import type {
  ModuleManifest,
  TenantContext,
  WorkflowDefinition,
} from "@erp/core";

export type WorkflowDocumentRef = {
  entity: string;
  id: string;
};

export type WorkflowActor = Pick<
  TenantContext,
  "permissions" | "roles" | "userId"
>;

export type WorkflowTransitionDefinition = {
  id: string;
  label: string;
  from: string;
  to: string;
  requiredPermissions?: string[];
  requiredRoles?: string[];
};

export type WorkflowPolicy = {
  definition: WorkflowDefinition;
  transitions: WorkflowTransitionDefinition[];
};

export type WorkflowTransitionRecord = {
  id: string;
  workflowId: string;
  document: WorkflowDocumentRef;
  actorId: string;
  from: string;
  to: string;
  reason: string | null;
  comment?: string | null;
  occurredAt: string;
};

export type WorkflowInstance = {
  id: string;
  workflowId: string;
  document: WorkflowDocumentRef;
  state: string;
  startedAt: string;
  updatedAt: string;
  transitions: WorkflowTransitionRecord[];
};

export type WorkflowAction = {
  id: string;
  label: string;
  to: string;
  requiredPermissions: string[];
  requiredRoles: string[];
};

export type WorkflowTask = {
  id: string;
  workflowId: string;
  document: WorkflowDocumentRef;
  title: string;
  summary: string;
  currentState: string;
  action: WorkflowAction;
  assigneeRole: string;
  assigneeRoles: string[];
  assigneePermissions: string[];
  dueAt: string | null;
  createdAt: string;
  ageHours: number;
  dueStatus: "due_soon" | "open" | "overdue";
  escalated: boolean;
  escalatedRoles: string[];
  notificationChannels: string[];
};

export type WorkflowDecision = {
  allowed: boolean;
  reasons: string[];
  transition?: WorkflowTransitionDefinition;
};

export class WorkflowTransitionError extends Error {
  constructor(
    message: string,
    readonly reasons: string[],
  ) {
    super(message);
    this.name = "WorkflowTransitionError";
  }
}

export function createWorkflowPoliciesFromManifests(
  manifests: ModuleManifest[],
): WorkflowPolicy[] {
  return manifests.flatMap((manifest) =>
    manifest.workflows.map((definition) => createWorkflowPolicy(definition)),
  );
}

export function createWorkflowPolicy(
  definition: WorkflowDefinition,
  transitions?: WorkflowTransitionDefinition[],
): WorkflowPolicy {
  assertWorkflowDefinition(definition);
  return {
    definition,
    transitions: transitions ?? deriveDefaultTransitions(definition),
  };
}

export function createWorkflowInstance({
  document,
  id,
  now = new Date().toISOString(),
  policy,
}: {
  document: WorkflowDocumentRef;
  id: string;
  now?: string;
  policy: WorkflowPolicy;
}): WorkflowInstance {
  return {
    id,
    workflowId: policy.definition.id,
    document,
    state: policy.definition.initialState,
    startedAt: now,
    updatedAt: now,
    transitions: [],
  };
}

export function getWorkflowActions(
  instance: WorkflowInstance,
  policy: WorkflowPolicy,
  actor: WorkflowActor,
): WorkflowAction[] {
  assertMatchingPolicy(instance, policy);
  if (isTerminalState(instance.state, policy)) {
    return [];
  }

  return policy.transitions
    .filter((transition) => transition.from === instance.state)
    .filter(
      (transition) =>
        evaluateWorkflowTransition({
          actor,
          instance,
          policy,
          targetState: transition.to,
        }).allowed,
    )
    .map((transition) => ({
      id: transition.id,
      label: transition.label,
      to: transition.to,
      requiredPermissions: transition.requiredPermissions ?? [],
      requiredRoles: transition.requiredRoles ?? [],
    }));
}

export function evaluateWorkflowTransition({
  actor,
  instance,
  policy,
  targetState,
}: {
  actor: WorkflowActor;
  instance: WorkflowInstance;
  policy: WorkflowPolicy;
  targetState: string;
}): WorkflowDecision {
  assertMatchingPolicy(instance, policy);
  const reasons: string[] = [];

  if (!policy.definition.states.includes(targetState)) {
    reasons.push(`Unknown workflow state: ${targetState}`);
  }

  if (instance.state === targetState) {
    return { allowed: reasons.length === 0, reasons };
  }

  if (isTerminalState(instance.state, policy)) {
    reasons.push(`Workflow is already terminal: ${instance.state}`);
  }

  const transition = policy.transitions.find(
    (candidate) =>
      candidate.from === instance.state && candidate.to === targetState,
  );
  if (!transition) {
    reasons.push(
      `Transition is not allowed: ${instance.state} to ${targetState}`,
    );
    return { allowed: false, reasons };
  }

  const missingPermissions = (transition.requiredPermissions ?? []).filter(
    (permission) => !actor.permissions.includes(permission),
  );
  if (missingPermissions.length > 0) {
    reasons.push(`Missing permissions: ${missingPermissions.join(", ")}`);
  }

  const missingRoles = (transition.requiredRoles ?? []).filter(
    (role) => !actor.roles.includes(role),
  );
  if (missingRoles.length > 0) {
    reasons.push(`Missing roles: ${missingRoles.join(", ")}`);
  }

  return {
    allowed: reasons.length === 0,
    reasons,
    transition,
  };
}

export function transitionWorkflow({
  actor,
  id,
  instance,
  now = new Date().toISOString(),
  policy,
  reason = null,
  targetState,
}: {
  actor: WorkflowActor;
  id: string;
  instance: WorkflowInstance;
  now?: string;
  policy: WorkflowPolicy;
  reason?: string | null;
  targetState: string;
}): WorkflowInstance {
  const decision = evaluateWorkflowTransition({
    actor,
    instance,
    policy,
    targetState,
  });
  if (!decision.allowed) {
    throw new WorkflowTransitionError(
      `Invalid workflow transition: ${instance.state} to ${targetState}`,
      decision.reasons,
    );
  }

  if (instance.state === targetState) {
    return instance;
  }

  const record: WorkflowTransitionRecord = {
    id,
    workflowId: instance.workflowId,
    document: instance.document,
    actorId: actor.userId,
    from: instance.state,
    to: targetState,
    reason,
    comment: reason,
    occurredAt: now,
  };

  return {
    ...instance,
    state: targetState,
    updatedAt: now,
    transitions: [...instance.transitions, record],
  };
}

function deriveDefaultTransitions(
  definition: WorkflowDefinition,
): WorkflowTransitionDefinition[] {
  const transitions = new Map<string, WorkflowTransitionDefinition>();
  const activeStates = definition.states.filter(
    (state) => !definition.terminalStates.includes(state),
  );
  const finalActiveState = activeStates.at(-1);

  for (const [index, from] of activeStates.entries()) {
    if (definition.terminalStates.includes(from)) {
      continue;
    }

    const next = activeStates[index + 1];
    if (next && next !== from) {
      addTransition(transitions, definition, from, next);
    }

    for (const terminalState of definition.terminalStates) {
      const canTransitionToTerminal =
        ["cancelled", "void"].includes(terminalState) ||
        from === finalActiveState;
      if (terminalState !== from && canTransitionToTerminal) {
        addTransition(transitions, definition, from, terminalState);
      }
    }
  }
  return [...transitions.values()];
}

function addTransition(
  transitions: Map<string, WorkflowTransitionDefinition>,
  definition: WorkflowDefinition,
  from: string,
  to: string,
) {
  const key = `${from}:${to}`;
  if (transitions.has(key)) {
    return;
  }
  transitions.set(key, {
    id: `${definition.id}.${from}.${to}`,
    label: humanizeTransition(to),
    from,
    to,
  });
}

function assertWorkflowDefinition(definition: WorkflowDefinition) {
  if (!definition.states.includes(definition.initialState)) {
    throw new Error(
      `Workflow ${definition.id} initial state is not in states: ${definition.initialState}`,
    );
  }
  for (const terminalState of definition.terminalStates) {
    if (!definition.states.includes(terminalState)) {
      throw new Error(
        `Workflow ${definition.id} terminal state is not in states: ${terminalState}`,
      );
    }
  }
}

function assertMatchingPolicy(
  instance: WorkflowInstance,
  policy: WorkflowPolicy,
) {
  if (instance.workflowId !== policy.definition.id) {
    throw new Error(
      `Workflow instance ${instance.id} uses ${instance.workflowId}, not ${policy.definition.id}`,
    );
  }
  if (!policy.definition.states.includes(instance.state)) {
    throw new Error(
      `Workflow instance ${instance.id} has unknown state: ${instance.state}`,
    );
  }
}

function isTerminalState(state: string, policy: WorkflowPolicy) {
  return policy.definition.terminalStates.includes(state);
}

function humanizeTransition(state: string) {
  return state
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
