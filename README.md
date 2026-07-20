# Open ERP Ecosystem

A TypeScript-first modular ERP platform designed to be deployable on common platforms and extensible through modules, metadata, workflows, and events.

## Planning

The authoritative implementation plan is the [ERPNext/SYSPRO Replacement Program](docs/roadmap.md). It records current completion evidence, dependency gates, the Now/Next/Later queue, business decisions, and cutover risks. Other roadmap and competitive-analysis documents are historical inputs.

## Quick Start

```bash
corepack enable
corepack prepare pnpm@11.9.0 --activate
pnpm install
cp .env.example .env
docker compose up -d postgres redis
pnpm dev
```

Default apps:

- Web: `http://localhost:3000`
- API: `http://localhost:4000`

PostgreSQL is required for API business data. The API fails closed when durable storage is unavailable; the web can use demo fallback data only when `ERP_ENABLE_DEMO_DATA=true` outside production.

## Full Container Run

```bash
cp .env.example .env
docker compose --profile app up --build
```

Use Node 24 LTS or Node 22 LTS for local development. Prisma 7 currently warns on Node 25.

Redis is exposed on host port `6380` to avoid colliding with other local projects. Containers still use `redis://redis:6379`.

## Database Setup

```bash
docker compose up -d postgres
pnpm --filter @erp/db prisma migrate dev --config prisma.config.ts
pnpm --filter @erp/db prisma db seed --config prisma.config.ts
```

## Useful Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
ERP_API_URL=http://localhost:4000 pnpm smoke:api
pnpm smoke:worker
pnpm audit:all
pnpm db:generate
pnpm db:migrate
```
