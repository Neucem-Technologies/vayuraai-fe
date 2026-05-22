# Vayura AI — Agent development guide (canonical)

**Agents and developers: treat this document as the single source of truth** for how to implement features, APIs, errors, and auth flows in Vayura AI. Do not invent alternate error shapes, generic copy, or duplicate patterns outside the files listed here.

**Repos**

| Repo | Path | Role |
|------|------|------|
| Backend | `vayura-backend/` | Express + TypeScript + Prisma + PostgreSQL |
| Frontend | `vayura-frontend/` | Vite + React + Tailwind + wouter |

**Related planning docs**

| Doc | Use for |
|-----|---------|
| `docs/product-delivery-roadmap-clickup.md` | Phases, milestones, ClickUp tasks |
| `vayura-backend/docs/development-plan.md` | Backend module order |
| `vayura-frontend/docs/development-plan.md` | Frontend module order |
| `vayura-backend/docs/api-guidelines.md` | API route JSDoc and contract |
| `vayura-backend/docs/scaling-call-plan.md` | Performance and infra triggers |

---

## 1. Product context (short)

- **Multi-tenant:** consulting **tenant (firm)** → many **client organisations**.
- **Users:** consultants (`consultant` / future `consultant_admin` | `consultant_member`) and optional **client SMEs** (`sme`); future **`client_viewer`** read-only role per spec.
- **MVP path:** auth → tenancy/orgs → ingestion → emissions → reports → (later) client viewer portal.

---

## 2. API response contract (mandatory)

All HTTP APIs under `/api/v1` use this shape.

### Success

```json
{ "success": true, "data": { } }
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "EMAIL_IN_USE",
    "message": "Human-readable message safe to show in the UI"
  }
}
```

### Rules

| Rule | Requirement |
|------|-------------|
| `error.code` | Stable `UPPER_SNAKE_CASE`; never change meaning without versioning |
| `error.message` | Clear, actionable, safe for end users; **no** stack traces or internal IDs |
| Status codes | Match semantics (400 validation, 401 auth, 403 forbidden, 404 not found, 409 conflict, 500 unexpected) |
| Logging | Internal details only in server logs (`logger.error` / `logger.warn`), not in `message` |
| Never | Return only `"Something went wrong. Please try again later."` for **known** cases (duplicate email, validation, wrong password) |

---

## 3. Backend — error implementation

### 3.1 Files (use these; do not duplicate logic elsewhere)

| File | Purpose |
|------|---------|
| `src/lib/api-errors.ts` | `toApiError()`, `sendApiError()` — maps thrown errors to status + code + message |
| `src/middlewares/error-handler.ts` | Express global handler; calls `toApiError()` |
| `src/lib/validation-messages.ts` | User-facing Zod validation copy for auth routes |
| `src/routes/*.ts` | Return explicit `{ success: false, error }` for **expected** business outcomes |

### 3.2 Expected business errors in routes

Handle predictable outcomes **in the route** with the correct status and code. Example (register):

```ts
if ('error' in result && result.error === 'EMAIL_IN_USE') {
  res.status(409).json({
    success: false,
    error: {
      code: 'EMAIL_IN_USE',
      message:
        'An account with this email already exists. Sign in or use a different email address.',
    },
  });
  return;
}
```

Use `next(e)` only for **unexpected** failures; the global handler will map Prisma `P2002` → `EMAIL_IN_USE` if something slips through.

### 3.3 Prisma → API mapping (in `toApiError`)

| Prisma code | HTTP | API `code` |
|-------------|------|------------|
| `P2002` (unique violation) | 409 | `EMAIL_IN_USE` (email); extend for other unique fields when added |
| `P2025` (record not found) | 404 | `NOT_FOUND` |
| `ZodError` | 400 | `VALIDATION_ERROR` |
| Unknown | 500 | `INTERNAL_SERVER_ERROR` |

### 3.4 Auth error catalog (backend)

| Code | HTTP | When | Example `message` |
|------|------|------|-------------------|
| `VALIDATION_ERROR` | 400 | Zod / invalid body | `Enter a valid email address.` |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password on login | `Incorrect email or password. Check your details and try again.` |
| `UNAUTHORIZED` | 401 | Missing/invalid bearer token | `Missing or invalid Authorization header.` / `Invalid or expired session.` |
| `EMAIL_IN_USE` | 409 | Register with existing email | `An account with this email already exists. Sign in or use a different email address.` |
| `NOT_FOUND` | 404 | User/resource missing | `The requested record was not found.` |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected failure | `Something went wrong on our side. Please try again in a moment.` |

When adding a new endpoint, add rows to this table and implement both BE message + FE mapping (section 4).

