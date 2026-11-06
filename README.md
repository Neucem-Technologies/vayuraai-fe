# Vayura Frontend

React SPA for Vayura AI (consultant firms, SME solo workspaces, client viewers, verifiers).

## Stack

- React + TypeScript + Vite
- Tailwind + shadcn/ui
- Wouter routing
- TanStack Query
- Shared DTOs via `@vayura/api-contracts` (`shared/`)

## Setup (local)

### 1. Prerequisites

- Node.js ≥ 20
- Running Vayura API on **http://localhost:4000** (see `vayura-backend` README)
- Git access (`dev` is the shared integration branch)

### 2. Clone and install

```bash
git checkout dev
git pull
npm install
```

### 3. Environment

```bash
cp .env.example .env.local
```

| Variable | Value |
| --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:4000` (no trailing slash) |

The SPA talks to the API with cookies (`credentials: 'include'`). Keep API `CORS_ORIGIN` and cookie settings aligned with `http://localhost:5173`.

### 4. Run the app

```bash
npm run dev
```

Open **http://localhost:5173**.

### 5. First login path

1. Sign up as **company (SME)** or **consultant**
2. Complete organisation onboarding
3. On **/billing**, activate a plan (backend `BILLING_DEV_BYPASS=true` enables a local bypass)
4. Finish data sources / facilities, then use Dashboard → Uploads → Reports

If the API returns **402 Payment Required**, the client redirects to `/billing`.

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

- `docs/frontend-architecture.md`
- `docs/frontend-development-process.md`
- `docs/product/` — product / UX notes

Keep `shared/` contracts in sync with `vayura-backend/shared` when API shapes change.
