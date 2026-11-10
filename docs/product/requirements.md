# Vayura AI — Product details (current)

**Audience:** consultants (firms), SME companies (solo workspaces), client viewers, verifiers.  
**Stack:** `vayura-frontend` (Vite/React) + `vayura-backend` (Express/Prisma/Postgres) + Redis/BullMQ workers + MinIO.  
**Integration branch:** `dev`  
**Local setup:** [`vayura-backend/README.md`](../../../vayura-backend/README.md) (API, DB, Redis, MinIO, workers) · [`README.md`](../../README.md) (SPA)

---

## Product goal

Platform carbon accounting for India-first disclosure workflows: ingest activity evidence → review → calculate Scope 1–3 → generate disclosure-ready reports, with billing, period controls, and limited external portals (client viewer, verifier messaging).

This is the **product platform**, not a marketing site (`carbonPilot` is separate).

---

## Who uses it

| Actor | How they arrive | Home surface | Can write product data? |
| --- | --- | --- | --- |
| **Consulting firm** (`userType: consultant`, `Tenant.smeSolo = false`) | Self-signup | `/clients` portfolio + org switcher | Yes (assigned orgs; admin = all) |
| **SME company** (`userType: sme`, `smeSolo = true`) | Self-signup | `/dashboard` (single org) | Yes |
| **Client viewer** (`access.kind: client_viewer`) | Invite from firm (Growth+ plan) | `/client/dashboard` | No (read-only) |
| **Verifier** (`userType: verifier`) | Invite from firm/SME | `/verifier` inbox | Messages only |

Tenant roles for operators: `consultant_admin` | `consultant_member` (SME UI may label these as company admin/member).  
`client_contributor` exists in schema only — **not** a live journey.

---

## What is in scope today (shipped)

- Auth, sessions (HttpOnly cookie), password reset, team / client / verifier invites  
- Organisation + facility setup (`operations` vs `generation` purpose)  
- Paid subscription gate (Razorpay INR; local `BILLING_DEV_BYPASS`) → **402** until active  
- Upload pipeline (PDF / Excel / CSV / image) → BullMQ workers → review → activity ledger → emissions  
- Reports: BRSR, GRI, GHG, CBAM (exploratory export) + async PDF + session-bound downloads  
- Offsets, emission factor library (firm), policies (firm)  
- ERP-style controls: reporting periods open/close/reopen, maker–checker SoD (exempt for SME solo), audit log, assurance ZIP  
- Client viewer portal (firm only; not SME solo)  
- Verifier desk + inbox messaging  
- Public “Find a consultant” directory (listed firms)

---

## Explicit non-goals (current phase)

- Custom ML models (Phase 2 roadmap) — optional LLM extraction behind `LLM_ENABLED`  
- Credit marketplace / CCTS trading / SSO / Tally–ERP sync (later roadmap)  
- Premature microservices split  
- Marketing CMS / waitlist product (`carbonPilot`) as part of this SPA

---

## Core user flows

### A. Operator happy path (firm or SME)

```text
Sign up (consultant | sme)
  → Organisation / firm onboarding
  → Industry (consultant) → Data sources (creates first org + facility)
  → Billing (Razorpay or local Dev activate)
  → Add operations facilities (generation optional, separate)
  → Upload evidence (site = operations facility)
  → Workers process → Review / approve (SoD: uploader ≠ approver unless SME solo)
  → Emissions view
  → Create report → Report worker → Download (session-bound token)
  → Optional: close period, export assurance pack
```

Post-login routing (`resolvePostLoginPath`): verifier → `/verifier`; client viewer → `/client/dashboard`; unpaid → `/billing`; incomplete onboarding → onboarding steps; else SME `/dashboard` or firm `/clients`.

### B. Billing gate

1. Catalog differs by audience (`company` vs `consultant`).  
2. Checkout creates Razorpay order; confirm verifies HMAC.  
3. Locally: `BILLING_DEV_BYPASS=true` → **Dev activate** on `/billing`.  
4. Unpaid statuses (`none`, `canceled`, `past_due`) block product APIs with **402** `PAYMENT_REQUIRED`; SPA redirects to `/billing`.  
5. Client viewers and verifiers skip operator billing.

### C. Site / facility boundaries

- **Operations** facilities: inventory sites for uploads and report boundary filters.  
- **Generation** facilities: tracked separately (residual/offset context), not the default upload/report site list.  
- Report boundaries: operational facility names + presets (`all`, `india`, organisation-wide).

### D. Client viewer (consulting firm only)

1. Plan allows portal (Growth+).  
2. Firm admin enables portal on the client org.  
3. Invite client → accept invite → `/client` shell.  
4. Dashboard + report list/download only.  
5. SME solo tenants **cannot** use firm consultant invite APIs (`blockSmeSolo`).

### E. Verifier

1. Admin invites verifier organisation.  
2. Operator opens desk threads per client org.  
3. Verifier replies in `/verifier` inbox (no uploads/reports inventory).

### F. Controls & assurance

| Control | Behaviour |
| --- | --- |
| Reporting period | Open / close / reopen (`reopen` = admin) |
| SoD | Uploader cannot approve own file unless `smeSolo` |
| Closed period | Blocks approve for activity dates in that period |
| Audit log | Actor + action trail in Controls |
| Assurance pack | ZIP: activities, audit, uploads, offsets, periods |

---

## Related specs

| Doc | Use |
| --- | --- |
| [roles-and-permissions.md](./roles-and-permissions.md) | **Roles, users, capability matrix** (firm / SME / viewer / verifier) |
| [../architecture/rbac-permissions-plan.md](../architecture/rbac-permissions-plan.md) | RBAC module plan (discuss → implement) |
| [../architecture/erp-integration-plan.md](../architecture/erp-integration-plan.md) | ERP integration plan (discuss → implement) |
| [feature-client-viewer-portal.md](./feature-client-viewer-portal.md) | Client portal behaviour (shipped; keep as reference) |
| [ui-ux-foundation.md](./ui-ux-foundation.md) | UI stack conventions |
| [../development-plan.md](../development-plan.md) | Frontend module status / next work |
| Backend [development-plan.md](../../../vayura-backend/docs/development-plan.md) | API module status / next work |
| Monorepo [product-roadmap.md](../../../docs/product-roadmap.md) | Multi-phase roadmap |

---

*Updated: Nov 2026 — reflects `dev` platform (billing, SME solo, ERP controls, portals).*
