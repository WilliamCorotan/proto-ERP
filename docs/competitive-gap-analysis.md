# Competitive Gap Analysis

> **Historical analysis — non-authoritative.** Use the [ERPNext/SYSPRO Replacement Program](roadmap.md) for current scope, status, dependencies, and execution order. Priorities below reflect the earlier evaluation date.

Date: 2026-07-01

This evaluation compares the current Open ERP Ecosystem against ERPNext and SYSPRO and translates the gaps into implementable roadmap phases.

## Current Project Baseline

Implemented:

- Modular monorepo with Core, Sales, Accounting, SDK, API, web, worker, Docker infrastructure, PostgreSQL, Redis, and MinIO.
- Tenant, users, RBAC, module manifests, audit events, settings, and module enablement.
- Sales customers, products, quotes, sales orders, invoices, stock movements, and quote-to-cash workflow.
- OpenAPI generation, generated SDK types, webhook event contract discovery.
- Custom fields, configurable view metadata, automation rule metadata, and dynamic customer field UI.
- Accounting chart of accounts, fiscal periods, tax rates, invoice journal posting, payments, and trial balance.
- Procurement suppliers, material requests, purchase orders, purchase receipts, supplier invoices, AP posting, and supplier payments.
- Inventory warehouses, bins, stock ledger, reservations, transfers, cycle counts, reorder points, valuation layers, and reconciliation.
- Manufacturing BOMs, work centers, routings, production plans, MRP suggestions, work orders, and inventory issue/receipt posting.
- Quality traceability, inspection templates, inspections, non-conformance, corrective actions, supplier scorecards, and recalls.
- Reporting catalog, report runs, print formats, export jobs, dashboards, and scheduled delivery metadata.
- Integration platform with API-key records, webhook subscriptions, durable outbox events, delivery retry/dead-letter visibility, import/export mappings, and connector registry.
- Operations module covering CRM leads/opportunities, projects/tasks, employees/leave requests, and service cases.

Major missing areas:

- Advanced picking/put-away, replenishment automation, mobile barcode flows, and deeper lot/serial controls.
- Capacity planning, shop-floor execution, finite scheduling, and timesheets.
- Payroll, expense claims, customer/supplier portals, POS, e-commerce, and full EDI payload exchange.
- Visual report/print designers, alert builder, real connector adapters, and marketplace packaging.
- Production-grade auth/session hardening, automated webhook workers, and use-case extraction beyond Integration and Operations.

## Reference Systems

### ERPNext

ERPNext positions itself as an all-in-one open-source ERP with Accounts, Procurement, Sales, CRM, Stock, Manufacturing, Projects, and POS. Its docs emphasize document flows and front-end customization through DocTypes, custom fields, customize form, print formats, and reports.

Relevant implementation ideas:

- Form/document model across all modules.
- Buying cycle: material request, RFQ, supplier quotation, purchase order, purchase receipt, purchase invoice, and payment.
- Stock and manufacturing integration: item master, warehouses, BOMs, work orders, production plans, MRP, capacity planning.
- Customization depth: custom fields, form customization, print format builder, naming settings, reports.
- Broad business modules: CRM, HR, payroll, projects, timesheets, POS, website/e-commerce.

### SYSPRO

SYSPRO is purpose-built for manufacturing and distribution. Its strengths are manufacturing execution, quality management, warehouse traceability, purchasing, supply-chain collaboration, distribution, e-commerce/EDI, planning, scheduling, and advanced operational visibility.

Relevant implementation ideas:

- Manufacturing/distribution depth over broad generic breadth.
- Production planning, scheduling, work orders, shop-floor execution, and factory documentation.
- Warehouse management with real-time inventory visibility, pick/put-away, barcode/mobile flows.
- Lot/serial traceability, recalls, quality management, compliance, and inspections.
- Supply-chain collaboration, forecasting, demand-driven replenishment, EDI/e-commerce, and marketplace-style integrations.

## Sources Used

- ERPNext/Frappe official feature page: https://frappe.io/erpnext/usa
- ERPNext accounting introduction: https://docs.frappe.io/erpnext/accounting/introduction
- ERPNext manufacturing documentation: https://docs.frappe.io/erpnext/manufacturing
- SYSPRO manufacturing software page: https://us.syspro.com/industry-specific-software/manufacturing-software/
- SYSPRO distribution management page: https://us.syspro.com/business-software/business-management-software/distribution-management/
- SYSPRO traceability ERP page: https://us.syspro.com/business-software/business-management-software/traceability-erp-software/
- SYSPRO quality management factsheet: https://us.syspro.com/factsheet/quality-management/

