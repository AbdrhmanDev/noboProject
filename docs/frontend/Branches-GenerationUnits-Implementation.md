# Branches & Generation Units — Frontend Implementation

Frontend-only. Backend (`G:\Projects\Nobo`) was read for contract verification but never modified —
confirmed at the end of this document.

## 1. Backend endpoints inspected

All read directly from source, no assumptions:

- `src/Nobo.Api/Branches/BranchEndpoints.cs` + `BranchEndpointContracts.cs`
  - `POST /api/companies/{companyId}/branches` — create
  - `GET /api/companies/{companyId}/branches` — list
  - `GET /api/companies/{companyId}/branches/{branchId}` — details (same `BranchResponse` shape as a list row — there is no separate, richer details DTO)
  - `PUT /api/companies/{companyId}/branches/{branchId}` — update
  - `PUT /api/companies/{companyId}/branches/{branchId}/status` — change status
- `src/Nobo.Api/Companies/CompanyProfileEndpoints.cs`
  - `GET /api/companies/{companyId}/profile` — the current APPROVED profile, including `proposedBranches[]` (with `materializedBranchId`/`materializedBranchStatus` once applied)
  - `POST /api/companies/{companyId}/profile/versions/{versionNumber}/proposed-branches/{ordinal}/apply` — the ONE branch-materialization action (P8.5.4)
- `src/Nobo.Api/Compliance/GenerationUnitEndpoints.cs`
  - `GET /api/companies/{companyId}/compliance/generation-units` — list
  - `GET /api/companies/{companyId}/compliance/generation-units/{unitId}` — details
  - `POST /api/companies/{companyId}/compliance/generation-units` — create
  - `POST .../{unitId}/activate`, `POST .../{unitId}/deactivate` — status
  - `GET /api/companies/{companyId}/branches/{branchId}/compliance/generation-unit` — branch's current unit
  - `PUT` same route — assign/reassign
- Domain read for exact enums/fields/comments: `Nobo.Domain.Branches.{Branch,BranchStatus}`, `Nobo.Domain.Compliance.GenerationUnits.{GenerationUnit,GenerationUnitAssignment}`
- Permissions read from `Nobo.Application.Authorization.ApplicationPermissions`: `BranchesView`, `BranchesManage`, `CompanyProfileView`, `ComplianceManage`

## 2. Branch UI implemented

`src/features/branches/pages/BranchesPage.jsx` (route `/branches/admin`):

- List (left column): name, code, status badge, and a "From approved profile" tag when it matches a materialized proposal.
- Details/edit (right column): name, code, phone, all 7 backend address fields (`countryCode, city, district, street, buildingNumber, additionalNumber, postalCode`) — nothing else.
- Status change (Active ⇄ Suspended) behind a real confirmation dialog (`ConfirmActionDialog`, not `window.confirm`), matching the app's existing pattern.
- Direct creation (`CreateBranchModal`) using the real `CreateBranchRequest` shape.
- **Proposed-branch materialization** (`ProposedBranchesPanel`): reads the approved profile's `proposedBranches[]` and calls the real `apply` endpoint per proposal, explicitly, one at a time. Already-applied proposals show "Applied (status)" instead of a button — this is the ONE branch-creation-from-registration path; nothing auto-creates a branch, and it is not a second/parallel creation mechanism (it calls the same backend action, from a proposal instead of free-form fields).
- Loading/empty/error states via the existing `shared/components/ui` primitives.

## 3. Generation Unit UI implemented

`src/features/generation-units/pages/GenerationUnitsPage.jsx` (route `/compliance/generation-units`):

- List: name, status (Active/Inactive), `default` badge, `assignedBranchCount`, created date.
- Create (name only — the only field the real `CreateGenerationUnitRequest` accepts).
- Activate / Deactivate, with a confirmation dialog on deactivate (a real, backend-enforced high-impact action). The default unit's Deactivate is disabled client-side only as a UX courtesy (the backend itself returns 409 either way; nothing is silently blocked).
- No status other than Active/Inactive is offered; no other lifecycle transition exists or is invented.
- Per the task's explicit exclusion list, nothing here shows or asks for a private key, certificate, OTP, CSID input, or signing/QR configuration — none exists on this response, and none was added.

## 4. Branch ↔ Generation Unit relationship

Represented as two distinct entities, never merged:

- The **assignment** (which unit a branch currently uses) is edited from the **Branches** page (`GenerationUnitAssignmentRow`, inside a branch's details panel, gated on `Compliance.Manage`) via the real `PUT .../branches/{branchId}/compliance/generation-unit`.
- The **Generation Units** page only shows the aggregate `assignedBranchCount` per unit (that's all the list endpoint returns) plus create/activate/deactivate — it does not attempt to list which branches use a unit (see gap below).
- **No assignment history exists anywhere in the backend** (`GenerationUnitAssignment` is one row per branch, replaced on reassignment — verified in the domain source, no history table, no history endpoint). The UI therefore shows only the CURRENT assignment and states this plainly; it never fabricates a history view.

## 5. Permission usage

Added to `src/features/authorization/constants/applicationPermissions.ts` (mirroring the backend catalog, verified against source — no invented names):

- `BRANCHES_VIEW_PERMISSION = "Branches.View"`, `BRANCHES_MANAGE_PERMISSION = "Branches.Manage"`
- `COMPANY_PROFILE_VIEW_PERMISSION = "CompanyProfile.View"`
- `COMPLIANCE_MANAGE_PERMISSION = "Compliance.Manage"` (the only permission the backend checks for every generation-unit route — there is no separate "view" permission for that feature, so the Generation Units page and every compliance-affecting control on the Branches page are gated on this one constant)

UI behavior: view-only users see data but not the mutating controls (create/edit/status/apply/assign buttons are hidden or disabled); the backend remains the authorization source of truth regardless of what the UI shows.

## 6. Routes / navigation added

- `ROUTES.BRANCHES_ADMIN = "/branches/admin"`, `ROUTES.GENERATION_UNITS_ADMIN = "/compliance/generation-units"` (`src/utils/routes.jsx`)
- Registered in `src/App.jsx` behind `accessGatedPage(..., { permission })`
- Nav items added in `src/utils/navItems.jsx` (Branches gated on `Branches.View`, Generation Units gated on `Compliance.Manage`)
- Localization: `nav.branches` / `nav.generationUnits` added in `src/i18n/translations.js` for ar/en/es/de (the page bodies themselves stay English, matching the existing convention of this exact admin-page family — e.g. `PaymentMethodsAdminPage.jsx` is not localized either).

## 7. Backend gaps discovered (left out, not faked)

1. **Branch provenance is not returned by any Branch endpoint.** The domain entity (`Branch.SourceProfileVersionId` / `SourceProposalOrdinal`) exists and is set once by `FromApprovedProposal`, but `BranchResponse`/`BranchResult` never expose it. The UI's "From approved profile" tag is a **best-effort cross-reference**: it matches a branch's id against the approved profile's `proposedBranches[].materializedBranchId` (only reliable for the *current* approved version, and only when the viewer has `CompanyProfile.View`). This is clearly not the same as reading provenance directly off the branch.
2. **No generation-unit assignment history endpoint** — confirmed there isn't even a history table server-side. Only the current assignment is ever shown.
3. **No endpoint lists which branches use a given generation unit** — only a `assignedBranchCount` on the unit. Discovering the reverse mapping would require calling the per-branch endpoint for every branch, which this implementation does not do speculatively; the Generation Units page shows only the count the backend already computed.
4. **No endpoint to change a generation unit's name or its "default" flag.** Only Name (create-time), Status (activate/deactivate) are mutable.
5. **`UpdateBranchRequest` uses `phoneNumber` while `CreateBranchRequest` uses `phone`** — a genuine backend inconsistency, kept as-is in the TypeScript types rather than "corrected."

## 8. Files changed

New:
- `src/features/branches/types/companyProfile.types.ts`
- `src/features/branches/api/companyProfileApi.ts`
- `src/features/branches/hooks/useCompanyProfile.ts`
- `src/features/branches/components/{ProposedBranchesPanel,BranchesModal,ConfirmActionDialog}.jsx`
- `src/features/branches/pages/BranchesPage.jsx`
- `src/features/generation-units/types/generationUnit.types.ts`
- `src/features/generation-units/api/generationUnitsApi.ts`
- `src/features/generation-units/hooks/useGenerationUnits.ts`
- `src/features/generation-units/pages/GenerationUnitsPage.jsx`
- `src/Pages/BranchesAdminPage/BranchesAdminPage.jsx`, `src/Pages/GenerationUnitsAdminPage/GenerationUnitsAdminPage.jsx` (thin re-export wrappers, matching the existing `src/Pages/*` routing convention)

Modified:
- `src/features/branches/types/branch.types.ts` (added `UpdateBranchAddress`/`UpdateBranchRequest`/`ChangeBranchStatusRequest`)
- `src/features/branches/api/branchesApi.ts` (added `getBranchDetails`, `updateBranch`, `changeBranchStatus`)
- `src/features/branches/hooks/useBranches.ts` (added `useBranchDetails`, `useUpdateBranch`, `useChangeBranchStatus`)
- `src/features/authorization/constants/applicationPermissions.ts` (added the 4 constants listed in §5)
- `src/utils/routes.jsx`, `src/utils/navItems.jsx`, `src/App.jsx`, `src/i18n/translations.js`

## 9–11. Verification

- **Typecheck** (`npx tsc --noEmit`): clean, no errors.
- **Lint** (`npx eslint .`): 3 pre-existing issues only (`I18nContext.jsx` fast-refresh export rule, `vite.config.js` `process` global, `POSPage.jsx` exhaustive-deps warning) — all three confirmed present on `main` before this task via `git stash`; zero new issues from this change.
- **Build** (`npx vite build`): succeeds.
- This was **static contract verification against the real backend source only** — no live backend instance was run this turn, so no live API call was made or is claimed.

## 12. Backend modification confirmation

`git status --short` in `G:\Projects\Nobo` is empty before and after this task — **zero backend files were modified**, added, or deleted. No EdgeAgent file was touched. No ZATCA behavior was changed.
