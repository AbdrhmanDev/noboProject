# Registration Requests / Applications — Frontend Implementation

Frontend-only. Backend (`G:\Projects\Nobo`) was read for contract verification but never modified —
confirmed at the end of this document.

**Persona**: this screen is the **Support/platform reviewer** side (`/api/platform/registrations/...`,
`Platform.Registrations.*` permissions), verified by reading `PlatformRegistrationEndpoints.cs` and
every handler it calls. It is explicitly **not** the company-owner amendment screen built in the
previous task (`src/features/company-profile`) — that one calls `/api/companies/{companyId}/profile/
amendments` + the applicant's own `/api/registrations/{id}/...` routes and has no approve/reject.

## 1. Registration endpoints inspected

All read directly from source:

- `src/Nobo.Api/CustomerRegistration/PlatformRegistrationEndpoints.cs` — every route (list, get, claim,
  edit field, confirm field, request information, approve, reject, history, documents CRUD +
  review/reject/replace, extraction trigger/list/get, extracted-value confirm/correct/reject).
- `src/Nobo.Api/CustomerRegistration/RegistrationEndpointContracts.cs` — every request/response DTO.
- `src/Nobo.Application/CustomerRegistration/SupportHandlers.cs`, `ApproveRegistrationHandler.cs` — the
  exact permission each handler checks (mapped 1:1 into `platformPermissions.ts`, see §8).
- `src/Nobo.Application/CustomerRegistration/Documents/RegistrationDocumentHandlers.cs` — document
  handlers' permissions.
- `src/Nobo.Application/CustomerRegistration/Extraction/{ExtractionHandlers,ExtractedValueReviewHandlers}.cs`
  — extraction trigger/list/get permissions, and the EXACT confirm/correct/reject transition rules
  (read verbatim from source, not guessed — see §6).
- `src/Nobo.Domain/CustomerRegistration/RegistrationEnums.cs`, `RegistrationDocument.cs`,
  `Extraction/ExtractionModels.cs`, `Extraction/ExtractionJob.cs` — every real status/kind enum value.

## 2. Registration list implemented

`src/features/registrations/pages/RegistrationsListPage.jsx` (`/platform/registrations`):
- Status filter (all 7 real `RegistrationStatus` values) and Kind filter (`Initial`/`Amendment`) — both
  server-side (`GET /api/platform/registrations?status=...&kind=...`), no client-side fake filtering.
- Table: reference, kind, applicant/legal name, status badge, submitted date, last updated — every
  column is a real `RegistrationSummaryResponse` field, nothing invented.
- Loading/empty/error states via the existing `shared/components/ui` primitives; Refresh button.
- Pagination: **Previous/Next only, no page count** — the real `ListRegistrationsHandler` returns no
  total (verified in source); "Next" is enabled only when a full page came back. This is the honest
  limit of the endpoint, not a client-side guess.
- Gated with the existing `PlatformAccessGate` (same component `Platform Staff`/`Platform Companies`
  already use) on `Platform.Registrations.View`.

## 3. Registration details implemented

`src/features/registrations/pages/RegistrationDetailsPage.jsx` (`/platform/registrations/:registrationId`):
- Header: reference, kind, status badge, timestamps, decision reason (when rejected), Claim button
  (only shown when unclaimed and the caller holds `Platform.Registrations.Review`).
- **Registration fields**, grouped by the real `RegistrationFieldGroup` (Legal identity / Registered
  address / Financial / Representative / Contacts), each showing its real `status`
  (`Empty/Suggested/ReviewRequired/Confirmed/Corrected`); Edit (`Platform.Registrations.Edit`) and
  Confirm (`Platform.Registrations.ReviewFields`) actions call the exact real endpoints.
- Proposed branches (read-only).
- **Information requests**: list + create form (`POST .../information-requests`), gated on
  `Platform.Registrations.RequestInformation`.
- **Documents** and **Extraction** sections (see §4/§5 below).
- **History** (events + revisions) via `GET .../history`, gated on `Platform.Registrations.ViewHistory`.
- **Decision** panel (Approve/Reject) — see §7.

## 4. Document UI implemented

`src/features/registrations/components/RegistrationDocumentsPanel.jsx`:
- List: file name, document type, size, upload source, upload date, review status badge, extraction
  status badge, superseded flag, review note.
