# Reopen Cancelled Registration — Frontend Implementation

Frontend-only change wiring the applicant's own registration screen to the already-existing backend endpoint `POST /api/registrations/{registrationId}/reopen`. **No backend, API contract, or EdgeAgent file was modified or created.**

## 1. Backend contract used (verified against source, not guessed)

- `POST /api/registrations/{registrationId}/reopen` — `Nobo.Api.CustomerRegistration.CustomerRegistrationEndpoints.ReopenAsync` / `Nobo.Application.CustomerRegistration.ApplicantHandlers.ReopenRegistrationHandler`.
- No request body (`ReopenRegistrationCommand` carries only the id, exactly like `submit`).
- Success: `200 OK` with the same `RegistrationResponse` shape every other applicant registration call already returns, now with `status: "Draft"`.
- Errors, per the backend's own documentation (`docs/registration/Reopen-Cancelled-Registration.md` in the backend repo):
  - `Authentication.Unauthenticated` (400)
  - `Registration.NotFound` (400) — unknown id or belongs to someone else
  - `Registration.InvalidTransition` (409) — status is not Cancelled
  - `Registration.ReopenConflict` (409) — lost an optimistic-concurrency race

No endpoint, field, or error code was invented; all four codes above are read directly from the real backend source.

## 2. Where the button appears

The applicant's single registration screen: `src/features/my-registration/pages/NewRegistrationPage.jsx`, reached via `src/Pages/NewRegistrationPage/NewRegistrationPage.jsx` (a thin re-export — confirmed this is the only page mounting the applicant registration flow). This page already loads the registration through `useMyLatestRegistration()` (`GET /api/registrations/mine`), so no new data-loading flow was introduced — the existing `GET /mine` / `RegistrationView` refetch pattern that every other transition (`submit`, `cancel`) already relies on is reused as-is.

The page already branches on `registration.status`: `"Draft"` renders `DraftForm`, everything else renders `ReadOnlyView`. Since `"Cancelled"` always renders `ReadOnlyView`, the new "Reopen Registration" button/dialog was added to `ReadOnlyView`, in the same place and visual pattern as the existing "Cancel registration" action (which is mutually exclusive with it: a Cancelled registration is never in `CANCELLABLE_STATUSES`, so the two actions never appear together).

## 3. Status conditions

```js
// Only Cancelled can be reopened -- the ONE transition RegistrationStateMachine.Allowed adds for
// Cancelled. Every other status (including Draft/UnderReview/Approved/Rejected) is refused by the
// backend with Registration.InvalidTransition -- never assumed reopenable.
const REOPENABLE_STATUSES = new Set(["Cancelled"]);
```

`canReopen = REOPENABLE_STATUSES.has(registration.status)` gates the button — shown for exactly `Cancelled`, hidden for `Draft`, `Submitted`, `UnderReview`, `NeedsMoreInformation`, `Approved`, `Rejected`, and any future status the type doesn't already enumerate. This mirrors the existing `CANCELLABLE_STATUSES` pattern already in the same file for consistency.

## 4. Flow implemented

