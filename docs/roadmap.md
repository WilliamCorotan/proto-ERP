# ERPNext/SYSPRO Replacement Program

> **Authoritative roadmap.** This file is the single source of truth for scope, status, sequencing, gates, and completion evidence. Other roadmap, gap-analysis, and reevaluation documents are historical research. When they disagree with this file, this file wins.

Last updated: 2026-07-10

## Purpose

Build and cut over a production-operable ERP platform that can replace the business-selected ERPNext and/or SYSPRO estate without losing financial control, tenant isolation, traceability, operational continuity, or audit history.

This is a replacement program, not a feature-count exercise. Existing screens, schemas, and demo workflows are evidence of implementation progress, but a capability is complete only when its slice acceptance criteria pass against durable PostgreSQL state and the responsible business owner accepts the result.

Historical inputs remain available in:

- [Feature research and architecture roadmap](feature-research-architecture-roadmap-2026-07-02.md)
- [Competitive reevaluation](competitive-reevaluation-2026-07-02.md)
- [ERP reevaluation](reevaluation-2026-07-01.md)
- [Competitive gap analysis](competitive-gap-analysis.md)
- [Frontend design-system roadmap](frontend-design-system-roadmap.md)

## Status legend

| Status | Meaning |
| --- | --- |
| ✅ Complete | Acceptance criteria are implemented and have current evidence. |
| 🟡 In progress | Work is implemented partially or is under verification/review. |
| ⬜ Planned | Sequenced, but dependencies or capacity prevent execution now. |
| ⛔ Blocked | A named business or technical decision is required before implementation. |
| 🗑 Superseded | Historical approach retained only for context; do not execute. |

Status applies to the exact slice, not the surrounding epic. No epic E1-E8 is complete, and the full replacement is not complete.

## Program principles and gates

1. **Integrity before depth.** Tenant isolation, durable writes, idempotency, auditability, and financial invariants precede advanced WMS, manufacturing, portals, or connectors.
2. **Vertical slices over broad scaffolding.** Each slice includes domain policy, migration, repository/use case, API/SDK, UI or worker surface, and focused verification where those layers apply.
3. **PostgreSQL is the production truth.** Memory/demo implementations are test fixtures only. Production/default execution must fail explicitly when durable services are unavailable.
4. **Dependencies point inward.** Business policies and use-case ports live in core/platform/module packages. Nest, Next, Prisma, Redis, HTTP, and external systems remain adapters.
5. **Tenant ownership is immutable.** Application queries and database constraints must both prevent cross-tenant reads, writes, relations, and ownership changes.
6. **Financial and stock postings are atomic and reversible, not editable.** A failed command leaves no partial document, ledger, audit, or event state.
7. **External delivery is at-least-once.** Stable idempotency keys, signed requests, retry leases, and dead-letter operations are mandatory; no component may claim exactly-once HTTP.
8. **Cutover evidence is a product deliverable.** Reconciliation packs, migration exception logs, rollback rehearsals, RPO/RTO evidence, and business sign-off are part of completion.

### Gates

| Gate | Must be true before dependent work proceeds |
| --- | --- |
| G0 — Replacement contract | Target products/modules, legal entities, sites, volumes, integrations, statutory controls, pilot, and cutover approach are approved. |
| G1 — Integrity foundation | Production fails closed; PostgreSQL integration runs in release CI; tenant/RBAC negative tests pass; critical cross-tenant FKs are validated. |
| G2 — Platform boundary | Inward ports, durable document/workflow/posting contracts, stable errors, idempotency, pagination, and generated contracts are established. |
| G3 — Slice acceptance | Durable integration, API/worker, browser, reconciliation, performance, and business acceptance pass for the slice. |
| G4 — Cutover readiness | Full-volume rehearsal, parallel-run controls, backup/restore, observability, rollback timing, and signed reconciliation pass. |

Every implementation slice must run the relevant subset of `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm build`, contract generation, API/worker smoke, and browser tests. Release candidates use `pnpm verify:release` with an explicitly isolated `TEST_DATABASE_URL`.

## Current implementation baseline

These are completed engineering milestones, not a claim of replacement readiness.

