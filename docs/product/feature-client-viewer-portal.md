# Feature: Client Viewer Portal — Read-Only Client Access

**Status:** Planned (not implemented)  
**Related:** [Product requirements](./requirements.md) · [Frontend development plan](../development-plan.md) · [Backend development plan](../../../vayura-backend/docs/development-plan.md)

---

## 1. Context

Vayura is a **multi-tenant** carbon accounting platform. The primary user is a **consultant** who manages **multiple client organisations**. Each client organisation is a company that may need to submit **BRSR**, **GRI**, or similar disclosures.

Today the product skews toward consultant-only access. This feature adds a **`client_viewer`** role: a **read-only** login for the **end-client company** so they can view their emissions summaries and download **their** reports without asking the consultant for every query.

**Implementation stack note:** This repository uses **Node + Express + TypeScript**, **Prisma + PostgreSQL**, and a **Vite + React** frontend. Pseudocode in the original prompt referenced Python middleware and generic `users` / `organizations` SQL—translate those ideas into **Express route middleware**, **Prisma models**, and **Zod-validated** request bodies. **Row Level Security (RLS)** is optional but recommended once `org_id` is threaded per request; until then, **every query must filter by `org_id` from the authenticated session** (never trust client-supplied `org_id` for `client_viewer`).

---

## 2. Role model

Add a **`role`** dimension to the user model (alongside or replacing the current `userType` split where it overlaps):

| Role | Access |
|------|--------|
| **`consultant_admin`** | Full access within their **consulting tenant**; billing; all orgs under that tenant; can invite/revoke `client_viewer`. |
| **`consultant_member`** | Full access only to **orgs they are assigned to** within the tenant. |
| **`client_viewer`** | **Read-only**; scoped to **exactly one `org_id`**; no tenant-wide admin. |

### 2.1 Rules for `client_viewer`

- Belongs to **exactly one** `org_id` (client organisation).
- **Created and managed only** by `consultant_admin` — **no self-registration** for client viewers.
- **Cannot** create, update, or delete domain data (emissions, activities, files, reports metadata, etc.).
- **Cannot** see any other organisation’s data.
- **Cannot** access consultant-only areas: tenant billing, firm settings, factor libraries / sourcing logic, internal review queues, uploads.
- **Consultant branding privacy:** whether the client sees the consultant firm name is controlled by a **consultant-level or org-level toggle** (e.g. `show_consultant_branding` on the org or tenant).

---

## 3. Database changes (target shape — align with Prisma migrations)

> **Prerequisite:** Introduce models for **Consulting tenant** (account), **Organisation** (client org), and **membership** (user ↔ org, role) as needed. Today’s schema may only have `User` + `Session`; extend before shipping this feature.

1. **`User.role`** (or equivalent enum column)  
   - Values: `'consultant_admin' | 'consultant_member' | 'client_viewer'`  
   - Default for new consultant users: `consultant_member` (or `consultant_admin` for first user on tenant—product decision).  
   - **Migration note:** map existing `userType` / legacy rows explicitly before enforcing NOT NULL.

2. **`Organisation.client_viewer_enabled`** (boolean, default `false`)  
   - When `false`, **no** `client_viewer` invites may be issued for that org.  
   - Toggled by `consultant_admin` in org settings.

3. **`Organisation.show_consultant_branding`** (boolean, default per product)  
   - Controls whether client viewer UI shows consultant identity.

4. **RLS (PostgreSQL) — when adopted**  
   - Set session variables (e.g. `app.org_id`, `app.role`, `app.tenant_id`) per request after JWT validation.  
   - **`client_viewer`:** `SELECT` only where `org_id = current_setting('app.org_id')`; **block all writes** at DB layer for that role on sensitive tables (`emissions`, `activities`, `raw_data`, `files`, `reports`, etc.).  
   - **`consultant_*`:** policies allow reads/writes per tenant + org assignment rules.  
   - **Tests:** prove a `client_viewer` cannot read another org even with crafted IDs.

Until RLS exists, enforce the same rules in **service layer + integration tests**.

---

## 4. API design (Express)

### 4.1 Global guard (conceptual — implement as TypeScript middleware)

- **`WRITE_METHODS`:** `POST`, `PUT`, `PATCH`, `DELETE`.  
- If `user.role === 'client_viewer'` and method is in `WRITE_METHODS` → **403** with a stable error code (e.g. `READ_ONLY_ROLE`).  
- Deny path prefixes for client viewers, e.g. `/api/v1/admin/`, `/api/v1/billing/`, `/api/v1/consultant/` (exact list to match your router layout).  
- **Never** accept `org_id` from body/query for `client_viewer`; resolve org from **JWT/session claims** only.

### 4.2 New / updated routes (version under `/api/v1/…`)

