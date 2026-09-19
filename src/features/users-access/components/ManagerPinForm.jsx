import { useState } from "react";
import { KeyRound } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { useSetCompanyMembershipPin } from "../hooks/useUsersAccess";

// Backend error codes -> localized messages. Never show raw backend exception text when a known
// code exists.
const ERROR_CODE_KEYS = {
  "ManagerPin.Invalid": "usersAccess.pin.errors.invalid",
  "CompanyMembership.NotActive": "usersAccess.pin.errors.notActive",
  "CompanyMembership.NotAvailable": "usersAccess.pin.errors.notAvailable",
  "Authorization.PermissionDenied": "usersAccess.pin.errors.permissionDenied",
  "Authentication.Unauthenticated": "usersAccess.pin.errors.unauthenticated",
};

const PIN_PATTERN = /^\d{4,8}$/;

// Reusable Manager PIN set/change form -- used both from Users & Access (admin managing another
// member, or a member managing their own row) and from the Profile page ("My Manager PIN"). Only
// ever calls PUT .../memberships/{membershipId}/pin with the NEW pin; the backend endpoint has no
// "current PIN" field, so none is collected here (Section 3 of the approved design).
//
// Security: the pin/confirmPin values live ONLY in this component's local useState -- never
// localStorage/sessionStorage/URL/React Query cache, never logged, cleared immediately after every
// submit attempt (success or failure). The only "is a PIN set" signal ever shown is the mutation's
// own confirmed response (`hasPinSet`) for the remainder of this mounted instance -- there is no
// backend field anywhere to know a membership's PIN status ahead of time, so this component never
// claims to know the PRIOR state; the action is always phrased as "Set / Change" and only reports
// status AFTER a successful update in this session.
export function ManagerPinForm({ companyId, membershipId, disabled = false, onSuccess }) {
  const { t } = useI18n();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [confirmedAtUtc, setConfirmedAtUtc] = useState(null);

  const mutation = useSetCompanyMembershipPin(companyId);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (disabled || mutation.isPending) return;

    if (!PIN_PATTERN.test(pin)) {
      setError(t("usersAccess.pin.errors.format"));
      return;
    }

    if (pin !== confirmPin) {
      setError(t("usersAccess.pin.errors.mismatch"));
      return;
    }

    setError("");

    try {
      const result = await mutation.mutateAsync({ membershipId, payload: { pin } });
      // Cleared immediately, success or failure -- never left sitting in the form.
      setPin("");
      setConfirmPin("");
      setConfirmedAtUtc(result.pinSetAtUtc);
      onSuccess?.();
    } catch (mutationError) {
      setPin("");
      setConfirmPin("");
      const key = ERROR_CODE_KEYS[mutationError?.code];
      setError(key ? t(key) : mutationError?.message || t("usersAccess.pin.errors.generic"));
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-[11px] leading-4 text-slate-500">{t("usersAccess.pin.explanation")}</p>

      {confirmedAtUtc && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
          {t("usersAccess.pin.confirmedNotice")}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-400">
            {t("usersAccess.pin.newLabel")}
          </span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(event) => {
              setPin(event.target.value);
              setError("");
            }}
            disabled={disabled || mutation.isPending}
            placeholder={t("usersAccess.pin.placeholder")}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-400">
            {t("usersAccess.pin.confirmLabel")}
          </span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={confirmPin}
            onChange={(event) => {
              setConfirmPin(event.target.value);
              setError("");
            }}
            disabled={disabled || mutation.isPending}
            placeholder={t("usersAccess.pin.placeholder")}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>

        {error && (
          <div className="sm:col-span-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-100">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={disabled || mutation.isPending || !pin || !confirmPin}
          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
        >
          <KeyRound size={14} />
          {mutation.isPending ? t("usersAccess.pin.saving") : t("usersAccess.pin.saveButton")}
        </button>
      </form>
    </div>
  );
}