- Upload (Support) — `documentType` field first, file part last, exactly as the real multipart
  contract requires; gated on `Platform.Registrations.UploadDocument`.
- Review / Reject (with a required reason) — gated on `Platform.Registrations.ReviewDocuments`.
- Replace (creates a new document, old one kept as history) — same upload permission.
- **Download**, not preview: `GET .../content` is streamed as a `Blob` and saved via a real
  `<a download>` click — gated on `Platform.Registrations.DownloadDocument`. No preview UI was built:
  there is no preview endpoint, only a `content` (attachment) stream (see §10).
- Selecting a document scopes the Extraction panel to it.

## 5. Extraction UI implemented

`src/features/registrations/components/ExtractionPanel.jsx`, scoped to the selected document:
- **Trigger** (`POST .../extract`, `{force}` supported) — gated on `Platform.Registrations.TriggerExtraction`.
- **Runs list**: provider name/version, the real `RegistrationExtractionRunStatus` values
  (`Pending/Running/Succeeded/Failed/Cancelled`), failure category/code when failed, value/problem
  counts when succeeded.
- **Polling**: `useExtractionRuns`/`useExtractionRun` use React Query's `refetchInterval` (3s) exactly
  while any run in the response is `Pending`/`Running`, and stop automatically once every run reaches a
  terminal state — no new frontend worker, no invented polling protocol; it only re-reads the backend's
  own durable background-worker state.
- Selecting a run shows its **suggested values** (§6).

## 6. Extraction suggestion actions

Each suggestion shows: field key (labeled, see §9), suggested value (`normalizedValue ?? rawText`),
confidence, warnings, and its real `reviewDecision` (`Pending/Confirmed/Corrected/Rejected`) via a
badge that is **never** "success" for `Pending` — a suggestion is only ever a suggestion until a person
decides, matching the domain's own comment verbatim.

