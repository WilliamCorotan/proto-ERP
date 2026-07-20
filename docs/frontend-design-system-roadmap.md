# Frontend Design System Roadmap

> **Historical specialist roadmap — non-authoritative.** Use the [ERPNext/SYSPRO Replacement Program](roadmap.md) for program status and sequencing. This document remains the design-system implementation history and reference.

Date: 2026-07-02

## Direction

The ERP frontend now uses a token-first Command Center design system for dense enterprise workflows. The system is custom-styled for this ERP, with Radix primitives available for accessible interaction behavior and compatibility styles for the existing module pages.

Reference patterns:

- Material Design 3: semantic design tokens and stateful surfaces.
- IBM Carbon: enterprise token governance, status color discipline, and AI/action affordances.
- Microsoft Fluent 2: accessible component behavior, density, and motion rules.
- Atlassian Design System: light/dark-ready tokens and product-scale color semantics.

## Iteration DS-1 - Foundation And Shell

Status: implemented.

Implemented:

- Added Radix dependencies for slot, dialog, dropdown menu, tabs, select, tooltip, switch, and checkbox.
- Added `class-variance-authority` and `clsx` for typed variant composition.
- Added design-system primitives under `apps/web/components/design-system`.
- Replaced the legacy beige stylesheet with semantic tokens for surfaces, text, borders, status tones, spacing, radius, elevation, typography, density, focus, and motion.
- Refreshed the shell with a dark command navigation surface, topbar search affordance, operator status, and a discoverable design-system link.

Evaluation:

- The architecture is dependency-light but has accessible Radix behavior where needed.
- The shell now presents an enterprise operating-system identity instead of a prototype dashboard.
- Existing module pages remain functional through compatibility class contracts.

Validation:

- `pnpm --filter @erp/web typecheck`
- `pnpm --filter @erp/web lint`
- `pnpm --filter @erp/web build`

## Iteration DS-2 - Dashboard And Compatibility Migration

Status: implemented.

Implemented:

- Migrated the dashboard to `PageHeader`, `MetricTile`, `RecordPanel`, `Timeline`, `TimelineRow`, `DataCard`, and `Badge`.
- Restyled existing `.panel`, `.record-form`, `.metric-grid`, `.data-grid`, `.module-grid`, `.timeline`, `.status-pill`, `.inline-form`, and `.mini-form` contracts so current module pages inherit the design system without changing business logic.
- Added responsive grid behavior for dense operational pages at desktop, tablet, and mobile widths.

Evaluation:

- The dashboard is now the reference implementation for new pages.
- Current module pages are covered by compatibility wrappers, so the design-system roadmap can advance without rewriting all ERP workflows at once.
- A later hardening pass can replace compatibility classes with primitives page by page when changing feature code.

Validation:

- `pnpm --filter @erp/web typecheck`
- `pnpm --filter @erp/web lint`
- `pnpm --filter @erp/web build`

## Iteration DS-3 - Internal Catalog And Enterprise Patterns

Status: implemented.

Implemented:

- Added `/design-system` as an internal catalog route.
- Demonstrated token swatches, status badges, action buttons, native and Radix selects, checkbox, switch, tabs, tooltip, dialog, metrics, cards, and timeline patterns.
- Added automation-specific visual tone for workflow and AI/action states.

Evaluation:

- The design system is now visible, testable, and discoverable from the app shell.
- The catalog proves Radix-backed controls compile in the Next app and share the same token layer.

Validation:

- `pnpm --filter @erp/web build` includes `/design-system`.
- HTTP smoke against the running Next app verified `/`, `/design-system`, `/accounting`, and `/integrations` render expected content.

## Iteration DS-4 - Accessibility And Governance

Status: implemented as foundation.

Implemented:

- Added global visible focus states for links, buttons, inputs, selects, textareas, and interactive roles.
- Added reduced-motion handling for hover/motion transitions.
- Added status tones with contrast-safe foreground/background pairings.
- Added responsive constraints to prevent common text and form overlap across module pages.
- Documented token usage, compatibility strategy, and validation gates in this roadmap.

Evaluation:

- The foundation satisfies enterprise accessibility basics and gives future page work clear guardrails.
- Remaining governance depth should be added when Storybook or a formal visual regression setup is introduced.

## Iteration DS-5 - Data, Density, And Module Migration

Status: implemented.

Implemented:

- Added a reusable `DataTable` primitive for ledger, event, and report-heavy ERP screens.
- Added a persisted density control in the shell with compact and comfortable modes backed by design tokens.
- Added density-aware spacing, form control, table, and timeline CSS variables.
- Migrated Accounting from compatibility panels into `RecordPanel`, `MetricTile`, `DataTable`, `Timeline`, `TimelineRow`, `DataCard`, and `Badge`.
- Migrated Integrations into the same primitives for API keys, webhooks, outbox events, event tables, mappings, and connector registry.