| Milestone | Status | Evidence |
| --- | --- | --- |
| TypeScript modular-monolith workspace | ✅ Complete | `apps/api`, `apps/web`, `apps/worker`, `packages/core`, module packages, Prisma package, SDK, Turbo/pnpm scripts. |
| Module manifests and workflow policy package | ✅ Complete | `packages/core/src/index.ts`, `packages/modules/*`, `packages/platform-workflow`; focused workflow tests. |
| Durable workflow instances/tasks and outbox schema | ✅ Complete | Prisma migrations through workflow task operations; workflow/outbox repository and worker tests. This does not complete the universal document platform. |
| Production API no longer falls back to memory | ✅ Complete | `ErpReadService` composes `PrismaErpRepository` directly in `apps/api/src/main.ts`; readiness checks the database. |
| Web production/default data fails explicitly | ✅ Complete | `apps/web/app/data.ts`; demo fallback requires `ERP_ENABLE_DEMO_DATA=true` outside production; focused web tests cover failure behavior. |
| Authenticated tenant propagation and read RBAC | ✅ Complete | Tenant ID flows from session through API reads/use cases; sales/dashboard require sales read access; dashboard audit data requires audit permission. |
| Isolated PostgreSQL integration harness and release command | ✅ Complete | `packages/db/test/support/postgres.ts`, integration fixtures/tests, root `test:integration` and `verify:release`; the harness requires explicit `TEST_DATABASE_URL`. |
| Pilot composite tenant constraints | 🟡 In progress | Additive preflight, concurrent indexes, `NOT VALID` expand, separate validation migrations, restrictive tenant updates, and negative tests exist for the sales chain and expense claim. Valid and dirty populated predecessor upgrades now pass; schema drift and production lock evidence remain gates. |
| Secure webhook HTTP transport | 🟡 In progress | `apps/worker/src/webhook-transport.ts` implements signed byte-stable delivery, HTTPS/SSRF policy, bounded timeout, redirect denial, and response classification with focused tests. Durable per-subscription state and dispatcher integration remain. |

Known baseline limitations that prevent replacement claims:

- `apps/api/src/repository.ts` and `apps/api/src/main.ts` remain cross-domain concentration points.
- Most repository behavior tests use `MemoryErpRepository`; durable per-capability coverage is incomplete.
- Snapshot APIs are broad and mostly unpaginated.
- Webhook delivery paths still simulate success; no signed HTTP transport is active.
- Business modules largely expose DTOs/manifests while rules remain in API repository code.
- Finance, stock, manufacturing, and migration controls have not passed business reconciliation or production-volume gates.

## E0 — Replacement contract and integrity foundation

Epic exit: G0 and G1 pass, production has no silent fallback or false external success, and the team can add vertical slices without weakening tenant or transactional boundaries.

