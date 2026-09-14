import { useState } from "react";
import { useI18n } from "../../../i18n/I18nContext";
import { PlatformModal } from "./PlatformModal";

// V1 deliberately only ever assigns PLATFORM_ADMIN through this UI (see the backend's own
// AssignPlatformStaffRoleHandler remarks) -- PLATFORM_OWNER assignment is not exposed here at all.
export function AssignPlatformAdminDialog({ isPending, onConfirm, onClose }) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");

    const trimmed = email.trim();
    if (!trimmed) {
      setFormError(t("platform.staff.form.emailRequired"));
      return;
    }

    try {
      await onConfirm(trimmed);
    } catch (error) {
      setFormError(error?.message || t("platform.error.message"));
    }
  };

  return (
    <PlatformModal title={t("platform.staff.assignAdmin")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-xs leading-5 text-slate-400">{t("platform.staff.assignAdminHelp")}</p>

        {formError && (
          <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {formError}
          </div>
        )}

        <label className="block text-xs font-semibold text-slate-400">
          {t("platform.staff.email")}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="user@example.com"
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60"
          />
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-sm font-bold text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("platform.actions.cancel")}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex h-11 flex-1 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? t("platform.actions.saving") : t("platform.staff.assign")}
          </button>
        </div>
      </form>
    </PlatformModal>
  );
}
