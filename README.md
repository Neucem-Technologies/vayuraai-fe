# Vayura Frontend

React SPA for Vayura AI (consultant firms, SME solo workspaces, client viewers, verifiers).

## Stack

- React + TypeScript + Vite
- Tailwind + shadcn/ui
- Wouter routing
- TanStack Query
- Shared DTOs via `@vayura/api-contracts` (`shared/`)

## Setup (local)

The API side (Postgres, Redis, MinIO, API process, **and workers**) is documented in detail here:

→ **`vayura-backend/README.md`** (start there first)

### Frontend only (after the API stack is up)

1. **Prerequisites:** Node.js ≥ 20, API at `http://localhost:4000`, Git on branch `dev`

2. **Install**

```bash
git checkout dev
git pull
npm install
```

3. **Env**

```bash
cp .env.example .env.local
```

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:4000
```

(No trailing slash. Cookies require API `CORS_ORIGIN` to include `http://localhost:5173`.)

4. **Run**

```bash
npm run dev
```

Open **http://localhost:5173**.

5. **First login**

1. Sign up (SME or consultant)  
2. Finish organisation onboarding  
3. On **/billing**, use **dev activate** (needs backend `BILLING_DEV_BYPASS=true`)  
4. Add an operations facility → upload → approve → report  

If the API returns **402**, the app redirects to `/billing`.

### Reminder: workers

Uploads and report PDFs need backend workers running:

```bash
# in vayura-backend
npm run worker:ingestion
npm run worker:report
```

Without them, files stay “Processing” and reports stay “generating”.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | Lint (when configured) |

## Branching

- **`dev`** — shared integration (open feature PRs here)
- **`main`** — protected

See `CONTRIBUTING.md`.

## Docs

- `docs/product/requirements.md` — **product details + flows** (start here)
- `docs/product/roles-and-permissions.md` — **roles, users, permissions matrix**
- `docs/architecture/rbac-permissions-plan.md` — RBAC module plan (discussion)
- `docs/architecture/erp-integration-plan.md` — ERP integration plan (discussion)
- `docs/development-plan.md` — module status / next work
- `docs/product/feature-client-viewer-portal.md` — client portal reference
- `docs/frontend-architecture.md`
- `docs/frontend-development-process.md`

Keep `shared/` contracts in sync with `vayura-backend/shared` when API shapes change.
