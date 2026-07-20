# ERP Feature Research, Architecture, And Implementation Roadmap

> **Historical research — non-authoritative.** Use the [ERPNext/SYSPRO Replacement Program](roadmap.md) for current status, sequencing, gates, and next work. This document preserves research and iteration evidence only.

Date: 2026-07-02

## Purpose

This document is the current source of truth for the remaining ERP implementation program. It combines competitive feature research, architecture guidance, implementation sequencing, acceptance criteria, and recurring evaluation gates.

The intent is not to copy any one ERP. The intent is to build a modular, extensible, deployable ERP ecosystem that reaches parity with broad systems like ERPNext and Odoo while developing deeper manufacturing/distribution strengths similar to SYSPRO, Business Central, and NetSuite.

## Research Sources

Primary references:

- ERPNext feature/product documentation: https://frappe.io/erpnext/usa and https://docs.frappe.io/erpnext/introduction
- ERPNext manufacturing documentation: https://docs.frappe.io/erpnext/manufacturing
- Odoo user documentation index: https://www.odoo.com/documentation/19.0/applications.html
- SYSPRO manufacturing ERP: https://us.syspro.com/industry-specific-software/manufacturing-software/
- SYSPRO distribution management: https://us.syspro.com/business-software/business-management-software/distribution-management/
- SYSPRO traceability ERP: https://us.syspro.com/business-software/business-management-software/traceability-erp-software/
- SYSPRO quality management factsheet: https://us.syspro.com/factsheet/quality-management/
- Microsoft Dynamics 365 Business Central documentation: https://learn.microsoft.com/en-us/dynamics365/business-central/
- Oracle NetSuite documentation: https://docs.oracle.com/en/cloud/saas/netsuite/

Local project references:

- `packages/core`: module registry, manifests, RBAC, workflow metadata, domain event contracts.
- `packages/modules/*`: current bounded-context DTOs and module manifests.
- `apps/api`: HTTP delivery, repository adapter, OpenAPI contract generation, partial use-case boundary extraction.
- `apps/web`: enterprise frontend shell, module pages, design system, command palette, Playwright smoke.
- `apps/worker`: worker execution path for outbox/automation.
- `docs/competitive-reevaluation-2026-07-02.md`: latest ERPNext/SYSPRO comparison.

## Current Architecture Score

Clean Architecture score: 7/10.

What is strong:

- The repository is already a modular monorepo with clear app/package separation.
- `packages/core` is stable and framework-free.
- Business modules are framework-free and depend on core contracts.
- API, web, worker, database, and SDK are delivery/adapters rather than domain packages.
- Some orchestration has already moved behind use-case ports in `apps/api/src/use-cases`.
- OpenAPI and SDK generation provide a contract discipline.
- Browser smoke, API smoke, lint, typecheck, tests, build, dependency audit, peer checks, and compose checks exist.

What prevents 10/10:

- Many application workflows still live in the API repository adapter rather than use-case interactors.
- Persistence is still primarily in-memory/demo-first for many flows, with database schema not yet the full source of persistence.
- Workflow definitions exist as metadata, but no universal workflow runtime enforces them.
- Some domain concepts are duplicated across modules instead of being first-class shared policies.
- Integration adapters are metadata-only; connector execution is not yet a clean adapter runtime.
- Reporting/printing/customization are present but not yet modeled as reusable cross-module platform services.

Architecture improvements required:

- Move one workflow at a time from controller/repository orchestration into use-case interactors.
- Define domain policies inside module packages or dedicated platform packages, never inside controllers.
- Keep database adapters outside business policy packages.
- Use input/output DTOs at every boundary.
- Emit domain events through a stable event port.
- Treat web, API, worker, Prisma, Redis, MinIO, SMTP, EDI, and commerce connectors as replaceable adapters.

## Competitive Feature Signals

### ERPNext

ERPNext signals broad open-source ERP coverage:

- Document-centric workflows across buying, selling, stock, manufacturing, accounting, HR, projects, support, and CRM.
- DocTypes, custom fields, form customization, print formats, reports, workflows, assignments, and roles.
- Buying cycle: material request, RFQ, supplier quotation, purchase order, purchase receipt, purchase invoice, payment.
- Selling cycle: lead, opportunity, quotation, sales order, delivery, invoice, payment, returns.
- Stock: item master, warehouses, serial/batch, stock ledger, reorder, valuation, stock reconciliation, barcode.
- Manufacturing: BOM, production plan, work order, job card, MRP, capacity planning, subcontracting.
- HR/payroll, projects, timesheets, expense claims, POS, website/e-commerce, support.

Implication for this project:

- Implement a universal document/workflow runtime.
- Make customization metadata executable, not only visible.
- Build report/print/import builders as platform features.
- Complete portals, HR/project/time/service workflows.

### Odoo

Odoo signals breadth plus strong operational UI:

- Finance: consolidation, taxes, customer invoices, vendor bills, payments, bank synchronization, reconciliation, analytic accounting, budgets, year-end closing.
- Sales/POS/e-commerce: quotation templates, margins, product variants, pricelists, discounts, returns/refunds, loyalty, subscriptions, online payment.
- Inventory: UoM, packages, product tracking, serials/lots, expiration, replenishment, multi-step receipt/delivery, put-away, wave/batch/cluster picking, removal strategies, landed costs.
- Manufacturing: multi-level BOMs, work centers, dependencies, MPS, time off, scrap, backorders, split/merge, unbuild, by-products, lots/serials, shop-floor time tracking, subcontracting, OEE.
- Barcode: receiving, delivery, batch transfers, product/location/lot barcodes, RFID.

Implication for this project:

- Prioritize WMS and manufacturing depth.
- Add pricing/subscription/returns/loyalty after stock and workflow maturity.
- Build mobile scan flows and dense operator UIs.

### SYSPRO

SYSPRO signals manufacturing/distribution depth:

- Manufacturing operations management, planning, scheduling, shop-floor visibility, labor/machine/resource tracking, and factory documentation.
- Distribution management, inventory control, order management, warehouse management, demand planning, and supply chain visibility.
- Lot/serial traceability, quality, recall, compliance, and supplier/customer audit trails.
- EDI, e-commerce, B2B transactions, and operational analytics.

Implication for this project:

- Deepen lot/serial, recalls, quality holds, and auditability.
- Add finite scheduling, OEE/OLE/TEEP, shop-floor dashboards, and factory documentation.
- Add real connector adapters beyond webhook metadata.

### Business Central And NetSuite

Business Central and NetSuite signal enterprise completeness:

- Financial control: multi-company, dimensions, budgets, consolidated statements, bank feeds, cash forecasting.
- Order and inventory: pricing, fulfillment, returns, warehouse picks/put-away, item tracking.
- Manufacturing and planning: production orders, capacity, demand planning, supply planning.
- Platform: reports, extensibility, approval workflows, auditability, integrations, role centers/dashboards.

Implication for this project:

- Add accounting dimensions and multi-company later, after workflow and document runtime.
- Treat role dashboards and saved views as a platform feature.
- Add audit and approval governance before complex financial expansion.

## Feature Gap Inventory

### Platform And Extensibility

Implemented:

- Module registry, manifests, permissions, navigation, settings, workflows metadata, events, jobs.
- Custom fields, configurable views, automation rules metadata.
- Users, roles, admin views, module enablement.
- API, SDK, OpenAPI, web app, worker, Docker.

Still needed:

- Universal document model and workflow runtime.
- Approval rules, assignments, comments, attachments, locks, audit trail per document.
- Metadata-driven form layout and validation.
- Import/export templates and validation preview.
- Saved views, filters, bulk actions, and user preferences.
- Plugin/connector packaging with adapter lifecycle.
- Tenant-scoped feature flags and module migrations.

### Finance

Implemented:

- Chart of accounts, fiscal periods, journal entries, payments, bank reconciliation, landed cost, fixed assets, depreciation, exchange rates, trial balance, AR/AP aging snapshot.

Still needed:

- Multi-company, branches, intercompany.
- Cost centers, dimensions, projects-as-dimensions.
- Budgets and budget controls.
- Financial statements: balance sheet, profit and loss, cash flow, general ledger, tax reports.
- Tax engine, withholding tax, fiscal positions, localizations.
- Bank feeds, bank statement import, reconciliation rules.
- Payment batches, dunning, credit control, cash forecast.
- Revenue recognition and deferred revenue/expense.

### Sales, CRM, Pricing, And Service

Implemented:

- Customers, products, quotes, sales orders, invoices, quote-to-order, order-to-invoice, CRM leads/opportunities, service cases.

Still needed:

- Price lists, product variants, UoM, pricing rules, discount rules, promotions.
- Credit holds and margin approval.
- Sales returns, RMA, credit notes, warranty claims.
- Delivery orders, shipment planning, carrier integrations, shipping labels.
- Contracts, subscriptions, recurring invoices.
- Customer portal and support knowledge base.
- SLA timers, escalations, service appointments, field service.

### Procurement And Supplier Collaboration

Implemented:

- Suppliers, material requests, RFQ/quotation concepts, purchase orders, purchase receipts, purchase invoices, supplier payments, PO workflow metadata.

Still needed:

- Supplier portal, RFQ online response, PO acknowledgement, ASN.
- Blanket orders, contracts, call-off orders.
- Supplier price lists, lead times, minimum order quantities.
- Supplier returns and debit notes.
- Incoming quality plans and supplier corrective action.
- Demand-driven requisitions and replenishment suggestions.

### Inventory And WMS

Implemented:

- Warehouses, bins, stock ledger, reservations, transfers, cycle counts, reorder points, valuation layers, pick/pack/ship, put-away, barcode scan records.

Still needed:

- Item tracking mode, lots, serials, expiration dates, shelf life.
- Inventory holds/quarantine linked to quality and recalls.
- License plates, containers, packages, nested handling units.
- Directed put-away, pick path, wave picking, batch/cluster picking.
- Replenishment tasks and min/max policy execution.
- FEFO/FIFO/LIFO/closest-location removal strategies.
- Mobile scan UI for receive, put-away, pick, pack, ship, transfer, count.
- Inventory dimensions, consignment, dropship, cross-dock.
- Warehouse labor metrics and exception dashboard.

### Manufacturing, MES, And Planning

Implemented:

- BOMs, work centers, routings, production plans, MRP suggestions, work orders, job cards, downtime, capacity schedule snapshot.

Still needed:

- Multi-level BOM explosion.
- BOM revisions, engineering change orders, effective dates.
- Work-center calendars, shift calendars, finite scheduling.
- Operation dependencies, queue times, setup/run/teardown.
- Labor and machine bookings.
- Scrap, rework, by-products, co-products, unbuild/disassembly.
- Subcontracting and subcontractor stock.
- MPS, demand forecast, safety stock, planning exceptions.
- OEE/OLE/TEEP, downtime reason Pareto, shop-floor dashboard.
- Factory documents and operator instructions.

### Quality, Compliance, And Traceability

Implemented:

- Trace records, trace movements, genealogy endpoint, inspection templates, inspections, NCR, CAPA, supplier scorecards, recalls.

Still needed:

- Lot/serial integration across every stock movement.
- Inspection plans by item/supplier/customer/work-center.
- Calibration, equipment checks, gauges.
- Quarantine/hold release workflow.
- Recall action tasks, contacts, notices, status tracking.
- Mock recall drill reports.
- Compliance documents and certificate of analysis.
- Audit-ready electronic signatures for regulated flows.

### Commerce, POS, And Portals

Implemented:

- POS registers, shifts, POS sales, tender types, channel catalog, channel orders.

Still needed:

- Offline POS sync model.
- Discounts, coupons, loyalty, gift cards, customer account payments.
- Returns/refunds and exchange flows.
- E-commerce product catalog, checkout, customer accounts, order status.
- Payment provider adapters.
- B2B customer portal and supplier portal.

### HR, Payroll, Projects, And Time

Implemented:

- Attendance, expenses, advances, payroll runs, payslips, projects, leave requests.

Still needed:

- Employees master data, departments, positions, contracts.
- Shift scheduling, holidays, overtime, leave policies.
- Timesheets linked to projects, service, manufacturing, and payroll.
- Payroll components, tax/benefit rules, statutory reports.
- Project billing, milestones, utilization, WIP.
- Expense policy controls and corporate card import.

### Reporting, Documents, And Analytics

Implemented:

- Saved reports, report runs, report previews, print formats, export jobs, dashboards, scheduled delivery metadata.

Still needed:

- Report builder UI with joins, filters, aggregates, permissions.
- Print format designer with blocks, tables, barcodes, signatures, letterheads.
- Scheduled delivery worker and subscriptions.
- KPI builder and role dashboards.
- Drill-down analytics from dashboard cards.
- CSV/XLSX import/export job management.
- Data warehouse/star schema later, after operational model stabilizes.

### Integrations

Implemented:

- API keys, webhooks, outbox events, retry/dead-letter visibility, mappings, connector registry.

Still needed:

- Connector adapter runtime with auth, map, transform, validate, dispatch, reconcile, replay.
- EDI flows: 850 purchase order, 855 acknowledgement, 856 ASN, 810 invoice, 940/945 warehouse.
- E-commerce adapters: Shopify/WooCommerce-style order and catalog sync.
- SFTP/CSV adapter.
- Payment provider adapters.
- Carrier/shipping adapters.
- Idempotency keys and inbound event inbox.
- Connector health, latency, error budgets, replay UI.

## Target Architecture

### Architecture Style

Use a modular monolith with clean architecture boundaries first. Split services only when a boundary has independent scale, operational ownership, or release cadence.

Layering:

1. Domain entities and policies: framework-free business rules.
2. Use cases: application workflows, orchestration, transactions, ports.
3. Interface adapters: repositories, presenters, API controllers, web actions, worker handlers.
4. Frameworks/drivers: Nest, Next, Prisma, Redis, MinIO, queues, email, EDI, payment gateways, browser.

Dependency rule:

- `packages/core` has no dependency on apps or business modules.
- Business modules depend on core only, or on explicitly stable shared platform packages.
- Use-case ports are defined inward; API/repository/database adapters implement them outward.
- Controllers, web actions, and workers call use cases; use cases never import delivery frameworks.
- DTOs cross boundaries; ORM models and framework request/response types do not.

### Proposed Package Evolution

Current packages remain:

- `packages/core`
- `packages/modules/*`
- `packages/db`
- `packages/sdk`
- `apps/api`
- `apps/web`
- `apps/worker`

Add when implementation begins:

- `packages/platform-workflow`: workflow definitions, instances, transitions, approvals, assignments, comments, locks.
- `packages/platform-documents`: document identity, attachments, comments, print metadata, audit references.
- `packages/platform-inventory-tracking`: lot/serial/hold policies shared by inventory, quality, procurement, manufacturing, commerce.
- `packages/platform-pricing`: price list, discount, tax, promotion, credit hold policies.
- `packages/platform-connectors`: adapter interfaces, connector result types, mapping validation.

