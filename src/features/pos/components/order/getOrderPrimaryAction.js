// Single source of truth for "what does the primary order action currently
// do" — used by both OrderPrimaryAction.jsx (rendering) and the POS page's
// F8 shortcut (execution), so the two can never drift out of sync.
//
// Returns { kind, disabled, run }. `kind` only decides WHICH state we're in;
// labels/icons/formatted money strings stay in OrderPrimaryAction.jsx since
// they need `t()`/formatMoney, which this helper deliberately doesn't own.
export function getOrderPrimaryAction({
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
  confirmCurrentOrder,
}) {
  if (isClosedOrder || isCancelledOrder) {
    return { kind: "newOrder", disabled: false, run: startNewOrder };
  }

  if (isConfirmedOrder && !isFullyPaid) {
    return { kind: "pay", disabled: false, run: onOpenPayment };
  }

  if (isConfirmedOrder && !kitchenReady) {
    return { kind: "newOrder", disabled: false, run: startNewOrder };
  }

  if (isConfirmedOrder) {
    return { kind: "closeOrder", disabled: !canCloseOrder, run: onOpenCloseOrder };
  }

  return { kind: "confirm", disabled: !hasOpenShift || !canConfirmOrder, run: confirmCurrentOrder };
}