| Slice | Status | Depends | Acceptance criteria | Main file areas | Verification/evidence | Blocker or decision |
| --- | --- | --- | --- | --- | --- | --- |
| E0.1 Replacement scope contract | ⛔ Blocked | None | Signed capability/control matrix names target ERP products and versions, modules/customizations, legal entities/sites, record volumes, integrations/devices, statutory controls, pilot, coexistence, cutover, RPO/RTO, and reconciliation tolerances. | This roadmap; future discovery records | Business and technical owner sign-off | Business input B1-B10 |
| E0.2 Fail-closed production reads/writes | ✅ Complete | None | API uses durable repository; web/API outage is explicit; production cannot return plausible demo ERP state; protected getters reject missing sessions. | `apps/api/src/main.ts`, `apps/web/app/data.ts` | API/web tests, lint, typecheck, web build | None |
| E0.3 PostgreSQL release harness | ✅ Complete | None | Fresh migrations run in a random disposable database; two-tenant fixtures load; cleanup is retry-safe; integration is part of release verification and cannot use normal `DATABASE_URL`. | `packages/db/test/**`, package scripts | DB unit checks; `pnpm test:integration` when isolated DB is supplied | Release environment must provide `TEST_DATABASE_URL` |
| E0.4 Pilot tenant-FK rollout | 🟡 In progress | E0.3 | Clean populated upgrade succeeds; dirty historical mismatch aborts before catalog change; same-tenant CRUD succeeds; cross-tenant create/update/ownership transfer fails; all pilot constraints and indexes are valid; Prisma drift is empty; old scalar FKs remain through rollback window. | Prisma schema; `2026071015*` migrations; DB integrity tests | 21 PostgreSQL integration tests include valid and dirty predecessor upgrades, constraint/index catalogs, tenant negatives, and cleanup; `prisma validate/generate` pass | Prisma drift and production-volume lock/replica rehearsal remain |
| E0.5 Capability boundaries and scalable reads | ⬜ Planned | E0.3 | Split API god files by capability; ports and inputs are defined inward; Prisma adapters implement them; snapshot endpoints gain pagination/filter contracts; a representative sales and accounting path is migrated without contract regression. | `packages/modules/*`, new use-case/port files, `apps/api`, `packages/sdk` | Dependency review, focused unit/Postgres/contract tests, load sample | Boundary/package naming decision |
| E0.6 Real signed webhook delivery | 🟡 In progress | E0.3, E0.4 pattern | Worker is sole HTTP sender; stable per-subscription delivery rows, HMAC signatures, HTTPS/SSRF policy, timeout, leases, jittered retries, idempotent replay, and dead letters work; API only enqueues/requeues; no code path can manufacture delivered status. | Integration schema/module; `apps/worker/src/webhook-transport.ts`; worker dispatcher; API integration use cases | 49 worker tests cover the initial transport; independent review requires DNS-deadline/rebinding controls, signed metadata, response-body cleanup, transient DNS classification, and Retry-After before dispatcher integration | Secret manager/KMS and fail-closed outbound egress policy |
| E0.7 Expand tenant constraints by capability | ⬜ Planned | E0.4 | Machine-reviewed relation inventory; identity/finance first, then operational modules; no unresolved ownership mismatches; composite constraints validate in bounded batches with preserved delete behavior and restrictive tenant updates. | Prisma schema/migrations, DB integration fixtures | Populated upgrades, negative SQL/Prisma tests, lock/replica evidence | Production row counts and maintenance constraints |

## E1 — Tenant/company and master-data kernel

Epic exit: every downstream document references governed, effective-dated company, party, item, accounting, tax, and numbering masters.

| Slice | Status | Depends | Acceptance criteria | Main file areas | Verification/evidence | Blocker or decision |
| --- | --- | --- | --- | --- | --- | --- |
| E1.1 Company/site/fiscal context | ⛔ Blocked | E0.1, E0.7 identity subset | Company, branch/site, fiscal calendar, currency, locale, and timezone are tenant-scoped and immutable on posted transactions. | Core/master-data package, Prisma, API/SDK, admin UI | Two-company isolation and effective-date tests | B2, B3, B4 |
| E1.2 Party master | ⬜ Planned | E1.1 | Customer/supplier/contact/address/payment terms/tax IDs share governed party records; inactive or foreign parties cannot enter documents; merge is audited. | Sales/procurement/master-data packages and screens | Duplicate/merge, status, tenant and import tests | B5 |
| E1.3 Item/UoM master | ⬜ Planned | E1.1 | Item, variant, UoM conversion, tracking mode, warehouse defaults, and lifecycle status validate receipt, sale, stock, and BOM use. | Inventory/manufacturing/master-data packages and screens | Conversion/property tests and cross-module Postgres flow | B6 |
| E1.4 Financial reference masters | ⛔ Blocked | E1.1 | COA, dimensions/cost centers, tax codes, number series, rates, and payment terms are effective at document date and cannot be changed retroactively after posting. | Accounting/pricing platform, Prisma, settings UI | Effective-date and closed-period tests | B3, B4, B7 |
| E1.5 Master import preview | ⬜ Planned | E1.2-E1.4 | CSV templates validate without writes, report row-level errors, import atomically or in auditable batches, and are idempotent on rerun. | Import worker/platform, API, admin UI | Reject-file, duplicate, restart and volume tests | Source extracts and matching rules |

## E2 — Universal document, workflow, and immutable ledger platform

Epic exit: documents use one durable identity/concurrency/audit model and post atomic, reconcilable entries through inward use cases.

