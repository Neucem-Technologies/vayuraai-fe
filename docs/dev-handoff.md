# Dev handoff — recent platform work

Companion to the backend handoff. Work lands on the `dev` branch.

## What shipped (UI)

| Area | Route / entry | Notes |
| --- | --- | --- |
| Billing | `/billing` | After org provision; SPA also redirects on unpaid subscription |
| SME journey | Dashboard + layout | Hides portfolio / firm settings; shows Verifiers, Find consultant, Team |
| Offsets | `/offsets` | Held / retired records; listed projects enquire |
| Find consultants | `/find-consultants` | Directory + enquire |
| Controls & assurance | `/settings/controls` | Period close/reopen, audit log, assurance ZIP download |
| Site boundaries | Uploads, review, Reports, Org settings | Ops sites only for inventory; generation sites stay under Org settings |

## Auth / billing gate (`App.tsx`)

1. Hydrate session
2. If `subscriptionStatus` is `none` / `canceled` / `past_due` → `/billing`
3. Else finish onboarding (`organization` → billing → `data-sources`) → dashboard

API `402 PAYMENT_REQUIRED` also forces a client redirect to `/billing` (`src/lib/api-client.ts`).

## Shared helpers worth knowing

- `src/lib/facilities.ts` — `operationalFacilities`, `normalizeFacilityLabel`, `reportBoundaryOptions`, `boundaryLabelDisplay`
- `src/lib/reporting-fy.ts` — Indian FY chrome (header selector, localStorage)
- `src/lib/controls-api.ts` — periods, audit events, assurance pack
- `src/lib/billing-api.ts` — catalog / checkout / confirm / dev-activate

## SME vs consultant copy

Prefer FE labels over raw enums:

- `consultant_admin` → Administrator
- `consultant_member` → Contributor (SME) / Member (firm)

Do not show “Firm Team / Active client” chrome for SME solo.

## Local setup

1. Point `VITE_API_BASE_URL` at the API (usually `http://localhost:4000`)
2. Backend must have billing + ERP migrations applied
3. `npm run dev` → http://localhost:5173

## Suggested smoke path

1. Sign up as SME → activate plan (dev bypass) → add ops facility
2. Upload → assign site → review → approve
3. Reports → pick boundary → confirm matching line count
4. Controls → close period → confirm approve blocked → reopen as admin
