# Frontend development plan (modules)

Tracks work against the shared product sequence.

1. **Shell + routing** — Vite, approved reference UI (Tailwind + shadcn/ui + wouter) *(done)*  
2. **Auth + onboarding skeleton** — login, register, onboarding, API client, protected routes *(done)*  
3. **Persistence alignment** — backend uses Postgres + Prisma; ensure `.env.local` points at API; no FE schema duplication *(done)*  
4. **Dashboard + navigation** — role-aware shell when backend exposes roles (`consultant_admin` / `consultant_member` split when added) *(next)*  
5. **Ingestion UI** — uploads, PDF/Excel/image, job status *(planned)*  
6. **Processing + reporting UI** *(planned)*  
7. **Client Viewer Portal** — read-only `/client` shell (dashboard + reports + downloads); invite UX from org settings — **after** items 4–6 and backend org/roles/reports; full spec: [product/feature-client-viewer-portal.md](./product/feature-client-viewer-portal.md)