| Slice | Status | Depends | Acceptance criteria | Main file areas | Verification/evidence | Blocker or decision |
| --- | --- | --- | --- | --- | --- | --- |
| E2.1 Durable workflow authority | 🟡 In progress | E0.5 | Actions derive from persisted tenant document state; generic transitions cannot accept fabricated state or nonexistent documents; domain mutation, workflow history, tasks, audit, and outbox are atomic. | `packages/platform-workflow`, capability use cases, API/repository | Stale-state, nonexistent/cross-tenant, rollback and permission tests | Transition transaction boundary design |
| E2.2 Document collaboration | ⬜ Planned | E2.1 | Shared document identity/version, optimistic lock, comments, assignments, attachments, edit locks, and timeline work for PO, invoice, journal, and quality documents. | New `platform-documents`, MinIO adapter, API/web | Conflict, attachment authorization, timeline and browser tests | Retention/storage policy |
| E2.3 Immutable posting engine | ⬜ Planned | E1.4, E2.1 | Balanced posting is atomic; posted entries cannot be edited; correction uses linked reversal; period lock and idempotency are enforced. | Accounting domain/use cases, Prisma adapter | Property tests, concurrency, Postgres rollback, audit drill-through | Accounting policy B7 |
| E2.4 Stock/subledger/outbox atomicity | ⬜ Planned | E2.3, E1.3 | A business command creates one document transition, stock/subledger entries, audit, and outbox event in one transaction; duplicate key produces no duplicate effects. | Inventory/accounting/integration ports and adapters | Failure injection and idempotent replay tests | Transaction ownership boundary |
| E2.5 Reconciliation harness | ⬜ Planned | E2.3, E2.4 | GL control accounts reconcile to AR, AP, inventory, WIP, cash, tax, and fixed-asset subledgers with explicit explained differences. | Accounting reporting/read models | Seeded/imported control totals and signed reconciliation output | Tolerances B10 |

## E3 — Finance-first operational spine

Existing finance screens/models are prototype input. These slices remain planned until durable reconciliation and business gates pass.

| Slice | Status | Depends | Acceptance criteria | Main file areas | Verification/evidence | Blocker or decision |
| --- | --- | --- | --- | --- | --- | --- |
| E3.1 General ledger and close | ⬜ Planned | E2.3, E2.5 | Journal approval/post/reverse/period lock produces balanced trial balance, P&L, balance sheet, cash flow, and close checklist with drill-through. | Accounting module/API/web/reporting | Parallel sample close and control totals | B3, B7 |
| E3.2 Accounts receivable | ⬜ Planned | E3.1, E1.2 | Quote/order/shipment/invoice/receipt/allocation/credit note/dunning reconcile customer aging to GL. | Sales, accounting, inventory | End-to-end PostgreSQL/browser flow and AR reconciliation | Pricing/tax/credit rules |
| E3.3 Accounts payable | ⬜ Planned | E3.1, E1.2 | Requisition/PO/receipt/three-way match/vendor invoice/payment/debit note handle tolerances and reconcile AP to GL. | Procurement, accounting, inventory | Match variance, approval and AP reconciliation | Approval and tolerance policy |
| E3.4 Bank and treasury | ⬜ Planned | E3.2, E3.3 | Statement import is idempotent; matching/reconciliation retains unexplained variance; cash position and payment state reconcile. | Accounting/integration/worker | Bank-format fixtures and rerun tests | Banking formats/integrations |
| E3.5 Tax, FX, costing, and assets | ⬜ Planned | E3.1-E3.4 | Tax, exchange, landed cost, depreciation, and revaluation produce traceable journals under closed-period rules. | Accounting/pricing/inventory | Jurisdiction scenarios and reconciliation | B4, B7 |

## E4 — SYSPRO-depth inventory, traceability, returns, and WMS

| Slice | Status | Depends | Acceptance criteria | Main file areas | Verification/evidence | Blocker or decision |
| --- | --- | --- | --- | --- | --- | --- |
| E4.1 Lot/serial and holds | ⬜ Planned | E1.3, E2.4, E3.1 | Tracked receipts create lot/serial identity; every movement requires it; failed inspection creates hold; held stock cannot allocate or ship. | Inventory-tracking, inventory, quality, procurement | Genealogy and blocked-allocation integration tests | B6, B8 |
| E4.2 Returns and recall | ⬜ Planned | E4.1, E3.2, E3.3 | RMA and supplier return inspect/restock/scrap and reverse finance; mock recall resolves supplier-to-customer impact and creates tasks. | Inventory, sales, procurement, quality, accounting | Mock recall and reversal reconciliation | Recall SLA/authority B8 |
| E4.3 Directed WMS | ⬜ Planned | E4.1 | Release creates waves; receipts create directed put-away; reorder creates replenishment; scan flows handle receive/pick/pack/ship/transfer/count with license plates. | Inventory/WMS use cases, worker, mobile web | Device/browser flows, concurrency, accuracy and cycle-time metrics | Warehouse topology/devices B8 |

