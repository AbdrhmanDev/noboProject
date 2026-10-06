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
        <p className="text-sm leading-5 text-muted">{t("platform.staff.assignAdminHelp")}</p>

        {formError && (
          <div className="rounded-xl border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">
            {formError}
          </div>
        )}

        <label className="block text-sm font-semibold text-muted">
          {t("platform.staff.email")}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="user@example.com"
            className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line"
          />
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-line bg-raised text-sm font-bold text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("platform.actions.cancel")}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex h-11 flex-1 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? t("platform.actions.saving") : t("platform.staff.assign")}
          </button>
        </div>
      </form>
    </PlatformModal>
  );
}
