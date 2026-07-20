# ERP Re-Evaluation: ERPNext And SYSPRO Gap Refresh

> **Historical analysis — non-authoritative.** Use the [ERPNext/SYSPRO Replacement Program](roadmap.md) for current status, dependencies, and next executable slices. This file preserves the 2026-07-01 evaluation.

Date: 2026-07-01

This refresh compares the current Open ERP Ecosystem against ERPNext and SYSPRO after completion of the core roadmap and hardening phases. It focuses on feature gaps that can be implemented in this codebase without changing the modular monolith strategy.

## Current Baseline

Implemented:

- Core platform: tenant, RBAC, module manifests, settings, audit, metadata customization, OpenAPI, SDK, Docker, API, web, worker, PostgreSQL, Redis, MinIO.
- Sales: customers, products, quotes, orders, invoices, quote-to-cash, stock effects.
- Accounting: chart of accounts, fiscal periods, tax rates, journal entries, payments, trial balance, AR/AP posting from sales and procurement.
- Procurement: suppliers, material requests, RFQ/quotation structures, purchase orders, receipts, supplier invoices, supplier payments.
- Inventory: warehouses, bins, stock ledger, reservations, transfers, cycle counts, reorder points, valuation layers, reconciliation.
- Manufacturing: BOM, work centers, routing, production plans, MRP suggestions, work orders, issue/receipt ledger posting.
- Quality: trace records, inspection templates, inspections, NCR/CAPA, supplier scorecards, recalls.
- Reporting: saved reports, report runs, print format metadata, export jobs, dashboard definitions, scheduled delivery metadata.
- Integration: API keys, webhook subscriptions, delivery retry/dead-letter, connector registry, durable outbox, manual outbox dispatch.
- Operations: leads/opportunities, projects/tasks, employees/leave requests, service cases.
- Hardening: Integration and Operations use-case ports, API smoke harness for critical workflows.

## External Signals

ERPNext signals:

- ERPNext has deep document customization, custom fields/forms, print format builder, custom reports, and assignment rules.
- ERPNext Stock highlights serial/batch tracking, item variants, pricing, barcode scanning, landed cost, delivery trips, stock closing, inventory dimensions, and traceability reports.
- ERPNext Manufacturing highlights multi-level BOM, work orders, job cards, production/material planning, capacity planning, downtime entry, WIP material tracking, and manufacturing reports.
- ERPNext Accounting includes richer operational finance: bank reconciliation, payment reconciliation, period close, AR/AP reports, landed cost, multi-currency, financial templates, and asset workflows.
- ERPNext includes POS/e-commerce and HR/payroll/expense areas that this project has not modeled yet.

SYSPRO signals:

- SYSPRO is strongest in manufacturing and distribution depth: WMS, mobile warehouse, traceability, batch/serial control, planning/scheduling, shop-floor/MOM, quality, and compliance.
- SYSPRO emphasizes integrated EDI/e-commerce, order-to-invoice automation, warehouse performance, electronic order processing, and shipping.
- SYSPRO manufacturing operations management covers planning, scheduling, publishing, collecting, tracking, analyzing, shop-floor visibility, labor/machine/resource utilization, factory documents, and quality/calibration integration.

## Updated Gap Matrix