## Gap Matrix

| Capability | Current Project | ERPNext Signal | SYSPRO Signal | Recommended Priority |
| --- | --- | --- | --- | --- |
| Core platform | Good foundation | DocTypes, roles, customization | Business rules, automation | Continue hardening |
| Sales | Basic quote-to-cash | Full selling cycle, POS, portal | Complex orders/releases | Extend after inventory/procurement |
| Accounting | Basic GL, payments, trial balance | Full accounting, taxes, AP/AR | Financial control | Add AP/AR aging, tax, bank rec |
| Procurement | Implemented procure-to-pay slice | Buying cycle | Purchasing/supplier collaboration | Harden |
| Inventory/WMS | Implemented warehouse/bin/ledger slice | Stock, warehouses, items | Warehouse, pick/put-away, real-time visibility | High |
| Manufacturing/MRP | Implemented vertical slice | BOM, production plan, work orders, MRP | MES, planning/scheduling, shop floor | Harden |
| Quality/traceability | Implemented vertical slice | Serial/batch support | Quality, recalls, lot/serial traceability | Harden |
| CRM | Implemented lead/opportunity slice | Leads/opportunities | Customer collaboration | Harden |
| HR/projects | Implemented projects/leave slice | HR, payroll, projects, timesheets | Less central than mfg/distribution | Extend |
| Reporting/printing | Implemented reporting/export slice | Report/print builders | Report writer, insights | Harden |
| Integrations | Implemented API key/webhook slice | REST/custom apps | EDI, e-commerce, marketplace | Extend |

## Recommended Next Roadmap

### Phase 7 - Procurement And Accounts Payable

Why next:

- It completes the buy side of the ERP and feeds inventory, accounting, and manufacturing.
- ERPNext's procurement cycle is a clear pattern: material request, RFQ, supplier quotation, purchase order, receipt, invoice, payment.
- SYSPRO's distribution/manufacturing focus depends heavily on purchasing and supplier collaboration.

Scope:

- Suppliers, supplier contacts, supplier terms.
- Material requests and purchase requisitions.
- RFQ and supplier quotations.
- Purchase orders, purchase receipts, purchase invoices.
- Accounts payable posting and supplier payments.
- Purchase approval workflow and audit trail.

Exit criteria:

- A user can request materials, create a purchase order, receive stock, receive a supplier invoice, and pay it.
- Purchase receipt updates inventory.
- Purchase invoice posts balanced AP journal entries.

### Phase 8 - Inventory And Warehouse Management

Scope:

- Warehouses, locations, bins, stock ledger, stock reservations.
- Lot and serial number support.
- Inventory valuation layers: FIFO first, weighted average later.
- Transfers, adjustments, cycle counts, reorder points.
- Barcode-ready pick/pack/ship and put-away APIs.

Exit criteria:

- Stock can be received, reserved, transferred, counted, and valued by warehouse/bin.
- Lot/serial history is queryable end to end.

### Phase 9 - Manufacturing And MRP

Scope:

- BOMs, multi-level BOM explosion, routings, operations, work centers.
- Work orders and production orders.
- Production plans from sales demand and forecasts.
- MRP suggestions for purchase/work orders.
- Capacity planning by work center calendar.

Exit criteria:

- A sales demand can generate a production plan, explode BOM requirements, create work/purchase suggestions, and consume/produce inventory.

### Phase 10 - Quality, Compliance, And Traceability

Scope:

- Inspection templates, quality inspections, non-conformance reports.
- Corrective/preventive actions.
- Supplier quality scorecards.
- Recall and mock-recall workflow by lot/serial.
- Compliance document attachments.

Exit criteria:

- A lot/serial can be traced from purchase receipt through production, sale, and recall.

### Phase 11 - Reporting, Printing, And Analytics

Scope:

- Saved reports and report builder.
- Print format designer for quotes, orders, invoices, POs, receipts.
- CSV import/export jobs.
- Dashboards and scheduled report delivery.
- KPI cards and drill-down report APIs.

Exit criteria:

- A tenant admin can build a report and print format without code changes.

### Phase 12 - Integration Platform

Scope:

- API keys/service accounts.
- Webhook delivery with retries, signatures, dead-letter inspection.
- EDI/e-commerce connector interfaces.
- Import/export mappings.
- Marketplace-style connector registry.

Exit criteria:

- External systems can subscribe to events, push orders, and receive delivery/retry visibility.

### Phase 13 - CRM, Projects, HR, And Service

Scope:

- CRM leads, opportunities, activities, campaigns.
- Projects, tasks, timesheets, billing.
- Employees, departments, leave, expense claims.
- Basic service/helpdesk cases.

