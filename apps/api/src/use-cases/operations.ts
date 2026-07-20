import type { Lead, LeaveRequest, OperationsSnapshot, Project, ServiceCase } from "@erp/operations";
import type { CreateLeadInput, CreateLeaveRequestInput, CreateProjectInput, CreateServiceCaseInput } from "../repository.js";

export type OperationsUseCasePort = {
  operations(tenantId: string): Promise<OperationsSnapshot>;
  createLead(tenantId: string, input: CreateLeadInput): Promise<Lead>;
  createProject(tenantId: string, input: CreateProjectInput): Promise<Project>;
  createServiceCase(tenantId: string, input: CreateServiceCaseInput): Promise<ServiceCase>;
  createLeaveRequest(tenantId: string, input: CreateLeaveRequestInput): Promise<LeaveRequest>;
  closeServiceCase(tenantId: string, caseId: string): Promise<ServiceCase>;
};

export class OperationsUseCases {
  constructor(private readonly repository: OperationsUseCasePort) {}

  snapshot(tenantId: string): Promise<OperationsSnapshot> {
    return this.repository.operations(tenantId);
  }

  createLead(tenantId: string, input: CreateLeadInput): Promise<Lead> {
    return this.repository.createLead(tenantId, input);
  }

  createProject(tenantId: string, input: CreateProjectInput): Promise<Project> {
    return this.repository.createProject(tenantId, input);
  }

  createServiceCase(tenantId: string, input: CreateServiceCaseInput): Promise<ServiceCase> {
    return this.repository.createServiceCase(tenantId, input);
  }

  createLeaveRequest(tenantId: string, input: CreateLeaveRequestInput): Promise<LeaveRequest> {
    return this.repository.createLeaveRequest(tenantId, input);
  }

  closeServiceCase(tenantId: string, caseId: string): Promise<ServiceCase> {
    return this.repository.closeServiceCase(tenantId, caseId);
  }
}
