import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Crown, ExternalLink, Flag, StickyNote, X } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "../../../i18n/I18nContext";
import { StatusBadge } from "../../../shared/components/ui";
import { formatDateTime, formatMoney } from "../../../shared/utils/formatters";
import { ROUTES } from "../../../utils/routes";
import {
  ATTENTION_STATUS_LABEL_KEYS,
  ATTENTION_TYPE_LABEL_KEYS,
  OPERATIONAL_STATE_BADGE_CLASSES,
  OPERATIONAL_STATE_LABEL_KEYS,
  formatElapsedMinutes,
  orderNumberDisplay,
} from "../utils/floorOperationalState";
import {
  useAcknowledgeTableAttention,
  useReleaseTableSession,
  useResolveTableAttention,
} from "../hooks/useFloorState";
import { useSeatRestaurantReservation } from "../hooks/useRestaurantReservations";
import { SeatGuestsDialog } from "./SeatGuestsDialog";
import { EditGuestSessionDialog } from "./EditGuestSessionDialog";
import { ConfirmActionDialog } from "./ConfirmActionDialog";
import { FlagAttentionDialog } from "./FlagAttentionDialog";
import { AttentionIndicator } from "./AttentionIndicator";

function Field({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-2.5">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="mt-0.5 text-xs font-bold text-slate-100">{value ?? "—"}</div>
    </div>
  );
}

function ORDER_STATUS_TONE(status) {
  if (status === "Confirmed") return "success";
  if (status === "Draft") return "info";
  if (status === "Cancelled") return "danger";
  return "neutral";
}

function ATTENTION_STATUS_TONE(status) {
  if (status === "Open") return "danger";
  if (status === "Acknowledged") return "warning";
  return "neutral";
}

function ActiveOrderCard({ order, canViewOrders, onOpenInPos, t }) {
  const paymentTone = order.isFullyPaid ? "success" : order.remainingAmount > 0 ? "warning" : "neutral";
  const paymentLabel = order.isFullyPaid
    ? t("salesOrders.payment.paid")
    : order.remainingAmount > 0
      ? t("salesOrders.payment.partiallyPaid")
      : t("salesOrders.payment.unpaid");

  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1728] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-black text-white">
          {orderNumberDisplay(order.orderNumber, order.orderNumberFormatted)}
        </span>
        <StatusBadge tone={ORDER_STATUS_TONE(order.status)}>{order.status}</StatusBadge>
      </div>
      {canViewOrders && (
        <>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Field
              label={t("restaurantFloor.details.total")}
              value={formatMoney(order.payableAmount, order.currencyCode, order.currencyMinorUnitDigits)}
            />
            <Field
              label={t("restaurantFloor.details.paid")}
              value={formatMoney(order.netPaidAmount, order.currencyCode, order.currencyMinorUnitDigits)}
            />
            <Field
              label={t("restaurantFloor.details.remaining")}
              value={formatMoney(order.remainingAmount, order.currencyCode, order.currencyMinorUnitDigits)}
            />
            <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.025] p-2.5">
              <StatusBadge tone={paymentTone}>{paymentLabel}</StatusBadge>
            </div>
          </div>
          <div className="mt-1.5 text-[10px] text-slate-500">
            {t("restaurantFloor.details.created")}: {formatDateTime(order.createdAtUtc)}
          </div>
        </>
      )}
      <button
        type="button"
        onClick={() => onOpenInPos(order)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-400/30 bg-blue-500/10 py-2 text-xs font-bold text-blue-200 transition hover:bg-blue-500/20"
      >
        <ExternalLink size={13} />
        {t("restaurantFloor.details.openInPos")}
      </button>
    </div>
  );
}