## E5 — Manufacturing, MES, planning, and costing

| Slice | Status | Depends | Acceptance criteria | Main file areas | Verification/evidence | Blocker or decision |
| --- | --- | --- | --- | --- | --- | --- |
| E5.1 BOM/routing revisions and ECO | ⬜ Planned | E1.3, E2.1 | Effective revisions are approved; MRP/work orders use the correct revision; changes are fully audited. | Manufacturing domain/API/web | Effective-date and approval tests | B9 |
| E5.2 MRP and finite scheduling | ⬜ Planned | E5.1, E4.1 | Multi-level MRP has pegging; work-center/shift capacity produces feasible operation queues and actionable exceptions. | Manufacturing/planning worker/read models | Golden plans and volume/performance tests | Planning rules B9 |
| E5.3 Shop-floor execution and OEE | ⬜ Planned | E5.2, E3.5 | Issues, labor/machine booking, scrap/rework/byproduct/receipt and downtime reconcile WIP/cost variance; OEE derives availability/performance/quality. | Manufacturing, inventory, quality, accounting, shop-floor UI | Full traced work order and cost/OEE reconciliation | Backflush/cost/OEE policy B9 |
| E5.4 Subcontracting | ⬜ Planned | E5.1, E3.3, E4.1 | Supplier stock, issue, receipt, quality, landed cost, and AP effects reconcile for subcontract orders. | Manufacturing/procurement/inventory/accounting | End-to-end subcontract reconciliation | Supplier process decision |

## E6 — Portals and executable integrations

| Slice | Status | Depends | Acceptance criteria | Main file areas | Verification/evidence | Blocker or decision |
| --- | --- | --- | --- | --- | --- | --- |
| E6.1 Portal identity and scope | ⬜ Planned | E0.7, E1.2 | External identities are separate from staff roles and can access only explicitly linked party/tenant records. | Auth/portal API and web | Cross-account/tenant security review | Identity provider decision |
| E6.2 Customer and supplier portals | ⬜ Planned | E6.1, E3.2, E3.3, E4.2 | Customer views quote/order/invoice/shipment and requests RMA; supplier responds to RFQ, acknowledges PO, and submits ASN. | Portal web/API, sales/procurement | Browser acceptance with external roles | Portal MVP scope |
| E6.3 Connector runtime | ⬜ Planned | E0.6, E2.4 | Adapter auth/map/validate/dispatch/reconcile/replay is durable; inbound commands are idempotent; failures are observable and replayable. | Connector platform, worker, integration UI | Mapping and replay integration tests | First connector B5/B8 |
| E6.4 First production connector | ⛔ Blocked | E6.3 | One selected SFTP/CSV, commerce, or EDI flow runs bidirectionally with reconciliation and support runbook. | Connector adapter and mapping | Partner sandbox and business reconciliation | Business must select first integration |

## E7 — Reporting, configuration, and production operations

| Slice | Status | Depends | Acceptance criteria | Main file areas | Verification/evidence | Blocker or decision |
| --- | --- | --- | --- | --- | --- | --- |
| E7.1 Operational read models | ⬜ Planned | E0.5, E3 core flows | Paginated/filterable read models meet representative volumes and drill to source documents without loading whole domains. | Reporting/read-model adapters, SDK/web | Query plans and agreed latency SLO | Volume/SLO input |
| E7.2 Report/import/print builders | ⬜ Planned | E1.5, E7.1 | Tenant admin builds, schedules, exports, and prints governed reports without code; import preview prevents invalid writes. | Reporting module, worker, web | Builder/browser and scheduled-delivery tests | Governance/retention policy |
| E7.3 Observability and resilience | ⬜ Planned | E0.6 | Structured logs, metrics, traces, readiness, rate limits, queue health, backup/restore, audit retention, and incident runbooks are tested. | Apps, deployment docs, worker/DB operations | Restore/failover/queue replay rehearsal | Hosting/RPO/RTO B10 |
| E7.4 Security and compliance gate | ⬜ Planned | E7.3, required product slices | Threat model, secret rotation, dependency review, penetration testing, tenant isolation, retention, and privileged audit controls pass. | Cross-cutting | Independent security report and remediations | Compliance requirements |

