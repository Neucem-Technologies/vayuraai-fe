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
4. **Emails** — branded invite + welcome (same tone as marketing SES work)  
5. **Contracts** — shared DTOs for onboarding status / invite states if missing  
6. **Align with RBAC** — gate invite actions with `verifier.manage` / `team.manage` when Shreya lands codes (use admin checks until then)

---

## Delivery slices

| Slice | Work | Repo |
| --- | --- | --- |
| **S0** | Plan + branch (this doc) | FE |
| **S1** | Verifier invite lifecycle: list pending, expiry copy, resend/cancel UX | FE + BE |
| **S2** | Verifier first-run after accept (welcome + empty inbox guidance) | FE |
| **S3** | Consultant onboarding polish (SME/firm paths, step resume) | FE (+ BE if status API gaps) |
| **S4** | Invite / welcome emails (SES or outbox) | BE |
| **S5** | QA checklist + handoff notes | both |

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
