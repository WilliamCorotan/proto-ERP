# ERP Architecture

This project is a modular ERP platform built as a modular monolith first. The core owns platform rules. Business modules depend on the core contracts. Delivery mechanisms, databases, workers, and web frameworks stay at the edge.

## Dependency Rules

- `packages/core` has no dependency on business modules, web, API, worker, or database adapters.
- Business modules may depend on `packages/core`.
- Apps compose modules at runtime and expose them through HTTP, jobs, and UI.
- Domain objects cross boundaries as plain DTOs, not framework or ORM objects.

## Extension Points

- Module manifests register navigation, permissions, settings, entities, workflows, events, jobs, and seed data.
- Domain events describe lifecycle changes that automation and integrations can consume.
- Custom fields and workflows are metadata-driven so tenants can adapt forms and approval paths without forks.
- Public integrations use REST/OpenAPI first, with webhooks for outbound events.
- Application use cases sit behind narrow ports so business orchestration can move out of Nest controllers and repository adapters incrementally.
- `pnpm smoke:api` runs deployed-environment workflow checks against `ERP_API_URL` for release validation.
- `pnpm smoke:worker` runs a one-shot automation worker pass, currently used to verify outbox dispatch without starting a long-running queue worker.

## First Modules

- Core: tenants, users, roles, permissions, settings, audit events, module registry.
- Sales: customers, products, quotes, sales orders, invoices, and stock movements.
