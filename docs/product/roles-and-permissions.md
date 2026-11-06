# Roles, users & permissions

**Source of truth for who can do what** on the Vayura platform (`dev`).  
Code: `access-context.service.ts`, route middlewares (`requireConsultant*`, `blockSmeSolo`, `blockClientViewerWrites`, `requirePaidSubscription`), review SoD.

Related: [requirements.md](./requirements.md) (flows) · [feature-client-viewer-portal.md](./feature-client-viewer-portal.md)

---

## Mental model (three layers)

| Layer | What it is | Values |
| --- | --- | --- |
| **1. Signup / account type** (`User.userType`) | How the account was created | `consultant` · `sme` · `verifier` (invite-only) |
| **2. Access kind** (`access.kind`) | How the session is authorized | `consultant` · `client_viewer` · `verifier` |
| **3. Role inside that kind** | Fine-grained rights | Tenant: `consultant_admin` \| `consultant_member` · Org: `client_viewer` (and unused `client_contributor`) |

**Workspace shape**

| Tenant shape | Flag | Meaning |
| --- | --- | --- |
| Consulting firm | `smeSolo = false` | Many client orgs; portfolio; firm-only features |
| SME company | `smeSolo = true` (from signup `sme`) | One org; home `/dashboard`; no firm portal / policies / directory listing APIs |

Access resolution order (first match wins): **verifier membership → client_viewer org membership → consultant tenant membership**.

---

## Personas (what we discussed)

| Persona | Signup / join | Access kind | Tenant role | Home |
| --- | --- | --- | --- | --- |
| Firm admin | `consultant` | `consultant` | `consultant_admin` | `/clients` |
| Firm member | invite / `consultant` | `consultant` | `consultant_member` | Assigned clients |
| SME admin | `sme` | `consultant` | `consultant_admin` (UI may say “Company admin”) | `/dashboard` |
| SME teammate | team invite on solo tenant | `consultant` | `consultant_member` | Same single org |
| Client viewer | firm invite (not SME) | `client_viewer` | — | `/client/dashboard` |
| Verifier | verifier invite | `verifier` | — | `/verifier` |

---

## Permission flags (API profile)

Returned on `/auth/me` as `permissions`:

| Flag | True when |
| --- | --- |
| `readOnly` | `client_viewer` |
| `canManageTenant` | `consultant_admin` |
| `canManageClientPortal` | `consultant_admin` (firm; UI/API also need plan + org flag) |
| `canAssignConsultants` | `consultant_admin` |

---

## Capability matrix

Legend: **Y** = allowed · **N** = blocked · **Admin** = `consultant_admin` only · **Assigned** = member only on assigned orgs · **—** = not applicable

### A. Workspace & billing

| Capability | Firm admin | Firm member | SME admin | SME member | Client viewer | Verifier |
| --- | --- | --- | --- | --- | --- | --- |
| See multi-client portfolio `/clients` | Y | Y (assigned) | N | N | N | N |
| Pay / activate subscription | Y | Y* | Y | Y* | N (skipped) | N (skipped) |
| Product APIs when unpaid | N (402) | N (402) | N (402) | N (402) | Allowed read portal | Inbox only |
| Edit firm profile / listing / branding | Admin | N | Profile yes; **listing blocked** (`blockSmeSolo`) | N | N | N |
| Invite / remove team; change roles | Admin | N | Admin | N | N | N |
| Assign members to client orgs | Admin | N | — (single org) | N | N | N |

\*Members can open `/billing`; tenant-wide plan changes are admin-oriented in practice.

### B. Client organisations & facilities

| Capability | Firm admin | Firm member | SME | Client viewer | Verifier |
| --- | --- | --- | --- | --- | --- |
| Create / list client orgs | Y (all) | Assigned only | Max **1** org | N | N |
| Facilities CRUD (`operations` / `generation`) | Y | Assigned | Y | N | N |
| Use **operations** sites on upload/report boundary | Y | Y | Y | N | N |