Confirm / Correct / Reject call the exact real endpoints and payload shapes
(`{value, reason}` for Correct, `{reason}` for Reject). Button visibility mirrors the **exact**
transition rules read from `ExtractedValueReviewHandlers.cs` (not reinvented):
- **Confirm**: only from `Pending` (repeating errors `Extraction.ValueAlreadyConfirmed`/`...Reviewed`/`...Rejected`).
- **Correct**: from `Pending`, `Confirmed`, or `Corrected` — **not** `Rejected` (a rejected suggestion is closed).
- **Reject**: only from `Pending` (already-applied values are corrected instead, per the handler's own comment).

Nothing is auto-accepted; nothing modifies a field locally without the real endpoint call.

## 7. Approval/rejection actions

Shown only when `registration.status === "UnderReview"` (the real precondition —
`ApproveRegistrationHandler` returns 409 outside it) and only for the two exact permissions:
`Platform.Registrations.Approve` / `Platform.Registrations.Reject`.
- **Approve**: real confirmation dialog (reused `ConfirmActionDialog`, mirroring the platform feature's
  own `ConfirmRevokeStaffRoleDialog` pattern), disabled while pending, refreshes registration state on
  success via query invalidation. A soft, **informational-only** note lists required-but-unconfirmed
  fields — computed straight from the already-returned `fields[]` array (never a new validation rule);
  the real gate is still the backend's own `Registration.FieldsNotConfirmed` response.
- **Reject**: real reason input (`RejectRegistrationRequest.Reason`, required — the exact backend
  contract), same confirmation dialog pattern.
- Explicitly **not** built here: the company-owner amendment approval flow (that has no company-side
  approve/reject at all — see the previous deliverable's gap list).

## 8. Permissions

Added to `src/features/platform/constants/platformPermissions.ts` (mirroring
`Nobo.Application.Authorization.PlatformPermissions`, one constant per real handler check, verified
against source): `PLATFORM_REGISTRATIONS_{VIEW,REVIEW,EDIT,REQUEST_INFORMATION,APPROVE,REJECT,
VIEW_HISTORY,VIEW_DOCUMENTS,UPLOAD_DOCUMENT,DOWNLOAD_DOCUMENT,REVIEW_DOCUMENTS,TRIGGER_EXTRACTION,
VIEW_EXTRACTIONS,REVIEW_FIELDS}`.

Every mutating action in the UI is hidden/disabled unless `useCurrentPlatformAccess().data.permissions`
contains the exact permission that handler requires — the same hook/pattern `PlatformStaffPage` already
uses. The backend remains the authorization source of truth regardless of what the UI shows.

## 9. Routes / navigation

- `ROUTES.PLATFORM_REGISTRATIONS = "/platform/registrations"`, `ROUTES.PLATFORM_REGISTRATION_DETAILS =
  "/platform/registrations/:registrationId"` — new, do not collide with `/company/profile/...` or
  `/branches/...` from the prior tasks.
- Registered in `App.jsx` with `protectedPage(...)` (auth-only), exactly like every other `/platform/*`
  route — the real gating is `PlatformAccessGate` inside the page, matching the existing convention.
- Added a "Registrations" item to `PlatformNavGroup.jsx`, visible only when the caller holds
  `Platform.Registrations.View` (same pattern as the existing "Staff" item's `PLATFORM_STAFF_VIEW` check).
- Localization: `nav.platformRegistrations` added for ar/en/es/de. Page bodies stay English, consistent
  with the majority of admin/utility pages built in this session (Branches, Generation Units, Invoice
  Templates, Company Profile) — noted here as a deliberate scope trade-off given the feature's size
  (~30 distinct actions across fields/documents/extraction/decision), not an oversight.

## 10. Backend gaps discovered (left out, not faked)

1. **No registration search endpoint** (by reference, applicant name, etc.) — only status/kind filters
   and offset paging exist. No client-side search over unfetched data was built.
2. **No total count on the list endpoint** — pagination is Next/Previous only (see §2).
3. **No document preview endpoint** — only `.../content` (a streamed attachment). Only Download was
   built, never an inline preview.
4. **No extraction "retry" endpoint distinct from trigger** — `{"force": true}` on the SAME trigger
   route starts a new run; there is no separate retry action, so none was invented.
5. **No revision history endpoint on the company/applicant side** (confirmed again from this side:
   `GetPlatformRegistrationHistory` is platform-only) — already documented in the prior deliverable.
6. **No company-side approval endpoint** — approval/rejection exist only under
   `/api/platform/registrations/...`; this was the explicit basis for keeping the two personas'
   screens completely separate.
7. **No field-catalog endpoint** — labels for the ~26 known field keys are a presentation-only map
   (`utils/fieldLabels.js`), identical in spirit to the one built for Company Profile/Amendments;
   an unknown key falls back to itself verbatim, never guessed.

## 11. Files changed

New:
- `src/features/registrations/types/registration.types.ts`
- `src/features/registrations/api/registrationsApi.ts`
- `src/features/registrations/hooks/useRegistrations.ts`
- `src/features/registrations/utils/fieldLabels.js`
- `src/features/registrations/components/{RegistrationBadges,ConfirmActionDialog,RegistrationDocumentsPanel,ExtractionPanel}.jsx`
- `src/features/registrations/pages/{RegistrationsListPage,RegistrationDetailsPage}.jsx`
- `src/Pages/RegistrationsListPage/RegistrationsListPage.jsx`, `src/Pages/RegistrationDetailsPage/RegistrationDetailsPage.jsx`

Modified:
- `src/features/platform/constants/platformPermissions.ts` (14 new `Platform.Registrations.*` constants)
- `src/features/platform/components/PlatformNavGroup.jsx` (1 nav item)
- `src/utils/routes.jsx` (2 routes + 1 path helper)
- `src/App.jsx` (2 route registrations + 2 imports)
- `src/i18n/translations.js` (`nav.platformRegistrations` × ar/en/es/de)

## 12–14. Verification

- **Typecheck** (`npx tsc --noEmit`): clean.
- **Lint** (`npx eslint .`): the same 3 pre-existing issues as every prior task this session
  (`I18nContext.jsx` fast-refresh rule, `vite.config.js` `process` global, `POSPage.jsx`
  exhaustive-deps warning) — zero new issues introduced.
- **Build** (`npx vite build`): succeeds.
- No test framework was introduced (none exists in the repo).
- This was **static contract verification against the real backend source only** — no live backend
  instance was run this turn, so no live API call was made or is claimed.

## 15. Backend modification confirmation

`git status --short` in `G:\Projects\Nobo` is empty before and after this task — **zero backend files
were modified**, added, or deleted. No EdgeAgent file was touched. No ZATCA behavior was changed.