| Area | Current Project | ERPNext/SYSPRO Feature Signal | Gap | Priority |
| --- | --- | --- | --- | --- |
| Worker automation | Outbox table and manual dispatch exist | Integration automation and workflow execution | Worker logs jobs but does not dispatch outbox automatically | P0 |
| WMS execution | Warehouses, bins, transfers, reservations | Barcode/mobile, picking, packing, shipping, put-away, delivery trips | No pick/pack/ship or mobile scan transaction model | P0 |
| Lot/serial depth | Trace records and optional serial field | Batch/serial item control and full serial/batch trace reports | Trace is not attached to every stock transaction, receipt, shipment, or work order | P0 |
| Manufacturing execution | Plans, MRP, work orders, release/complete | Job cards, downtime, WIP, scheduling, shop-floor capture, factory docs | No operation-level execution, labor capture, downtime, or finite schedule | P0 |
| Finance depth | GL, AP/AR posting, trial balance | Bank reconciliation, aging, period close, landed cost, assets, multi-currency | Financial close and treasury workflows are shallow | P1 |
| Procurement depth | PO, receipt, invoice, payment | RFQ/supplier quotes, landed cost, return to supplier | RFQ and supplier quotation are metadata only; no landed cost or supplier returns | P1 |
| Reporting/design | Report runs and print metadata | Print builder, custom reports, charts, financial templates | No visual builder or parameterized report definitions | P1 |
| POS/e-commerce | Connector catalog only | POS profile/workflows, invoice consolidation, web store, reviews | No retail checkout, POS posting, storefront, or channel order ingestion | P1 |
| HR/payroll | Employees and leave requests | Attendance, shifts, payroll, tax/benefits, expense claims | No attendance, payroll, expenses, or approvals beyond leave | P2 |
| CRM/service | Leads, opportunities, service cases | Assignment rules, campaigns/newsletter, SLA automation | No activity timeline, assignment rules, campaign workflow, SLA jobs | P2 |
| Security/auth | JWT login and RBAC | Enterprise security and audit controls | No refresh tokens, rotation, secret management, retention policy | P2 |
| Extensibility | Module manifests and metadata | DocType/custom app style extensibility | Customization exists only for Customer fields; workflows are mostly static | P2 |

## Recommended Implementation Roadmap

### Phase 17 - Automated Integration Dispatcher

Status: completed

Why:

- This closes the most obvious production gap left after the durable outbox work.
- It unlocks automation, external integrations, and connector adapters.

Scope:

- Worker-side outbox polling and locking.
- Dispatch pending/failed outbox events to active webhook subscriptions.
- Retry policy using `nextAttemptAt`, max attempts, dead-letter promotion, and structured logs.
- Idempotent delivery keys and signature generation.
- Smoke coverage for automated dispatch.

Exit criteria:

- Creating a business event eventually creates webhook deliveries without manual API dispatch.
- Failed deliveries retry on schedule and move to dead letter after max attempts.

Implemented:

- Worker-side batch claiming and lock handling for pending/failed outbox events.
- One-shot dispatcher command through `pnpm smoke:worker`.
- BullMQ job execution now calls the dispatcher.
- Unit and live smoke coverage for automated dispatch.

### Phase 18 - WMS Pick/Pack/Ship And Put-Away

Status: completed

Why:

- ERPNext and SYSPRO both expose stronger stock/distribution capabilities than the current warehouse slice.
- This is the highest-value operational feature after outbox automation.

Scope:

- Pick lists from approved sales orders.
- Pick tasks by warehouse/bin with reserved quantities.
- Pack records and shipment records.
- Put-away tasks from purchase receipts.
- Barcode scan events API for pick, pack, receive, move, and count.
- Delivery trip/shipping carrier metadata.

Exit criteria:

- An approved sales order can reserve stock, generate pick tasks, confirm picks by bin, pack goods, ship, and post inventory ledger entries.
- Purchase receipt can generate put-away tasks and move received goods to storage bins.

Implemented:

- Pick lists from sales orders with bin-level pick tasks.
- Barcode-confirmed pick, pack, ship, and put-away transactions.
- Pack records, shipment records, and carrier/tracking metadata.
- Put-away tasks from purchase receipts.
- API contracts, SDK calls, `/inventory` UI controls, repository tests, and live HTTP smoke coverage.

Remaining depth:

- Inventory ledger movement still happens at sales-order approval and purchase receipt posting. A later costing/inventory hardening slice should optionally move stock effects to shipment and put-away confirmation for deployments that require execution-stage posting.

### Phase 19 - Serial/Batch Genealogy

Status: completed

Why:

- The quality module has trace records, but it needs stock-ledger-level traceability to match ERPNext/SYSPRO expectations.

Scope:

- Batch/serial master records.
- Attach lot/serial numbers to purchase receipts, transfers, sales shipments, work-order issues, and work-order receipts.
- Genealogy report from supplier receipt through production, shipment, inspection, NCR, and recall.
- Serial/batch opening balances and stock reconciliation rules.

Exit criteria:

- A lot or serial can be traced across every inventory movement and manufacturing transformation.

Implemented:

- `TraceRecord` remains the lot/serial master.
- `TraceMovement` records receipt, put-away, shipment, work-order issue, work-order receipt, inspection, and recall events.
- Genealogy endpoint returns one trace record with movements, inspections, non-conformance records, and recalls.
- Quality UI shows a movement timeline, and the SDK exposes `traceGenealogy(id)`.

Remaining depth:

- Trace movements currently use pragmatic first-available lot allocation for outbound shipment and component issue paths. A later inventory-costing slice should add lot quantity balances, FEFO/FIFO lot allocation rules, and lot-specific reservations.

### Phase 20 - Manufacturing Execution And Capacity Scheduling

Status: completed

Why:

- This is the main SYSPRO advantage area and the next manufacturing maturity step after MRP.

Scope:

- Job cards per routing operation.
- Operation start/pause/complete.
- Labor and machine time capture.
- Downtime entries and reason codes.
- Work center calendars and finite capacity scheduling.
- Factory documents: job tickets, route cards, material requisitions, travelers.
- WIP material transfer and consumed-material report.

Exit criteria:

- A work order can be scheduled against finite work center capacity, executed operation by operation, and analyzed for labor, downtime, material consumption, and throughput.

Implemented:

- Job cards are generated from routing operations when a work order is released.
- Job cards support start and completion capture with operator and actual minutes.
- Downtime can be recorded against a work center and optionally a job card.
- Capacity schedule rows summarize scheduled minutes, capacity minutes, downtime minutes, and load percent.
- Work-order completion is blocked until all generated job cards are completed.

Remaining depth:

- Capacity scheduling is a first-pass load view, not a finite scheduler with calendar exceptions, sequencing constraints, overlap, queue time, or dispatch optimization.

### Phase 21 - Finance Close And Costing

Status: implemented as the Phase 21 foundation on July 1, 2026.

Why:

- Accounting is functional but still early compared with ERPNext finance depth.

Scope:

- AR aging and AP aging.
- Bank accounts, bank transactions, and reconciliation.
- Period close vouchers.
- Landed cost allocation from freight/duties to valuation layers.
- Fixed assets and depreciation schedules.
- Multi-currency exchange rates and realized/unrealized gains.

Exit criteria:

- Finance can reconcile bank transactions, run AR/AP aging, close a period, allocate landed costs, and post depreciation.

Implemented:

- AR/AP aging in the accounting snapshot.
- Bank accounts, bank transactions, and reconciliation workflow.
- Period close records with close journal vouchers.
- Landed cost allocation against purchase-receipt valuation layers.
- Fixed asset capitalization and depreciation journals.
- Exchange-rate maintenance as the multi-currency foundation.

Remaining hardening:

- Realized/unrealized FX revaluation journals.
- Bank statement import, auto-matching rules, and payment reconciliation suggestions.
- Close checklist controls, approvals, and close task ownership.
- Asset disposal, impairment, and depreciation schedules beyond single-run posting.

### Phase 22 - Report And Print Builder

Status: implemented as the Phase 22 foundation on July 1, 2026.

Why:

- ERPNext's print/report customization is a major differentiator, and this project already has metadata foundations.

Scope:

- Parameterized report definitions.
- Column/filter/sort/group metadata.
- Chart definitions.
- Print format layout blocks and line/table sections.
- Preview endpoint and HTML/PDF-ready rendering.

Exit criteria:

- A tenant admin can create a custom operational report and document print layout without code changes.

Implemented:

- Saved-report builder metadata for parameters, filters, sorts, grouping, chart settings, and columns.
- Print format blocks for headings, fields, tables, barcodes, signatures, and text.
- Report preview endpoint that returns projected rows without storing a run.
- Print preview endpoint that renders saved block layouts into HTML.
- Web builder controls on the reports page.

