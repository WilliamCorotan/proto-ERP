# Competitive Reevaluation: ERPNext And SYSPRO

> **Historical analysis — non-authoritative.** Use the [ERPNext/SYSPRO Replacement Program](roadmap.md) for current status, gates, and implementation order. This file preserves the 2026-07-02 comparison evidence.

Date: 2026-07-02

## Sources Reviewed

- ERPNext official feature page: https://frappe.io/erpnext/usa
- ERPNext documentation index for accounting, setup, permissions, printing, reporting, automation, and integrations: https://docs.frappe.io/erpnext/accounting/introduction
- ERPNext manufacturing documentation: https://docs.frappe.io/erpnext/manufacturing
- SYSPRO manufacturing ERP page: https://us.syspro.com/industry-specific-software/manufacturing-software/
- SYSPRO distribution management page: https://us.syspro.com/business-software/business-management-software/distribution-management/
- SYSPRO traceability and recall page: https://us.syspro.com/business-software/business-management-software/traceability-erp-software/
- SYSPRO quality management factsheet: https://us.syspro.com/factsheet/quality-management/

## Executive Read

The current project is already directionally competitive as a modular ERP foundation. It has a wider module skeleton than many first-pass ERP builds: core registry, RBAC, sales, procurement, inventory, manufacturing, quality, accounting, commerce, HR, reporting, integration, operations, customization, API, SDK, worker, Docker, and a validated enterprise UI shell.

The biggest gap is depth. ERPNext should be treated as the benchmark for broad open-source configurability: document workflows, custom fields/forms, print formats, reports, POS, projects, support, HR/payroll, and portals. SYSPRO should be treated as the benchmark for manufacturing and distribution depth: planning, scheduling, WMS execution, lot/serial traceability, recalls, quality, EDI/e-commerce, and operational analytics.

## Current Coverage

Strong foundations already present:

- Modular manifests with entities, permissions, workflows, events, jobs, settings, and navigation.
- Tenant-aware API, SDK, web, worker, Docker deployment, OpenAPI generation, and smoke validation.
- Quote-to-cash, procure-to-pay, inventory ledger, WMS pick/pack/ship and put-away, MRP, work orders, job cards, quality traceability, reporting/print formats, webhook/outbox integrations, POS/channel ingestion, HR/payroll slice, and CRM/service/project operations.
- Custom fields, configurable views, automation-rule metadata, roles, users, module toggles, and audit-friendly records.
- Enterprise frontend design system, density control, command palette, data table primitive, and browser smoke coverage.

Still shallow or missing:

- Universal document workflow engine with approval matrices, authorization rules, workflow tasks, assignments, comments, and document locking.
- Deep item master, unit of measure, product variants, price lists, pricing rules, discounts, credit control, and tax rules.
- Advanced WMS: wave planning, replenishment, directed picking/put-away, mobile scan flows, license plates, container tracking, and packing station workflow.
- Full lot/serial controls integrated through procurement, inventory, manufacturing, sales, returns, quality holds, and recalls.
- Returns/RMA and supplier returns.
- Advanced manufacturing: multi-level BOM explosion, engineering change control, subcontracting, shop-floor OEE, labor/machine actuals, scrap/byproduct handling, finite scheduling, and work-center calendars.
- Forecasting, demand planning, min/max replenishment, and supply-chain exceptions.
- Customer/supplier portals, service knowledge base, support SLA automation, and self-service documents.
- EDI/B2B e-commerce connector adapters with real payload mapping, not only connector registry metadata.
- Financial depth: multi-company, consolidated statements, tax engines, budgets, cost centers, dimensions, AR/AP aging, dunning, bank feeds, and cash forecasting.

## Comparison Matrix