## E8 — Migration, parallel run, cutover, and decommission

Design begins during E0; execution waits for the selected pilot’s required product slices.

| Slice | Status | Depends | Acceptance criteria | Main file areas | Verification/evidence | Blocker or decision |
| --- | --- | --- | --- | --- | --- | --- |
| E8.1 Source profiling and mapping | ⛔ Blocked | E0.1, E1 design | Versioned transforms cover masters, open documents, balances, history, attachments, and custom fields; every reject has an owner. | Dedicated migration tooling/docs | Source extracts, profiling report, mapping sign-off | Source access and target products B1 |
| E8.2 Rehearsal migrations | ⬜ Planned | E8.1, pilot product slices | Master, opening GL/AR/AP/inventory/WIP, open documents, and retained history migrate at full volume with repeatable control totals. | Migration tooling and reconciliation reports | Timed rehearsals and exception log | Masked/full-volume environment |
| E8.3 Parallel operations | ⬜ Planned | E8.2, E7.3 | At least one approved financial close and required warehouse/manufacturing cycles reconcile within signed tolerances. | Runbooks/reconciliation | Business-signed parallel-run pack | Pilot and tolerance B10 |
| E8.4 Cutover and rollback | ⬜ Planned | E8.3, G4 | Freeze, delta load, validation, go/no-go, rollback, communications, and hypercare complete within RTO with named owners. | Cutover runbook and operations | Full dress rehearsal and signed go-live checklist | Cutover approach/window |
| E8.5 Legacy decommission | ⬜ Planned | Stable E8.4 | Retention/legal access, final archive, integration shutdown, license termination, and support ownership are approved. | Archive/operations docs | Audit and decommission sign-off | Retention/legal policy |

## Now / Next / Later

### Now

1. **E0.4:** finish Prisma drift and production-volume lock/replica evidence for the pilot tenant-FK rollout.
2. **E0.6:** remediate the transport security-review findings, then integrate durable per-subscription delivery state and remove every false-success API/worker path.
3. **E0.1:** run business discovery in parallel and close B1-B10. This blocks product-level replacement commitments.
4. **E0.5:** select the first capability extraction (sales read/write plus accounting posting boundary) and define pagination/error/idempotency contracts.

### Next

1. Expand tenant constraints to identity and finance through E0.7.
2. Execute E1.1-E1.4 master-data decisions and schemas.
3. Complete E2.1 durable workflow authority, then E2.3 posting engine and E2.5 reconciliation.
4. Start E3.1 GL/close only after the above gates pass.

### Later

E3.2-E3.5 finance operations, E4 WMS/traceability, E5 manufacturing, E6 portals/connectors, E7 builders/operations, and E8 cutover proceed in dependency order. “Later” is not lower value; it means starting now would bypass an integrity or business gate.

## Business-input register

| ID | Required decision/input | Owner | Status | Blocks |
| --- | --- | --- | --- | --- |
| B1 | Are we replacing ERPNext, SYSPRO, or both; which versions, modules, customizations, and reports? | Executive sponsor / product owner | Open | E0.1, E8.1 |
| B2 | Legal entities, companies, branches, plants, warehouses, countries, and tenant/company hierarchy | Finance/operations | Open | E1.1 |
| B3 | Fiscal calendars, COA, dimensions, budgets, consolidation, intercompany, close and approval controls | Finance controller | Open | E1.1, E1.4, E3 |
| B4 | Tax jurisdictions, registrations, invoice rules, currencies, FX sources, and statutory reporting | Tax/finance | Open | E1.4, E3.5 |
| B5 | Customer/supplier identity, duplicate/merge rules, terms, portals, and first external connector | Sales/procurement | Open | E1.2, E6 |
| B6 | SKU/variant/UoM conventions, lot/serial/expiry, valuation and removal strategies | Inventory/product | Open | E1.3, E4 |
| B7 | Revenue, AP/AR, payment, asset, landed-cost, WIP, reversal and retention policies | Finance controller | Open | E2.3, E3, E5 |
| B8 | Warehouse topology, devices/barcodes, pick/put-away/replenishment, quarantine and recall authority/SLA | Warehouse/quality | Open | E4, E6.4 |
| B9 | BOM/routing/ECO, capacity, planning horizon, backflush, labor/machine rates, subcontracting and OEE definitions | Manufacturing | Open | E5 |
| B10 | Volumes/peaks, SLOs, deployment/data residency, HA, RPO/RTO, migration history, parallel-run tolerances and pilot | IT/operations/business owners | Open | E0.1, E7, E8 |

