# ERP Integration — Architecture & Plan (for discussion)

**Owner (assigned):** Ashish Pawar  
**Status:** Draft for team discussion — **do not implement until aligned**  
**Related:** product flows · assurance / period controls · Phase 3 roadmap (ERP/Tally pilot)

---

## 1. Goal

Let Vayura **pull structured financial / operational ledger data** from a client’s ERP so consultants spend less time on manual uploads, while keeping **human review, audit trail, and period controls** intact.

We are **not** replacing the ERP. Vayura remains the carbon / disclosure system of record for emissions; ERP remains the financial system of record.

---

## 2. Why this matters (compliance / industry)

| Need | How ERP integration helps |
| --- | --- |
| Traceability (BRSR / assurance) | Document → source voucher / GL line → activity → kgCO₂e |
| Completeness | Fewer missing electricity / fuel / travel invoices |
| Segregation of duties | Import creates *candidates*; approve still requires reviewer |
| Period close | Sync only into **open** reporting periods |
| Data integrity | Idempotent sync; no silent overwrite of approved ledger |

Standards / practices we align to (lightweight, not certification claims):

- **API-first connectors** with least-privilege credentials  
- **Audit logging** of every sync (who, when, what, status)  
- **Maker–checker**: machine propose → human approve (same SoD spirit as uploads)  
- **Retention & export** compatible with existing assurance ZIP  

---

## 3. What we already have (build on this)

| Existing piece | Reuse for ERP |
| --- | --- |
| Upload → BullMQ workers → review → activity ledger | Treat ERP rows as another **ingestion source** |
| MinIO object storage | Store raw sync payloads / export files |
| Reporting periods + close | Block posting into closed periods |
| SoD on approve | Keep for firm tenants |
| Assurance pack | Include sync run metadata + source refs |
| Facilities (operations vs generation) | Map ERP cost centres / locations → facilities |

**Gap today:** no connector framework, no vendor adapters, no mapping UI, no scheduled sync.

---

## 4. Proposed architecture (high level)

```text
ERP (Tally / SAP / others)
        │  OAuth / API key / file drop (phase-dependent)
        ▼
┌───────────────────────┐
│  Connector service    │  per-tenant credentials (encrypted)
│  - auth               │  rate limits + retries
│  - pull / webhook     │  idempotency keys
└───────────┬───────────┘
            ▼
┌───────────────────────┐
│  Normaliser           │  vendor → Vayura Canonical Activity DTO
│  Mapping engine       │  account / item / cost-centre → category + facility
└───────────┬───────────┘
            ▼
┌───────────────────────┐
│  Ingestion queue      │  same review UX as file uploads
│  status: needs_review │
└───────────┬───────────┘
            ▼
     Approve / reject  →  ActivityRecord (emissions ledger)
```

**Principles**

1. **Canonical model first** — one internal DTO; adapters plug in per ERP.  
2. **Never auto-approve** into the emissions ledger in v1 (compliance default).  
3. **Org-scoped** — credentials and mappings belong to one client organisation.  
4. **Firm vs SME** — both can connect; firm admins connect per client org.  
5. **Fail safe** — sync failure must not corrupt approved data.

---

## 5. Phased delivery (recommended)

### Phase A — Foundation (discuss / design now)

- Connector registry (`tally_prime`, `sap_s4`, `generic_csv` …)  
- Encrypted credential store (tenant/org scoped)  
- Canonical Activity DTO + mapping tables  
- Manual “Run sync” + sync run history UI  
- Land results in **existing review queue**

### Phase B — First pilot connector

**Primary candidate for India mid-market:** **Tally** (export / API / CSV bridge — exact method TBD after vendor research).  
Fallback: **generic CSV/Excel GL extract** with column mapping (fastest pilot).

Success for pilot: 1–2 real clients, electricity + fuel lines → review → report, with source voucher IDs preserved.

### Phase C — Hardening

- Scheduled sync (cron / queue)  
- Webhooks where vendors support them  
- Mapping templates per industry  
- Conflict rules (duplicate voucher, amended voucher)  
- Ops dashboards (last success, error rate)

### Later (not now)

- SAP / Oracle / NetSuite / Zoho Books adapters  
- Write-back to ERP (out of scope until asked)  
- Real-time bidirectional master-data sync  

---

## 6. Data & security design (summary)

| Topic | Approach |
| --- | --- |
| Credentials | Encrypted at rest; never returned in full via API; admin-only manage |
| Transport | TLS only; vendor allowlists where possible |
| PII / financial data | Minimise fields; store only what calculation + audit need |
| Idempotency | `erpSystem + externalId (+ amendmentNo)` unique per org |
| Deletes | Soft-flag in staging; never delete approved activity without explicit void flow |
| Access | Same RBAC as uploads (admin/member on org; no client_viewer write) |
| Audit | `erp_sync_started` / `erp_sync_completed` / `erp_sync_failed` events |

---

## 7. Product UX (sketch)

1. Org settings → **Integrations** → Connect ERP  
2. Map chart-of-accounts / ledger groups → emission categories + facilities  
3. Choose period / date range → **Sync now**  
4. Open **Processing / Review** — same approve/reject as uploads  
5. Controls → see sync runs in audit / assurance pack  

---

## 8. Open questions (need team decision)

1. First pilot ERP: **Tally only**, or **generic CSV + Tally**?  
2. Who owns mappings — consultant only, or client viewer read-only view?  
3. Should SME solo get Integrations in v1?  
4. Hosted connector vs customer-hosted agent (firewall / on-prem Tally)?  
5. Commercial: included in Growth+, or add-on?  

---

## 9. Out of scope for this plan

- Replacing manual upload (uploads stay)  
- Automatic disclosure filing  
- Carbon credit marketplace  
- Changing emission factor governance  

---

## 10. Next steps after discussion

1. Agree Phase A scope + first pilot vendor  
2. Spike: auth + sample pull for chosen ERP (time-boxed)  
3. Spec Canonical DTO in `@vayura/api-contracts`  
4. Implement behind feature flag; pilot with 1 tenant  

---

*Draft for group review · Nov 2026 · discuss → then implement*
