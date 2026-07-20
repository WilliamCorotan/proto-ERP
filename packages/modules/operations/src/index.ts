import type { ModuleManifest } from "@erp/core";
import type { Money } from "@erp/core";

export type Lead = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  source: string;
  stage: "new" | "qualified" | "disqualified";
  owner: string;
};

export type Opportunity = {
  id: string;
  leadId: string;
  companyName: string;
  stage: "discovery" | "proposal" | "won" | "lost";
  expectedValue: Money;
  expectedCloseDate: string;
};

export type Project = {
  id: string;
  code: string;
  name: string;
  customerName: string;
  status: "planned" | "active" | "completed" | "on_hold";
  budget: Money;
  startDate: string;
  endDate: string;
};

export type ProjectTask = {
  id: string;
  projectId: string;
  title: string;
  owner: string;
  status: "todo" | "doing" | "done";
  dueDate: string;
};

export type Employee = {
  id: string;
  employeeNumber: string;
  name: string;
  department: string;
  role: string;
  status: "active" | "inactive";
};

export type LeaveRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: "vacation" | "sick" | "personal";
  status: "requested" | "approved" | "rejected";
  startDate: string;
  endDate: string;
};

export type ServiceCase = {
  id: string;
  caseNumber: string;
  customerName: string;
  subject: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "closed";
  owner: string;
};

export type OperationsSnapshot = {
  leads: Lead[];
  opportunities: Opportunity[];
  projects: Project[];
  tasks: ProjectTask[];
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  serviceCases: ServiceCase[];
};

export const operationsManifest: ModuleManifest = {
  id: "operations",
  name: "Operations",
  version: "0.1.0",
  description: "CRM pipeline, project delivery, employee leave, and customer service operations.",
  dependencies: ["core", "sales"],
  permissions: [
    { key: "operations.read", label: "Read operations" },
    { key: "operations.manage", label: "Manage operations" }
  ],
  navigation: [{ label: "Operations", path: "/operations", icon: "briefcase-business", permission: "operations.read", order: 100 }],
  entities: [
    { name: "Lead", label: "Lead", permissions: ["operations.read", "operations.manage"] },
    { name: "Opportunity", label: "Opportunity", permissions: ["operations.read", "operations.manage"] },
    { name: "Project", label: "Project", permissions: ["operations.read", "operations.manage"] },
    { name: "Employee", label: "Employee", permissions: ["operations.read", "operations.manage"] },
    { name: "ServiceCase", label: "Service Case", permissions: ["operations.read", "operations.manage"] }
  ],
  workflows: [
    {
      id: "service-case-lifecycle",
      entity: "ServiceCase",
      states: ["open", "in_progress", "resolved", "closed"],
      initialState: "open",
      terminalStates: ["closed"]
    }
  ],
  events: ["operations.lead.created", "operations.service-case.closed", "operations.leave-request.approved"],
  jobs: ["operations.service-sla-review"],
  settings: ["operations_default_case_owner"]
};

export const demoOperationsData: OperationsSnapshot = {
  leads: [
    {
      id: "lead_001",
      companyName: "Northstar Clinics",
      contactName: "Elena Ruiz",
      email: "elena@northstar.example",
      source: "Partner referral",
      stage: "qualified",
      owner: "Mina Cruz"
    }
  ],
  opportunities: [
    {
      id: "opp_001",
      leadId: "lead_001",
      companyName: "Northstar Clinics",
      stage: "proposal",
      expectedValue: { amount: 42000, currency: "USD" },
      expectedCloseDate: "2026-08-30"
    }
  ],
  projects: [
    {
      id: "proj_001",
      code: "PRJ-1001",
      name: "Clinic rollout",
      customerName: "Northstar Clinics",
      status: "active",
      budget: { amount: 38000, currency: "USD" },
      startDate: "2026-07-15",
      endDate: "2026-09-30"
    }
  ],
  tasks: [
    {
      id: "task_001",
      projectId: "proj_001",
      title: "Configure device inventory sync",
      owner: "Operations Lead",
      status: "doing",
      dueDate: "2026-07-25"
    }
  ],
  employees: [
    {
      id: "emp_001",
      employeeNumber: "E-1001",
      name: "Mina Cruz",
      department: "Sales",
      role: "Account Executive",
      status: "active"
    }
  ],
  leaveRequests: [],
  serviceCases: [
    {
      id: "case_001",
      caseNumber: "CASE-2026-0001",
      customerName: "Northstar Clinics",
      subject: "Scanner onboarding issue",
      priority: "high",
      status: "in_progress",
      owner: "Support Lead"
    }
  ]
};
