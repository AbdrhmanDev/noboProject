// Smallest clean continuation mechanism for the invitation-aware registration flow (Section 1.4,
// hardened in Section 12 of the Permission-Driven Tenant Application Shell task).
//
// Decision: localStorage, not sessionStorage. Considered and rejected sessionStorage because the
// flow this exists for is specifically Register -> Confirm Email -> Login, and the confirmation
// link is opened by clicking it inside an email client -- which opens a brand-new top-level
// browser window/tab with its own empty sessionStorage, completely unrelated to the tab the user
// registered in. That would silently break the exact continuation this mechanism exists for.
// localStorage is shared across tabs/windows of the same browser profile and is the only
// mechanism that survives that hop, matching the existing convention used by CompanyContext
// ("nobo.currentCompanyId") and BranchContext ("nobo.currentBranchId").
//
// This is a TEMPORARY pointer, not a permanent record and not a security boundary -- the backend
// (PreviewCompanyInvitationHandler/AcceptCompanyInvitationHandler) is still the sole authority on
// whether the invitation is actually valid. It holds only the invitation's raw token (already the
// least-sensitive form -- the same value already sits in the emailed link URL) plus a stored-at
// timestamp, and is cleared as soon as it stops being useful:
//   - accepted (InviteAcceptPage, on success)
//   - found Cancelled/Expired/Accepted on the preview page (InviteAcceptPage, terminal states)
//   - simply abandoned for longer than MAX_AGE_MS (self-heals here, on next read)
// It is never logged and never sent to analytics.
const STORAGE_KEY = "nobo.pendingInvitationToken";

// Independent of the invitation's own (longer, backend-authoritative) expiry -- this only bounds
// how long an abandoned Register/Confirm/Login attempt is allowed to keep a stale pointer around
// client-side. Re-opening the invitation link (InviteAcceptPage's mount effect) re-stamps this,
// so an actively-in-progress flow never goes stale mid-way.
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

type StoredInvitation = {
  token: string;
  storedAtUtc: string;
};

function readStored(): StoredInvitation | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredInvitation>;
    if (!parsed || typeof parsed.token !== "string" || typeof parsed.storedAtUtc !== "string") {
      return null;
    }

    return { token: parsed.token, storedAtUtc: parsed.storedAtUtc };
  } catch {
    // Covers both storage-access failures and a malformed/legacy value -- either way, there is
    // no usable pending invitation.
    return null;
  }
}

export function getPendingInvitationToken(): string | null {
  const stored = readStored();
  if (!stored) return null;

  const storedAtMs = new Date(stored.storedAtUtc).getTime();
  const ageMs = Date.now() - storedAtMs;

  if (!Number.isFinite(storedAtMs) || ageMs > MAX_AGE_MS) {
    clearPendingInvitationToken();
    return null;
  }

  return stored.token;
}

export function setPendingInvitationToken(token: string): void {
  try {
    const record: StoredInvitation = { token, storedAtUtc: new Date().toISOString() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // ignore storage failures
  }
}

export function clearPendingInvitationToken(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
}

export function buildInviteAcceptPath(token: string): string {
  return `/invite/${encodeURIComponent(token)}`;
}