Exit criteria:

- Sales and service teams can manage presales, delivery, and support workflows in the same system.

## Architecture Recommendations

- Extract repository orchestration into use-case classes before Phase 7 grows the API. Procurement, inventory, and accounting rules will otherwise make `repository.ts` too large.
- Keep business modules independent: Procurement should depend on Core and Accounting contracts, not Sales internals.
- Add a domain-event outbox table before real webhook delivery. This will support audit, automation, integrations, and retries.
- Add end-to-end browser tests for quote-to-cash, custom fields, accounting, and future procure-to-pay.
- Introduce structured fixtures per module so demo seed data can remain deterministic.

## Immediate Best Next Iteration

The roadmap through Phase 16 is implemented. The next highest-value iteration is automated integration dispatch, followed by WMS execution and manufacturing execution depth. See `docs/reevaluation-2026-07-01.md` for the refreshed ERPNext/SYSPRO comparison and Phase 17+ roadmap.

Initial hardening slice:

1. Extract large repository workflows into use-case classes behind module ports. Status: Integration and Operations are extracted; Sales, Procurement, Inventory, Manufacturing, Quality, and Reporting remain.
2. Add an event outbox table and background dispatcher for durable webhook delivery. Status: table, API dispatch, UI dispatch, and job registration are implemented; a worker-side dispatcher loop remains.
3. Add browser E2E coverage for quote-to-cash, procure-to-pay, MRP, quality recall, integration retry, and service case workflows. Status: API smoke coverage exists through `pnpm smoke:api`; browser-level coverage remains.
4. Add session refresh, token rotation, secrets management, and audit retention controls.
5. Add real connector adapter interfaces for e-commerce/EDI payload exchange.

## Expanded Implementation Roadmap

This roadmap continues after the completed Core, Sales, Customization, Contracts, and Accounting foundation. Each phase must end with contract generation, lint, typecheck, tests, production build, dependency audit, peer check, Compose config validation, and a next-step evaluation.

### Phase 7 - Procurement And Accounts Payable

Status: completed

- Added supplier master data and procurement module manifest.
- Added material requests, RFQs, supplier quotations, purchase orders, purchase receipts, and purchase invoices.
- Added AP journal posting and supplier payments.
- Added purchase receipt stock movements.
- Added procurement API, SDK, OpenAPI schemas, tests, and web pages.

Exit criteria:

- A user can request materials, create a purchase order, receive stock, create a supplier invoice, and pay it.
- Receipt updates product stock and records stock movement.
- Supplier invoice/payment create balanced ledger entries.

### Phase 8 - Inventory And Warehouse Management

Status: completed

- Added `@erp/inventory` module manifest and DTOs.
- Added warehouse, bin, stock ledger, reservation, transfer, cycle count, reorder point, and valuation layer models.
- Added opening-stock seed backfill, inventory module permissions, and enabled module metadata.
- Added inventory snapshot, reservation, transfer, and cycle count API methods.
- Added SDK methods, OpenAPI schemas, tests, worker registry, navigation, and `/inventory` UI.

Exit criteria:

- Stock can be received, reserved, transferred, counted, and valued by warehouse/bin.
- Inventory ledger reconciles to on-hand quantities.

### 2026-07-01 - Phase 8 Inventory/WMS Evaluation

- Implemented warehouse and bin control with seeded `MAIN` warehouse, `MAIN-01` primary stock bin, and `QC-HOLD` quality hold bin.
- Implemented stock ledger entries, active reservations, stock transfers, cycle counts, reorder points, and valuation layers.
- Purchase receipt and sales order stock postings now also write stock ledger entries.
- Product creation now creates opening inventory ledger and valuation records; seed backfills opening ledger for existing products.
- Added `/inventory`, `/inventory/reservations`, `/inventory/transfers`, and `/inventory/cycle-counts` APIs with generated SDK methods and OpenAPI schemas.
- Added inventory UI for reconciliation, warehouse/bin visibility, reservations, transfers, cycle counts, ledger entries, and valuation summary.
- Verified over HTTP that inventory starts reconciled, can reserve scanner stock, transfer stock from `MAIN-01` to `QC-HOLD`, post a cycle count, and remain reconciled.
- Passed contract generation, Prisma migration/seed, lint, typecheck, tests, production build, dependency audit, peer check, and Compose config validation.
- Remaining inventory gaps: lot/serial traceability, pick/pack/ship, put-away rules, and mobile barcode workflows belong in Phase 10 quality/traceability or a later WMS hardening pass.
- Next highest-value item: Phase 9 manufacturing and MRP, because inventory and procurement now provide the material availability foundation needed for BOM explosion and work order posting.

