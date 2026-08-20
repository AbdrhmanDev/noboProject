import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "../../../i18n/I18nContext";
import { RestaurantModal } from "./RestaurantModal";
import { useOpenTableSession } from "../hooks/useFloorState";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

// Opens a brand-new session for an AVAILABLE table. Seating a specific
// reservation is a different, dedicated action (seatRestaurantReservation)
// that opens its own linked session server-side — this dialog never touches
// reservationId, matching the "no manual reservation linking here" scope.
export function SeatGuestsDialog({ companyId, branchId, table, onClose, onSuccess }) {
  const { t } = useI18n();
  const [guestName, setGuestName] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [isVip, setIsVip] = useState(false);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");

  const openSessionMutation = useOpenTableSession(companyId, branchId);

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");

    const trimmedCount = guestCount.trim();
    if (trimmedCount && (!/^\d+$/.test(trimmedCount) || Number(trimmedCount) <= 0)) {
      setFormError(t("restaurantFloor.form.guestCountInvalid"));
      return;
    }

    try {
      await openSessionMutation.mutateAsync({
        tableId: table.restaurantTableId,
        payload: {
          reservationId: null,
          guestName: guestName.trim() || null,
          guestCount: trimmedCount ? Number(trimmedCount) : null,
          isVip,
          note: note.trim() || null,
        },
      });
      toast.success(t("restaurantFloor.toast.seated", { code: table.code }));
      onSuccess();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <RestaurantModal title={t("restaurantFloor.actions.seatGuests")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-xs text-slate-500">
          {t("restaurantFloor.form.seatingTable", { code: table.code })}
        </p>

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
            placeholder="e.g. 4"
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
          disabled={openSessionMutation.isPending}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {openSessionMutation.isPending
            ? t("restaurantFloor.actions.saving")
            : t("restaurantFloor.actions.seatGuests")}
        </button>
      </form>
    </RestaurantModal>
  );
}
