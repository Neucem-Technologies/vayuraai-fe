# ERP file import — progress

Frontend branch: `feat/erp-tally-live` (file import remains on `feat/erp-tally-excel` history).

The stage checklist, decisions, migration SQL, and verification notes are maintained in the backend repo at `vayuraai-be/docs/erp/PROGRESS.md` and mirrored here after each stage.

## Stage checklist

- [x] S0 Baseline and safety net
- [x] S1 Ledger schema
- [x] S2 Connector foundation
- [x] S3 Tally / Excel parsing
- [x] S4 Calculation and conversion
- [ ] S5 Duplicate, overlap, and correction
- [ ] S6 Async audit, retention, worker
- [ ] S7 Backend API
- [ ] S8 Frontend
- [ ] S9 Automated verification
- [ ] S10 Self-audit
- [ ] S11 Final report

## Live Tally pull

Frontend branch for this slice: `feat/erp-tally-live`.

File import is unchanged. A firm admin (`canManageTenant`) can save a TallyPrime HTTP gateway (host, port, company name) and pull one financial year of vouchers. The pull stores the raw XML as an upload and stages lines for the existing review queue. Nothing is auto-approved. There is no password, OAuth, or credential UI. Excel file import stays on Uploads.

## Decisions

See the backend progress log. Branch base is the current product tip, not literal `main`, because `main` has no `ReportingPeriod` or `smeSolo`.

## Baseline

Frontend `tsc --noEmit` was clean before feature code.