| Method | Route | Who | Behaviour |
|--------|--------|-----|------------|
| `POST` | `/api/v1/consultant/orgs/:orgId/invite-client` | `consultant_admin` | Body: `{ email, name }`. Creates pending `client_viewer` for that org; sends invite email (e.g. SES). Org must have `client_viewer_enabled` and plan must allow portal (`can_enable_client_portal`). |
| `DELETE` | `/api/v1/consultant/orgs/:orgId/client-access/:userId` | `consultant_admin` | Revokes or suspends client viewer access. |
| `GET` | `/api/v1/client/dashboard` | `client_viewer` | Emissions summary for **JWT org only**; optional `period` query only from an allowlist (FY / quarter). |
| `GET` | `/api/v1/client/reports` | `client_viewer` | Read-only list of reports for that org. |
| `GET` | `/api/v1/client/reports/:reportId/download` | `client_viewer` | Returns **short-lived signed URL** (S3 or compatible) for PDF; TTL ≤ **1 hour**. |

Invite completion: `POST` with one-time token → set password → issue normal session with `role=client_viewer` and embedded `org_id` (and `tenant_id` if used).

---

## 5. Client viewer UI (separate shell)

Build a **stripped-down layout** for sessions where `role === 'client_viewer'` (distinct route group, e.g. `/client/...`).

**Include**

- **Dashboard:** Scope 1 / 2 / 3 totals (kg CO₂e), optional intensity metrics (per revenue, per employee if data exists), **period selector** (FY / quarter).
- **Reports:** table of generated reports (name, period, generated date, status); **Download** uses signed URL flow.

**Exclude**

- Upload, review queue, categorisation detail, confidence scores, factor sources.
- Billing, firm settings, other clients’ data.
- Consultant name **unless** `show_consultant_branding` is true for that org.

---

## 6. Invite flow (product)

1. `consultant_admin` opens **org settings** for a client org.  
2. Toggles **“Enable client portal”** → sets `client_viewer_enabled = true`.  
3. Clicks **“Invite client”** → enters email + name.  
4. System creates user (or invite record) with `role = client_viewer`, bound to that `org_id`.  
5. Email (e.g. SES): subject **“Your ESG report is ready — [Org Name]”**; body contains **one-time link** (token **expires in 48h**, **single-use**).  
6. Client sets password → lands on **client dashboard**.  
7. `consultant_admin` can **revoke** access from org settings (soft-disable or delete invite tokens per policy).

---

## 7. Pricing gate

```text
can_enable_client_portal(consultant_tenant):
  return consultant_tenant.plan in ("growth", "professional", "enterprise")
```

- **Starter** (or equivalent): client portal **disabled** in UI; show **upgrade** CTA if admin tries to enable.  
- If tenant **downgrades** from Growth → Starter: **suspend** existing `client_viewer` sessions (do not silently delete users without policy); block new invites until upgraded again.

---

## 8. Security checklist (ship gate)

- [ ] `org_id` (and `tenant_id` if applicable) **only** from signed JWT / server session for `client_viewer` — **never** from body/query for authz.  
- [ ] RLS or equivalent integration tests: **no cross-org reads**.  
- [ ] Signed report URLs **TTL ≤ 1 hour**.  
- [ ] Invite tokens: **48h expiry**, **single-use**, invalidated on password set.  
- [ ] All write routes return **403** for `client_viewer` (automated test sweep).  
- [ ] Rate limit **`/api/v1/client/*`** (e.g. **100 req/min per user** — tune per deployment).  
- [ ] **Audit log** on report view and report download (actor, org, report id, timestamp).

---

## 9. Dependencies & development sequencing

Ship this **after** the following exist (or in parallel only where stubs are clearly bounded):

| Prerequisite | Why |
|--------------|-----|
| **Organisation + tenant model** in DB and API | `org_id` scoping and invites attach to a real org. |
| **Role field + auth middleware** on API | Guards and UI routing depend on it. |
| **Reports pipeline** (generate + store PDFs + metadata) | Client “Reports” page has real artifacts; signed download depends on object storage. |
| **Email provider** (e.g. SES) + secret management | Invite flow. |
| **Plan / subscription flag** on tenant | Pricing gate and downgrade behaviour. |
| **Ingestion + emissions persistence** (minimum read model) | Dashboard KPIs are credible. |

**Suggested order alongside other roadmap items**

1. **Foundation:** org + membership + roles (`consultant_admin` / `consultant_member`) on API and FE shell.  
2. **Ingestion + processing + reporting** (consultant path) — establishes data and report entities.  
3. **Client Viewer Portal** (this doc) — invite, client layout, read APIs, downloads.  
4. **Hardening:** RLS, audit, rate limits, branding toggle QA.

Document **cross-links** in release notes / ADR when the role enum and org flags land.

---

## 10. Traceability

When implementing, split work into trackable PRs, for example:

- Prisma: `Organisation`, memberships, `User.role`, flags `client_viewer_enabled`, `show_consultant_branding`.  
- Auth: JWT claims, middleware, invite token table.  
- API: consultant invite/revoke + client read-only routes.  
- FE: `/client` layout, dashboard + reports pages; org settings for consultants.  
- Infra: S3 presign, SES templates, rate limit middleware.  
- Tests: authz matrix for all roles × routes.

---

*Last updated: aligned to Vayura monorepo docs; original prompt preserved in intent, adapted to Express/Prisma/React.*