### 3.5 Auth routes (current)

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/v1/auth/register` | Body: `email`, `password`, optional `userType`: `consultant` \| `sme` |
| POST | `/api/v1/auth/login` | Body: `email`, `password` |
| GET | `/api/v1/auth/me` | Bearer required |
| GET | `/api/v1/auth/onboarding/status` | Bearer required |
| POST | `/api/v1/auth/onboarding/complete` | Bearer required |
| POST | `/api/v1/auth/logout` | Bearer optional |

**Router wiring:** `src/routes/index.ts` must mount `authRouter` at `/auth` (not only `/health`).

---

## 4. Frontend — error implementation

### 4.1 Files (use these)

| File | Purpose |
|------|---------|
| `src/lib/api-client.ts` | `apiFetch()`, `ApiRequestError` — parses `{ error: { code, message } }` |
| `src/lib/auth-errors.ts` | `getAuthErrorPresentation(error, context)` — toast title/description + optional field errors |
| `src/hooks/use-toast.ts` | Toast UI for errors |
| Auth pages | `login.tsx`, `signup.tsx` — must use `getAuthErrorPresentation`, not ad-hoc strings |

### 4.2 Display rules

| Rule | Requirement |
|------|-------------|
| Auth flows | Use `getAuthErrorPresentation(e, 'signup' \| 'login')` in `catch` |
| Toasts | `variant: 'destructive'`, include **title** + **description** |
| Field errors | When `emailFieldMessage` is set (e.g. `EMAIL_IN_USE`), call `form.setError('email', { type: 'server', message })` |
| Prefer server message | If `ApiRequestError.message` is present, show it; fall back to code map in `auth-errors.ts` |
| Never | Replace known API errors with generic `"Try again later"` only |

### 4.3 Auth error catalog (frontend)

Keep in sync with `src/lib/auth-errors.ts` `MESSAGES` object. When backend adds a code, add an entry here.

| `error.code` | Toast title (typical) | User action |
|--------------|----------------------|-------------|
| `EMAIL_IN_USE` | Email already registered | Sign in or use another email; highlight email field |
| `INVALID_CREDENTIALS` | Could not sign in | Fix email/password |
| `VALIDATION_ERROR` | Check your details | Fix highlighted fields |
| `UNAUTHORIZED` | Session expired | Sign in again |
| `NOT_FOUND` | Account not found | Sign in or sign up |
| `INTERNAL_SERVER_ERROR` | Something went wrong | Retry later |
| `NETWORK_ERROR` | Connection problem | Check network / API URL |

### 4.4 API base URL

- `VITE_API_BASE_URL` in `.env.local` (see `.env.example`), default `http://localhost:4000`.
- Missing env throws a clear configuration error from `api-client.ts`.

### 4.5 Auth UI conventions

- **Login** ↔ **Signup:** cross-links at top (text link) and bottom (outline button) between `/login` and `/signup`.
- **No demo credentials** or demo banners on login/signup.
- Signup sends `userType` (`consultant` | `sme`) to register API.

---

## 5. Adding a new feature — agent checklist

### Backend

1. Read `docs/api-guidelines.md` and this guide.
2. Define error codes and messages **before** coding.
3. Implement route → service → Prisma; validate with Zod at route boundary.
4. Return explicit error JSON for expected failures; use `next(e)` for unexpected.
5. Extend `toApiError()` if new Prisma or error types need global mapping.
6. JSDoc on route with `@apiError` lines per code.
7. `npm run build` passes; `npm run db:deploy` if schema changed.

### Frontend

1. Add API function in `src/lib/*-api.ts` using `apiFetch`.
2. Map errors via domain helper (auth → `getAuthErrorPresentation`; new domains → new `*-errors.ts` file mirroring auth pattern).
3. Cover loading, empty, error, success states on the page.
4. `npm run build` passes.

### Both

- Do not add `Co-authored-by: Cursor` or other tool attribution to commits unless the user asks.
- Do not commit `.env` secrets.

---

## 6. Local development

### Backend

```bash
cd vayura-backend
docker compose up -d
cp .env.example .env   # set DATABASE_URL, etc.
npm run db:deploy
npm run dev            # http://localhost:4000
```

### Frontend

```bash
cd vayura-frontend
cp .env.example .env.local
npm run dev            # http://localhost:5173
```

---

## 7. Module status (summary)

| Area | Status |
|------|--------|
| Foundation, health, env | Done |
| Auth register/login/session/onboarding | Done (branch `feat/sign-in-flow`) |
| Tenancy, orgs, roles (`consultant_admin`, etc.) | Planned |
| Ingestion, processing, reporting | Planned |
| Client viewer portal | Spec only — `vayura-frontend/docs/product/feature-client-viewer-portal.md` |

---

## 8. Agent prohibitions

- Do not use Ant Design on frontend (stack is Tailwind + shadcn-style `components/ui`).
- Do not return HTML errors from API; always JSON contract above.
- Do not expose `org_id` from request body for `client_viewer` sessions (future); use JWT claims only.
- Do not skip updating `auth-errors.ts` (or equivalent) when adding new API error codes.
- Do not use MongoDB/Mongoose; persistence is **PostgreSQL + Prisma** only.

---

*When this guide conflicts with an older doc, **this guide wins**. Update this file when conventions change.*
