import { z } from "zod";

export const PermissionSchema = z.object({
  key: z.string().min(3),
  label: z.string().min(1),
  description: z.string().optional()
});

export type Permission = z.infer<typeof PermissionSchema>;

export const NavigationItemSchema = z.object({
  label: z.string(),
  path: z.string(),
  icon: z.string().optional(),
  permission: z.string().optional(),
  order: z.number().default(100)
});

export type NavigationItem = z.infer<typeof NavigationItemSchema>;

export const EntitySchema = z.object({
  name: z.string(),
  label: z.string(),
  permissions: z.array(z.string()).default([])
});

export type EntityDefinition = z.infer<typeof EntitySchema>;

export const WorkflowSchema = z.object({
  id: z.string(),
  entity: z.string(),
  states: z.array(z.string()).min(1),
  initialState: z.string(),
  terminalStates: z.array(z.string()).default([])
});

export type WorkflowDefinition = z.infer<typeof WorkflowSchema>;

export const ModuleManifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  dependencies: z.array(z.string()).default([]),
  permissions: z.array(PermissionSchema).default([]),
  navigation: z.array(NavigationItemSchema).default([]),
  entities: z.array(EntitySchema).default([]),
  workflows: z.array(WorkflowSchema).default([]),
  events: z.array(z.string()).default([]),
  jobs: z.array(z.string()).default([]),
  settings: z.array(z.string()).default([])
});

export type ModuleManifest = z.infer<typeof ModuleManifestSchema>;

export type TenantContext = {
  tenantId: string;
  userId: string;
  roles: string[];
  permissions: string[];
};

export type AuditEvent = {
  id: string;
  tenantId: string;
  actorId: string;
  entity: string;
  entityId: string;
  action: string;
  message: string;
  createdAt: string;
};

export type DomainEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> = {
  id: string;
  tenantId: string;
  type: string;
  payload: TPayload;
  occurredAt: string;
};

export type Money = {
  amount: number;
  currency: string;
};

export type RecordStatus = "draft" | "submitted" | "approved" | "cancelled" | "closed";

export class ModuleRegistry {
  private readonly modules = new Map<string, ModuleManifest>();

  register(manifest: ModuleManifest): void {
    const parsed = ModuleManifestSchema.parse(manifest);
    if (this.modules.has(parsed.id)) {
      throw new Error(`Module already registered: ${parsed.id}`);
    }
    for (const dependency of parsed.dependencies) {
      if (!this.modules.has(dependency)) {
        throw new Error(`Module ${parsed.id} requires missing dependency ${dependency}`);
      }
    }
    this.modules.set(parsed.id, parsed);
  }

  list(): ModuleManifest[] {
    return [...this.modules.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  navigation(): NavigationItem[] {
    return this.list()
      .flatMap((module) => module.navigation)
      .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
  }

  permissions(): Permission[] {
    return this.list().flatMap((module) => module.permissions);
  }
}

export const coreManifest: ModuleManifest = {
  id: "core",
  name: "Core Platform",
  version: "0.1.0",
  description: "Tenancy, users, RBAC, settings, audit trail, module registry, and platform navigation.",
  dependencies: [],
  permissions: [
    { key: "core.admin", label: "Administer platform" },
    { key: "core.audit.read", label: "Read audit trail" }
  ],
  navigation: [
    { label: "Dashboard", path: "/", icon: "layout-dashboard", order: 1 },
    { label: "Workflow Inbox", path: "/workflow-inbox", icon: "inbox", order: 12 },
    { label: "Settings", path: "/settings", icon: "settings", permission: "core.admin", order: 900 }
  ],
  entities: [
    { name: "Tenant", label: "Tenant", permissions: ["core.admin"] },
    { name: "User", label: "User", permissions: ["core.admin"] },
    { name: "Role", label: "Role", permissions: ["core.admin"] },
    { name: "AuditEvent", label: "Audit Event", permissions: ["core.audit.read"] }
  ],
  workflows: [],
  events: ["core.audit.recorded", "core.module.enabled"],
  jobs: ["core.audit.retention"],
  settings: ["company_profile", "locale", "currency", "enabled_modules"]
};

export function createDefaultRegistry(modules: ModuleManifest[] = []): ModuleRegistry {
  const registry = new ModuleRegistry();
  registry.register(coreManifest);
  for (const module of modules) {
    registry.register(module);
  }
  return registry;
}
