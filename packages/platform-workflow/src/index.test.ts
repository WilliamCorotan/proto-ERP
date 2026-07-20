import { describe, expect, it } from "vitest";
import type { ModuleManifest } from "@erp/core";
import {
  WorkflowTransitionError,
  createWorkflowInstance,
  createWorkflowPoliciesFromManifests,
  createWorkflowPolicy,
  evaluateWorkflowTransition,
  getWorkflowActions,
  transitionWorkflow
} from "./index";

const purchaseOrderWorkflow = {
  id: "procurement.purchase-order",
  entity: "PurchaseOrder",
  states: ["draft", "submitted", "approved", "cancelled", "closed"],
  initialState: "draft",
  terminalStates: ["cancelled", "closed"]
};

const actor = {
  userId: "usr_ops",
  roles: ["buyer"],
  permissions: ["procurement.manage"]
};

describe("workflow policy", () => {
  it("creates policies from module manifests", () => {
    const manifest: ModuleManifest = {
      id: "procurement",
      name: "Procurement",
      version: "0.1.0",
      description: "Procurement workflows",
      dependencies: [],
      permissions: [],
      navigation: [],
      entities: [],
      workflows: [purchaseOrderWorkflow],
      events: [],
      jobs: [],
      settings: []
    };

    const policies = createWorkflowPoliciesFromManifests([manifest]);

    expect(policies).toHaveLength(1);
    expect(policies[0]?.definition.id).toBe("procurement.purchase-order");
    expect(policies[0]?.transitions.some((transition) => transition.from === "draft" && transition.to === "submitted")).toBe(true);
  });

  it("exposes allowed actions for the current state", () => {
    const policy = createWorkflowPolicy(purchaseOrderWorkflow, [
      {
        id: "submit",
        label: "Submit",
        from: "draft",
        to: "submitted",
        requiredPermissions: ["procurement.manage"]
      }
    ]);
    const instance = createWorkflowInstance({
      document: { entity: "PurchaseOrder", id: "po_001" },
      id: "wf_po_001",
      now: "2026-07-02T00:00:00.000Z",
      policy
    });

    expect(getWorkflowActions(instance, policy, actor)).toEqual([
      {
        id: "submit",
        label: "Submit",
        to: "submitted",
        requiredPermissions: ["procurement.manage"],
        requiredRoles: []
      }
    ]);
  });

  it("allows void terminal transitions from any active state", () => {
    const policy = createWorkflowPolicy({
      id: "sales.invoice",
      entity: "Invoice",
      states: ["draft", "posted", "paid", "void"],
      initialState: "draft",
      terminalStates: ["paid", "void"]
    });
    const instance = createWorkflowInstance({
      document: { entity: "Invoice", id: "inv_001" },
      id: "wf_inv_001",
      policy
    });

    expect(getWorkflowActions(instance, policy, actor).some((action) => action.to === "void")).toBe(true);
    expect(evaluateWorkflowTransition({ actor, instance, policy, targetState: "void" }).allowed).toBe(true);
  });

  it("transitions and records audit history", () => {
    const policy = createWorkflowPolicy(purchaseOrderWorkflow);
    const instance = createWorkflowInstance({
      document: { entity: "PurchaseOrder", id: "po_001" },
      id: "wf_po_001",
      now: "2026-07-02T00:00:00.000Z",
      policy
    });

    const submitted = transitionWorkflow({
      actor,
      id: "wft_001",
      instance,
      now: "2026-07-02T01:00:00.000Z",
      policy,
      reason: "Ready for approval",
      targetState: "submitted"
    });

    expect(submitted.state).toBe("submitted");
    expect(submitted.transitions).toMatchObject([
      {
        actorId: "usr_ops",
        from: "draft",
        reason: "Ready for approval",
        to: "submitted"
      }
    ]);
  });

  it("rejects invalid transitions", () => {
    const policy = createWorkflowPolicy(purchaseOrderWorkflow);
    const instance = createWorkflowInstance({
      document: { entity: "PurchaseOrder", id: "po_001" },
      id: "wf_po_001",
      policy
    });

    expect(() =>
      transitionWorkflow({
        actor,
        id: "wft_001",
        instance,
        policy,
        targetState: "closed"
      })
    ).toThrow(WorkflowTransitionError);
  });

  it("allows cancellation from an active document state", () => {
    const policy = createWorkflowPolicy(purchaseOrderWorkflow);
    const instance = createWorkflowInstance({
      document: { entity: "PurchaseOrder", id: "po_001" },
      id: "wf_po_001",
      policy
    });

    const cancelled = transitionWorkflow({
      actor,
      id: "wft_001",
      instance,
      policy,
      targetState: "cancelled"
    });

    expect(cancelled.state).toBe("cancelled");
  });

  it("rejects transitions when guards are not satisfied", () => {
    const policy = createWorkflowPolicy(purchaseOrderWorkflow, [
      {
        id: "approve",
        label: "Approve",
        from: "submitted",
        to: "approved",
        requiredPermissions: ["procurement.approve"],
        requiredRoles: ["procurement_manager"]
      }
    ]);
    const instance = {
      ...createWorkflowInstance({
        document: { entity: "PurchaseOrder", id: "po_001" },
        id: "wf_po_001",
        policy
      }),
      state: "submitted"
    };

    const decision = evaluateWorkflowTransition({ actor, instance, policy, targetState: "approved" });

    expect(decision.allowed).toBe(false);
    expect(decision.reasons).toContain("Missing permissions: procurement.approve");
    expect(decision.reasons).toContain("Missing roles: procurement_manager");
  });

  it("does not expose actions for terminal states", () => {
    const policy = createWorkflowPolicy(purchaseOrderWorkflow);
    const instance = {
      ...createWorkflowInstance({
        document: { entity: "PurchaseOrder", id: "po_001" },
        id: "wf_po_001",
        policy
      }),
      state: "cancelled"
    };

    expect(getWorkflowActions(instance, policy, actor)).toEqual([]);
  });
});