## Risk register

| ID | Risk | Severity | Current control / next action |
| --- | --- | --- | --- |
| R1 | Replacement scope is inferred from product marketing rather than the actual estate | Critical | E0.1 and B1-B10 block replacement commitments. |
| R2 | Plausible demo data masks production outages or lost writes | High | Mitigated for API/web by E0.2; retain regression tests. |
| R3 | Cross-tenant relations or updates bypass scoped queries | Critical | Pilot constraints are in progress; expand via E0.7 and retain negative repository/DB tests. |
| R4 | Cross-domain API repository/controller concentration makes changes unsafe | High | E0.5 extracts bounded use cases/adapters before feature expansion. |
| R5 | Webhooks report delivery without network I/O | Critical | E0.6 is in Now; worker becomes sole sender with signed transport. |
| R6 | Memory tests pass while Prisma transaction/concurrency behavior fails | High | E0.3 exists; each slice must add durable tests and release CI evidence. |
| R7 | Broad migrations lock populated ERP tables or silently rewrite ownership | Critical | Use concurrent indexes, NOT VALID/VALIDATE phases, lock timeouts, populated rehearsals, and no automatic tenant repair. |
| R8 | Finance/stock/manufacturing prototypes are mistaken for controlled business completion | Critical | G3 requires reconciliation, volume, browser/worker, and business acceptance. |
| R9 | Manual OpenAPI/Zod/domain/Prisma contract sources drift | High | E0.5 selects authoritative contracts and requires regeneration/drift tests. |
| R10 | Cutover cannot reconcile or roll back within the business window | Critical | E8 rehearsals and G4 are mandatory before go-live. |

## Update protocol

1. The main implementation thread owns roadmap status changes and integration decisions.
2. Update a slice only when its acceptance evidence changes. Do not mark completion from file presence or unit tests alone.
3. Every status change records date, evidence/commands, unresolved risks, and the next executable slice in the changelog.
4. New work receives an epic/slice ID and explicit dependencies before implementation.
5. Blocked work names the decision and owner in the business-input or risk register.
6. Historical research files receive context corrections only; do not maintain competing status lists there.
7. When a slice changes public API, regenerate OpenAPI/SDK and record contract checks.
8. When a slice changes persistence, verify fresh migration, populated upgrade, rollback/forward recovery, tenant negatives, and drift.

## Changelog

### 2026-07-10 — Roadmap consolidation

- Replaced phase/iteration accumulation with dependency-ordered epics E0-E8 and slice-level gates.
- Recorded completed fail-closed, tenant propagation/RBAC, workflow persistence, and PostgreSQL harness milestones.
- Kept the tenant-FK pilot in progress pending live populated-upgrade/drift/locking evidence.
- Made real webhook delivery and replacement-scope discovery immediate work.
- Added business-input and risk registers plus explicit cutover acceptance.
- Marked historical roadmap/gap documents non-authoritative; their research and iteration history remain available through links above.

### 2026-07-10 — Continued integrity and transport implementation

- Added cutoff-capable migration testing with clean and deliberately dirty populated predecessor upgrades; the full PostgreSQL lane now passes 21 tests.
- Added a framework-free signed webhook transport with HTTPS/SSRF policy, HMAC headers, bounded timeouts, redirect denial, and 49 focused worker tests.
- Independent transport review found no P0 issue but requires DNS-deadline/rebinding controls, signed delivery metadata, bounded response-body cleanup, transient DNS retry classification, and Retry-After support before dispatcher integration.
- Kept E0.4 and E0.6 in progress because production lock/drift evidence and reviewed durable dispatcher/persistence integration are still required.
