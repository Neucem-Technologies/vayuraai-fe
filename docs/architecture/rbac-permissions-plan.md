# Role-Based Permission Module — Architecture & Plan (for discussion)

**Owner (assigned):** Shreya N  
**Status:** Draft for team discussion — **do not implement until aligned**  
**Baseline today:** [roles-and-permissions.md](../product/roles-and-permissions.md)  
**Related:** access-context · middlewares · SoD · client portal · verifiers

---

## 1. Goal

Evolve today’s **hard-coded role checks** into a clear, maintainable **RBAC module** that:

- Matches how consulting + SME + assurance workflows actually work  
- Is easy for product/QA to reason about  
- Supports **compliance expectations** (least privilege, SoD, auditability)  
- Does **not** break current firm / SME / viewer / verifier behaviour  

This is a **permissions platform module**, not a redesign of the whole product.

---

## 2. Why (industry + compliance)

Carbon / disclosure platforms are expected to show:

| Expectation | Industry practice | Vayura implication |
| --- | --- | --- |
| Least privilege | RBAC (NIST / ISO 27001 access control) | Permissions granted by role + scope, not “everyone is admin” |
| Segregation of duties | SOX-style maker–checker | Uploader ≠ approver (firms); document exemptions (SME) |
| Accountability | Audit who changed access | Log role changes, invites, revokes |
| Tenant isolation | Multi-tenant SaaS norm | Org scope + RLS stay mandatory |
| Read-only external parties | Assurance / client portals | `client_viewer`, verifier inbox stay constrained |
| Change control | Period lock | Closed period blocks approvals |

We are **not** claiming SOC 2 / ISO certification in this doc — we are aligning **design** so those paths stay possible.

---

## 3. What we already have

| Layer | Today |
| --- | --- |
| Account type | `User.userType`: `consultant` \| `sme` \| `verifier` |
| Access kind | `consultant` \| `client_viewer` \| `verifier` |
| Tenant roles | `consultant_admin` \| `consultant_member` |
| Org roles | `client_viewer` (+ unused `client_contributor`) |
| Flags | `readOnly`, `canManageTenant`, `canManageClientPortal`, `canAssignConsultants` |
| Guards | `requireConsultant*`, `blockSmeSolo`, `blockClientViewerWrites`, `requirePaidSubscription` |
| SoD | Enforce on firm approve; exempt `smeSolo` |
| Docs | Capability matrix in `roles-and-permissions.md` |

**Pain for a “permission module”:** logic is spread across middlewares + services; adding a new capability means hunting many files; no single permission catalogue; UI cannot show a clean “what can this user do?” admin view.

---

## 4. Target model (simple RBAC)

Keep **three layers**, add an explicit **permission catalogue**:

```text
User
  └─ Membership (tenant and/or org and/or verifier org)
        └─ Role (admin / member / viewer / …)
              └─ Permissions[]  (stable string codes)
                    └─ enforced with org/tenant scope
```

### 4.1 Proposed permission codes (v1 catalogue)

Stable `UPPER_SNAKE` codes (API + FE share via `@vayura/api-contracts`):

| Code | Meaning |
| --- | --- |
| `tenant.manage` | Firm/SME settings, listing, branding |
| `team.manage` | Invite / remove / change roles |
| `org.assign` | Assign members to client orgs (firm) |
| `billing.manage` | Checkout / plan changes |
| `org.create` | Create client organisations |
| `facility.manage` | Facilities CRUD |
| `upload.write` | Upload evidence |
| `review.write` | Edit extraction / reject |
| `review.approve` | Approve into ledger (SoD may still apply) |
| `emissions.read` | View activity / emissions |
| `report.write` | Create / generate reports |
| `report.download` | Download PDFs |
| `period.manage` | Open / close periods |
| `period.reopen` | Reopen closed period |
| `audit.read` | View audit log |
| `assurance.export` | Download assurance ZIP |
| `portal.manage` | Enable portal + invite client viewers |
| `verifier.manage` | Invite / manage verifiers |
| `verifier.message` | Desk / inbox messaging |
| `integration.manage` | Future ERP connectors |
| `factor.manage` | Factor library overrides (firm) |
| `policy.manage` | Policies (firm-only) |

### 4.2 Role → permission defaults

| Role | Default permissions (summary) |
| --- | --- |
| `consultant_admin` | All tenant/org ops for allowed orgs; portal/verifier/team |
| `consultant_member` (firm or SME) | **Subset assigned by admin** from an allow-list (see 4.4); never self-grant admin-only codes |
| `client_viewer` | External / portal role; access level from invite option (below) |
| `client_contributor` | External / portal contributor; same access-level options in v1 (limited write later) |
| `verifier` | `verifier.message` only (desk/inbox) |
| SME solo admin | Same as firm admin for **own org**, including inviting external people with access options; still **deny** multi-client firm features (`policy.manage`, public directory listing, `/clients` portfolio) |

### 4.3 Shared access levels (Read / Read + download)

Used whenever someone is invited as an **external portal user** — by a **consulting firm** (for a client org) **or by an SME** (for their own company).

| Option | Codes | Can do |
| --- | --- | --- |
| **Read only** | `emissions.read` | Dashboard / summaries |
| **Read + download** | `emissions.read`, `report.download` | Above + report PDFs |

**Who can invite**

