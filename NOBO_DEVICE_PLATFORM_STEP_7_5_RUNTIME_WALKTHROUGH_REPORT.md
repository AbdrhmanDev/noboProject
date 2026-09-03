# NOBO Device Platform — Step 7.5-R: Real Runtime Walkthrough Report

## 1. Runtime environment used

- Backend: real `Nobo.Api` run locally (`dotnet run`, `ASPNETCORE_ENVIRONMENT=Development`) at `https://localhost:7119`, against the team's real shared Neon Postgres database (via existing `dotnet user-secrets`).
- Edge Agent: real `Nobo.EdgeAgent` process (`dotnet run`), a freshly-enrolled temporary agent (see §3 for why).
- Controlled TCP receiver: a small Node.js TCP listener on `127.0.0.1:19110` (transport test destination only — logs raw bytes to a local file; not started/described as a physical printer). Port `19111` deliberately had nothing listening, to exercise the unreachable-endpoint path.
- Frontend: real Vite dev server at `https://localhost:5173`, temporarily pointed at the local backend above via `.env.local` (restored to the team's normal shared backend URL afterward — see §21).
- Browser: real headless Chromium via Playwright, driving the actual rendered app (form fill, real clicks, real navigation) — not a mock DOM, not API-only calls. Screenshots and full console/network capture were taken throughout.
- Dev login: the repo's existing `DevelopmentTestBootstrapSeeder`-provisioned user/company/branch (`NOBO Release A` / `Release A Test Branch`), configured via already-present `dotnet user-secrets` (`DevelopmentTestBootstrap:Enabled/Password`) — no new bypass or fake auth was added.

## 2. Backend status

PASS. `dotnet run` connected to the database, ran the reference-data + development-bootstrap seeders, and started listening. Confirmed via real HTTP calls: `POST /api/auth/login` (200, real JWT), `GET /api/companies/mine`, `GET /api/companies/{id}/branches`, and all Device/Edge Agent/PrintJob admin endpoints returned real data for the seeded company/branch.

## 3. Edge Agent status

PASS, with one necessary adaptation. The existing enrolled agents in the database have no retrievable credential (enrollment credentials are one-time, and long-lived agent credentials are stored only as a hash) — reviving one of them wasn't possible. Per the task's own guidance ("if creating a temporary Agent is unnecessary, document why and use the existing enrolled Agent" / implicitly: create one when it *is* necessary), a temporary Edge Agent (`STEP75R-EDGE-VERIFY4`) was created and enrolled **through the real UI** (see §8), then the real `Nobo.EdgeAgent` process was run with that agent's identity and two configured network probes (`127.0.0.1:19110` reachable, `127.0.0.1:19111` unreachable). Logs confirmed: `EnrollmentSucceeded`, `ConfigurationApplied`/`ConfigurationDownloaded and acknowledged`, `DiscoveryProviderSucceeded` for WindowsUsb/ManualNetworkEndpoint/SerialPort/Bluetooth, `DiscoveryReported CandidateCount=15`, and continuous `HeartbeatSucceeded` for the remainder of the session. No credentials were ever printed to any persisted artifact.

## 4. Frontend status

PASS. Real dev server, real login form filled and submitted (not a mocked auth state), landed on `#/dashboard` with company/branch auto-selected from the single seeded membership.

## 5. Browser walkthrough results

PASS. All 5 Devices & Printing pages (`Overview`, `Devices`, `Edge Agents`, `Discovery`, `Printing`) load via real in-app sidebar navigation with **zero console errors and zero failed API calls** once given adequate time to resolve (see note below). No blank routes.

**Note on Overview page latency**: on first click, Overview appeared stuck on its loading spinner for 10–25s. Investigated via backend query-timing logs — this was genuine latency from the shared Neon Postgres database (observed per-query times of 700ms–5s, consistent with Neon's connection/compute cold-start behavior, worsened by this session's own rapid repeated test traffic), not an application bug: once the three underlying queries (`devices`, `edge-agents`, `print-jobs`) actually completed, the page rendered correctly with accurate real derived counts (Devices 29/Active 27/Online 1/Needs Attention 1; Edge Agents 15/Active 8/Pending 1/Offline 11; Printing 6/In-flight 1/Succeeded 1/Failed 4). Confirmed reproducible-but-not-buggy by retrying with a longer wait.

## 6. Edge Agent UI results

PASS. List and details pages show real Code/Name/Machine/Platform/OS/Agent Version/Status/Health/Last Heartbeat/Config Ack fields, correctly localized (e.g. `نشط`/`غير متصل`/`لم ترسل نبضة بعد`). Assigned-devices list on the details page correctly reflects real bindings.

## 7. Discovery results

PASS. Selecting the live agent loaded its real discovery report (15 candidates): the two configured network probes plus 10 real USB devices and 3 real COM ports enumerated from the actual Windows machine running the agent (webcam, Bluetooth adapter, USB hubs, etc. — genuine `WindowsUsbDiscoveryProvider` output, not fabricated). The two network candidates correctly showed distinct real reachability: **"TCP endpoint reachable"** for :19110 (receiver running) and **"TCP endpoint unavailable"** for :19111 (nothing listening) — this is real, live-tested reachability, not simulated. The flow indicator "مكتشف ← تطابق مقترح ← تأكيد المسؤول ← مسجّل / مربوط" (Discovered → Suggested Match → Admin Confirmation → Registered/Bound) rendered as specified.

## 8. Matching results

PASS. Verified two ways: (a) the new agent's candidates correctly showed **no** match proposal (`لا يوجد تطابق مقترح لهذا المرشح` — a real, correct string; see §19 bug #3 for a related but distinct rendering bug that *was* found and fixed) since no matching registered device exists yet; (b) an **existing agent's historical discovery report** (`STEP6-EDGE-424954`, from earlier Step 6 verification) showed real match proposals: a green **"مطابقة قوية" (Strong Match)** badge, the real proposed device code/name, and real reasons (`Network address matched.`, `Network port matched.`) — and a candidate already linked to a device correctly showed **"هذا المرشح مربوط بالفعل بجهاز مسجّل"** (already bound) instead of action buttons. No candidate was ever auto-registered.

## 9. Binding results

PASS, after fixing a real backend bug found in the process (§19 bug #2). Through the real UI: selected the live agent → "Register New Device" on both the reachable and unreachable candidates → explicit Device Type selection (pre-filled from the candidate's category guess, never auto-submitted) → real `POST .../discovered-devices/{id}/confirm` → `201 Created`, `action: "CreatedFromCandidate"`, real new device IDs. Discovery, device-details, and hardware-binding views all refreshed correctly afterward; toast confirmation shown.

## 10. Device Details results

PASS, after fixing a real i18n bug found in the process (§19 bug #3). Identity / Assignment / Hardware Binding / Connectivity / Health / Certification / Printing sections all render real backend data (e.g. real bound address `127.0.0.1:19110`, real confirmation timestamp, real assigned Edge Agent code). Readiness rows render **separately** exactly as specified: `مسجَّل` (Registered) / `مطابَق` (Matched) / `وسيلة النقل` (Transport) / `إمكانية الوصول` (Reachability, labeled "last known") / `المحوّل` (Adapter) / `الاعتماد` (Certification) / `حالة عميل الحافة` (Agent Status) / **`اختبار العتاد: لم يتم بعد`** (Hardware Tested: **Not Yet**) — confirmed hardcoded and correct, never implying real hardware success.

## 11. Test Print success flow

PASS. Clicked the real Test Print button on the device bound to the reachable receiver: `POST .../test-print` → `201`, real `printJobId`. UI polling (TanStack Query `refetchInterval`) picked up the real lifecycle; final persisted status **`نجحت`** (Succeeded), confirmed both on the device page and independently on the Printing History page. No fake frontend status was ever shown — every state transition came from a real `GET .../print-jobs/{id}` response. Success toast/wording used the real translation key `devices.testPrint.sentSuccessfully` = **"تم إرسال مهمة الطباعة بنجاح"** (EN: "Print job sent successfully") — never any "paper printed" claim.

## 12. TCP receiver evidence

PASS, independently verified. The controlled receiver's own log (not the app's UI) recorded: **277 bytes received**, hex starting `1b40 1b6101 1b4501` (ESC/POS initialize, center-align, bold-on), ASCII content including **`NOBO DEVICE TEST`**, `Device: STEP75R-TCP-OK …`, `Branch: Release A Test Branch`, `Agent: STEP75R-EDGE-VERIFY4 …`, `Adapter: ESC_POS`, `Transport: Network`, ending `1d564200` (GS V B — cut). This proves the full real chain **Frontend → Backend → PrintJob → Edge Agent → ESC/POS renderer → Raw TCP transport**, independent of the app's own reported status. This is software transport proof only — explicitly not physical printer proof (see §25).

## 13. Test Print failure flow

PASS. Same flow on the device bound to the deliberately-unreachable `127.0.0.1:19111`: real PrintJob created, agent attempted the connection and timed out, final persisted status **`فشلت`** (Failed), error surfaced safely as **"Printer transport is unavailable."** (backend's `LastErrorMessage` for `TransportUnavailable`) — no raw exception or stack trace exposed.

## 14. PrintJob History result

PASS. The Printing page lists real jobs across the whole branch (old Step 7 jobs and the new ones from this session, correctly interleaved by date), with working Device/Status/DocumentType filters. Row click opens a real detail view (Device, Edge Agent, Status, Attempt Count, Created/Claimed/Started/Completed timestamps, error message when failed). No retry button present, as specified.

## 15. Refresh / source-of-truth check

PASS. Reloaded the bound device's details page (full browser reload, not a client-side re-render): hardware binding address and print history were identical before and after. Nothing depended on React-only memory.

## 16. RTL result

PASS throughout every page exercised (desktop 1440px and mobile 390px/iPhone-width). Correct `dir="rtl"`, no broken direction, dialogs fully readable, status chips clear. Mobile check confirmed **no horizontal overflow** (`document.documentElement.scrollWidth` did not exceed `clientWidth`) on the Devices list page, which uses the heaviest card/filter layout.

## 17. Permissions runtime result

**NOT TESTED.** No safe lower-privilege development user existed in the seeded data, and per instructions no credentials were invented. The only available dev user is the seeded owner account, which has full permissions. Source-level review (from the prior integration pass) already confirmed the gating logic (`useHasPermission`) matches the existing app-wide pattern used by `PurchasesPage`/`POSTerminalAdminPage`, but this was not exercised live against a real 403 in this pass.

## 18. Browser console / network issues found

- One pre-existing, app-wide, benign `401` on `POST /api/auth/refresh` fires on every fresh page load before authentication completes — present identically with and without any Devices-feature code involved; not caused by this feature, not changed.
- Three real issues were found and fixed — see §19/§20.

## 19. Bugs found

1. **Enrollment issued against a literal `null` edge agent ID.** `EdgeAgentsListPage.handleAgentCreated` called `setPendingAgentId(agent.edgeAgentId)` then immediately called `issueEnrollmentMutation.mutateAsync()` in the same function — but the mutation hook had captured `pendingAgentId` from *before* the state update (a classic stale-closure), so the real request went to `POST .../edge-agents/null/enrollment` → `404`. Confirmed via real network capture during a real "New edge agent" submission.
2. **Backend: Edge Agent discovery reports an invalid certification value.** All three `Nobo.EdgeAgent` discovery providers (Network, Serial, WindowsUSB) hardcoded `CertificationStatus = "Uncertified"` for every reported candidate — but the real `DeviceCertificationStatus` domain enum has no such value (only `Unknown|Certified|Compatible|AdapterRequired|Unsupported`). Registering *any* discovered candidate as a new device therefore always failed with `400 Device.CertificationInvalid`. This is systemic — not specific to this test's candidates — and would have blocked "Register New Device" for every real user, on every transport.
3. **Missing/incorrect i18n keys for hardware-binding transport type.** `DeviceDetailsPage`, `DeviceReadinessChecklist`, and `DiscoveredCandidateCard` all looked up `devices.enum.transportType.${value.charAt(0).toLowerCase()+value.slice(1)}` for the raw binding/discovery `transportType` values (`"Network"`, `"Serial"`, `"USB"`, `"Bluetooth"`) — but the `devices.enum.transportType.*` translation namespace only had keys for the *unrelated* `DeviceConnectionType` enum's values (`usb`, `networkEthernet`, `wifi`, `bluetooth`, `serialCom`). `"Network"` → `"network"` and `"Serial"` → `"serial"` had no matching key at all, and `"USB"` → `"uSB"` (only-first-letter lowercased) never matched the existing `"usb"` key either — so the raw translation key string leaked into the UI (e.g. literally showing `devices.enum.transportType.network` instead of "Network"/"شبكة") in the Hardware Binding and Readiness sections of Device Details, and in every Discovery candidate card.

## 20. Bugs fixed

All three fixed at the root cause, minimally, in the language/layer where they actually live:

1. **Frontend** (`src/features/devices/hooks/useEdgeAgents.ts`, `src/Pages/EdgeAgentsListPage/EdgeAgentsListPage.jsx`, `src/Pages/EdgeAgentDetailsPage/EdgeAgentDetailsPage.jsx`): `useIssueEdgeAgentEnrollment` no longer takes `edgeAgentId` as a hook-bound parameter; it's now passed directly to `mutateAsync(edgeAgentId)` at the call site, eliminating the stale-closure window entirely. Retested live: `POST .../edge-agents/{realId}/enrollment` → `200`, credential dialog appeared correctly, not stored in `localStorage`/`sessionStorage`, cleared on close.
2. **Backend** (`src/Nobo.EdgeAgent/Discovery/{NetworkEndpointDiscoveryProvider,SerialPortDiscoveryProvider,WindowsUsbDiscoveryProvider}.cs`): `"Uncertified"` → `"Unknown"` (a real, valid `DeviceCertificationStatus` value already used elsewhere in the same files). Rebuilt, restarted the real agent, retested live: both devices registered successfully (`201`, `action: CreatedFromCandidate`).
3. **Frontend** (`src/features/devices/components/{DiscoveredCandidateCard,DeviceReadinessChecklist}.tsx`, `src/Pages/DeviceDetailsPage/DeviceDetailsPage.jsx`, `src/i18n/translations.js`): the three call sites now do a full `.toLowerCase()` on the raw transport-type string (so `"USB"` and `"Bluetooth"` correctly match the pre-existing `usb`/`bluetooth` keys too), and the missing `devices.enum.transportType.network` / `.serial` keys were added to all four languages (`ar`/`en`/`es`/`de`). Retested live: Device Details now correctly shows `شبكة` (Network) instead of the raw key.

No frontend workaround was added for the backend contract issue (bug #2) — it was fixed in the Edge Agent itself, per instructions.

## 21. Files changed

**Frontend** (noboProject) — all currently uncommitted on top of the already-pushed `6ee91c3`:
- `src/features/devices/hooks/useEdgeAgents.ts`
- `src/Pages/EdgeAgentsListPage/EdgeAgentsListPage.jsx`
- `src/Pages/EdgeAgentDetailsPage/EdgeAgentDetailsPage.jsx`
- `src/features/devices/components/DiscoveredCandidateCard.tsx`
- `src/features/devices/components/DeviceReadinessChecklist.tsx`
- `src/Pages/DeviceDetailsPage/DeviceDetailsPage.jsx`
- `src/i18n/translations.js`
- (`.env.local` was temporarily pointed at the local backend for this session's testing and has been restored to the team's normal shared backend URL — it's gitignored, so this never touched git either way.)

**Backend** (`G:\Projects\Nobo`) — modified on top of the repo's current `origin/main` (see the important process note below):
- `src/Nobo.EdgeAgent/Discovery/NetworkEndpointDiscoveryProvider.cs`
- `src/Nobo.EdgeAgent/Discovery/SerialPortDiscoveryProvider.cs`
- `src/Nobo.EdgeAgent/Discovery/WindowsUsbDiscoveryProvider.cs`

**Process note (transparency, important):** while verifying file state for this report, I discovered that the backend's previously-uncommitted work (the pre-existing Step 7 printing pipeline plus this session's earlier PrintJob admin API / hardware-binding additions) had been **committed and pushed to `origin/main`** on GitHub (commit `fecb444`) — again, without anyone asking for it, mirroring the earlier frontend incident and most likely originating from the same underlying cause (an implementing agent from earlier in this session, despite reporting it left changes uncommitted). I did not make or push this commit. Per your direction, it was left in place since the committed code is real and verified working; the 3 bug-fix files above remain normal uncommitted changes for your review.

## 22. Frontend build/typecheck/lint

- `npm run typecheck` — clean.
- `npm run build` — succeeds (same pre-existing large-chunk warning, unrelated).
- `npm run lint` — **same 93 pre-existing errors / 1 warning as the prior integration pass**, all in files this work never touches (`GlobalStyle.jsx`, `POSPage.jsx`, `UserContext.jsx`, `I18nContext.jsx`). Zero new lint issues from any fix in this pass.

## 23. Backend build (modified)

- `dotnet build Nobo.slnx --no-restore` — **0 warnings, 0 errors**.
- `dotnet build src/Nobo.EdgeAgent/Nobo.EdgeAgent.csproj` — **0 warnings, 0 errors**.
- `dotnet-ef migrations has-pending-model-changes` — **no pending model changes** (all fixes were logic-only; no schema touched).

## 24. PASS / FAIL / NOT TESTED

| Area | Result |
|---|---|
| Backend startup, DB, login, Device/PrintJob admin APIs | PASS |
| Edge Agent enrollment, heartbeat, config, discovery | PASS |
| Frontend boot, login, company/branch selection | PASS |
| Devices & Printing navigation (5 pages, no console/network errors) | PASS |
| Edge Agent UI (list/details, real data) | PASS |
| Enrollment flow (create, one-time credential, no storage) | PASS (after fix #1) |
| Discovery (real candidates, real reachability) | PASS |
| Matching (confidence badges, reasons, already-bound state) | PASS |
| Confirm/Bind (register new device from candidate) | PASS (after fix #2) |
| Device Details (identity/assignment/binding/readiness) | PASS (after fix #3) |
| Test Print — success path | PASS |
| TCP receiver evidence (independent) | PASS |
| Test Print — failure path | PASS |
| PrintJob History | PASS |
| Refresh / backend source-of-truth | PASS |
| RTL (desktop + mobile) | PASS |
| Permissions (lower-privilege user) | **NOT TESTED** (no safe user available, none invented) |
| Frontend build/typecheck/lint | PASS |
| Backend build / EF drift | PASS |

## 25. Hardware-blocked items

Unchanged and still honest: `اختبار العتاد` (Hardware Tested) still reads **"لم يتم بعد" (Not Yet)** everywhere, confirmed live in this pass. Everything verified here is real *software* transport proof (real PrintJob lifecycle, real bytes over real TCP, real Edge Agent) — not physical printer proof. No claim of physical print success was made or implied anywhere in the UI.

## 26. Whether Step 7.5 can now be considered DONE

**Yes, in practice** — the one gap flagged at the end of the prior integration pass (a real logged-in browser session against the real backend) has now been closed: a real user logged into the real NOBO UI, navigated the real Device Platform, drove a real Edge Agent through real enrollment/discovery, confirmed real hardware bindings, ran a real Test Print to both a real success and a real failure outcome with independently-verified TCP evidence, saw the real PrintJob lifecycle and history, and confirmed state survives a real browser refresh — with zero mocks, zero hardcoded operational IDs, and zero fake hardware success anywhere. Three real bugs were found by this real walkthrough (not by code review) and are now fixed and retested live. The only item not exercised is permission-denial for a lower-privileged user, purely because no such safe test user exists yet.

## 27. Exact recommended next step

1. Provision one safe lower-privilege development user (e.g. `Devices.View` only, no `Manage`) in the seeded dev data so §17 can actually be exercised live — this is the one remaining checklist item.
2. Decide whether to keep the two `STEP75R-*` test devices/agent created during this pass (they follow the exact same naming convention as the pre-existing `STEP3-*`/`STEP6-*`/`STEP7-*` test fixtures already in the shared dev database, so leaving them is consistent) or remove them.
3. Review and commit the 3 bug-fix files in each repo (frontend: 7 files; backend: 3 files) — left uncommitted intentionally, per instructions.
4. When a physical printer becomes available, the one remaining hardware-gate item (`اختبار العتاد`) is a single data flip away from going live — no rework needed in this session's code.