function AttentionCard({ attention, canManage, onAcknowledge, onResolve, isPending, t }) {
  return (
    <div className="rounded-xl border border-rose-400/20 bg-rose-500/[0.04] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-100">{t(ATTENTION_TYPE_LABEL_KEYS[attention.type])}</span>
        <StatusBadge tone={ATTENTION_STATUS_TONE(attention.status)}>
          {t(ATTENTION_STATUS_LABEL_KEYS[attention.status])}
        </StatusBadge>
      </div>
      <p className="mt-1.5 text-xs leading-5 text-slate-300">{attention.note}</p>
      <div className="mt-1.5 text-[10px] text-slate-500">
        {t("restaurantFloor.details.created")}: {formatDateTime(attention.createdAtUtc)}
        {attention.acknowledgedAtUtc && (
          <>
            {" · "}
            {t("restaurantFloor.attention.acknowledgedAt")}: {formatDateTime(attention.acknowledgedAtUtc)}
          </>
        )}
      </div>
      {canManage && attention.status !== "Resolved" && (
        <div className="mt-2 flex gap-1.5">
          {attention.status === "Open" && (
            <button
              type="button"
              onClick={() => onAcknowledge(attention.restaurantTableAttentionId)}
              disabled={isPending}
              className="flex-1 rounded-lg border border-amber-400/30 bg-amber-500/10 py-1.5 text-[11px] font-bold text-amber-200 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("restaurantFloor.attention.acknowledge")}
            </button>
          )}
          <button
            type="button"
            onClick={() => onResolve(attention.restaurantTableAttentionId)}
            disabled={isPending}
            className="flex-1 rounded-lg border border-emerald-400/30 bg-emerald-500/10 py-1.5 text-[11px] font-bold text-emerald-200 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("restaurantFloor.attention.resolve")}
          </button>
        </div>
      )}
    </div>
  );
}