### C. Ingestion, review, emissions, reports

| Capability | Firm admin | Firm member | SME | Client viewer | Verifier |
| --- | --- | --- | --- | --- | --- |
| Upload evidence | Y | Assigned | Y | N | N |
| Review / edit extractions lines | Y | Assigned | Y | N | N |
| Approve upload (→ activity ledger) | Y† | Y† | Y‡ | N | N |
| Reject upload | Y | Assigned | Y | N | N |
| View emissions / activity | Y | Assigned | Y | Dashboard summary only | N |
| Create reports / trigger PDF | Y | Assigned | Y | N | N |
| Download report PDF | Y | Assigned | Y | Own org reports | N |

†**Maker–checker (SoD):** uploader cannot approve their own file on firm tenants → `SOD_VIOLATION`.  
‡**SME solo:** SoD exempt (same person may upload and approve).  
**Closed reporting period:** approve blocked for activity dates in that period.

### D. Controls & assurance

| Capability | Firm / SME admin | Firm / SME member | Client viewer | Verifier |
| --- | --- | --- | --- | --- |
| Open / close reporting period | Y | Y (org-scoped) | N | N |
| **Reopen** period | Admin only | N | N | N |
| View audit log | Y | Y | N | N |
| Download assurance ZIP | Y | Y | N | N |

### E. Firm-only features (`blockSmeSolo`)

Blocked for SME solo tenants (even admins):

| Feature | Firm | SME solo |
| --- | --- | --- |
| Client viewer invite / portal management | Admin + Growth+ + org enabled | **Blocked** |
| Policies library | Y | **Blocked** |
| Public directory listing toggle | Admin | **Blocked** |
| Consultant “firm” portfolio APIs under `/api/v1/consultant/*` | Y | **Blocked** |

SME **can** still use verifiers desk (paid) and Find-a-consultant as a buyer.

### F. Portals & external actors

| Capability | Firm admin | Others (operators) | Client viewer | Verifier |
| --- | --- | --- | --- | --- |
| Enable client portal on org | Y (plan Growth+) | N | N | N |
| Invite / revoke client viewer | Y | N | N | N |
| Client dashboard + report download | N | N | Y (own org) | N |
| Any write on product data | — | — | **N** (`READ_ONLY_ROLE` / write block) | N |
| Invite verifier org | Admin | N | N | N |
| Open / message verifier threads | Y (paid) | Y (paid) | N | Reply in inbox |
| Factor library (firm) | Y | Y | N | N |

---

## Middleware cheat-sheet (backend)

| Guard | Effect |
| --- | --- |
| `requireConsultant` | Session must be access kind `consultant` |
| `requireConsultantAdmin` | Tenant role `consultant_admin` |
| `requireTenant` | Tenant context present |
| `requirePaidSubscription` | Unpaid → **402** `PAYMENT_REQUIRED` (viewers/verifiers skip) |
| `blockClientViewerWrites` | Viewer cannot mutate |
| `blockSmeSolo` | Firm-only routes; SME gets forbidden |
| Org scope | All data access filtered by `allowedOrgIds` (+ RLS) |

---

## Not shipped

| Item | Status |
| --- | --- |
| `client_contributor` | Enum / types only — no journey |
| Per-field ACL beyond admin/member/viewer/verifier | Not modelled |
| SSO / IdP roles | Roadmap |

---

## How to verify quickly

1. Firm admin vs member: firm settings + team invite (admin only).  
2. Firm member on unassigned client: org APIs reject / UI hides.  
3. SME: no `/clients` portfolio; client-portal invite fails.  
4. Two firm users: A uploads, A cannot approve (SoD); B can.  
5. SME: same user can upload and approve.  
6. Viewer: GET client routes OK; POST upload → forbidden.  
7. Unpaid operator: product call → 402 → SPA `/billing`.

---

*Updated: Nov 2026 — matches discussed firm / SME / billing / SoD / portal / verifier model.*