Evaluation:

- Accounting and Integrations now exercise dense forms, timelines, status badges, metrics, cards, and tabular data on the shared component layer.
- The density model is intentionally token-level, so future pages inherit compact mode without page-specific branches.
- The next UI migration should target Inventory, Manufacturing, Procurement, and Reports because those screens contain the next highest concentration of operational records.

Validation:

- `pnpm --filter @erp/web typecheck`
- `pnpm --filter @erp/web lint`
- `pnpm --filter @erp/web build`

## Iteration DS-6 - Browser Smoke Automation

Status: implemented.

Implemented:

- Added Playwright to the web app.
- Added `pnpm --filter @erp/web smoke:ui`.
- Added desktop smoke coverage for `/`, `/design-system`, `/accounting`, `/inventory`, `/manufacturing`, `/integrations`, and `/settings`.
- Added mobile responsive smoke coverage for `/`, `/design-system`, `/accounting`, and `/integrations`.
- Smoke tests assert route content, shell rendering, styled navigation, main content sizing, and no document-level horizontal overflow.

Evaluation:

- The suite is intentionally fast and route-focused so it can run as a standard validation gate after UI changes.
- Screenshot capture was unstable in this local browser environment, so the implemented checks validate rendered DOM layout instead of persisting screenshots.
- Formal visual regression should be added later when CI/browser image capture is stable.

Validation:

- `pnpm --filter @erp/web smoke:ui`

## Iteration DS-7 - Warehouse And Shop-Floor Migration

Status: implemented.

Implemented:

- Migrated Inventory from compatibility panels to `RecordPanel`, `MetricTile`, `DataCard`, `DataTable`, `Timeline`, `TimelineRow`, and `Badge`.
- Added a tabular stock ledger view using the shared `DataTable` primitive.
- Migrated Inventory location, stock reservation, transfer, cycle count, pick/pack/ship, receiving, reservation, cycle count, pick-task, and barcode activity surfaces.
- Migrated Manufacturing from compatibility panels to `RecordPanel`, `MetricTile`, `DataCard`, `Timeline`, `TimelineRow`, and `Badge`.
- Migrated Manufacturing BOM/routing, MRP suggestion, work order, job card, capacity, downtime, and production plan surfaces.

Evaluation:

- Accounting, Integrations, Inventory, and Manufacturing now exercise the design system directly across finance, events, warehouse execution, and shop-floor execution.
- These four modules cover the densest ERP interaction patterns in the current app: operational forms, stateful activity streams, record tables, status badges, and action rows.
- Remaining compatibility pages can be migrated opportunistically, but the design system is now proven against the critical operational workloads.

Validation:

- `pnpm --filter @erp/web typecheck`
- `pnpm --filter @erp/web lint`
- `pnpm --filter @erp/web build`
- `pnpm --filter @erp/web smoke:ui`

## Iteration DS-8 - Command Navigation

Status: implemented.

Implemented:

- Added a shell-level command palette opened from the topbar, `/`, or Cmd/Ctrl+K.
- Added module and governance route filtering with keyboard-first search.
- Added command palette styling on top of the existing Radix dialog primitive and design tokens.
- Extended browser smoke coverage to verify palette open, filtering, and navigation to Inventory.

Evaluation:

- Navigation is now closer to enterprise ERP operator expectations: dense module lists can be searched instead of only scanned.
- The command layer is route-based for now, which keeps it safe and deployable while leaving room for future record search and action execution.
- The next command iteration should add permission-aware action commands for workflows such as releasing work orders, retrying integrations, and posting inventory counts.

Validation:

- `pnpm --filter @erp/web typecheck`
- `pnpm --filter @erp/web lint`
- `pnpm --filter @erp/web build`
- `pnpm --filter @erp/web smoke:ui`

## Completion Evaluation

Status: roadmap completed for the requested design-system implementation pass.

Completed criteria:

- Token-first enterprise design system exists.
- Radix primitives are installed and exposed through local components.
- Shell, dashboard, Accounting, Integrations, Inventory, and Manufacturing use the new system directly.
- Remaining module pages are covered by compatibility wrappers until their feature work is touched.
- Internal catalog route exists at `/design-system`.
- Data-table and density primitives exist.
- Command palette navigation exists.
- Focus, status, responsive, and reduced-motion foundations are in place.
- Focused web typecheck, lint, build, and browser smoke passed.

Recommended next evaluation:

1. Extend `DataTable` with sorting, filtering, bulk selection, and saved views.
2. Add permission-aware action commands for common ERP workflows.
3. Migrate Procurement, Sales, Quality, HR, and Reports when those workflows are expanded.
4. Add formal visual regression in CI once screenshot capture is stable.
5. Add Storybook or an equivalent package catalog if the design system becomes shared across apps.
