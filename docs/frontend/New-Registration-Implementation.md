# New Registration (Applicant) — Frontend Implementation

Frontend-only. Backend (`G:\Projects\Nobo`) was read for contract verification but never modified —
confirmed at the end of this document.

**Persona**: the **applicant** — the user who has no company yet and is applying for one. This is a
**third, distinct persona** from the two already built: `src/features/registrations` (Support/platform
reviewer, `/api/platform/registrations/...`) and `src/features/company-profile` (an existing
company-owner's amendment of an already-approved profile, `/api/companies/.../profile/amendments`).
This task's routes/API calls never touch either of those.

## 1. Applicant endpoints inspected

All under `/api/registrations` — `src/Nobo.Api/CustomerRegistration/CustomerRegistrationEndpoints.cs`
(the group's own comment: *"There is no company yet, so nothing is tenant-scoped"*):

- `POST /api/registrations/` — create the draft
- `GET /api/registrations/mine` — the applicant's most recent request (**resume**)
- `GET /api/registrations/{id}` — one request by id
- `PUT /api/registrations/{id}/draft` — update, **Draft only** (409 `Registration.WrongState` otherwise)
- `POST /api/registrations/{id}/submit`
- `POST /api/registrations/{id}/cancel`
- `POST /api/registrations/{id}/information-requests/{id}/respond`
- `POST /api/registrations/{id}/documents` (upload, multipart), `GET .../documents`, `GET .../documents/{id}`, `GET .../documents/{id}/content` (download)

Handlers read for exact preconditions/messages: `ApplicantHandlers.cs` (Create/Update/Submit/Cancel),
`RegistrationContracts.cs` (`RegistrationSupport.NotFound()` = `"Registration.NotFound"`, the exact code
used to distinguish "no draft yet" from a real error), `RegistrationRequest.cs` (domain state machine —
`Cancel`'s own comment: *"Draft / Submitted / UnderReview -> Cancelled ... NeedsMoreInformation is not
cancellable in this phase's state machine"*, read verbatim, not assumed).

**Confirmed by source**: there is **no applicant-side extraction endpoint at all**. Both
`PlatformRegistrationEndpoints.cs` sections are explicitly commented *"support only; no customer route
exists"* — for triggering extraction AND for confirming/correcting/rejecting suggested values. This
governs §5–§7 below.

## 2. Registration creation flow

`src/features/my-registration/pages/NewRegistrationPage.jsx` (`/registration/new`):
- On load, calls `GET /mine`. A failed query with `error.code === "Registration.NotFound"` is treated
  as "no draft yet" (not an error box) and shows a **Start registration** screen.
- "Start registration" calls the real `POST /api/registrations/` with an empty body (no invented
  default values are sent) and stores the returned `RegistrationView` directly via
  `queryClient.setQueryData` — no fake local registration object is ever created; the id/reference/
  status shown are exactly what the backend returned.
- The same page then re-renders based on the now-present registration's real `status`.

## 3. Data-entry sections

Mapped onto the real `RegistrationFieldGroup` values only (`LegalIdentity`, `RegisteredAddress`,
`Financial`, `Representative`, `Contacts`) plus a real, backend-supported **Proposed Branches** section
(`CreateDraftRegistrationCommand`/`UpdateDraftRegistrationCommand` both accept `ProposedBranches`) —
not the task's suggested "Registration details" wording verbatim, but the actual fields that exist.
Every input is keyed by the field's own real `key` (`Dictionary<string,string?>` on the wire); nothing
is renamed, defaulted, or inferred. A presentation-only label map (`utils/fieldLabels.js`, third copy
of the same pattern used in the other two registration features) turns ~26 known keys into readable
labels; an unknown key falls back to itself verbatim — there is still no field-catalog endpoint.

## 4. Document upload

`src/features/my-registration/components/MyRegistrationDocumentsPanel.jsx`:
- Upload (`documentType` field first, file part last, exactly the real multipart contract), List,
  Download (streamed as a `Blob`, saved via a real `<a download>` click — there is no preview endpoint).
- Document type options are the real `RegistrationDocumentType` enum values only
  (`CommercialRegistration, VatCertificate, NationalAddress, BankLetter, Identification, Other`).
- **No remove/replace/re-upload** on this side: verified in source that `Replace` exists **only**
  under `/api/platform/registrations/.../replace` (Support-only); there is no delete route anywhere.
  Uploading again simply adds a new document row.

## 5. Extraction flow

**Not built — genuine backend gap, not faked.** Confirmed twice from source (this task and the prior
platform-registrations task): extraction trigger/list/get and extracted-value confirm/correct/reject
are Support-only routes under `/api/platform/registrations/...`. There is no equivalent under
`/api/registrations/...`. The applicant therefore cannot trigger extraction, see extraction runs, or
review suggestions — the backend's own review workflow already covers that on the Support side, and
this page does not attempt a parallel or workaround implementation.

## 6. Extraction suggestion actions

**Not applicable — see §5.** No Confirm/Correct/Reject UI is offered to the applicant, since no such
endpoint exists for this persona. Field values the applicant enters go straight through the real
`Draft`/`Update` endpoints as `CustomerSubmitted` values (an applicant never sees "extracted",
"corrected" etc. field origin — those only ever apply after a reviewer runs extraction).

## 7. Submit flow

- **Review summary**: while in `Draft`, the same editable fields ARE the review surface (current
  server state, editable); no separate read-only "final review" screen was invented on top of it,
  since the backend has no distinct "review" state for a draft — Submit is the one real transition.
- **Submit button**: first saves the current local edits via the real `PUT .../draft` (so "Submit"
  never silently discards unsaved changes), then calls the real `POST .../submit`. A confirmation step
  is shown first; the button disables while either call is pending (duplicate-submit protection).
- On success, the query is invalidated/refetched and the page switches to a **read-only** view driven
  by the fresh `status` (`Submitted`/`UnderReview`/etc.) — editing is only ever offered while
  `status === "Draft"`, matching the real 409 `Registration.WrongState` the backend would otherwise
  return.
- **Cancel**: offered only while `status` is `Draft`, `Submitted`, or `UnderReview` — mirroring the
  domain's own `Cancel()` comment exactly (not offered for `NeedsMoreInformation`, which the backend
  does not allow to cancel).

## 8. Resume behavior

Fully implemented via `GET /api/registrations/mine` (`useMyLatestRegistration`) — this **is** the real
"my registration" endpoint the task asked about; no gap here. Reopening `/registration/new` always
shows the applicant's current registration (Draft continues editing; any other status shows the
read-only view with its own real actions: respond to information requests, download documents, cancel
when allowed).

## 9. Authorization

No new permission was invented. The applicant routes require only **authentication** — verified in
source: every applicant handler checks `_currentUser.UserId` and nothing else (no permission, no role,
no company); ownership is enforced server-side per-request (`IsApplicantAsync`, "another user's request
is reported exactly like one that does not exist"). The frontend mirrors this with a plain
authenticated-only route (see §10).

## 10. Routes / navigation

- **`ROUTES.REGISTRATION_NEW = "/registration/new"`** — does not collide with the existing
  `ROUTES.REGISTER = "/register"` (that is user-account signup, `RegisterPage`, unrelated).
- **New route wrapper**: `src/features/auth/components/AuthenticatedOnlyRoute.tsx`. This was
  necessary, not incidental: every existing `protectedPage(...)` route in `App.jsx` is wrapped in
  `ProtectedRoute` → `CompanyGate` → `BranchGate`, and `CompanyGate` requires the user to already have
  a `CompanyMembership` (showing `CompanyOnboarding`/`NoAccessState` otherwise). Routing the applicant
  registration flow through that would make it **unreachable for exactly the user it is for** (someone
  with no company yet). `AuthenticatedOnlyRoute` reuses the same `useAuth()` status check
  `ProtectedRoute` uses, just without the company gate — same authentication pattern, deliberately
  narrower wrapping.
- **Navigation placement**: added directly in `src/components/AppLayout.jsx`, right next to the
  existing hard-coded "Home" button (**not** through `NAV_ITEMS`/`PermissionNavItem`, whose visibility
  check hard-requires `currentCompanyId` — which would hide it from exactly the companyless user it
  targets). Kept out of `PlatformNavGroup` entirely, per the task's explicit instruction to keep the
  two personas separate.
- **Not touched**: `CompanyOnboarding.tsx`/`CompanyGate.tsx` (the existing, separate, INSTANT
  self-service company-creation flow already wired into every protected route) were read but not
  modified — see the gap note below.

## 11. Backend gaps / notable findings (documented, nothing faked)

1. **No applicant-side extraction of any kind** (§5/§6) — the single largest gap; fully documented,
   nothing built to compensate.
2. **No applicant document replace/remove** — upload-only; new uploads never supersede old ones on
   this side (only Support can supersede).
3. **NOBO currently has TWO separate paths to get a Company**: (a) the pre-existing, instant
   `useCreateCompany()` self-service flow (`CompanyOnboarding.tsx`, already live, wired into
   `CompanyGate` for every zero-company user) and (b) this task's reviewed Customer Registration flow
   (`Draft → Submitted → UnderReview → Support Approve → Company created`). This task only builds UI
   for (b); it does not replace, disable, or link from (a). Deciding whether/how the two should be
   presented together (e.g. an option on the onboarding screen) is a product decision outside this
   task's explicit scope, not a gap in this delivery.
4. A companyless user must navigate to `/registration/new` directly (or via the new sidebar item, only
   visible once already inside the app shell) — there is no link to it from the login page or from
   `CompanyOnboarding` itself; wiring that in is a natural follow-up but was not requested here.

## 12. Files changed

New:
- `src/features/my-registration/types/registration.types.ts`
- `src/features/my-registration/api/myRegistrationApi.ts`
- `src/features/my-registration/hooks/useMyRegistration.ts`
- `src/features/my-registration/utils/fieldLabels.js`
- `src/features/my-registration/components/{RegistrationStatusBadges,MyRegistrationDocumentsPanel,ProposedBranchesEditor}.jsx`
- `src/features/my-registration/pages/NewRegistrationPage.jsx`
- `src/features/auth/components/AuthenticatedOnlyRoute.tsx`
- `src/Pages/NewRegistrationPage/NewRegistrationPage.jsx`

Modified:
- `src/utils/routes.jsx` (`REGISTRATION_NEW` route)
- `src/App.jsx` (route registration + import)
- `src/components/AppLayout.jsx` (always-visible "My Registration" sidebar item + icon import)
- `src/i18n/translations.js` (`nav.myRegistration` × ar/en/es/de)

## 13–15. Verification

- **Typecheck** (`npx tsc --noEmit`): clean.
- **Lint** (`npx eslint .`): the same 3 pre-existing issues as every prior task this session
  (`I18nContext.jsx`, `vite.config.js`, `POSPage.jsx`) — zero new. Note:
  `src/features/auth/components/*.tsx` (including the new `AuthenticatedOnlyRoute.tsx`) is reported as
  "ignored, no matching configuration" when linted directly — confirmed pre-existing by running the
  same check against the untouched `ProtectedRoute.tsx`, so this is a repo-wide config gap, not
  something introduced here.
- **Build** (`npx vite build`): succeeds.
- No test framework was introduced (none exists in the repo).
- This was **static contract verification against the real backend source only** — no live backend
  instance was run this turn, so no live API call was made or is claimed.

## 16. Backend modification confirmation

`git status --short` in `G:\Projects\Nobo` is empty before and after this task — **ZERO BACKEND FILES
MODIFIED**. No EdgeAgent file was touched. No ZATCA behavior was changed.
