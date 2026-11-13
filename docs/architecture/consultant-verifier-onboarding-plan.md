# Consultant & Verifier Onboarding — Implementation Plan

**Owner:** Summayya Hashmani  
**Branch:** `feat/consultant-verifier-onboarding` (FE + BE)  
**Status:** In progress  
**Related:** [roles-and-permissions.md](../product/roles-and-permissions.md) · RBAC (Shreya) · ERP (Ashish)

---

## Goal

Make **consultant firm / SME setup** and **verifier join** a clear, reliable module: from signup/invite → first useful screen, with correct routing, email, and admin visibility.

---

## What already exists (platform)

| Flow | Today |
| --- | --- |
| Consultant / SME signup | `userType` consultant \| sme → provision tenant |
| Consultant onboarding | `/onboarding/organization` → industry → data sources → billing |
| Team invite | invite → `/accept-team-invite` → member |
| Verifier invite (admin) | `/verifiers` desk → invite |
| Verifier accept | `/accept-verifier-invite` → `/verifier` inbox |
| Post-login routing | `resolvePostLoginPath` (billing / onboarding / dashboard / verifier) |

---

## Gaps to close (this branch)

1. **Consultant onboarding clarity** — step labels, SME vs firm copy, resume mid-flow, failure recovery  
2. **Verifier onboarding** — first-run empty state, org profile basics after accept, invite email reliability  
3. **Admin visibility** — pending invites, expired/cancelled, resend  
4. **Verifier review workflow** — see client **uploads + reports**, leave **comments** on the request thread  
5. **Emails** — branded invite + welcome  
6. **Align with RBAC** — `verifier.manage` / `team.manage` when Shreya lands codes  

---

## Verifier review workflow (product)

```text
Firm/SME invites verifier → accept → active
Firm opens “Request verification” for a client org
  → thread (comments)
  → review pack: uploads (needs_review/completed) + reports (final/submitted)
Verifier opens request → evidence panel + comments
```

Read-only evidence; no upload/approve by verifier in v1. Comments = thread messages (can reference a file/report).

---

## Delivery slices

| Slice | Work | Repo |
| --- | --- | --- |
| **S0** | Plan + branch (this doc) | FE |
| **S1** | Verifier invite lifecycle: pending / expired / resend / cancel | FE + BE |
| **S1b** | Review pack API + evidence panel in conversation (uploads, reports, comments) | FE + BE |
| **S2** | Verifier first-run after accept | FE |
| **S3** | Consultant onboarding polish | FE (+ BE if needed) |
| **S4** | Invite / welcome emails | BE |
| **S5** | PDF download for verifiers on review-pack reports (optional) | both |

---

## Out of scope (other owners)

- Full RBAC catalogue / `can()` migration → Shreya  
- ERP connectors → Ashish  
- `integration.manage` wiring beyond reserving the code  

---

## Start now

**S1** — harden verifier invite onboarding (admin + accept path), then S2 first-run.

---

*Branch created Nov 2026 from `dev`.*
