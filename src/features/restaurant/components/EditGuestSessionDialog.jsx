import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "../../../i18n/I18nContext";
import { RestaurantModal } from "./RestaurantModal";
import { useUpdateTableSession } from "../hooks/useFloorState";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

export function EditGuestSessionDialog({ companyId, branchId, table, session, onClose, onSuccess }) {
  const { t } = useI18n();
  const [guestName, setGuestName] = useState(session.guestName || "");
  const [guestCount, setGuestCount] = useState(session.guestCount ? String(session.guestCount) : "");
  const [isVip, setIsVip] = useState(Boolean(session.isVip));
  const [note, setNote] = useState(session.note || "");
  const [formError, setFormError] = useState("");

  const updateSessionMutation = useUpdateTableSession(companyId, branchId);

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");

    const trimmedCount = guestCount.trim();
    if (trimmedCount && (!/^\d+$/.test(trimmedCount) || Number(trimmedCount) <= 0)) {
      setFormError(t("restaurantFloor.form.guestCountInvalid"));
      return;
    }

    try {
      await updateSessionMutation.mutateAsync({
        sessionId: session.restaurantTableSessionId,
        payload: {
          guestName: guestName.trim() || null,
          guestCount: trimmedCount ? Number(trimmedCount) : null,
          isVip,
          note: note.trim() || null,
        },
      });
      toast.success(t("restaurantFloor.toast.sessionUpdated", { code: table.code }));
      onSuccess();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <RestaurantModal title={t("restaurantFloor.actions.editGuestDetails")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {formError && (
          <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {formError}
          </div>
        )}

        <label className="block text-xs font-semibold text-slate-400">
          {t("restaurantFloor.form.guestName")}
          <input
            type="text"
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
            maxLength={200}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60"
          />
        </label>

        <label className="block text-xs font-semibold text-slate-400">
          {t("restaurantFloor.form.guestCount")}
          <input
            type="text"
            inputMode="numeric"
            value={guestCount}
            onChange={(event) => setGuestCount(event.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60"
          />
        </label>

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <input
            type="checkbox"
            checked={isVip}
            onChange={(event) => setIsVip(event.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-black/20 accent-amber-400"
          />
          {t("restaurantFloor.form.vip")}
        </label>

        <label className="block text-xs font-semibold text-slate-400">
          {t("restaurantFloor.form.note")}
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
            className="mt-1 h-20 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white outline-none focus:border-blue-400/60"
          />
        </label>

        <button
          type="submit"
          disabled={updateSessionMutation.isPending}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {updateSessionMutation.isPending ? t("restaurantFloor.actions.saving") : t("restaurantFloor.actions.saveChanges")}
        </button>
      </form>
    </RestaurantModal>
  );
}
