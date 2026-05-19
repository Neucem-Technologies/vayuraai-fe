# Scaling notes (frontend)

The full **upgrade calling plan** (phases, triggers, Postgres, workers, serverless) lives in the **vayura-backend** repository: `docs/scaling-call-plan.md`. Treat that file as the source of truth for platform scaling when both repos are open in one workspace, or open the backend repo and read the same path there.

The backend now **requires PostgreSQL** (`DATABASE_URL`) for auth; run its `docker compose` + `npm run db:deploy` before exercising login/register from the UI.

## Frontend-specific habits (always)

- **Code-split** heavy routes (admin, reports, large charts) with `React.lazy` / dynamic `import()` when bundles grow.
- **Avoid huge client-side copies** of server datasets; use pagination and server-driven filters.
- **Handle slow APIs**: loading, timeout messaging, and retries only where idempotent (GET), not for POST without idempotency keys.
- **Do not store secrets** in the client; tokens only in memory + `httpOnly` cookies when we switch from `localStorage` (documented future ADR).

When backend introduces job-based ingestion, the UI should **poll or subscribe** to job status rather than assuming a single long request completes in the browser.
