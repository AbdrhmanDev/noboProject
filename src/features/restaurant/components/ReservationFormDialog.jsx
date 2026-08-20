import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "../../../i18n/I18nContext";
import { RestaurantModal } from "./RestaurantModal";
import {
  useCreateRestaurantReservation,
  useUpdateRestaurantReservation,
} from "../hooks/useRestaurantReservations";
import { fromDateTimeLocalValue, toDateTimeLocalValue } from "../utils/restaurantDateTime";

function getErrorMessage(error) {
  // Backend rejects overlapping reservations with a normalized ProblemDetails
  // error — normalizeApiError already turns that into a plain message, so
  // this just needs to surface it, never a raw ProblemDetails object.
  return error?.message || "Request failed.";
}

// Shared create/edit form: restaurantTableId is only ever set at creation
// (UpdateRestaurantReservationRequest has no table field — the backend does
// not support moving a reservation to a different table), so editing shows
// the table as a fixed label instead of a picker.
export function ReservationFormDialog({ companyId, branchId, tables, reservation, onClose, onSuccess }) {
  const { t } = useI18n();
  const isEdit = Boolean(reservation);

  const [restaurantTableId, setRestaurantTableId] = useState(reservation?.restaurantTableId || "");
  const [guestName, setGuestName] = useState(reservation?.guestName || "");
  const [guestCount, setGuestCount] = useState(
    reservation?.guestCount ? String(reservation.guestCount) : "",
  );
  const [startsAt, setStartsAt] = useState(
    reservation ? toDateTimeLocalValue(reservation.startsAtUtc) : "",
  );
  const [endsAt, setEndsAt] = useState(reservation ? toDateTimeLocalValue(reservation.endsAtUtc) : "");
  const [isVip, setIsVip] = useState(Boolean(reservation?.isVip));
  const [note, setNote] = useState(reservation?.note || "");
  const [formError, setFormError] = useState("");

  const createMutation = useCreateRestaurantReservation(companyId, branchId);
  const updateMutation = useUpdateRestaurantReservation(companyId, branchId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const selectedTable = tables.find((table) => table.restaurantTableId === restaurantTableId) || null;

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!isEdit && !restaurantTableId) {
      setFormError(t("restaurantFloor.form.tableRequired"));
      return;
    }
    if (!guestName.trim()) {
      setFormError(t("restaurantFloor.form.guestNameRequired"));
      return;
    }
    const startsAtUtc = fromDateTimeLocalValue(startsAt);
    const endsAtUtc = fromDateTimeLocalValue(endsAt);
    if (!startsAtUtc || !endsAtUtc) {
      setFormError(t("restaurantFloor.form.datesRequired"));
      return;
    }
    if (new Date(endsAtUtc) <= new Date(startsAtUtc)) {
      setFormError(t("restaurantFloor.form.endBeforeStart"));
      return;
    }
    const trimmedCount = guestCount.trim();
    if (trimmedCount && (!/^\d+$/.test(trimmedCount) || Number(trimmedCount) <= 0)) {
      setFormError(t("restaurantFloor.form.guestCountInvalid"));
      return;
    }

    const shared = {
      guestName: guestName.trim(),
      guestCount: trimmedCount ? Number(trimmedCount) : null,
      startsAtUtc,
      endsAtUtc,
      isVip,
      note: note.trim() || null,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ reservationId: reservation.restaurantReservationId, payload: shared });
        toast.success(t("restaurantFloor.toast.reservationUpdated"));
      } else {
        await createMutation.mutateAsync({ restaurantTableId, ...shared });
        toast.success(t("restaurantFloor.toast.reservationCreated"));
      }
      onSuccess();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <RestaurantModal
      title={isEdit ? t("restaurantFloor.reservations.edit") : t("restaurantFloor.reservations.new")}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-3">
        {formError && (
          <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {formError}
          </div>
        )}

        <label className="block text-xs font-semibold text-slate-400">
          {t("restaurantFloor.reservations.table")}
          {isEdit ? (
            <div className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/10 px-3 text-sm leading-[44px] text-slate-300">
              {reservation.restaurantTableCode}
            </div>
          ) : (
            <select
              value={restaurantTableId}
              onChange={(event) => setRestaurantTableId(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60"
            >
              <option value="">{t("restaurantFloor.form.tableSelectPlaceholder")}</option>
              {tables.map((table) => (
                <option key={table.restaurantTableId} value={table.restaurantTableId}>
                  {table.code}
                  {table.floorName ? ` · ${table.floorName}` : ""}
                </option>
              ))}
            </select>
          )}
          {selectedTable?.name && (
            <span className="mt-1 block text-[11px] font-normal text-slate-500">{selectedTable.name}</span>
          )}
        </label>

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

        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-semibold text-slate-400">
            {t("restaurantFloor.reservations.start")}
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-2 text-xs text-white outline-none focus:border-blue-400/60"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-400">
            {t("restaurantFloor.reservations.end")}
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-2 text-xs text-white outline-none focus:border-blue-400/60"
            />
          </label>
        </div>

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
          disabled={isPending}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? t("restaurantFloor.actions.saving")
            : isEdit
              ? t("restaurantFloor.actions.saveChanges")
              : t("restaurantFloor.reservations.new")}
        </button>
      </form>
    </RestaurantModal>
  );
}
