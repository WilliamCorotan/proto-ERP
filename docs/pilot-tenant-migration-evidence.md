# Pilot tenant migration evidence

The PostgreSQL integration lane provides repeatable CI evidence for the pilot
tenant-foreign-key rollout. It is evidence about the checked-in migrations on
an isolated PostgreSQL 18 instance; it is not evidence from a production
replica.

## Automated evidence

- `prisma-drift.integration.test.ts` deploys every migration and compares the
  live catalog with `schema.prisma` using `prisma migrate diff`. CI rejects any
  difference outside the exact reviewed allowlist.
- The allowlist contains only scalar foreign keys intentionally retained for
  the rollback window and four Prisma-requested index renames caused by
  PostgreSQL's 63-byte identifier truncation. This means current drift is
  controlled, not literally empty. Remove the scalar constraints and resolve
  the mapped index names before marking the roadmap's empty-drift criterion
  complete.
- `pilot-lock-evidence.integration.test.ts` loads 10,000 same-tenant customers
  and quotes, holds a conflicting writer lock, and executes the checked-in
  quote/customer expand migration. It proves the five-second `lock_timeout`
  aborts without a partial constraint, then proves the same migration succeeds
  after the writer releases its lock while preserving all rows.

Run the complete evidence lane with:

```bash
TEST_DATABASE_URL=postgresql://... pnpm test:integration
```

`TEST_DATABASE_URL` must identify a disposable administrative database whose
user can create isolated test databases.

## Evidence still required outside CI

Before production rollout, rehearse against a recent masked replica or a
production-sized clone using actual row counts, index sizes, write concurrency,
replication topology, and maintenance settings. Record:

- wall-clock duration for every preflight, concurrent index, expand, and
  validation migration;
- lock waits and blocked sessions from `pg_locks` and `pg_stat_activity`;
- primary CPU, I/O, WAL generation, replica lag, and recovery after cancellation;
- the approved maintenance window, alert thresholds, abort owner, and retry
  procedure.

Local CI cannot establish production lock duration, replication impact, or a
safe deployment window, so issue #4 remains in progress until that rehearsal
and the literal empty-drift criterion are complete.
