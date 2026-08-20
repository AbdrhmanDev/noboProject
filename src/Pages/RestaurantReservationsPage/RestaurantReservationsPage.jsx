import { useMemo, useState } from "react";
import { CalendarClock, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "../../shared/components/ui";
import { formatDateTime } from "../../shared/utils/formatters";
import { useI18n } from "../../i18n/I18nContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import { useFloorState } from "../../features/restaurant/hooks/useFloorState";
import {
  useCancelRestaurantReservation,
  useNoShowRestaurantReservation,
  useRestaurantReservations,
  useSeatRestaurantReservation,
} from "../../features/restaurant/hooks/useRestaurantReservations";
import { ReservationFormDialog } from "../../features/restaurant/components/ReservationFormDialog";
import { ConfirmActionDialog } from "../../features/restaurant/components/ConfirmActionDialog";
import { ROUTES } from "../../utils/routes";

const RESTAURANT_VIEW_PERMISSION = "Restaurant.View";
const RESTAURANT_MANAGE_PERMISSION = "Restaurant.Manage";
const PAGE_SIZE = 25;
const STATUS_OPTIONS = ["Booked", "Seated", "Completed", "Cancelled", "NoShow"];

const STATUS_TONE = {
  Booked: "info",
  Seated: "success",
  Completed: "neutral",
  Cancelled: "danger",
  NoShow: "warning",
};

const STATUS_LABEL_KEYS = {
  Booked: "restaurantFloor.reservations.status.booked",
  Seated: "restaurantFloor.reservations.status.seated",
  Completed: "restaurantFloor.reservations.status.completed",
  Cancelled: "restaurantFloor.reservations.status.cancelled",
  NoShow: "restaurantFloor.reservations.status.noShow",
};

export default function RestaurantReservationsPage() {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();

  const [status, setStatus] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [dialog, setDialog] = useState(null); // { type: "create" | "edit", reservation? }
  const [confirmAction, setConfirmAction] = useState(null); // { type: "cancel" | "noShow", reservation }

  const viewPermissionQuery = useHasPermission(currentCompanyId, RESTAURANT_VIEW_PERMISSION);
  const managePermissionQuery = useHasPermission(currentCompanyId, RESTAURANT_MANAGE_PERMISSION);
  const canQuery =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !viewPermissionQuery.isLoading &&
    viewPermissionQuery.hasPermission;
  const canManage = !managePermissionQuery.isLoading && managePermissionQuery.hasPermission;

  const filters = useMemo(() => ({ pageNumber, pageSize: PAGE_SIZE, status }), [pageNumber, status]);
  const reservationsQuery = useRestaurantReservations(currentCompanyId, currentBranchId, filters, canQuery);
  const reservations = reservationsQuery.data?.items || [];

  // Tables (with code/floor) for the New/Edit Reservation table picker —
  // floor-state already carries exactly that, and React Query dedupes this
  // against the Floor page's own identical query instead of double-fetching.
  const floorStateQuery = useFloorState(currentCompanyId, currentBranchId, {}, canManage);
  const { tables } = floorStateQuery;

  const cancelMutation = useCancelRestaurantReservation(currentCompanyId, currentBranchId);
  const noShowMutation = useNoShowRestaurantReservation(currentCompanyId, currentBranchId);
  const seatMutation = useSeatRestaurantReservation(currentCompanyId, currentBranchId);

  const runConfirm = async () => {
    if (!confirmAction) return;
    const { type, reservation } = confirmAction;
    try {
      if (type === "cancel") {
        await cancelMutation.mutateAsync(reservation.restaurantReservationId);
        toast.success(t("restaurantFloor.toast.reservationCancelled"));
      } else {
        await noShowMutation.mutateAsync(reservation.restaurantReservationId);
        toast.success(t("restaurantFloor.toast.reservationNoShow"));
      }
      setConfirmAction(null);
    } catch (error) {
      toast.error(error?.message || t("restaurantFloor.error.message"));
    }
  };

  const seatReservation = async (reservation) => {
    try {
      await seatMutation.mutateAsync({
        reservationId: reservation.restaurantReservationId,
        payload: { isVip: reservation.isVip },
      });
      toast.success(t("restaurantFloor.toast.reservationSeated", { name: reservation.guestName }));
    } catch (error) {
      toast.error(error?.message || t("restaurantFloor.error.message"));
    }
  };

  return (
    <AppLayout activePath={ROUTES.RESTAURANT_RESERVATIONS}>
      <main className="space-y-4" dir="rtl">
        <header className="rounded-2xl border border-white/10 bg-[#0c1424]/85 p-4 shadow-xl shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CalendarClock size={16} className="text-blue-300" />
                {t("nav.restaurant")}
              </div>
              <h1 className="mt-1 text-2xl font-black text-white">{t("restaurantFloor.reservations.title")}</h1>
              <p className="mt-0.5 text-[11px] text-slate-500">{t("restaurantFloor.reservations.subtitle")}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => reservationsQuery.refetch()}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
              >
                <RefreshCw size={14} />
                {t("restaurantFloor.refresh")}
              </button>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setDialog({ type: "create" })}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:brightness-110"
                >
                  <Plus size={14} />
                  {t("restaurantFloor.reservations.new")}
                </button>
              )}
            </div>
          </div>
        </header>

        {!currentCompanyId || !currentBranchId ? (
          <EmptyState
            title={t("restaurantFloor.companyBranchRequired.title")}
            message={t("restaurantFloor.companyBranchRequired.message")}
          />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label={t("restaurantFloor.loading")} />
        ) : !viewPermissionQuery.hasPermission ? (
          <ErrorState
            title={t("restaurantFloor.permissionRequired.title")}
            message={t("restaurantFloor.permissionRequired.message")}
          />
        ) : (
          <>
            <section className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#0c1424] p-3">
              <button
                type="button"
                onClick={() => {
                  setStatus("");
                  setPageNumber(1);
                }}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                  status === ""
                    ? "border-blue-400/70 bg-blue-500/15 text-blue-100"
                    : "border-white/10 bg-black/10 text-slate-400 hover:bg-white/10"
                }`}
              >
                {t("restaurantFloor.filters.all")}
              </button>
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setStatus(option);
                    setPageNumber(1);
                  }}
                  className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                    status === option
                      ? "border-blue-400/70 bg-blue-500/15 text-blue-100"
                      : "border-white/10 bg-black/10 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {t(STATUS_LABEL_KEYS[option])}
                </button>
              ))}
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
              {reservationsQuery.isLoading && <LoadingState label={t("restaurantFloor.loading")} />}
              {reservationsQuery.isError && (
                <>
                  <ErrorState
                    title={t("restaurantFloor.error.title")}
                    message={reservationsQuery.error?.message || t("restaurantFloor.error.message")}
                  />
                  <button
                    type="button"
                    onClick={() => reservationsQuery.refetch()}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.035] py-2 text-xs font-bold text-slate-100 hover:bg-white/10"
                  >
                    {t("restaurantFloor.retry")}
                  </button>
                </>
              )}
              {!reservationsQuery.isLoading && !reservationsQuery.isError && reservations.length === 0 && (
                <EmptyState
                  title={t("restaurantFloor.reservations.empty.title")}
                  message={t("restaurantFloor.reservations.empty.message")}
                />
              )}

              {!reservationsQuery.isLoading && !reservationsQuery.isError && reservations.length > 0 && (
                <div className="space-y-2">
                  {reservations.map((reservation) => (
                    <div
                      key={reservation.restaurantReservationId}
                      className="rounded-xl border border-white/10 bg-[#0d1728] p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">{reservation.guestName}</span>
                          <StatusBadge tone={STATUS_TONE[reservation.status]}>
                            {t(STATUS_LABEL_KEYS[reservation.status])}
                          </StatusBadge>
                          {reservation.isVip && (
                            <StatusBadge tone="warning">{t("restaurantFloor.form.vip")}</StatusBadge>
                          )}
                          {reservation.note && (
                            <span className="text-[10px] text-slate-500">{t("restaurantFloor.reservations.hasNote")}</span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-blue-200">{reservation.restaurantTableCode}</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                        <span>
                          {t("restaurantFloor.reservations.start")}: {formatDateTime(reservation.startsAtUtc)}
                        </span>
                        <span>
                          {t("restaurantFloor.reservations.end")}: {formatDateTime(reservation.endsAtUtc)}
                        </span>
                        {reservation.guestCount != null && (
                          <span>{t("restaurantFloor.card.guestCount", { count: reservation.guestCount })}</span>
                        )}
                      </div>

                      {canManage && reservation.status === "Booked" && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => seatReservation(reservation)}
                            disabled={seatMutation.isPending}
                            className="rounded-lg bg-violet-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {t("restaurantFloor.actions.seatReservation")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDialog({ type: "edit", reservation })}
                            className="rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[11px] font-bold text-slate-100 hover:bg-white/10"
                          >
                            {t("restaurantFloor.reservations.edit")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmAction({ type: "noShow", reservation })}
                            className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-200 hover:bg-amber-500/20"
                          >
                            {t("restaurantFloor.reservations.noShow")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmAction({ type: "cancel", reservation })}
                            className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-200 hover:bg-rose-500/20"
                          >
                            {t("restaurantFloor.reservations.cancel")}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {reservationsQuery.data && reservationsQuery.data.totalPages > 1 && (
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                  <button
                    type="button"
                    disabled={pageNumber <= 1}
                    onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
                    className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t("salesOrders.pagination.previous")}
                  </button>
                  <span className="text-xs text-slate-400">
                    {t("salesOrders.pagination.page", {
                      current: reservationsQuery.data.pageNumber,
                      total: reservationsQuery.data.totalPages,
                    })}
                  </span>
                  <button
                    type="button"
                    disabled={pageNumber >= reservationsQuery.data.totalPages}
                    onClick={() => setPageNumber((page) => page + 1)}
                    className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t("salesOrders.pagination.next")}
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {dialog && (
        <ReservationFormDialog
          companyId={currentCompanyId}
          branchId={currentBranchId}
          tables={tables}
          reservation={dialog.type === "edit" ? dialog.reservation : null}
          onClose={() => setDialog(null)}
          onSuccess={() => setDialog(null)}
        />
      )}

      {confirmAction && (
        <ConfirmActionDialog
          title={
            confirmAction.type === "cancel"
              ? t("restaurantFloor.reservations.cancel")
              : t("restaurantFloor.reservations.noShow")
          }
          message={
            confirmAction.type === "cancel"
              ? t("restaurantFloor.confirm.cancelReservationMessage", { name: confirmAction.reservation.guestName })
              : t("restaurantFloor.confirm.noShowMessage", { name: confirmAction.reservation.guestName })
          }
          confirmLabel={
            confirmAction.type === "cancel"
              ? t("restaurantFloor.reservations.cancel")
              : t("restaurantFloor.reservations.noShow")
          }
          isPending={cancelMutation.isPending || noShowMutation.isPending}
          onConfirm={runConfirm}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </AppLayout>
  );
}