### 2026-07-01 - Phase 7 Procurement/AP Evaluation

- Implemented `@erp/procurement` with supplier, material request, RFQ, supplier quotation, purchase order, receipt, supplier invoice, and supplier payment DTOs.
- Added Prisma procurement models and AP relationships.
- Seeded supplier, material request, purchase order, AP/inventory accounts, permissions, and enabled module metadata.
- Added procurement APIs, OpenAPI schemas, SDK methods, and `/procurement` UI.
- Added receipt stock movements and balanced AP invoice/payment journal posting.
- Verified over HTTP that receiving `po_001` creates `PRC-2026-0001`, posts `PINV-2026-0001`, records payment, increases scanner kit stock to 52, and keeps trial balance balanced.
- Passed contract generation, lint, typecheck, tests, production build, dependency audit, peer check, and Compose config validation.
- Next highest-value item: Phase 8 inventory and warehouse management, because procurement and sales now both need warehouse/bin/ledger control instead of single product stock.

### Phase 9 - Manufacturing And MRP

Status: completed

- Added `@erp/manufacturing` module manifest and DTOs.
- Added BOM, work center, routing, work order, production plan, and MRP suggestion models.
- Added production planning from demand, BOM explosion, work-order suggestions, and component shortage suggestions.
- Added work order creation, release, and completion with inventory issue/receipt ledger posting.
- Added manufacturing API, SDK, OpenAPI schemas, tests, worker registry, navigation, and `/manufacturing` UI.

Exit criteria:

- Sales demand can explode BOM requirements and create production/purchase suggestions.

### 2026-07-01 - Phase 9 Manufacturing/MRP Evaluation

- Implemented seeded BOM `BOM-2026-0001` for `KIT-WHS-220`, assembly work center `ASM`, and routing `RT-2026-0001`.
- Implemented production plans that compare demand to available stock and create MRP suggestions.
- Implemented work order creation from work-order MRP suggestions.
- Implemented work order release and completion.
- Work order completion consumes BOM component inventory through `WorkOrderIssue` ledger entries and produces finished goods through `WorkOrderReceipt` ledger entries and valuation layers.
- Added `/manufacturing`, `/manufacturing/production-plans`, `/manufacturing/mrp-suggestions/:id/work-order`, `/manufacturing/work-orders/:id/release`, and `/manufacturing/work-orders/:id/complete` APIs with generated SDK methods and OpenAPI schemas.
- Added manufacturing UI for BOM/routing visibility, MRP planning, suggestions, production plans, and work order controls.
- Verified over HTTP that MRP created a 3-unit work order, completing it increased scanner kit stock from 42 to 45, decreased component stock from 500 to 497, and kept inventory reconciled.
- Passed contract generation, Prisma migration/seed, lint, typecheck, tests, production build, dependency audit, peer check, and Compose config validation.
- Remaining manufacturing gaps: capacity calendars, finite scheduling, multi-level BOM recursion, scrap/byproducts, operation labor tracking, and shop-floor data capture.
- Next highest-value item: Phase 10 quality, compliance, and traceability, because procurement, inventory, and manufacturing now need lot/serial genealogy and inspection controls.

### Phase 10 - Quality, Compliance, And Traceability

Status: completed

- Added `@erp/quality` module manifest and DTOs.
- Added trace records, inspection templates, quality inspections, non-conformance, corrective actions, supplier scorecards, and recalls.
- Added failed-inspection workflow that quarantines trace records and creates NCR/CAPA records.
- Added recall workflow that marks affected trace records recalled.
- Added quality API, SDK, OpenAPI schemas, tests, worker registry, navigation, and `/quality` UI.

Exit criteria:

- A lot/serial can be traced from receipt through production, sale, and recall.

### 2026-07-01 - Phase 10 Quality/Traceability Evaluation

- Implemented seeded trace record `LOT-KIT-2026-001`, receipt inspection template, and supplier scorecard.
- Implemented quality inspections with pass/fail checkpoint results.
- Failed inspections now create a non-conformance, create a corrective action, and quarantine the affected trace record.
- Recalls now collect affected trace IDs by lot and mark trace records recalled.
- Added `/quality`, `/quality/inspections`, and `/quality/recalls` APIs with generated SDK methods and OpenAPI schemas.
- Added quality UI for trace records, inspection posting, NCR/CAPA timelines, and recall workflow.
- Verified over HTTP that a failed inspection creates NCR/CAPA, quarantines `LOT-KIT-2026-001`, opening a recall affects one trace record, and final trace status becomes recalled.
- Passed contract generation, Prisma migration/seed, lint, typecheck, tests, production build, dependency audit, peer check, and Compose config validation.
- Remaining quality gaps: automatic trace creation from every stock receipt/work-order receipt, serial-level genealogy, supplier defect rollups from inspection data, compliance attachments, and mock-recall analytics.
- Next highest-value item: Phase 11 reporting, printing, and analytics, because the platform now has enough cross-module data to need saved reports, exports, dashboards, and printable business documents.