| Area | Current Project | ERPNext Benchmark | SYSPRO Benchmark | Recommended Move |
| --- | --- | --- | --- | --- |
| Architecture | Strong modular monolith and app shell | DocType-driven custom ERP | Industry-specific ERP suite | Keep module manifests; add a true document/workflow runtime |
| Customization | Custom fields/views and automation metadata | No-code/low-code forms, reports, print formats, workflows | Customizable ERP and ISV ecosystem | Add metadata-driven document layouts and workflow actions |
| Sales | Quote/order/invoice basics | Order-to-cash, pricing rules, print formats, POS | Complex order/distribution flows | Add pricing rules, credit holds, returns/RMA |
| Procurement | Material requests, PO, receipt, invoice, payment | Procure-to-pay, RFQ, approvals, supplier scorecards | Supplier collaboration, incoming quality, purchase control | Add RFQ/quotation workflow depth and supplier portal |
| Inventory/WMS | Warehouses, bins, ledger, valuation, pick/pack/ship, put-away | Item master, warehouses, serial/batch, stock ledger, reports | Smart warehouse, barcoding, serial/lot, container tracking | Add directed WMS, wave planning, replenishment, mobile scan UI |
| Manufacturing | BOM, routing, MRP, work order, job card, downtime | Multi-level BOM, production planning, MRP, capacity, subcontracting | Shop-floor, OEE/OLE/TEEP, planning/scheduling, quality | Add finite scheduling, OEE, ECO/ECC, subcontracting |
| Quality/Traceability | Trace records, movement, inspection, NCR, CAPA, recall | Quality inspections/templates and end-to-end material checks | Lot/serial traceability, quarantine, mock recall, audit reporting | Integrate trace IDs across every material movement and returns |
| Reporting/Printing | Saved reports, exports, print previews | Print Format Builder, custom reports, auto reports | Business insights, dashboards, real-time reporting | Add report builder UI and scheduled delivery worker |
| Integrations | API keys, webhooks, outbox, mappings, connector registry | Integrations such as Shopify/WooCommerce and backups | EDI, B2B e-commerce, ISV partners | Add adapter contracts and first real EDI/e-commerce connector |
| HR/Projects/Service | HR/payroll slice, projects, leave, service cases | HR/payroll, projects, timesheets, support portal | Less central but present around customer operations | Add timesheets, billing, service portal, knowledge base |

## Feature Backlog To Implement And Integrate

### P0 - Universal Document Workflow Engine

Why:

- ERPNext’s depth comes from workflow/configuration across documents.
- The project already has workflow definitions in module manifests, but execution is mostly bespoke per endpoint.

Build:

- `WorkflowInstance`, `WorkflowTransition`, `ApprovalRule`, `Assignment`, `DocumentComment`, `DocumentAttachment`, and `DocumentLock`.
- Permission-aware transition API: submit, approve, reject, cancel, close.
- Workflow action commands surfaced in the existing command palette.
- Shared audit/event emission for all transitions.

Integrate first:

- Sales quote/order approval.
- Purchase order approval.
- Journal entry posting.
- Expense claim approval.
- Quality NCR/CAPA lifecycle.

### P1 - Lot/Serial, Holds, Returns, And Mock Recall

Why:

- SYSPRO’s biggest differentiator is traceability that can drive quarantine, recall, customer communication, supplier returns, and audit reports.
- The project has quality trace records, but traceability should be connected to all stock movement entities.

Build:

- `Lot`, `Serial`, `InventoryHold`, `CustomerReturn`, `SupplierReturn`, `RecallAction`, `RecallContact`.
- Trace identifiers on purchase receipts, stock ledger, transfers, work-order issue/receipt, shipments, POS sale, returns, inspections, NCR, and recall.
- Mock recall report that resolves affected stock, shipped customers, suppliers, production orders, and open holds.

Integrate first:

- Procurement receipt creates lots/serials.
- Inventory movements require lot/serial where product tracking mode demands it.
- Quality failure automatically creates hold/quarantine.
- Recall workflow blocks allocation/shipment.

### P1 - Advanced WMS Execution

Why:

- We have pick/pack/ship and put-away, but ERPNext/SYSPRO-grade warehouse operations need planning and directed execution.

Build:

- `PickWave`, `ReplenishmentTask`, `LicensePlate`, `PackingStation`, `Container`, and `ScanSession`.
- Directed pick path and put-away suggestion engine.
- Mobile-first scan route for receive, put-away, pick, pack, transfer, count, ship.
- Warehouse performance metrics: pick accuracy, cycle time, shorts, backorders.

Integrate first:

- Sales order release creates pick waves.
- Purchase receipt creates directed put-away.
- Reorder point creates replenishment tasks.
- Browser smoke adds mobile scan route coverage.