1. **Button** — "Reopen Registration" (`RotateCcw` icon, emerald accent to visually read as a constructive action, distinct from the destructive red "Cancel"), disabled while a reopen is in flight.
2. **Confirmation dialog** — an inline confirm box (same visual pattern the page's existing Submit/Cancel confirmations already use — no shared modal/dialog component exists in the repo to import instead), explaining the request returns to Draft with nothing lost, with "Confirm reopen" / "Keep cancelled" actions.
3. **Call** — `POST /api/registrations/{registrationId}/reopen`, via a new `reopenRegistration(registrationId)` API function (`src/features/my-registration/api/myRegistrationApi.ts`) and a new `useReopenRegistration(registrationId)` React Query mutation hook (`src/features/my-registration/hooks/useMyRegistration.ts`), following the exact same shape as the existing `cancelRegistration`/`useCancelRegistration` pair.
4. **Duplicate-submission prevention** — both the trigger button and the confirm button are `disabled={reopenMutation.isPending}`; the `reopen()` handler additionally no-ops if a mutation is already pending, so no second request can be fired while one is in flight.
5. **Loading state** — the confirm button's label switches to the translated "Reopening..." string while `reopenMutation.isPending`.
6. **On success** — the mutation's `onSuccess` invalidates the same `myRegistrationQueryKeys.mine` query every other transition (`submit`, `cancel`, draft update) already invalidates, causing the existing `GET /mine` query to refetch automatically. The refetched view carries `status: "Draft"`, so the page's own existing `status === "Draft" ? <DraftForm/> : <ReadOnlyView/>` branch switches the UI over on its own — no new "reopened" mode or special-case rendering was added. A success toast (`sonner`, already mounted app-wide in `AppProviders.tsx`) confirms the action. **The registration id is unchanged** — the refetched `RegistrationView.id` is the same one the page was already displaying, since the backend mutates the same aggregate.
7. **On failure** — the confirm dialog closes and the existing inline error banner (the same one `cancel()` already uses) shows a message: `Registration.ReopenConflict` gets its own translated, friendlier copy ("This registration was just changed by another request..."); every other code (e.g. `Registration.InvalidTransition` if the status changed underneath the user) falls back to the real backend `message` text via the existing `getErrorMessage()` helper — no invented error text for codes the backend didn't actually return.

## 5. Error handling detail

```js
setError(reopenError?.code === "Registration.ReopenConflict" ? t("myRegistration.reopen.error.conflict") : getErrorMessage(reopenError));
```

`reopenError.code`/`.message` come from the existing `normalizeApiError` (`src/shared/api/apiError.ts`) — the same real backend error envelope every other mutation on this page already relies on (`code` from the ASP.NET `ApplicationResult` failure, `message` its human text). Nothing new was added to the HTTP client or error normalizer.

## 6. Reuse (no new patterns introduced)

- **API client**: `httpClient` from `shared/api/httpClient`, same instance every other registration call uses.
- **React Query**: same `useMutation`/`useQueryClient` + `invalidateMine()` pattern as `useCancelRegistration`/`useSubmitRegistration`.
- **Dialog**: the page's own existing inline confirm-box pattern (no shared dialog component exists in the repo for this feature; matched styling, not introduced a new one).
- **Toast**: `sonner`, already the app-wide toast library (`AppProviders.tsx` mounts `<Toaster/>`; already used the same way — `toast.success(t("..."))`  — in other features, e.g. `features/devices/components/ConfirmMatchDialog.tsx`).
- **Route helpers**: none needed — no new route was added; the existing `/registrations` (or wherever `NewRegistrationPage` is already mounted) route is unchanged.
- **i18n**: `useI18n()` / `t()` from `src/i18n/I18nContext`, the app's existing flat-key translation system. New keys were added to `src/i18n/translations.js` under a new `myRegistration.reopen.*` namespace, in **all four** existing languages (`ar`, `en`, `es`, `de`) — matching the repo's established convention of translating every new key into every supported language (verified against a recent precedent key present in all four sections), even though only Arabic/English were explicitly requested. No user-facing string for the new feature is hardcoded.

## 7. Files changed

- `src/features/my-registration/api/myRegistrationApi.ts` — added `reopenRegistration(registrationId)`.
- `src/features/my-registration/hooks/useMyRegistration.ts` — added `useReopenRegistration(registrationId)`.
- `src/features/my-registration/pages/NewRegistrationPage.jsx` — added `REOPENABLE_STATUSES`, the reopen button + confirm dialog in `ReadOnlyView`, wired to the new hook, `sonner` toast, and `useI18n()`.
- `src/i18n/translations.js` — added `myRegistration.reopen.button|confirmTitle|confirmBody|confirmAction|cancelAction|pending|success|error.conflict` to the `ar`, `en`, `es`, `de` sections.

No other file was touched. No new page, no new route, no new dialog component, no new translation namespace beyond the one above.

## 8. Manual verification performed (static + code-path review; no live backend was called)

- `REOPENABLE_STATUSES` contains exactly `"Cancelled"` — confirmed a registration with `status: "Cancelled"` renders `canReopen === true` and `status: "Draft"` (or any other status) renders `canReopen === false`, by tracing the `ReadOnlyView` render logic (Draft never even reaches `ReadOnlyView` — it renders `DraftForm` instead, so the button structurally cannot appear there).
- Clicking "Reopen Registration" → "Confirm reopen" calls `reopenMutation.mutateAsync()`, which calls `reopenRegistration(registration.id)`, which issues `POST /api/registrations/{id}/reopen` with an empty JSON body — traced end to end through the new code, matching the real endpoint's route and verb exactly.
- On success, `invalidateMine(queryClient)` runs, which is the identical call `useCancelRegistration`'s `onSuccess` already makes — the same, already-proven refetch path drives the status change to `Draft` in the UI.
- Both the trigger and confirm buttons carry `disabled={reopenMutation.isPending}`, and `reopen()` itself returns early if a mutation is already pending — duplicate clicks cannot fire a second request.
- The error branch was traced for both `Registration.ReopenConflict` (translated message) and any other code (falls through to `getErrorMessage`, i.e. the real backend message) — no code path invents a message not backed by the actual `ApiError` shape.

No live backend instance was exercised in this session (no dev server or API call was made) — this is static/source-level verification, not an integration test run, and is reported as such rather than claimed as live verification.

## 9. Typecheck, lint, build

- `npx tsc --noEmit` — **0 errors.**
- `npx eslint src/features/my-registration src/i18n` — **0 errors** on every file this change touched; the run surfaced exactly one pre-existing error, in `src/i18n/I18nContext.jsx` (a `react-refresh/only-export-components` rule violation), confirmed via `git diff`/`git status` to be **unmodified by this session** — it exists on the file as already committed/present in the working tree, not introduced here.
- `npx vite build` — **succeeded** (`✓ built in 1.80s`). The build emits its own pre-existing warnings (a Node.js version advisory and a "chunk larger than 500 kB" note) — both unrelated to this change and present before it.

## 10. Confirmation: zero backend files modified

Checked `git status` in the backend repository (`G:\Projects\Nobo`) after this session's frontend work: **no file under `src/`, `tests/`, or anywhere else in the backend repository shows as changed.** Every file touched in this task lives under the frontend repository's `src/features/my-registration/`, `src/i18n/`, or `docs/frontend/` — the backend `Nobo.Api.CustomerRegistration.CustomerRegistrationEndpoints.ReopenAsync` endpoint, its DTOs, and every other backend file are exactly as they were before this task, and no new endpoint was invented.
