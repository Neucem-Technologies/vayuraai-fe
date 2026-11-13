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

## Verifier review workflow (industry-style)

```text
Invite → Accept → Active
Firm opens verification engagement for a client
  Status: Requested → Under review → Queries → Closed
Evidence room (read-only):
  - Source uploads (needs_review / completed)
  - Disclosure reports (final / submitted) + session-bound PDF download
Discussion:
  - Comments / queries on evidence (email notify other side)
```

Aligned with assurance practice: evidence room + query trail + engagement status. Verifier cannot mutate inventory.

---

## Delivery slices

| Slice | Work | Repo |
| --- | --- | --- |
| **S0** | Plan + branch (this doc) | FE |
| **S1** | Verifier invite lifecycle: pending / expired / resend / cancel | FE + BE — done |
| **S1b** | Evidence room: review pack + comments + engagement status (Requested → Under review → Queries → Closed) | FE + BE — done |
| **S1c** | Session-bound report PDF download on engagement | FE + BE — done |
| **S2** | Verifier first-run after accept | FE |
| **S3** | Consultant onboarding polish | FE (+ BE if needed) |
| **S4** | Invite / welcome emails | BE |

---

## Out of scope (other owners)

- Full RBAC catalogue / `can()` migration → Shreya  
- ERP connectors → Ashish  
- `integration.manage` wiring beyond reserving the code  

---

## Start now

**S2** — verifier first-run after accept (empty state + org basics), then S3/S4.

---

*Branch created Nov 2026 from `dev`.*
