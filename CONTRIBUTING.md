# Contributing (Frontend)

## Branching
- `main` is protected (production-ready)
- **`dev` is the shared integration branch** — open feature PRs into `dev` unless releasing
- Feature branches: `feat/<short-name>`
- Fix branches: `fix/<short-name>`

## Local development
1. Copy env if needed (see `.env.example` / `VITE_API_BASE_URL`)
2. Install deps: `npm install`
3. Start Vite: `npm run dev` (default http://localhost:5173)
4. Ensure the API has applied the latest Prisma migrations (billing / ERP)

## Quality bar before PR
- `npm run build` passes
- Loading/empty/error/success states covered
- Accessibility checks done for new interactions
- Docs updated when shared patterns change
- Keep `shared/` contracts aligned with `vayura-backend/shared`