### Phase 11 - Reporting, Printing, And Analytics

Status: completed

- Added `@erp/reporting` module manifest and DTOs.
- Added saved reports, report runs, print formats, export jobs, dashboard definitions, and scheduled deliveries.
- Added report execution over inventory reconciliation data.
- Added completed CSV/JSON export job creation.
- Added reporting API, SDK, OpenAPI schemas, tests, worker registry, navigation, and `/reports` UI.

Exit criteria:

- A tenant admin can build and run a report and print format without code changes.

### 2026-07-01 - Phase 11 Reporting/Printing Evaluation

- Implemented seeded `Inventory Reconciliation` report, `Standard Invoice` print format, and `Operations Control` dashboard definition.
- Implemented report runs that produce rows with stock-on-hand and ledger quantity.
- Implemented export jobs with deterministic download URL metadata.
- Added `/reports`, `/reports/runs`, and `/reports/exports` APIs with generated SDK methods and OpenAPI schemas.
- Added reports UI for saved reports, report runs, export jobs, print formats, and dashboards.
- Verified over HTTP that the inventory report runs with 5 rows, includes `ledgerQuantity`, creates a completed CSV export, and persists run/export records.
- Passed contract generation, Prisma migration/seed, lint, typecheck, tests, production build, dependency audit, peer check, and Compose config validation.
- Remaining reporting gaps: visual report builder, true print rendering/PDF, scheduled delivery worker execution, persisted file storage, and report authorization filters.
- Next highest-value item: Phase 12 integration platform, because OpenAPI contracts now need service accounts, API keys, webhook delivery, retries, and connector metadata.

### Phase 12 - Integration Platform

Status: in progress

- Add API keys, service accounts, webhook delivery, signatures, retries, dead-letter inspection, import/export mappings, and connector registry.

Exit criteria:

- External systems can subscribe to events, push transactions, and inspect delivery/retry state.

### Phase 13 - CRM, Projects, HR, And Service

Status: completed

- Added `@erp/operations` module manifest and DTOs.
- Added CRM lead/opportunity, project/task, employee/leave, and service-case persistence.
- Added operations API, OpenAPI schemas, SDK methods, tests, worker registry, navigation, and `/operations` UI.
- Added workflows for lead creation, project creation, leave request, service case creation, and service case close.

Exit criteria:

- Sales and service teams can manage presales, delivery, employee leave, and support workflows in the same system.
- Operations endpoints are contract-documented and validated by repository and live smoke tests.

### 2026-07-01 - Phase 12 Integration Platform Evaluation

- Implemented `@erp/integration` with API keys, webhook subscriptions, deliveries, dead letters, mappings, and connector registry.
- Added Prisma migration `20260701082123_add_integration_platform` and seeded demo subscriptions, mappings, connectors, permissions, and module enablement.
- Added protected integration APIs, SDK methods, OpenAPI schemas, worker registry, navigation, and `/integrations` UI.
- Verified live API flow: login, read integrations, create API key, dispatch failed webhook, retry to dead letter, and read final state.
- Passed Prisma validate/generate/migrate/seed, contract generation, lint, typecheck, tests, production build, audit, peer check, and Compose config validation.

### 2026-07-01 - Phase 13 Operations Evaluation

- Implemented `@erp/operations` with CRM leads/opportunities, projects/tasks, employees/leave, and service cases.
- Added Prisma migration `20260701084509_add_operations_crm_projects_hr_service` and seeded operations data, permissions, and module enablement.
- Added protected operations APIs, SDK methods, OpenAPI schemas, worker registry, navigation, and `/operations` UI.
- Verified live API flow: login, read operations, create lead, create project, request leave, create service case, close service case, and read final state.
- Passed lint, typecheck, tests, production build, dependency audit, peer dependency check, and Compose config validation.

Status: pending

- Add leads, opportunities, activities, campaigns, projects, tasks, timesheets, employees, departments, leave, expense claims, and service cases.

Exit criteria:

- Presales, delivery, people operations, and support workflows are represented as tenant-scoped modules with API, SDK, UI, and tests.
