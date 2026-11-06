# Contributing (Frontend)

## Branching
- `main` is protected (production-ready)
- **`dev` is the shared integration branch** — open feature PRs into `dev` unless releasing
- Feature branches: `feat/<short-name>`
- Fix branches: `fix/<short-name>`

## Local development
Follow the step-by-step setup in **`README.md`** (`VITE_API_BASE_URL`, `npm run dev`). Ensure the API has applied the latest Prisma migrations.

## Quality bar before PR
- `npm run build` passes
- Loading/empty/error/success states covered
- Accessibility checks done for new interactions
- Docs updated when shared patterns change
- Keep `shared/` contracts aligned with `vayura-backend/shared`
