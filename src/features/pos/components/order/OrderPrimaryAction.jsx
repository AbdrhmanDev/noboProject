import { Ban, Check, CircleCheckBig, Plus, WalletCards } from "lucide-react";
import { formatMoney } from "../../../../shared/utils/formatters";
import { ShortcutHint } from "../../../shortcuts/components/ShortcutHint";
import { getOrderPrimaryAction } from "./getOrderPrimaryAction";

export function OrderPrimaryAction({
  isClosedOrder,
  isCancelledOrder,
  isConfirmedOrder,
  isFullyPaid,
  kitchenReady,
  draftOrder,
  startNewOrder,
  onOpenPayment,
  remainingAmount,
  settlementCurrencyCode,
  settlementMinorUnitDigits,
  readyKitchenTicketCount,
  kitchenTickets,
  closeBlockers,
  canCloseOrder,
  onOpenCloseOrder,
  hasOpenShift,
  canConfirmOrder,
  confirmCurrentOrder,
  goToPayment,
  orderType,
  total,
  catalogCurrencyCode,
  onOpenRetrieve,
}) {
  // `getOrderPrimaryAction` decides eligibility (`disabled`) — the branches
  // below only pick a label/icon for the SAME `kind` it returned, they never
  // re-derive whether the action is allowed.
  const primaryAction = getOrderPrimaryAction({
    isClosedOrder,
    isCancelledOrder,
    isConfirmedOrder,
    isFullyPaid,
    kitchenReady,
    canCloseOrder,
    canConfirmOrder,
    hasOpenShift,
    startNewOrder,
    onOpenPayment,
    onOpenCloseOrder,
    goToPayment,
  });

  if (isClosedOrder || isCancelledOrder) {
    return (
      <button
        type="button"
        onClick={primaryAction.run}
        className="pos-fs-base flex h-14 w-full items-center justify-center gap-2 rounded-pos bg-slate-700 font-bold transition hover:bg-slate-600"
      >
        {isClosedOrder ? <CircleCheckBig size={18} /> : <Ban size={18} />}
        {isClosedOrder
          ? "Closed -"
          : draftOrder?.cancellationKind === "PreparedVoid"
            ? "Prepared Void -"
            : "Cancelled -"}
        <Plus size={16} />
        New Order
        <ShortcutHint action="pos.confirm" className="mr-1" />
      </button>
    );
  }

  if (isConfirmedOrder && !isFullyPaid) {
    // Payment timing is flexible for Dine-In — the order is already
    // confirmed and unpaid at this point (nothing forced payment to open),
    // so this is genuinely just "Pay Now" vs "keep serving and pay later",
    // never a paymentTiming/payLater flag. "Later" makes that explicit
    // instead of leaving it implicit, and reuses the existing Retrieve
    // Order flow (F6) rather than any new modal/state.
    return (
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={primaryAction.run}
          className="pos-fs-base flex h-14 w-full items-center justify-center gap-2 rounded-pos bg-pos-action font-bold text-white transition hover:bg-pos-action-hover"
        >
          <WalletCards size={19} />
          Pay Now · {formatMoney(remainingAmount, settlementCurrencyCode, settlementMinorUnitDigits)}
          <ShortcutHint action="pos.confirm" className="mr-1" />
        </button>
        {orderType === "DineIn" && onOpenRetrieve && (
          <button
            type="button"
            onClick={onOpenRetrieve}
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-bold text-muted transition hover:text-ink"
          >
            Pay Later — continue service
          </button>
        )}
      </div>
    );
  }

  if (isConfirmedOrder && !kitchenReady) {
    return (
      <div className="space-y-2">
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
          <div className="font-bold">Payment complete</div>
          <div className="mt-0.5 text-[10px] text-emerald-200/80">
            Order sent to kitchen · {readyKitchenTicketCount}/{kitchenTickets.length} ready
          </div>
        </div>
        <button
          type="button"
          onClick={primaryAction.run}
          className="pos-fs-base flex h-14 w-full items-center justify-center gap-2 rounded-pos bg-pos-primary font-bold text-white transition hover:bg-pos-primary-hover"
        >
          <Plus size={18} />
          New Order
          <ShortcutHint action="pos.confirm" className="mr-1" />
        </button>
      </div>
    );
  }

  if (isConfirmedOrder) {
    return (
      <div className="space-y-2">
        {closeBlockers.length > 0 && (
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-[10px] leading-4 text-amber-100">
            {closeBlockers[0]}
          </div>
        )}
        <button
          type="button"
          disabled={primaryAction.disabled}
          onClick={primaryAction.run}
          className="pos-fs-base flex h-14 w-full items-center justify-center gap-2 rounded-pos bg-pos-action font-bold text-white transition hover:bg-pos-action-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CircleCheckBig size={19} />
          Close Order
          <ShortcutHint action="pos.confirm" className="mr-1" />
        </button>
      </div>
    );
  }

  // Draft, every order type: primary action always moves straight to
  // Payment (goToPayment, a local phase change — nothing is confirmed yet),
  // so Order → Payment → Edit Order → Payment works before any real payment
  // is recorded, DineIn included. DineIn's genuine "confirm now, pay later"
  // need — send the order to the kitchen without going through Payment at
  // all right now — stays available as its own explicit, clearly-separate
  // action underneath, exactly like the existing post-confirm "Pay Later"
  // affordance below.
  return (
    <div className="space-y-1.5">
      <button
        type="button"
        disabled={primaryAction.disabled}
        onClick={primaryAction.run}
        className="pos-fs-base flex h-14 w-full items-center justify-center gap-2 rounded-pos bg-pos-action font-bold text-white transition hover:bg-pos-action-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        <WalletCards size={19} />
        Payment · {formatMoney(total, catalogCurrencyCode, 2)}
        <ShortcutHint action="pos.confirm" className="mr-1" />
      </button>
      {orderType === "DineIn" && (
        <button
          type="button"
          disabled={primaryAction.disabled}
          onClick={confirmCurrentOrder}
          className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-bold text-muted transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check size={13} />
          Confirm — Pay Later
        </button>
      )}
    </div>
  );
}
