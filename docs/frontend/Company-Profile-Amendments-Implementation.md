# Company Profile & Amendments — Frontend Implementation

Frontend-only. Backend (`G:\Projects\Nobo`) was read for contract verification but never modified —
confirmed at the end of this document.

## 1. Endpoints inspected

- `src/Nobo.Api/Companies/CompanyProfileEndpoints.cs`
  - `GET /api/companies/{companyId}/profile` — current approved profile (`CompanyProfile.View`)
  - `GET /api/companies/{companyId}/profile/versions` — version metadata, newest first
  - `GET /api/companies/{companyId}/profile/versions/{versionNumber}` — one version exactly as approved
  - `POST /api/companies/{companyId}/profile/amendments` — create (owner only)
  - `GET /api/companies/{companyId}/profile/amendments` — list (owner only)
  - `GET /api/companies/{companyId}/profile/amendments/{registrationId}` — detail (owner only)
- `src/Nobo.Api/CustomerRegistration/CustomerRegistrationEndpoints.cs` — an amendment IS a `RegistrationRequest` (`Kind = Amendment`), so its own editing reuses these EXACT routes (verified against `AmendmentHandlers.cs`'s own comment: "editing, submitting, review, documents, extraction and history all reuse the registration machinery unchanged"):
  - `PUT /api/registrations/{id}/draft`
  - `POST /api/registrations/{id}/submit`
  - `POST /api/registrations/{id}/cancel`
  - `POST /api/registrations/{id}/information-requests/{informationRequestId}/respond`
- `src/Nobo.Application/CustomerRegistration/AmendmentHandlers.cs` — `CreateAmendmentHandler` (baseline = current approved version; ownership checked via `ICompanyMembershipRepository`, **not** a permission string), `CompanyAmendmentQueries` (list/get), `ApproveAmendmentHandler` (platform-staff-only, see §gaps).
- Enums read verbatim from `src/Nobo.Domain/CustomerRegistration/RegistrationEnums.cs`: `RegistrationKind`, `RegistrationStatus`, `RegistrationFieldStatus`, `RegistrationFieldOrigin`, `InformationRequestStatus`.
- Field catalog read from `src/Nobo.Domain/CustomerRegistration/RegistrationFieldCatalog.cs` (`RegistrationFieldKeys`, `RegistrationFieldGroup`) — used only to build a **presentation-only** label map (see §9).
- Permission read from `Nobo.Application.Authorization.ApplicationPermissions.CompanyProfileView = "CompanyProfile.View"`.

## 2. Pages/components added

`src/features/company-profile/`:
- `types/companyProfile.types.ts`, `types/amendment.types.ts` — mirror the real DTOs field-for-field.
- `api/companyProfileApi.ts` (read-only profile/version routes), `api/amendmentsApi.ts` (amendment + generic registration routes).
- `hooks/useCompanyProfile.ts`, `hooks/useAmendments.ts` (React Query, same conventions as every other feature in this repo — query keys, `enabled` gating, `invalidateQueries` on mutation success).
- `utils/fieldLabels.js` — presentation-only key→label map (see §9).
- `components/RegistrationStatusBadge.jsx` — the 7 real `RegistrationStatus` values, nothing invented.
- `pages/CompanyProfilePage.jsx` — current profile (all fields the real response returns: identity, address, financial, representative, contacts, proposed branches) + a "Version history" tab (`GET .../versions`) with per-version expand → `GET .../versions/{n}`, explicitly labeled read-only.
- `pages/CompanyProfileAmendmentsPage.jsx` — list + create (owner-gated, disabled while one is already open, mirroring the backend's own `Registration.AmendmentAlreadyOpen` rule instead of duplicating it as new logic).
- `pages/CompanyProfileAmendmentDetailsPage.jsx` — status, base version, timestamps, decision reason; editable field grid (grouped by the real `RegistrationFieldGroup`) while `Status === "Draft"`; Save draft / Submit / Cancel; open information requests with a respond form.

Page wrappers under `src/Pages/{CompanyProfilePage,CompanyProfileAmendmentsPage,CompanyProfileAmendmentDetailsPage}/*.jsx` (thin re-exports, matching the existing routing convention).

## 3. Routes / navigation

- `ROUTES.COMPANY_PROFILE = "/company/profile"` — gated in `App.jsx` on `CompanyProfile.View` (an actual permission).
- `ROUTES.COMPANY_PROFILE_AMENDMENTS`, `ROUTES.COMPANY_PROFILE_AMENDMENT_DETAILS` — gated only on authentication (`protectedPage`, the same wrapper `Dashboard` uses), **not** a permission constant, because the backend itself does not gate amendments by a permission string — it checks `ICompanyMembershipRepository` for an active OWNER membership. Inventing a permission constant for this would misrepresent the real authorization model, so the pages check `useCompanyPermissions(companyId).data.isOwner` instead (the same field `useHasPermission`/`useLandingRoute` already read elsewhere in this app) and show `ErrorState` for a non-owner.
- Nav item `nav.companyProfile` added (gated on `CompanyProfile.View`); localized ar/en/es/de in `src/i18n/translations.js`. The amendments pages are reached from the Company Profile page's own "Amendments" button, not a separate top-level nav entry (consistent with them being a sub-flow, not a standalone module).

## 4. Permission usage

- `CompanyProfile.View` — added as `COMPANY_PROFILE_VIEW_PERMISSION` to `src/features/authorization/constants/applicationPermissions.ts` in the prior Branches/Generation-Units task; reused here, not re-added.
- Amendment creation/editing: **ownership**, not a permission constant — see §3. No permission name was invented to fill this gap.
- Approving/rejecting an amendment: `Platform.Registrations.Approve`, checked by `ApproveAmendmentHandler` — this is a **platform-staff** permission on a **different route group** (`/api/platform/registrations/...`) reached by a different persona than a company owner. Building that UI here would be building the wrong persona's screen; it is out of scope for "Company Profile" and is not implemented (see §7).

## 5. Backend gaps discovered (left out, not faked)

1. **No field-catalog endpoint.** `RegistrationFieldCatalog`/`RegistrationFieldKeys` (labels, formats, choices, length limits) are domain-internal; no `GET` exposes them. The edit form therefore renders every field as a plain text input keyed by its own `key`, using a **presentation-only** label map for ~26 known keys (falls back to the raw key otherwise) — never a picker, dropdown, or format-specific control, since none of that is backend-confirmed. This is explicitly commented in `utils/fieldLabels.js`.
2. **No company-side amendment history/revision endpoint.** `GET /api/registrations/{id}/history` exists **only** under `PlatformRegistrationEndpoints.cs` (`Platform.Registrations.*`). A company owner can see the amendment's current field values/statuses but not a revision-by-revision history — the UI does not fabricate one.
3. **No company-side approve/reject.** Confirmed by reading `AmendmentHandlers.ApproveAmendmentHandler`: it requires `Platform.Registrations.Approve` and lives under the platform route group. Not built here — a different persona's screen, and building it under `company-profile` would misrepresent who can do it.
4. **Amendments cannot change proposed branches.** `RegistrationRequest.CreateAmendmentDraft`/`ApproveAmendmentHandler` never touch `ProposedBranches` for an amendment (only an Initial registration's own draft can, via `UpdateMyRegistrationDraft`'s `ProposedBranches` field, but the company-amendment flow's `SaveDraftRequest` handling in this app's UI never sends that field). Proposed branches are shown **read-only** on the Company Profile page.
5. **`RegistrationField.Group`/`Status`/`RegistrationResponse.Kind`/`Status` are plain PascalCase strings** (the enum's own `.ToString()`, not camelCase) — unlike the Invoice Templates feature's JSON (which uses a camelCase enum converter). Verified by reading `RegistrationEndpointContracts.cs` (no enum converter applied to these string-typed DTO properties) before writing the TypeScript types, so the two features' string casings are intentionally different, not a copy-paste mismatch.

## 6. Data rules followed

- No VAT/CR/compliance value is derived, inferred, or defaulted anywhere in this feature.
- No frontend parsing of a free-text field into structured data (the address fields already come structured from the backend).
- Every request body sent matches the backend's own field names and types exactly (`values: Record<string, string | null>` for drafts, etc.).
- Historical profile versions are rendered with the exact same `ProfileContent` component as the current profile, with no controls — explicitly labeled read-only, matching the backend's own lack of a version-edit endpoint.

## 7–9. Verification

- **Typecheck** (`npx tsc --noEmit`): clean.
- **Lint** (`npx eslint .`): the same 3 pre-existing issues as before this task (`I18nContext.jsx` fast-refresh rule, `vite.config.js` `process` global, `POSPage.jsx` exhaustive-deps warning) — zero new issues.
- **Build** (`npx vite build`): succeeds.
- No test framework was introduced (none exists in the repo; not required here).
- This was **static contract verification against the real backend source only** — no live backend instance was run this turn.

## Files changed

New:
- `src/features/company-profile/types/{companyProfile,amendment}.types.ts`
- `src/features/company-profile/api/{companyProfileApi,amendmentsApi}.ts`
- `src/features/company-profile/hooks/{useCompanyProfile,useAmendments}.ts`
- `src/features/company-profile/utils/fieldLabels.js`
- `src/features/company-profile/components/RegistrationStatusBadge.jsx`
- `src/features/company-profile/pages/{CompanyProfilePage,CompanyProfileAmendmentsPage,CompanyProfileAmendmentDetailsPage}.jsx`
- `src/Pages/CompanyProfilePage/CompanyProfilePage.jsx`, `src/Pages/CompanyProfileAmendmentsPage/CompanyProfileAmendmentsPage.jsx`, `src/Pages/CompanyProfileAmendmentDetailsPage/CompanyProfileAmendmentDetailsPage.jsx`

Modified:
- `src/utils/routes.jsx` (3 routes + 1 path helper)
- `src/utils/navItems.jsx` (1 nav item)
- `src/App.jsx` (3 route registrations + 3 imports)
- `src/i18n/translations.js` (`nav.companyProfile` × ar/en/es/de)

## 10. Backend modification confirmation

`git status --short` in `G:\Projects\Nobo` is empty before and after this task — **zero backend files were modified**, added, or deleted. No EdgeAgent file was touched. No ZATCA behavior was changed.