Rule:

- Add a platform package only when at least two modules need the same business policy.
- Otherwise keep logic inside the owning module.

### Workflow Runtime Architecture

Core concepts:

- `WorkflowDefinition`: registered from module manifest or tenant customization.
- `WorkflowInstance`: one per document lifecycle.
- `WorkflowTransition`: transition history with actor, timestamp, from/to state, reason.
- `ApprovalRule`: permission/role/amount/entity guard.
- `Assignment`: owner/reviewer/operator task.
- `DocumentLock`: prevents conflicting edits.
- `DocumentComment` and `DocumentAttachment`: collaboration and audit context.

Ports:

- `WorkflowRepository`
- `WorkflowDefinitionProvider`
- `PermissionEvaluator`
- `DocumentGateway`
- `DomainEventPublisher`
- `AuditLog`

Use cases:

- `StartWorkflow`
- `GetWorkflowActions`
- `TransitionWorkflow`
- `AssignDocument`
- `CommentOnDocument`
- `LockDocument`
- `UnlockDocument`

Integration points:

- Sales quote/order transitions.
- Procurement PO approval.
- Journal posting.
- Expense approval.
- Quality NCR/CAPA/recall.
- Command palette action discovery.

### Data Architecture

Short term:

- Keep demo/in-memory flows for rapid iteration where needed.
- Add durable persistence for cross-cutting platform features first: workflow, document comments, assignments, attachments, outbox/inbox.
- Preserve deterministic seeded data for local smoke tests.

Medium term:

- Move module snapshots from in-memory repository to persisted aggregate stores incrementally.
- Add migration strategy and seed strategy per module.
- Add idempotency tables for inbound commands and integrations.

Long term:

- Add analytical/read-model layer for reporting and dashboards.
- Keep operational writes normalized; build reporting models separately.

### API And SDK Architecture

Rules:

- Every endpoint delegates to a use case.
- OpenAPI contract generation is mandatory after endpoint changes.
- SDK types are regenerated after contract changes.
- Use idempotency keys for external command endpoints.
- Use stable error envelopes and validation errors.
- Add route groups by business capability, not by technical table.

### Frontend Architecture

Rules:

- Continue using the enterprise design system.
- Use dense, work-focused screens for operations, not marketing layouts.
- Use `DataTable` for tabular records, `RecordPanel` for workflow panels, `Timeline` for audit/activity, and command palette for route/action discovery.
- Add role dashboards and saved views as platform features.
- Mobile-first scan flows should be separate task surfaces, not squeezed into desktop pages.

### Worker Architecture

Workers should handle:

- Outbox dispatch.
- Workflow reminders/escalations.
- Scheduled reports.
- Replenishment suggestions.
- MRP planning.
- Connector sync.
- Import/export jobs.
- Bank feed ingestion.

Worker handlers should call use cases through ports and should not contain business policy.

## Master Roadmap

Every phase ends with:

- Architecture review against dependency rule.
- Contract generation when API changes.
- Focused tests for new use cases.
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm audit`
- `pnpm peers check`
- `docker compose config --quiet`
- Relevant smoke tests: API, worker, browser.
- Update this roadmap with what was learned and the next selected phase.

### Phase 1 - Universal Workflow Runtime

Goal:

- Replace bespoke status transitions with a reusable workflow engine.

Build:

- Workflow domain types and package.
- Workflow use cases and ports.
- API endpoints for actions and transition execution.
- UI pending approvals panel.
- Command palette workflow actions.

Acceptance:

- Quote, purchase order, expense claim, and NCR can expose allowed transitions through the same runtime.
- Permission and role guards are enforced.
- Transition history is visible.
- Tests cover allowed, denied, and terminal-state transitions.

### Phase 2 - Document Collaboration And Audit

Goal:

- Add assignments, comments, attachments, locks, and per-document audit timeline.

Build:

- Document platform package.
- Attachments metadata, comments, assignment tasks, edit locks.
- Document timeline UI component.
- Worker reminders for stale assignments.

Acceptance:

- Any supported document can have comments, assignments, attachments, and audit entries.
- Workflow transitions write to document timeline.
- Locked documents block conflicting transitions/edits.

### Phase 3 - Lot/Serial Tracking And Inventory Holds

Goal:

- Make traceability operational, not just a quality snapshot.

Build:

- Tracking mode on products.
- Lot and serial records.
- Inventory hold/quarantine.
- Trace IDs on ledger, receipt, transfer, work-order issue/receipt, shipment, POS, returns.

Acceptance:

- Tracked products require lot/serial on material movements.
- Quality inspection failure creates a hold.
- Held lots cannot be allocated or shipped.
- Genealogy resolves purchase, stock, production, shipment, and quality history.

### Phase 4 - Returns, RMA, Supplier Returns, And Recall Actions

Goal:

- Complete reverse logistics and recall execution.

Build:

- Customer return/RMA.
- Supplier return/debit note.
- Recall actions, contact lists, customer notifications, supplier impact.
- Credit note and inventory reversal policies.

Acceptance:

- A shipped item can be returned, inspected, restocked/scrapped, credited, and traced.
- Recall blocks affected lots and generates action tasks.
- Supplier return reverses stock and AP where applicable.

### Phase 5 - Advanced WMS

Goal:

- Move from basic WMS transactions to directed warehouse execution.

Build:

- Pick waves, replenishment tasks, license plates, containers, packing station, scan session.
- Directed pick/put-away engines.
- Batch, cluster, and wave picking.
- Mobile scan pages.

Acceptance:

- Sales order release can create a pick wave.
- Purchase receipt creates put-away suggestions.
- Reorder point creates replenishment tasks.
- Mobile scan flow processes receive, put-away, pick, pack, ship, transfer, count.

### Phase 6 - Manufacturing Scheduling And OEE

Goal:

- Add shop-floor depth comparable to manufacturing-focused ERP systems.

Build:

- Work-center calendar, shift calendar, finite schedule.
- Operation queue and dependencies.
- Labor/machine booking.
- Scrap/rework/byproduct records.
- OEE/OLE/TEEP metrics and downtime Pareto.

Acceptance:

- Work order release schedules operations.
- Job cards record actual labor/machine time and scrap.
- OEE dashboard calculates availability, performance, and quality.
- Quality failures and downtime flow into OEE.

### Phase 7 - BOM Revisions, ECO, And Subcontracting

Goal:

- Mature engineering/manufacturing control.

Build:

- BOM/routing revisions and effective dates.
- Engineering change orders.
- Multi-level BOM comparison.
- Subcontracting orders and subcontractor stock.

Acceptance:

- MRP uses effective BOM/routing revision.
- ECO approval changes active revision.
- Subcontracting consumes and receives stock correctly.

### Phase 8 - Pricing, Credit, Tax, And Revenue Controls

Goal:

- Add order-to-cash controls needed by distribution and finance.

Build:

- Price lists, pricing rules, discounts, promotions.
- Tax engine and fiscal positions.
- Credit limit and margin approval.
- Sales returns/credit notes.
- Dunning and payment follow-up.

Acceptance:

- Quote/order pricing is calculated by policy.
- Credit hold blocks approval through workflow.
- Return creates credit note and correct stock/accounting reversal.

### Phase 9 - Financial Management Expansion

Goal:

- Mature finance beyond transaction posting.

Build:

- Accounting dimensions, cost centers, budgets.
- Financial statements.
- Multi-company and intercompany basics.
- Bank feed import and reconciliation rules.
- Cash forecast.

Acceptance:

- Trial balance, P&L, balance sheet, and cash flow are generated.
- Budget controls can warn/block transactions.
- Bank import can reconcile common payments.

### Phase 10 - Customer And Supplier Portals

Goal:

- Add controlled external collaboration.

Build:

- Portal auth and role model.
- Customer portal: quotes, orders, invoices, shipments, tickets, returns.
- Supplier portal: RFQs, quotations, PO acknowledgement, ASN, scorecards.

Acceptance:

- Portal user can only see scoped records.
- Supplier can respond to RFQ.
- Customer can request RMA and view invoice/shipment.

### Phase 11 - Connector Adapter Runtime

Goal:

- Turn connector metadata into executable integrations.

Build:

- Adapter interface with auth, map, transform, validate, dispatch, reconcile, replay.
- Inbound inbox with idempotency.
- SFTP/CSV adapter.
- E-commerce order adapter.
- EDI 850/855/856/810 proof.

Acceptance:

- Connector can ingest an order idempotently.
- Outbound events can be mapped and dispatched through adapter runtime.
- Failed connector events are replayable.

### Phase 12 - Report, Import, And Print Builders

Goal:

- Bring ERPNext/Odoo-style no-code document and reporting tools into the platform.

Build:

- Report builder UI.
- Saved views and bulk actions.
- Print format visual editor.
- Import templates and validation preview.
- Scheduled delivery worker.

Acceptance:

- Tenant admin can build a report, export it, schedule it, and create a print format without code.
- Import preview catches validation errors before writing.

### Phase 13 - HR, Time, Projects, And Service Depth

Goal:

- Mature service and people workflows.

Build:

- Employee master, contracts, departments, leave policies, shifts.
- Timesheets linked to projects, service, manufacturing, payroll.
- Project billing and milestones.
- Service SLA, escalation, appointment scheduling, knowledge base.

Acceptance:

- Time can be captured once and used for payroll, project billing, and manufacturing/service costing.
- SLA escalation creates assignments and workflow events.

### Phase 14 - Deployment, Observability, And Production Hardening

Goal:

- Make the platform production-operable.

Build:

- Structured logs, metrics, traces.
- Health checks, readiness checks.
- Backup/restore runbook.
- Tenant data isolation tests.
- Rate limits, idempotency, audit log retention.
- CI validation matrix.

Acceptance:

- App can be deployed with documented operational checks.
- Tenant isolation has automated tests.
- Worker queues and connectors have observable failure modes.

## Iteration Protocol

For each implementation iteration:

1. Re-read the relevant phase and current code.
2. Select the smallest vertical slice that proves the phase.
3. Define acceptance criteria before editing.
4. Implement domain/use-case first.
5. Add adapter/API/web/worker layers only after the use case is testable.
6. Add tests and smoke coverage.
7. Run validation.
8. Update the roadmap with evaluation notes.
9. Choose the next slice based on the new state, not the old plan.

## Immediate Next Iteration

Implement Phase 1: Universal Workflow Runtime.

First slice:

- Create `packages/platform-workflow`.
- Define framework-free workflow types and transition policy.
- Add tests for allowed, denied, and terminal transitions.
- Register existing module workflow definitions.
- Add API use case for `GetWorkflowActions` and `TransitionWorkflow`.
- Integrate one existing lifecycle first: purchase order or sales quote.

Why this first:

- It reduces duplicated status handling.
- It unlocks approvals across every module.
- It gives the command palette real action commands.
- It is the cleanest bridge from current metadata to ERPNext/Odoo-style configurability.

## Implementation Log

### Iteration 1 - Workflow Runtime Foundation

Status: implemented.

Implemented:

- Added `@erp/platform-workflow` as a framework-free package.
- Added workflow policies, default transition derivation, workflow instances, actor-aware actions, transition records, transition execution, and transition errors.
- Added guard support for required permissions and roles.
- Added tests for manifest policy creation, allowed actions, transition history, invalid transitions, guard failures, terminal states, and cancellation.
- Added workspace TypeScript path and verified Turbo includes the package.

Evaluation:

- Architecture score improves toward 8/10 for workflow policy because the transition rules are now outside Nest, Prisma, web, and repository adapters.
- The default transition derivation intentionally matches common ERP document lifecycles: sequential progress, cancellation from active states, and close from the final active state.
- The runtime is not persistent yet; document binding and durable workflow instances remain the next gap.

Validation:

- `pnpm --filter @erp/platform-workflow typecheck`
- `pnpm --filter @erp/platform-workflow lint`
- `pnpm --filter @erp/platform-workflow test`
- `pnpm typecheck`
- `pnpm test`
- `pnpm lint`

### Iteration 2 - Workflow API Discovery And Transition Use Case

Status: implemented.

Implemented:

- Added `WorkflowUseCases` in the API use-case boundary.
- Added `GET /workflows` to expose registered workflow policies from module manifests.
- Added `POST /workflows/actions` to resolve allowed actions for an authenticated actor and supplied document state.
- Added `POST /workflows/transitions` to execute a workflow transition against a supplied document state through the shared runtime.
- Added validation schemas, OpenAPI component schemas, generated OpenAPI, and regenerated SDK types.
- Added API use-case tests for policy listing, actor-specific actions, successful transitions, and invalid transitions.

Evaluation:

- This gives the frontend and command palette a stable action-discovery contract without replacing existing document mutation endpoints prematurely.
- The transition endpoint is still state-supplied and non-persistent. The next implementation slice should create durable workflow instances and bind at least one real document lifecycle to them.
- Purchase order or sales quote is the best first bound lifecycle because both already have status workflows and tests.

Validation:

- `pnpm --filter @erp/api typecheck`
- `pnpm --filter @erp/api lint`
- `pnpm --filter @erp/api test`
- `pnpm --filter @erp/sdk typecheck`
- `pnpm contracts:generate`

### Next Selected Slice

Implement durable workflow instances for purchase orders.

Acceptance criteria:

- Purchase order creation starts a workflow instance.
- Purchase order status transition uses `@erp/platform-workflow` policy before repository mutation.
- Workflow transition history is returned in an API response or document timeline DTO.
- Existing invalid transition tests continue to pass.
- New tests prove purchase order cannot jump from `draft` to `closed` and can move `draft` to `submitted`.

### Iteration 3 - Purchase Order Workflow Binding

Status: implemented as runtime validation binding.

Implemented:

- Bound the existing purchase-order status endpoint to `WorkflowUseCases` before repository mutation.
- The endpoint now fetches the current purchase order state, validates the requested target state against the shared workflow runtime, and only then delegates to the existing repository mutation.
- Existing repository transition validation remains in place as a secondary guard.

Evaluation:

- This proves a real document lifecycle can consume the shared workflow runtime without a broad rewrite.
- Durable workflow instances and persisted transition history are still not implemented. The current binding validates policy but does not yet store workflow records separately from audit events.
- The next slice should add workflow instance storage in the repository layer, starting with purchase orders.

Validation:

- `pnpm --filter @erp/api typecheck`
- `pnpm --filter @erp/api lint`
- `pnpm --filter @erp/api test`

### Next Selected Slice After Iteration 3

Persist workflow instances and transition records for purchase orders.

Acceptance criteria:

- Purchase order creation creates a workflow instance.
- Purchase order transition stores a workflow transition record.
- Procurement snapshot or a workflow endpoint can return transition history for `po_001`.
- Tests cover persisted transition history and invalid transition rejection.

### Iteration 4 - Durable Workflow Persistence

Status: implemented.

Implemented:

- Added generic `WorkflowInstance` and `WorkflowTransition` Prisma models with tenant, workflow, document, state, and transition-history indexes.
- Added a checked-in Prisma migration for workflow persistence.
- Extended the repository boundary with `workflowInstance`, `ensureWorkflowInstance`, and `recordWorkflowTransition`.
- Implemented workflow persistence in both the memory repository and Prisma repository.
- Purchase-order creation now starts a `procurement.purchase-order` workflow instance.
- Purchase-order status transitions now pass the evaluated runtime transition into the repository mutation so Prisma can store order status, workflow transition history, and audit trail together in one transaction.
- Added `POST /workflows/instances/lookup` so API and SDK clients can retrieve persisted workflow state and transition history by workflow/document reference.
- Updated validation, OpenAPI contract schemas, generated SDK types, SDK convenience methods, and repository tests.

Evaluation:

- Architecture score improves toward 8.5/10 for workflow capability: the runtime remains framework-free, use cases orchestrate policy evaluation, and persistence is isolated behind repository methods.
- The workflow tables are generic enough for sales quotes/orders, HR expenses, manufacturing work orders, and quality inspections.
- Purchase-order status is now the first real durable lifecycle, but action discovery still requires callers to provide `currentState`. The next slice should read current workflow state from persistence where available.

Validation:

- `pnpm --filter @erp/db prisma generate`
- `pnpm contracts:generate`
- `pnpm --filter @erp/db typecheck`
- `pnpm --filter @erp/api typecheck`
- `pnpm --filter @erp/sdk typecheck`
- `pnpm --filter @erp/api test`
- `pnpm --filter @erp/api lint`
- `pnpm --filter @erp/db lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm lint`
- `pnpm build`
- `pnpm audit`
- `pnpm peers check`
- `docker compose config --quiet`
- `pnpm --filter @erp/web smoke:ui`
- `pnpm smoke:worker` exited successfully, with existing outbox delivery state still reporting 19 claimed, 0 dispatched, and 19 failed.

### Next Selected Slice After Iteration 4

Stateful workflow actions and UI timeline integration.

Acceptance criteria:

- Workflow action discovery can use persisted workflow instance state when `currentState` is omitted.
- Purchase-order UI can show available workflow actions from `/workflows/actions` instead of hard-coded status choices.
- Purchase-order UI can show persisted workflow transition history from `/workflows/instances/lookup`.
- API and web tests cover action discovery from stored state and timeline rendering.

### Iteration 5 - Stateful Workflow Actions And Procurement Timeline UI

Status: implemented.

Implemented:

- Made `currentState` optional on `WorkflowActionsRequest`.
- Updated `workflowActions` service orchestration so omitted state resolves from persisted `WorkflowInstance` data.
- Regenerated OpenAPI and SDK types after the action-discovery contract change.
- Added SDK-facing workflow helpers to the web data layer for purchase-order actions and persisted workflow instance lookup.
- Replaced the procurement page's hard-coded purchase-order status select with action buttons returned from `/workflows/actions`.
- Added a compact workflow transition history surface to each purchase-order card using `/workflows/instances/lookup`.
- Added procurement route and workflow-surface coverage to Playwright desktop/mobile smoke tests.

Evaluation:

- Workflow actions are now progressively stateful: new persisted instances can resolve actions without caller-supplied state, while legacy records fall back to explicit document status until they receive workflow instances.
- The purchase-order UI now consumes the workflow platform instead of duplicating lifecycle options in the frontend.
- The next implementation slice should apply the same durable workflow binding to sales quotes and sales orders, then remove remaining hard-coded document status controls from those pages.

Validation:

- `pnpm contracts:generate`
- `pnpm --filter @erp/api typecheck`
- `pnpm --filter @erp/api test`
- `pnpm --filter @erp/sdk typecheck`
- `pnpm --filter @erp/web typecheck`
- `pnpm --filter @erp/web lint`
- `pnpm --filter @erp/web build`
- `ERP_WEB_SMOKE_PORT=4023 pnpm --filter @erp/web smoke:ui`
- `pnpm typecheck`
- `pnpm test`
- `pnpm lint`
- `pnpm build`
- `pnpm audit`
- `pnpm peers check`
- `docker compose config --quiet`
- `pnpm smoke:worker` exited successfully, with existing outbox delivery state still reporting 19 claimed, 0 dispatched, and 19 failed.

### Next Selected Slice After Iteration 5

Sales quote and sales order workflow persistence plus UI action migration.

Acceptance criteria:

- Quote and sales-order creation or existing generation starts workflow instances.
- Quote and sales-order status transitions store workflow transition records.
- Quote and order pages use `/workflows/actions` instead of hard-coded status selects.
- Quote and order pages show persisted workflow transition history.
- Tests cover quote/order persisted transition history, invalid transition rejection, and browser rendering.

### Iteration 6 - Sales Workflow Persistence And UI Migration

Status: implemented.

Implemented:

- Bound quote and sales-order status endpoints to `WorkflowUseCases` before repository mutation.
- Extended quote and sales-order repository transitions to accept and persist evaluated workflow transition records.
- Persisted quote and sales-order workflow transitions in both memory and Prisma repositories.
- Backfilled or started `sales.order` workflow instances when `generateOrderFromQuote` returns an existing order or creates a new order.
- Added repository tests proving quote and sales-order workflow history is stored and retrievable.
- Added sales workflow data helpers for quote/order action discovery and workflow history lookup.
- Replaced hard-coded quote and order status selects with workflow action buttons from `/workflows/actions`.
- Added persisted workflow history surfaces to quote and order cards.
- Expanded Playwright smoke coverage for quote/order desktop rendering and mobile overflow checks.

Evaluation:

- The workflow platform is now used by procurement purchase orders and core sales quote/order lifecycles.
- The remaining status selects are narrower now; invoices still use document-specific status logic because invoice posting drives accounting side effects and should get a separate workflow-plus-posting slice.
- The repeated worker smoke result shows a persistent integration reliability gap: outbox dispatch exits successfully but leaves 19 failed deliveries. The next roadmap slice should make outbox failures actionable with retry limits, dead-letter remediation, and clearer operator controls before expanding more event-producing modules.

Validation:

- `pnpm --filter @erp/api typecheck`
- `pnpm --filter @erp/api test`
- `pnpm --filter @erp/api lint`
- `pnpm --filter @erp/web typecheck`
- `pnpm --filter @erp/web lint`
- `pnpm --filter @erp/web build`
- `ERP_WEB_SMOKE_PORT=4024 pnpm --filter @erp/web smoke:ui`
- `pnpm typecheck`
- `pnpm test`
- `pnpm lint`
- `pnpm build`
- `pnpm audit`
- `pnpm peers check`
- `docker compose config --quiet`
- `pnpm smoke:worker` exited successfully, with existing outbox delivery state still reporting 19 claimed, 0 dispatched, and 19 failed.

### Next Selected Slice After Iteration 6

Outbox failure remediation and operator controls.

Acceptance criteria:

- Outbox dispatcher should stop repeatedly claiming terminally failed events after a configured max attempt threshold.
- Failed events should be moved or exposed as actionable dead-letter records with last error and attempt count.
- Integration UI should show retry/dead-letter actions for outbox failures without requiring direct database inspection.
- Worker smoke should clearly distinguish "nothing dispatchable" from "failed deliveries remain" and include a test for max-attempt behavior.

### Iteration 7 - Outbox Failure Remediation And Operator Controls

Status: implemented.

Implemented:

- Extended `DeadLetterRecord` so it can reference either a webhook delivery or an outbox event.
- Added a Prisma migration for outbox-backed dead-letter records.
- Added `dead_letter` status to outbox DTOs, OpenAPI, SDK types, mappers, and status badge tones.
- Updated API/manual outbox dispatch so failed events move to `dead_letter` after `OUTBOX_MAX_ATTEMPTS` attempts.
- Updated memory and Prisma repository paths to create outbox dead-letter records with source ids and reasons.
- Updated the worker dispatcher to skip terminal failed events, sweep exhausted failed events into dead letters, and report `deadLettered` separately from `failed`.
- Updated integration UI copy and controls so only dispatchable outbox events show operator dispatch/dead-letter actions, while dead letters identify webhook vs outbox source.
- Added API repository tests for outbox max-attempt dead-lettering.
- Added worker tests for dead-lettered outcomes, terminal sweeps, and max-attempt claim behavior.
- Applied pending Prisma migrations locally, including workflow persistence and outbox dead-letter support.

Evaluation:

- Worker smoke now reports a clean queue: 0 claimed, 0 dead-lettered, 0 dispatched, 0 failed.
- The integration operator surface now distinguishes dispatchable work from terminal dead-letter records.
- This closes the repeated failed-outbox state observed in earlier iterations and improves platform reliability before adding more event-producing modules.
- The next slice should bind invoice status to the workflow runtime while preserving accounting posting semantics, because invoice transitions still use hard-coded status controls and drive financial side effects.

Validation:

- `pnpm --filter @erp/db prisma generate`
- `pnpm --filter @erp/db prisma migrate deploy`
- `pnpm contracts:generate`
- `pnpm --filter @erp/db typecheck`
- `pnpm --filter @erp/api typecheck`
- `pnpm --filter @erp/api test`
- `pnpm --filter @erp/api lint`
- `pnpm --filter @erp/worker typecheck`
- `pnpm --filter @erp/worker test`
- `pnpm --filter @erp/worker lint`
- `pnpm --filter @erp/sdk typecheck`
- `pnpm --filter @erp/web typecheck`
- `pnpm --filter @erp/web lint`
- `pnpm --filter @erp/web build`
- `ERP_WEB_SMOKE_PORT=4025 pnpm --filter @erp/web smoke:ui`
- `pnpm typecheck`
- `pnpm test`
- `pnpm lint`
- `pnpm build`
- `pnpm audit`
- `pnpm peers check`
- `docker compose config --quiet`
- `pnpm smoke:worker`

### Next Selected Slice After Iteration 7

Invoice workflow persistence with accounting-safe posting.

Acceptance criteria:

- Invoice status transitions evaluate through the workflow runtime before repository mutation.
- Invoice workflow transitions persist to `WorkflowTransition` history.
- Posting an invoice still creates balanced accounting entries exactly once.
- Invoice page uses workflow action buttons and shows persisted workflow history.
- Tests cover invalid invoice workflow transitions, idempotent posting, persisted invoice history, and browser rendering.

### Iteration 8 - Invoice Workflow Persistence And Accounting-Safe Posting

Status: implemented.

Implemented:

- Added `sales.invoice` to the sales module manifest with `draft`, `posted`, `paid`, and `void` lifecycle states.
- Extended the workflow runtime default transition derivation so `void` behaves like a cancellative terminal state and is available from active states.
- Bound invoice status transitions to workflow evaluation before repository mutation.
- Persisted invoice workflow transitions in both memory and Prisma repository paths.
- Started or backfilled `sales.invoice` workflow instances when invoices are generated or existing order invoices are returned.
- Kept invoice posting idempotent: repeated `posted` transitions still create only one invoice journal entry.
- Updated full-payment recording so invoices moved to `paid` also advance the invoice workflow state and history.
- Replaced the invoice page status selector with workflow action buttons and persisted workflow history.
- Added invoice route coverage to desktop smoke and mobile overflow checks.
- Fixed in-memory repository demo-data isolation by deep-cloning sales fixtures instead of shallow-copying shared records.

Evaluation:

- Billing is now aligned with the shared workflow runtime used by procurement, quotes, and sales orders.
- Accounting side effects remain behind repository/use-case boundaries and posting stays idempotent.
- Payment posting no longer creates stale invoice workflow state, so the invoice page can safely prefer persisted workflow state.
- Clean Architecture score for this slice: 8/10. The business rule boundary is better because invoice transitions are policy-evaluated before adapter mutation, but repository methods still combine persistence, audit, workflow recording, and ledger side effects. The next architecture improvement should extract document workflow orchestration into focused use cases before adding more approval-heavy modules.

Validation:

- `pnpm --filter @erp/api typecheck`
- `pnpm --filter @erp/api test`
- `pnpm --filter @erp/api lint`
- `pnpm --filter @erp/platform-workflow typecheck`
- `pnpm --filter @erp/platform-workflow test`
- `pnpm --filter @erp/sdk typecheck`
- `pnpm --filter @erp/web typecheck`
- `pnpm --filter @erp/web lint`
- `pnpm --filter @erp/web build`
- `pnpm typecheck`
- `pnpm test`
- `pnpm lint`
- `pnpm build`
- `pnpm audit`
- `pnpm peers check`
- `docker compose config --quiet`
- `pnpm smoke:worker`
- `ERP_WEB_SMOKE_PORT=4026 pnpm --filter @erp/web smoke:ui`

### Next Selected Slice After Iteration 8

Workflow inbox, approval assignments, and transition comments.

Acceptance criteria:

- Workflow transitions can carry an operator comment and show it in document history.
- A workflow task/inbox model lists pending actionable transitions by tenant, assignee role, document, and due date.
- Quote, order, invoice, and purchase-order pages surface assigned workflow work without hard-coded status selectors.
- API exposes a role-aware workflow inbox endpoint and keeps existing action endpoints backward-compatible.
- Tests cover assignment visibility, comment persistence, and browser rendering for the inbox surface.

### Iteration 9 - Workflow Inbox, Assignments, And Transition Comments

Status: implemented.

Implemented:

- Added an optional workflow transition `comment` contract and mapped it to persisted workflow transition reason/comment history.
- Extended quote, sales-order, invoice, and purchase-order transition request schemas and SDK request types with optional comments.
- Added a framework-free workflow inbox use case that builds role-aware actionable tasks from workflow policies and current document states.
- Added `WorkflowTask` and `WorkflowInboxResponse` API schemas plus a bearer-authenticated `GET /workflows/inbox` endpoint.
- Added an SDK `workflowInbox()` method.
- Added Workflow Inbox to core navigation as a platform-level operator workspace.
- Built a `/workflow-inbox` page with assigned task cards, due dates, current-to-target state context, assignee role, comment input, and task execution.
- Added comment inputs to quote, order, invoice, and purchase-order workflow action forms.
- Updated workflow history surfaces to display persisted transition comments.
- Added tests for inbox task generation, role assignment, transition comment propagation, OpenAPI endpoint coverage, persistent comment history, and browser rendering.
- Regenerated `docs/openapi.json` and `packages/sdk/src/openapi-types.ts`.

Evaluation:

- Operators now have a single task queue across sales and procurement workflows, similar to the worklist patterns expected in ERPNext-style approvals and SYSPRO-style operational queues.
- The implementation deliberately computes tasks from policy plus document state instead of introducing a premature workflow-task table. This keeps the architecture simple while making approval work visible and actionable.
- The limitation is that assignment policy is still implicit: default transitions inherit the actor role, and workflow definitions do not yet support configurable approver groups, amount thresholds, substitute approvers, or escalation SLAs.
- Clean Architecture score for this slice: 8/10. The inbox orchestration sits in a use-case layer and accepts plain candidates, but candidate construction still lives in the read service and should eventually move behind a workflow document query port when assignment rules become persistent.

Validation:

- `pnpm contracts:generate`
- `pnpm --filter @erp/api typecheck`
- `pnpm --filter @erp/api test`
- `pnpm --filter @erp/api lint`
- `pnpm --filter @erp/platform-workflow typecheck`
- `pnpm --filter @erp/platform-workflow test`
- `pnpm --filter @erp/sdk typecheck`
- `pnpm --filter @erp/web typecheck`
- `pnpm --filter @erp/web lint`
- `pnpm --filter @erp/web build`
- `pnpm typecheck`
- `pnpm test`
- `pnpm lint`
- `pnpm build`
- `pnpm audit`
- `pnpm peers check`
- `docker compose config --quiet`
- `pnpm smoke:worker`
- `ERP_WEB_SMOKE_PORT=4027 pnpm --filter @erp/web smoke:ui`

### Iteration 10 - Configurable Approval Policies And Assignment Rules

Status: implemented.

Implemented:

- Added persisted workflow assignment rules to customization metadata, with workflow ID, source state, target state, role, active flag, and optional minimum/maximum amount thresholds.
- Added the Prisma `WorkflowAssignmentRule` model, tenant relation, indexes, uniqueness constraint, migration, and generated Prisma client support.
- Added repository methods for creating/updating assignment rules and returning them through the customization snapshot.
- Added OpenAPI schemas, validation, SDK types, and SDK client method for `POST /customization/workflow-assignment-rules`.
- Updated workflow inbox generation to apply assignment rules before emitting tasks. If no matching rule exists, the legacy policy/actor-role behavior remains intact.
- Updated workflow action discovery to apply the same assignment-rule and amount-threshold logic used by the inbox.
- Added document total context for quote, sales-order, invoice, and purchase-order workflow candidates.
- Added settings UI controls for viewing and creating workflow assignment rules with role and threshold fields.
- Added tests for persisted customization metadata, assignment-rule task matching, amount threshold fallback, action discovery filtering, contract coverage, and settings browser rendering.
- Regenerated `docs/openapi.json` and `packages/sdk/src/openapi-types.ts`.

Evaluation:

- This closes the main approval-policy gap against ERPNext-style configurable approval routing and SYSPRO-style delegated operational queues for the first four document families.
- The policy is intentionally simple: exact workflow/state/target/role matching plus optional amount thresholds. That keeps it understandable for admins and avoids introducing a premature condition-expression language before there is a visual workflow designer.
- The current limitation is that rules do not yet support escalation due dates, substitute approvers, notifications, department/cost-center filters, or approval groups. Those should be layered as policy metadata rather than hardcoded into document modules.
- Clean Architecture score for this slice: 8.5/10. Rule evaluation now lives in the workflow use-case boundary and persistence is behind the repository, but action candidate amount lookup still happens in the read service. A future workflow document query port would reduce read-service coupling.

Validation:

- `pnpm db:generate`
- `pnpm contracts:generate`
- `pnpm --filter @erp/api typecheck`
- `pnpm --filter @erp/api test`
- `pnpm --filter @erp/api lint`
- `pnpm --filter @erp/platform-workflow typecheck`
- `pnpm --filter @erp/sdk typecheck`
- `pnpm --filter @erp/web typecheck`
- `pnpm --filter @erp/web lint`
- `pnpm --filter @erp/web build`
- `ERP_WEB_SMOKE_PORT=4028 pnpm --filter @erp/web smoke:ui`
- `pnpm audit`
- `docker compose config --quiet`

### Next Selected Slice After Iteration 10

Workflow notification, escalation, and delegation policies.

Acceptance criteria:

- Admins can define workflow escalation rules by workflow/state/target role, due-in hours, escalation role, and notification channel.
- Workflow inbox surfaces task age, due status, and escalated assignee roles.
- Assignment rules support a substitute/delegate role for temporary coverage.
- Workflow transitions and generated tasks emit outbox events for assignment, escalation, and completion.
- Worker smoke dispatches workflow notification events without breaking existing webhook retry/dead-letter behavior.
- Tests cover escalation matching, due-state computation, delegation fallback, outbox emission, admin UI rendering, and browser smoke.

### Iteration 11 - Workflow Notification, Escalation, And Delegation Policies

Status: implemented.

Implemented:

- Added delegate role support to workflow assignment rules, including optional delegate start/end windows for temporary coverage.
- Added persisted workflow escalation rules with workflow, state, target transition, target role, due-in hours, escalation role, notification channel, and active flag.
- Added Prisma schema changes, migration, repository methods, validation schemas, OpenAPI contracts, and SDK methods for workflow escalation rules.
- Enriched workflow tasks with `ageHours`, `dueStatus`, `escalated`, `escalatedRoles`, and `notificationChannels`.
- Updated the workflow use-case boundary to evaluate delegation and escalation policies while keeping fallback behavior intact.
- Updated workflow inbox generation and workflow action discovery to consume assignment/escalation metadata from customization.
- Added workflow outbox events for task assignment, task escalation, and transition completion.
- Added workflow notification event types to the integration manifest, webhook event contracts, and demo webhook subscription.
- Added settings UI controls for delegate coverage and escalation policies.
- Updated the workflow inbox UI to surface task age, due state, escalation roles, and notification channels.
- Added tests for delegate matching, overdue escalation due-state computation, escalation persistence, workflow notification worker dispatch, contracts, and browser rendering.
- Regenerated `docs/openapi.json` and `packages/sdk/src/openapi-types.ts`.

Evaluation:

- This moves the approval backbone closer to ERPNext/SYSPRO-grade operational governance: work can now be delegated, escalated by SLA, surfaced in the inbox, and emitted to the integration layer for notification delivery.
- The cleanest part is the workflow use-case boundary: policy metadata is plain data, and task enrichment is deterministic and directly testable without Nest, Prisma, or a browser.
- The main limitation is event idempotency. Inbox reads currently emit assignment/escalation outbox events when tasks are generated, which satisfies notification plumbing but can duplicate events across repeated reads. Production-grade workflow notifications need durable task identity, event de-duplication keys, or a materialized workflow task table.
- Clean Architecture score for this slice: 8/10. Business policy remains inside the use case, but outbox emission still sits in the read-service orchestration path. A notification use case with idempotency storage would improve the boundary.

Validation:

- `pnpm db:generate`
- `pnpm contracts:generate`
- `pnpm --filter @erp/api typecheck`
- `pnpm --filter @erp/api test`
- `pnpm --filter @erp/api lint`
- `pnpm --filter @erp/platform-workflow typecheck`
- `pnpm --filter @erp/platform-workflow test`
- `pnpm --filter @erp/sdk typecheck`
- `pnpm --filter @erp/web typecheck`
- `pnpm --filter @erp/web lint`
- `pnpm --filter @erp/web build`
- `pnpm --filter @erp/worker test`
- `ERP_WEB_SMOKE_PORT=4029 pnpm --filter @erp/web smoke:ui`
- `pnpm audit`
- `docker compose config --quiet`
- `pnpm smoke:worker`

### Next Selected Slice After Iteration 11

Durable workflow task materialization and notification idempotency.

Acceptance criteria:

- Workflow tasks are materialized with stable tenant/workflow/document/action identity and current assignment/escalation status.
- Inbox reads no longer create duplicate assignment/escalation outbox events.
- Task notification events use idempotency keys or persisted delivery state for assigned, escalated, completed, and cancelled task states.
- Transition completion closes or supersedes materialized tasks for the completed action.
- Admins can inspect workflow task notification status from the settings or integration UI.
- Tests cover materialization upsert behavior, no duplicate outbox events on repeated inbox reads, task closure on transition, worker dispatch of workflow notifications, and browser smoke.

### Iteration 12 - Durable Workflow Task Materialization And Notification Idempotency

Status: implemented.

Implemented:

- Added a persisted `WorkflowTaskRecord` model with stable `tenantId + taskKey` uniqueness for workflow/document/action identity.
- Added task notification state fields for assigned, escalated, completed, and cancelled notifications.
- Added repository methods to materialize workflow tasks, upsert current assignment/escalation state, and close completed/cancelled tasks on transitions.
- Replaced read-time duplicate task notification emission with materialization-driven idempotency: repeated inbox reads update the existing task and do not create duplicate assignment/escalation outbox events.
- Added idempotency keys to workflow task notification payloads.
- Updated workflow transitions to close open materialized tasks for the document/action and emit completed/cancelled task notifications once.
- Added workflow task records to the integration snapshot and OpenAPI/SDK contracts.
- Added integration UI visibility for workflow task notification status.
- Added workflow task completed/cancelled event contracts and demo webhook subscription support.
- Added tests for materialization upsert behavior, no duplicate assigned/escalated outbox events, task completion/cancellation closure, worker dispatch coverage, contract schema coverage, and browser rendering.
- Regenerated `docs/openapi.json` and `packages/sdk/src/openapi-types.ts`.

Evaluation:

- This closes the biggest reliability gap from Iteration 11. Workflow task notifications now have durable state, stable identity, and persisted notification timestamps.
- The implementation stays pragmatic: materialized tasks are updated by the existing workflow inbox/transition orchestration, while the pure workflow use case still computes task policy without database dependencies.
- Admin visibility improved through the integration workspace, where workflow task notification status can be inspected alongside outbox, webhook deliveries, and dead letters.
- The remaining limitation is operational control: admins can inspect workflow task state, but cannot yet manually reassign, snooze, force-escalate, retry a single workflow task notification, or view a dedicated workflow task audit timeline.
- Clean Architecture score for this slice: 8.5/10. Persistence and idempotency moved into repository ports, and business task computation stays testable. The next improvement should extract workflow task orchestration into a focused use-case/service boundary instead of keeping it inside the read service.

Validation:

- `pnpm db:generate`
- `pnpm contracts:generate`
- `pnpm --filter @erp/api typecheck`
- `pnpm --filter @erp/api test`
- `pnpm --filter @erp/api lint`
- `pnpm --filter @erp/sdk typecheck`
- `pnpm --filter @erp/integration typecheck`
- `pnpm --filter @erp/db typecheck`
- `pnpm --filter @erp/web typecheck`
- `pnpm --filter @erp/web lint`
- `pnpm --filter @erp/web build`
- `pnpm --filter @erp/worker test`
- `ERP_WEB_SMOKE_PORT=4030 pnpm --filter @erp/web smoke:ui`
- `pnpm audit`
- `docker compose config --quiet`
- `pnpm smoke:worker`

### Next Selected Slice After Iteration 12

Workflow task operations console: reassignment, snooze, retry, and audit trail.

Acceptance criteria:

- Admins can list workflow tasks with filters for status, due state, workflow, assignee role, and notification state.
- Admins can reassign a materialized task to another role without changing the workflow definition.
- Admins can snooze a task to a new due date and record the reason.
- Admins can retry task notifications for assigned, escalated, completed, or cancelled states through the existing outbox mechanism.
- Task operations write audit events and preserve a task operation history.
- Tests cover reassignment, snooze, notification retry idempotency, audit history, API contracts, admin UI rendering, and browser smoke.

### Iteration 13 - Workflow Task Operations Console

Status: implemented.

Implemented:

- Added task-local `WorkflowTaskOperation` history for reassignment, snooze, and notification retry operations.
- Extended materialized workflow task records with due date, notification channels, and embedded operation history in the integration snapshot.
- Added repository ports and implementations for workflow task reassignment, snoozing, and notification retry across memory, Prisma, and resilient repositories.
- Added audit events for workflow task reassignment, snooze, and notification retry actions.
- Added outbox-backed manual workflow task notification retry with operation-specific idempotency keys.
- Added validation schemas, Nest endpoints, OpenAPI contracts, generated SDK types, and SDK client methods for all three operations.
- Added web server actions and an integration workspace operations console with filters for status, due state, workflow, assignee role, and notification state.
- Added operation forms for task reassignment, snooze, and notification retry, plus an embedded task operation timeline.
- Added repository, use-case, contract, and browser smoke coverage.
- Regenerated `docs/openapi.json` and `packages/sdk/src/openapi-types.ts`.

Evaluation:

- This slice turns workflow tasks from passive notification records into an administrable operations surface, which is closer to ERPNext/SYSPRO expectations for operational control.
- Reassignment and snooze are stored as task-local operations instead of only audit rows, so admins can inspect a task timeline without querying global audit history.
- Manual notification retry deliberately creates a new outbox event per operation. That preserves the original idempotent notification semantics while still allowing explicit human retry attempts.
- The main remaining limitation is visibility at scale: admins can filter and act on individual tasks, but there is not yet an SLA dashboard showing overdue load, aging distribution, reassignment frequency, retry health, or bottleneck roles.
- Clean Architecture score for this slice: 8.5/10. The operation behavior is behind repository/use-case ports and the UI uses SDK methods. A dedicated workflow task application service would still be cleaner as workflow operations grow.

Validation:

- `pnpm db:generate`
- `pnpm contracts:generate`
- `pnpm --filter @erp/api typecheck`
- `pnpm --filter @erp/web typecheck`
- `pnpm --filter @erp/sdk typecheck`
- `pnpm --filter @erp/api test -- src/repository.test.ts src/use-cases/use-cases.test.ts src/contracts.test.ts`
- `pnpm --filter @erp/api lint`
- `pnpm --filter @erp/web lint`
- `pnpm --filter @erp/web build`
- `ERP_WEB_SMOKE_PORT=4030 pnpm --filter @erp/web smoke:ui`
- `pnpm typecheck`
- `pnpm test`
- `pnpm lint`
- `pnpm build`
- `pnpm audit`
- `docker compose config --quiet`
- `pnpm smoke:worker`

### Next Selected Slice After Iteration 13

Workflow SLA analytics and bottleneck reporting.

Acceptance criteria:

- Admins can view workflow task KPIs by workflow, status, due state, assignee role, and notification health.
- The API exposes workflow SLA metrics derived from materialized tasks and task operation history.
- Metrics include open tasks, overdue tasks, due-soon tasks, completed tasks, average task age, reassignment count, snooze count, retry count, and bottleneck roles.
- The integration or reporting UI shows an enterprise-grade workflow SLA dashboard with dense, scannable tables and metrics.
- Reports can be filtered by workflow and role without losing the existing task operations console.
- Tests cover metric aggregation, operation-derived counts, API contracts/SDK types, UI rendering, and browser smoke.