| Inviter | Who they can add | Access level picker |
| --- | --- | --- |
| Firm admin | Client viewer / client contributor on a client org | Read only · Read + download |
| SME admin | Contributors (and other external helpers on their org) — same option set | Read only · Read + download |
| Firm or SME admin | Verifiers | Messaging desk (separate from portal read options) |

Notes:
- Default invite option: **Read + download** (unless product picks Read only).  
- Portal / contributor users never upload, review, or approve in v1.  
- Permission to manage these invites: `portal.manage` (grant to **firm admin and SME admin**; remove from the old SME deny-list).  
- Still firm-only: multi-client portfolio, policies library, public consultant directory listing.  
- Store chosen option on membership/invite; resolve into `permissions[]` on `/auth/me`.

**Scope always applies:** permission without org/tenant scope is invalid for data APIs.

### 4.4 Member access is assigned by admin (permissions + scope)

Operators are not only “admin vs one fixed member pack.”

**For consulting firms (same model, stronger scoping):**

1. **Permissions** — admin grants each member a subset from the safe allow-list (upload, review, approve, reports, …).  
2. **Clients** — admin assigns **which client orgs** that member can access. Member sees **only those clients’ data** (`allowedOrgIds` / existing org assignment).  
3. Both are required for data APIs: *permission code* **and** *org in assigned set*.

**For SME:**

1. Same permission grants from admin.  
2. Scope is the single company org (no multi-client portfolio).

Rules:
- Member only gets what admin assigned; cannot self-elevate.  
- Hard ceiling (never for members): `tenant.manage`, `team.manage`, `portal.manage`, `period.reopen`, tenant billing/settings.  
- Unassigned firm client → no read/write (security boundary).  
- Phase A: keep today’s defaults + wire catalogue; persist per-member permission overrides; client assignment already exists — expose clearly in admin UI with permission picker.

---

## 5. Proposed architecture

```text
┌────────────────────────────┐
│  Permission catalogue      │  shared contracts (codes + labels)
└─────────────┬──────────────┘
              ▼
┌────────────────────────────┐
│  Role policy map           │  role → Set<PermissionCode>
│  (+ smeSolo deny list)     │
└─────────────┬──────────────┘
              ▼
┌────────────────────────────┐
│  resolveAccessContext()    │  existing resolver, enriched with permissions[]
└─────────────┬──────────────┘
              ▼
┌────────────────────────────┐
│  requirePermission(code)   │  single middleware for routes
│  assertPermission(...)     │  services / SoD still layered
└────────────────────────────┘
```

**Frontend:** gate nav/buttons with `can('upload.write')` helper using `/auth/me` permissions list (not duplicated if/else sprawl).

**Backward compatible:** keep existing boolean flags as **derived** from the catalogue for one release, then deprecate.

---

## 6. Phased delivery

### Phase A — Catalogue + central checks (no behaviour change)

1. Publish permission codes in `shared/`  
2. Map current roles → codes (must match today’s matrix 1:1)  
3. Add `requirePermission` / `can()`  
4. Migrate routes **one domain at a time** (uploads → review → reports → controls)  
5. Regression: QA matrix in roles doc  

### Phase B — Admin visibility

- Settings → Team: show role + human-readable capabilities  
- Optional: “Permission diff” when changing admin ↔ member  

### Phase C — Controlled extensibility

- `client_contributor` beyond read options (limited write, if product asks)  
- Optional custom role **templates** per tenant (only if pilots demand; avoid early)  
- ERP `integration.manage` when Ashish’s connector ships  

### Not in v1 (Phase A)

- Free-form arbitrary permission pickers beyond the **Read** / **Read + download** portal options  
- Full ABAC engine beyond org assignment + smeSolo + portal access option  
- SSO group → role mapping (Phase 3 / enterprise)  

---

## 7. Compliance rules to keep explicit

| Rule | Enforcement |
| --- | --- |
| Maker–checker | Service-level SoD on approve; not removable via UI in v1 |
| SME SoD exemption | Documented policy; flag `smeSolo` |
| Period lock | Independent of RBAC; closed period blocks approve |
| Viewer writes | No write codes on `client_viewer` |
| Firm-only APIs | Deny list for `smeSolo` even if role is admin |
| Audit | Role change, invite, revoke, permission denials (optional sampled) |

---

## 8. Open questions (need team decision)

1. Stay with **fixed roles only**, or allow tenant-defined custom roles later?  
2. Portal invite default: **Read + download** or **Read only**? (proposal: Read + download)  
3. SME invite labels in UI: “Contributor” only, or also “Advisor / consultant (read access)”?  
4. Should members get `billing.manage` or admin-only?  
5. Who owns the matrix doc after this lands — product or eng?  

---

## 9. Success criteria

- [ ] One catalogue documents every gated action  
- [ ] New feature adds a **code + role map row**, not new ad-hoc middleware where avoidable  
- [ ] Behaviour matches current [roles-and-permissions.md](../product/roles-and-permissions.md) after Phase A  
- [ ] QA can test from the matrix without reading source  
- [ ] Ready to attach ERP / onboarding permissions without redesign  

---

## 10. Next steps after discussion

1. Freeze v1 permission catalogue with Summayya (product) + Ashish (ERP codes)  
2. Implement Phase A behind parity tests  
3. Update roles matrix doc to reference codes  
4. Only then: Phase B admin UI  

---

*Draft for group review · Nov 2026 · discuss → then implement*
