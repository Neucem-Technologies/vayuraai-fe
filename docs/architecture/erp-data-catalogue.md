# ERP data catalogue


What data we pull from ERPs (Zoho, Tally, SAP, or CSV) into Vayura. We do **not** copy the whole ERP — only lines useful for emissions, plus the mapping lists needed to classify them.

---

## Goal

ERP line → review queue → approved activity record.

- ERP stays the financial system of record  
- Vayura stays the carbon / disclosure system of record  
- Nothing from ERP is auto-approved in v1  

**Pilot target:** electricity and fuel lines, with voucher IDs kept for audit.

---

## Fields on each transaction line

One bill/expense/journal **line** becomes one row:

| Field | Required? | Notes |
| --- | --- | --- |
| External id | Yes | Stable id (document + line) so re-sync does not duplicate |
| ERP system | Yes | zoho / tally / sap / csv |
| Module | Yes | expense, bill, journal, etc. (see below) |
| Document number | Yes | Voucher / bill number |
| Line number | Yes | Position on the document |
| Date | Yes | Transaction / posting date |
| Description | Yes | What the line is |
| Account code | Yes | Ledger / expense account |
| Account name | Yes | For mapping and review |
| Quantity | **Required for calc** | Activity amount (kWh, litres, km, …). Without it we cannot compute kgCO₂e. |
| Unit | **Required for calc** | Must match the emission factor (e.g. kWh, L, kg, km). |
| Amount | Optional | Money value — useful for review/audit, **not** used in v1 GHG calc. |
| Currency | Optional | e.g. INR — pairs with amount; **not** used in v1 GHG calc. |
| Vendor code / name | Optional | Supplier label only — no full contact dump |
| Cost centre / branch / location / project | If multi-site | Maps to a Vayura facility |
| Item code / name | Optional | Useful for fuel / energy stock items |
| Status | Optional | Skip drafts; flag cancelled |
| Synced at | Yes | When we pulled it |

**Unique key:** organisation + ERP system + external id (and amendment number if the ERP uses one).

### What the calculator actually needs

```text
kgCO₂e  ≈  quantity  ×  emission factor (for that unit / category)
```

| Needed for emissions? | Fields |
| --- | --- |
| **Yes** | `quantity` + `unit` (+ category/factor after mapping) |
| **No (v1)** | `amount` + `currency` — keep them when the ERP sends them, but do not treat ₹ as a substitute for kWh/L |

If a line has amount but no quantity/unit, still pull it into **review**; someone must fill quantity and unit before approve. Do not auto-derive activity units from money in v1.

---

## Modules we use

### Transactions (pulled on sync)

| Module | Priority | What it is | Typical use for us |
| --- | --- | --- | --- |
| **Expense** | P0 | Company / employee expenses | Fuel cards, travel, small utility spends |
| **Bill** | P0 | Vendor bills / purchase invoices | Electricity and bulk fuel (best qty source) |
| **Journal** | P0 | Manual GL / journals | Power or fuel postings not on bills — **only mapped accounts**, not full GL |
| **Purchase** | P1 | Purchase vouchers / POs | Fuel or materials when the org books that way; avoid double-counting with bills |
| **Travel claim** | P1 | Travel / mileage claims | Flights, cabs, km, hotel nights when distance or nights exist |
| **Inventory issue** | P2 | Stock issued for use | Fuel taken from godown/plant; ignore warehouse-to-warehouse moves |

### Reference lists (on connect + refresh)

| Module | Priority | What it is | Why we need it |
| --- | --- | --- | --- |
| **Chart of accounts** | P0 | Ledgers / GL accounts | Map account → emission category |
| **Cost centres / sites** | P0 | Cost centre, branch, godown, plant | Map → Vayura facility |
| **Items** | Nice | Fuel / energy stock items | Default units and clearer quantities |
| **Vendors** | Nice | Supplier id + name only | Cleaner labels on review |

### Do not sync (v1)

- Sales invoices / CRM / customers  
- Payroll and employee personal data  
- Bank feeds  
- Full general ledger dump  
- Write-back into the ERP  

---

## Where this lives in each ERP

| Module | Zoho Books | Tally | SAP |
| --- | --- | --- | --- |
| Expense | Expenses | Payment / expense ledgers | Expense / travel documents |
| Bill | Bills (+ lines) | Purchase voucher | Vendor invoice / AP lines |
| Journal | Journals (filtered) | Journal voucher (filtered) | FI journals (filtered) |
| Purchase | Purchase orders only if needed | Purchase voucher | PO / goods receipt (careful with doubles) |
| Travel claim | Travel-style expenses | Travel ledgers | Travel / expense reports |
| Inventory issue | Inventory issue / adjust | Stock journal | Goods issue |
| Chart of accounts | Chart of Accounts | Ledgers / groups | GL accounts |
| Cost centres | Tags / branches / cost centres | Cost centre / godown | Cost center / plant |
| Items | Items | Stock items | Materials |
| Vendors | Vendor contacts (id + name) | Creditor ledgers | Vendor master (lite) |

Vendor API field names stay in the adapter. This doc only defines the **shared shape** after normalise.

---

## Priority order

1. **P0** — Electricity and fuel from bills, expenses, and mapped journals  
2. **P1** — Travel and freight  
3. **P2** — Materials / waste / stock issues if the client discloses them  

---

## Flow on our side

```text
ERP module line
  → normalised row (fields above)
  → map account / item / site → category + facility
  → review (needs_review)
  → approve
  → activity record (quantity, unit, date, facility, emissions)
```

**Storage (two forms, not two ERPs):**

| Form | What | Where | Why |
| --- | --- | --- | --- |
| **Structured** | Normalised lines (the field list above) | DB / review queue → activity records | Day-to-day product: map, review, calculate, report |
| **Raw (optional)** | Sync payload / export file for that run only | Object storage (e.g. MinIO) | Evidence if someone asks “what did we pull on this sync?” |

Raw is a **per-sync snapshot of the filtered pull**, not a live second ERP. You do not keep a full mirror of all Zoho/Tally/SAP books. Retention should be limited (e.g. with assurance / sync history), then drop or archive.

---

## Related

- [erp-integration-plan.md](./erp-integration-plan.md) — architecture and phases  
- [roles-and-permissions.md](../product/roles-and-permissions.md) — who can connect and approve  

---

*Draft · Nov 2026*