### P1 - Manufacturing Planning, Scheduling, And OEE

Why:

- SYSPRO is explicitly strong in shop-floor, scheduling, OEE/OLE/TEEP, and manufacturing visibility.
- ERPNext lists capacity planning, production/material planning, MRP, job cards, downtime, and manufacturing analytics.

Build:

- Work-center calendar, shift calendar, finite schedule, operation queue, labor booking, machine booking, scrap/byproduct records.
- OEE metrics: availability, performance, quality, downtime reason Pareto.
- Multi-level BOM explosion and BOM comparison/update tools.
- Engineering change control and effective-date BOM/routing revisions.

Integrate first:

- Production plan uses multi-level BOM explosion.
- Work order release schedules operations by work-center calendar.
- Job cards collect actual labor/machine minutes and scrap.
- Quality failures reduce OEE quality score and create NCR/CAPA.

### P2 - Pricing, Credit Control, And Revenue Completeness

Why:

- ERPNext has pricing rules and complete selling/accounting flows; distribution ERP needs credit and margin control.

Build:

- Price lists, price rules, discount rules, customer credit holds, tax rules, sales returns/credit notes, dunning.
- AR/AP aging actions and cash forecasting.
- Cost centers, accounting dimensions, budgets, and financial statements.

Integrate first:

- Quote/order/invoice pricing engine.
- Customer credit limit blocks order approval.
- Returns generate credit note and reverse stock/accounting.

### P2 - Portals And Collaboration

Why:

- ERPNext and SYSPRO both expose customer/supplier collaboration concepts: portals, order visibility, support, supplier performance, e-commerce/EDI.

Build:

- Customer portal: quotes, orders, invoices, shipments, tickets, returns, knowledge base.
- Supplier portal: RFQs, quotations, PO acknowledgements, ASN, supplier returns, scorecards.
- Portal role model separate from internal user roles.

Integrate first:

- Portal-visible order status and invoice download.
- Supplier quotation submission.
- RMA request from customer portal.

### P2 - Real Connector Adapter Framework

Why:

- The project has connector metadata and durable outbox, but no real adapter execution model.

Build:

- Adapter interface with auth, mapping, transform, validate, retry, and reconciliation hooks.
- First adapters: CSV/SFTP, Shopify/WooCommerce-style commerce order import, generic EDI 850/855/856/810 flow.
- Mapping tester and replay UI.

Integrate first:

- Outbox dispatch calls adapter runtime.
- Inbound channel orders use mapping validation.
- Connector health appears on integrations dashboard.

### P3 - Data Import/Export, Report Builder, And Visual Governance

Why:

- ERPNext exposes import/export, print format builder, custom reports, auto reports, and workflow/automation configuration.

Build:

- Import templates per entity with validation preview.
- Interactive report builder and saved view builder.
- Print format visual editor with reusable blocks, letterheads, barcode/signature blocks.
- Scheduled report delivery worker.

Integrate first:

- Customer/product/import templates.
- Invoice/PO/receipt print layouts.
- Scheduled daily operations report.

## Recommended Next Implementation Sequence

1. Workflow engine runtime.
2. Lot/serial and holds integrated into stock ledger.
3. Returns/RMA and supplier returns.
4. Advanced WMS wave/replenishment/scan flows.
5. Manufacturing scheduling and OEE.
6. Pricing/credit/tax rule engine.
7. Customer/supplier portals.
8. Connector adapter runtime and first EDI/e-commerce adapter.
9. Report/import/print builders.

## Immediate Next Slice

Implement the workflow engine first.

Reasons:

- It is cross-cutting and unlocks ERPNext-like customizability.
- It reduces bespoke status-transition code.
- It enables permission-aware command palette actions.
- It provides the approval backbone for procurement, sales, accounting, HR, quality, returns, and recalls.

Acceptance criteria:

- Workflow definitions can be registered from module manifests or tenant metadata.
- A document can have a workflow instance with current state, allowed transitions, assignee, and audit history.
- Transitions enforce role/permission guards.
- API exposes allowed actions and transition execution.
- UI shows pending approvals and allows a permitted operator to transition a document.
- Existing quote/order/PO/expense/NCR lifecycles migrate to the shared engine incrementally.