export function RestaurantTableDetailsDrawer({
  table,
  companyId,
  branchId,
  canManage,
  canViewOrders,
  onClose,
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [activeDialog, setActiveDialog] = useState(null);

  const releaseMutation = useReleaseTableSession(companyId, branchId);
  const seatReservationMutation = useSeatRestaurantReservation(companyId, branchId);
  const acknowledgeMutation = useAcknowledgeTableAttention(companyId, branchId);
  const resolveMutation = useResolveTableAttention(companyId, branchId);

  if (!table) return null;

  const state = table.operationalState;
  const session = table.currentSession;
  const nextReservation = table.nextReservation;
  const activeAttentions = table.activeAttentions || [];

  // WAITING_PAYMENT is exactly the backend's own "a Confirmed order still
  // has RemainingAmount > 0" derivation — reusing it here (rather than
  // re-deriving it from activeOrders) is what keeps this single source of
  // truth instead of a second, potentially-divergent client calculation.
  const hasOutstandingBalance = state === "WAITING_PAYMENT";
  const draftOrders = table.activeOrders.filter((order) => order.status === "Draft");

  const canSeatGuests = canManage && state === "AVAILABLE";
  const canEditSession = canManage && Boolean(session) && state !== "UNAVAILABLE";
  const canRelease = canManage && Boolean(session) && !hasOutstandingBalance;
  const canFlagAttention = canManage && Boolean(session);

  const openInPos = (order) => {
    toast.info(
      t("restaurantFloor.toast.retrieveInPos", {
        order: orderNumberDisplay(order.orderNumber, order.orderNumberFormatted),
      }),
    );
    navigate(ROUTES.POS);
  };

  const confirmRelease = async () => {
    if (!session) return;
    try {
      await releaseMutation.mutateAsync(session.restaurantTableSessionId);
      toast.success(t("restaurantFloor.toast.released", { code: table.code }));
      setActiveDialog(null);
    } catch (error) {
      toast.error(error?.message || t("restaurantFloor.error.message"));
    }
  };

  const seatReservation = async () => {
    if (!nextReservation) return;
    try {
      await seatReservationMutation.mutateAsync({
        reservationId: nextReservation.restaurantReservationId,
        payload: { isVip: nextReservation.isVip },
      });
      toast.success(t("restaurantFloor.toast.reservationSeated", { name: nextReservation.guestName }));
    } catch (error) {
      toast.error(error?.message || t("restaurantFloor.error.message"));
    }
  };

  const acknowledgeAttention = async (attentionId) => {
    try {
      await acknowledgeMutation.mutateAsync(attentionId);
      toast.success(t("restaurantFloor.toast.attentionAcknowledged"));
    } catch (error) {
      toast.error(error?.message || t("restaurantFloor.error.message"));
    }
  };

  const resolveAttention = async (attentionId) => {
    try {
      await resolveMutation.mutateAsync(attentionId);
      toast.success(t("restaurantFloor.toast.attentionResolved"));
    } catch (error) {
      toast.error(error?.message || t("restaurantFloor.error.message"));
    }
  };

  // Advisory only — never blocks the confirm action itself, since the
  // backend stays authoritative on whether release is actually allowed
  // (it already blocks on outstanding Confirmed balances on its own; it
  // does not block on Draft orders or unresolved attention).
  const releaseWarnings = [];
  if (draftOrders.length > 0) {
    releaseWarnings.push(t("restaurantFloor.confirm.draftOrderWarning", { count: draftOrders.length }));
  }
  if (activeAttentions.length > 0) {
    releaseWarnings.push(
      t("restaurantFloor.confirm.unresolvedAttentionWarning", { count: activeAttentions.length }),
    );
  }

  return (
    <>
      <aside className="w-full shrink-0 rounded-2xl border border-white/10 bg-[#0c1424] p-4 xl:w-[380px]">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] text-slate-500">{table.floorName}</div>
            <h2 className="text-xl font-black text-white">{table.code}</h2>
            {table.name && <div className="text-xs text-slate-400">{table.name}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label={t("restaurantFloor.details.close")}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${OPERATIONAL_STATE_BADGE_CLASSES[state]}`}
          >
            {t(OPERATIONAL_STATE_LABEL_KEYS[state])}
          </span>
          {table.hasAttention && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300">
              <AttentionIndicator activeAttentions={activeAttentions} />
              {t("restaurantFloor.attention.needsAttention")}
            </span>
          )}
        </div>

        {/* CURRENT SESSION */}
        {session && (
          <section className="mt-4">
            <h3 className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
              {t("restaurantFloor.details.currentSession")}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Field label={t("restaurantFloor.form.guestName")} value={session.guestName} />
              <Field label={t("restaurantFloor.form.guestCount")} value={session.guestCount} />
              <Field
                label={t("restaurantFloor.form.vip")}
                value={
                  session.isVip ? (
                    <span className="flex items-center gap-1 text-amber-300">
                      <Crown size={12} /> {t("restaurantFloor.form.vip")}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
              <Field label={t("restaurantFloor.details.openedAt")} value={formatDateTime(session.openedAtUtc)} />
              <Field
                label={t("restaurantFloor.details.duration")}
                value={t("restaurantFloor.card.elapsedMinutes", { minutes: formatElapsedMinutes(session.openedAtUtc) })}
              />
            </div>

            {/* SESSION NOTE — informational, kept visually distinct from ATTENTION below */}
            {session.note && (
              <div className="mt-2">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  {t("restaurantFloor.details.sessionNote")}
                </div>
                <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-2.5 text-xs text-slate-300">
                  <StickyNote size={14} className="mt-0.5 shrink-0 text-slate-500" />
                  <p className="leading-5">{session.note}</p>
                </div>
              </div>
            )}

            {(canEditSession || canRelease || canFlagAttention) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {canEditSession && (
                  <button
                    type="button"
                    onClick={() => setActiveDialog("edit")}
                    className="flex h-10 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-xs font-bold text-slate-100 hover:bg-white/10"
                  >
                    {t("restaurantFloor.actions.editGuestDetails")}
                  </button>
                )}
                {canFlagAttention && (
                  <button
                    type="button"
                    onClick={() => setActiveDialog("flagAttention")}
                    className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-400/25 bg-rose-500/[0.06] text-xs font-bold text-rose-200 hover:bg-rose-500/15"
                  >
                    <Flag size={13} />
                    {t("restaurantFloor.actions.flagAttention")}
                  </button>
                )}
                {canRelease && (
                  <button
                    type="button"
                    onClick={() => setActiveDialog("release")}
                    className="flex h-10 flex-1 items-center justify-center rounded-xl border border-rose-400/30 bg-rose-500/10 text-xs font-bold text-rose-200 hover:bg-rose-500/20"
                  >
                    {t("restaurantFloor.actions.releaseTable")}
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {/* SETTLE BILL — shown instead of a misleading normal Release action
            whenever a Confirmed order still has a remaining balance. Payment
            itself always happens through POS's own real payment flow
            (Active Orders below); this section never collects money. */}
        {session && hasOutstandingBalance && (
          <section className="mt-4">
            <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-amber-300">
              <AlertTriangle size={13} />
              {t("restaurantFloor.settleBill.title")}
            </h3>
            <p className="text-xs leading-5 text-slate-400">{t("restaurantFloor.settleBill.message")}</p>
          </section>
        )}

        {/* ATTENTION */}
        {session && activeAttentions.length > 0 && (
          <section className="mt-4">
            <h3 className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
              {t("restaurantFloor.attention.title")}
            </h3>
            <div className="space-y-2">
              {activeAttentions.map((attention) => (
                <AttentionCard
                  key={attention.restaurantTableAttentionId}
                  attention={attention}
                  canManage={canManage}
                  onAcknowledge={acknowledgeAttention}
                  onResolve={resolveAttention}
                  isPending={acknowledgeMutation.isPending || resolveMutation.isPending}
                  t={t}
                />
              ))}
            </div>
          </section>
        )}

        {/* ACTIVE ORDERS */}
        {session && (
          <section className="mt-4">
            <h3 className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
              {t("restaurantFloor.details.activeOrders")}
            </h3>
            {!canViewOrders ? (
              <p className="text-xs text-slate-500">{t("restaurantFloor.details.ordersPermissionRequired")}</p>
            ) : table.activeOrders.length === 0 ? (
              <p className="text-xs text-slate-500">{t("restaurantFloor.details.noActiveOrder")}</p>
            ) : (
              <div className="space-y-2">
                {table.activeOrders.map((order) => (
                  <ActiveOrderCard
                    key={order.salesOrderId}
                    order={order}
                    canViewOrders={canViewOrders}
                    onOpenInPos={openInPos}
                    t={t}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* NEXT RESERVATION */}
        {nextReservation && (
          <section className="mt-4">
            <h3 className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
              {t("restaurantFloor.details.nextReservation")}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Field label={t("restaurantFloor.form.guestName")} value={nextReservation.guestName} />
              <Field label={t("restaurantFloor.form.guestCount")} value={nextReservation.guestCount} />
              <Field
                label={t("restaurantFloor.reservations.start")}
                value={formatDateTime(nextReservation.startsAtUtc)}
              />
              <Field
                label={t("restaurantFloor.reservations.end")}
                value={formatDateTime(nextReservation.endsAtUtc)}
              />
            </div>
            {nextReservation.note && (
              <div className="mt-2 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-2.5 text-xs text-slate-300">
                <StickyNote size={14} className="mt-0.5 shrink-0 text-slate-500" />
                <p className="leading-5">{nextReservation.note}</p>
              </div>
            )}
            {canManage && !session && (
              <button
                type="button"
                onClick={seatReservation}
                disabled={seatReservationMutation.isPending}
                className="mt-3 flex h-10 w-full items-center justify-center rounded-xl bg-violet-600 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {seatReservationMutation.isPending
                  ? t("restaurantFloor.actions.saving")
                  : t("restaurantFloor.actions.seatReservation")}
              </button>
            )}
          </section>
        )}

        {canSeatGuests && (
          <button
            type="button"
            onClick={() => setActiveDialog("seat")}
            className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white transition hover:brightness-110"
          >
            {t("restaurantFloor.actions.seatGuests")}
          </button>
        )}
      </aside>

      {activeDialog === "seat" && (
        <SeatGuestsDialog
          companyId={companyId}
          branchId={branchId}
          table={table}
          onClose={() => setActiveDialog(null)}
          onSuccess={() => setActiveDialog(null)}
        />
      )}

      {activeDialog === "edit" && session && (
        <EditGuestSessionDialog
          companyId={companyId}
          branchId={branchId}
          table={table}
          session={session}
          onClose={() => setActiveDialog(null)}
          onSuccess={() => setActiveDialog(null)}
        />
      )}

      {activeDialog === "flagAttention" && session && (
        <FlagAttentionDialog
          companyId={companyId}
          branchId={branchId}
          table={table}
          session={session}
          onClose={() => setActiveDialog(null)}
          onSuccess={() => setActiveDialog(null)}
        />
      )}

      {activeDialog === "release" && session && (
        <ConfirmActionDialog
          title={t("restaurantFloor.actions.releaseTable")}
          message={t("restaurantFloor.confirm.releaseMessage", { code: table.code })}
          confirmLabel={t("restaurantFloor.actions.releaseTable")}
          isPending={releaseMutation.isPending}
          onConfirm={confirmRelease}
          onClose={() => setActiveDialog(null)}
          extraWarnings={releaseWarnings}
        />
      )}
    </>
  );
}