Remaining hardening:

- Visual drag-and-drop layout editor.
- PDF generation and print queue delivery.
- Query-builder depth beyond current module row sources.
- Scheduled delivery execution and barcode image rendering.

### Phase 23 - POS And E-Commerce Channel

Why:

- ERPNext includes POS/e-commerce, while SYSPRO emphasizes electronic order processing and B2B e-commerce.

Scope:

- POS profiles, registers, shifts, tenders, cash drawer close.
- POS invoice with stock and GL posting.
- Customer loyalty points.
- Storefront product publishing metadata.
- Channel order import adapter shape for Shopify/EDI/B2B orders.

Exit criteria:

- A POS sale posts invoice, payment, stock movement, and GL entries; imported channel orders create sales orders through integration mappings.

Implemented:

- Commerce module manifest and DTO package for channels, price lists, POS profiles, registers, shifts, POS sales, catalog items, and channel orders.
- Prisma persistence and seed data for POS/web channels, retail price lists, main counter POS profile, and register setup.
- POS shift open/close, cash tender checkout, sales order/invoice/payment creation, stock decrement, balanced accounting journals, and commerce outbox events.
- E-commerce catalog publishing and idempotent inbound channel order ingestion.
- SDK methods, OpenAPI contracts, web server actions, and `/commerce` operational UI.
- Repository coverage and live HTTP smoke across commerce, sales, inventory, accounting, and integration outbox.

Remaining hardening:

- Customer loyalty points and promotions.
- Returns/exchanges, refunds, and cash drawer variance approvals.
- Taxes, discounts, card terminal settlement, and offline POS sync.
- Shopify, EDI, marketplace, and B2B adapter implementations.
- Fulfillment status callbacks and customer-facing storefront pages.

### Phase 24 - HR, Attendance, Payroll, Expenses

Why:

- This increases ERPNext parity but is less central to SYSPRO's manufacturing/distribution focus.

Scope:

- Departments, shifts, attendance, employee check-ins.
- Expense claims and employee advances.
- Payroll components, salary structures, payroll runs, payslips.
- Basic tax/benefit deductions as configurable rules.

Exit criteria:

- Attendance feeds payroll, payroll creates accounting journals, and expenses route through approval/payment.

Implemented:

- HR module manifest and DTOs for departments, work shifts, attendance, expenses, advances, salary structures, payroll runs, and payslips.
- Prisma persistence, seed data, HR permissions, enabled module metadata, payroll payable, employee advance, payroll expense, and employee expense accounts.
- Attendance recording, expense submit/approve/pay workflow, employee advance request/pay workflow, and payroll run posting with payslip generation.
- Balanced journals for reimbursed expenses, paid advances, and payroll gross/net/deduction posting.
- SDK methods, OpenAPI contracts, web server actions, and `/hr` operational UI.
- Repository coverage and live HTTP smoke across HR, operations employees, accounting, and integration outbox.

Remaining hardening:

- Employee onboarding and richer employee master data.
- Leave approvals feeding payroll deductions.
- Jurisdiction-specific payroll taxes, benefits, and statutory reports.
- Payslip PDFs, payroll payment files, and bank disbursement integration.
- Advance recovery through payroll and expense attachments.
- Manager approval routing and configurable HR workflows.

### Phase 25 - Workflow/Automation Designer

Why:

- Existing manifests define workflows, and customization metadata exists, but runtime automation is shallow.

Scope:

- Workflow state definitions per entity.
- Assignment rules.
- Event-triggered automation actions: create task, send webhook, audit, assign owner, schedule reminder.
- Scheduled automation worker.

Exit criteria:

- A tenant admin can configure an assignment/automation rule that runs from domain events without code changes.

Implemented:

- Runtime automation metadata on `AutomationRule`: run count, last run timestamp, and last error.
- Event-triggered rule creation through `POST /customization/automation-rules`.
- OpenAPI contracts, generated SDK method, web server action, and settings-page creation controls.
- Domain event execution from outbox publication for enabled event rules.
- `audit` and `outbox` automation actions with recursion protection for `automation.*` events.
- Success and failure telemetry on each rule execution.
- Repository coverage and live HTTP smoke using `hr.payroll.posted` as the trigger event.

Remaining hardening:

- Visual workflow graph and state-transition editor.
- Entity transition guard enforcement and assignment rules.
- Task, owner assignment, notification, webhook template, and scheduled reminder actions.
- Scheduled automation worker and retry/dead-letter handling.
- Approval inbox UI and richer no-code condition builder.

## Immediate Next Best Slice

The Phase 1-25 roadmap is complete. The next best slice is production hardening around workflow depth, use-case boundaries, deployment reliability, and real integration adapters.

Rationale:

- The platform now covers the planned ERP surface across sales, procurement, inventory, WMS, manufacturing, quality, accounting, reporting, integrations, operations, commerce, HR, and event automation.
- The current automation runtime proves event-triggered no-code actions, but production parity with ERPNext/SYSPRO needs deeper workflow controls and real adapters.
- The API still contains a large repository surface; the next architecture return comes from extracting more use-case boundaries and adding end-to-end environment checks.

Suggested hardening sequence:

1. Deepen workflow automation with visual workflow definitions, guard permissions, conditions, assignments, task creation, webhook templates, and scheduled worker execution.
2. Extract use-case classes for Sales, Procurement, Inventory, Manufacturing, Quality, Reporting, Commerce, HR, Accounting, and Customization.
3. Add Playwright E2E coverage for admin setup, quote-to-cash, procure-to-pay, WMS, manufacturing, quality traceability, POS, HR payroll, and automation.
4. Harden auth and tenancy with refresh/session controls, tenant-scoped uniqueness audits, permission regression tests, and admin audit export.
5. Build real adapter implementations for Shopify, EDI/webhooks, email/PDF delivery, bank statement import, payroll payment files, and POS payment terminals.
6. Add deployment readiness: Helm/Kubernetes examples, production Compose profile, health checks, worker scaling, backup/restore scripts, and observability dashboards.
7. Add data governance: import/export jobs, custom field indexing strategy, audit retention, fiscal lock enforcement, and report/print PDF generation.

## Sources

- ERPNext Bill of Materials and multi-level BOM: https://docs.frappe.io/erpnext/bill-of-materials
- ERPNext Capacity Planning: https://docs.frappe.io/erpnext/capacity-planning
- ERPNext Serial and Batch: https://docs.frappe.io/erpnext/serial-and-batch
- ERPNext Serial/Batch Traceability Report: https://docs.frappe.io/erpnext/serial-and-batch-traceability-report
- ERPNext Barcode Tracking: https://docs.frappe.io/erpnext/track-items-using-barcode
- ERPNext E-commerce setup: https://docs.frappe.io/erpnext/set_up_e_commerce
- ERPNext POS workflows: https://docs.frappe.io/erpnext/pos-workflows
- ERPNext Landed Cost Voucher: https://docs.frappe.io/erpnext/landed-cost-voucher
- ERPNext Print Format Builder: https://docs.frappe.io/erpnext/print-format-builder
- ERPNext Payroll overview: https://docs.frappe.io/erpnext/v13/user/manual/en/human-resources/payroll-intro
- SYSPRO Distribution Management: https://us.syspro.com/business-software/business-management-software/distribution-management/
- SYSPRO Planning and Scheduling: https://us.syspro.com/business-processes/planning-and-scheduling-software/
- SYSPRO Manufacturing Operations Management: https://us.syspro.com/business-software/business-management-software/manufacturing-operations-management/
- SYSPRO Factory Documentation: https://us.syspro.com/factsheet/factory-documentation/
- SYSPRO EDI factsheet: https://us.syspro.com/factsheet/edi-for-syspro-powered-by-tie-kinetix/
