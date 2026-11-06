# Frontend development plan

Tracks UI work against the product sequence. Product behaviour: [product/requirements.md](./product/requirements.md).

Shared integration branch: **`dev`**.

---

## Module status

| # | Module | Status | Notes |
| --- | --- | --- | --- |
| 1 | Shell + routing (Vite, Tailwind, shadcn/ui, wouter) | **Done** | Role-aware layouts in `App.tsx` |
| 2 | Auth + onboarding | **Done** | Signup (consultant/SME), login, invites, password reset |
| 3 | Persistence alignment | **Done** | Talks to Postgres API; contracts in `shared/` |
| 4 | Dashboard + navigation | **Done** | Firm `/clients` vs SME `/dashboard`; FY / org switcher |
| 5 | Ingestion UI | **Done** | Uploads, facility site, live status (WS) |
| 6 | Processing + emissions + reports | **Done** | Review, approve/reject, emissions, report create/download |
| 7 | Billing UI | **Done** | Catalog, Razorpay checkout, local Dev activate, 402 → `/billing` |
| 8 | Facilities & boundaries | **Done** | Operations vs generation; report boundary column/filters |
| 9 | Controls / periods / audit / assurance | **Done** | Settings → Controls |
| 10 | Client Viewer Portal | **Done** | `/client/*` shell; firm invite UX |
| 11 | Verifiers + Find consultants | **Done** | Desk + inbox + directory |
| 12 | Offsets, factors, policies | **Done** | Firm-gated where applicable |

---

## Next (near-term)

1. Harden empty/error states on download + assurance pack across browsers  
2. Clearer SME vs firm copy (role labels, nav) where still consultant-centric  
3. Client contributor journey — **out of scope** until product decides  
4. Phase 2 ML UX — only after backend inference ships  
5. Accessibility + release checklist polish before wider pilots

---

## Working rules

- Keep `shared/` (`@vayura/api-contracts`) aligned with backend  
- Prefer shared helpers (`lib/facilities`, FY helpers, boundary match) over one-off filters  
- Do not invent API shapes — extend contracts first  
- Local UI alone is not enough: API + **workers** must be running (see backend README)
