import { OrderHeader } from "./OrderHeader";
import { OrderLines } from "./OrderLines";
import { OrderSummary } from "./OrderSummary";
import { OrderSecondaryActions } from "./OrderSecondaryActions";
import { OrderPrimaryAction } from "./OrderPrimaryAction";

export function OrderSidebar({
  // OrderHeader
  navigate,
  draftLines,
  customer,
  setCustomer,
  onOpenCustomer,
  draftOrder,
  isCancelledOrder,
  isConfirmedOrder,
  isClosedOrder,
  orderType,
  canEditDraft,
  isDraftMutationPending,
  handleOrderTypeChange,
  selectedRestaurantTable,
  restaurantPermissionQuery,
  seatingQuery,
  effectiveRestaurantTableId,
  handleTableSelect,
  currentCompanyId,
  currentBranchId,
  invalidateRestaurantSeating,
  // OrderLines
  catalogCurrencyCode,
  changeQty,
  removeDraftLine,
  isLinePending,
  selectedLineId,
  onSelectLine,
  onEditQuantity,
  // OrderSummary
  onOpenDiscount,
  subtotal,
  discountValue,
  vat,
  total,
  shouldShowPaymentPanel,
  netPaidAmount,
  settlementCurrencyCode,
  settlementMinorUnitDigits,
  remainingAmount,
  isFullyPaid,
  // OrderSecondaryActions
  preparationStarted,
  canRequestPreparedVoid,
  canRequestCancel,
  openLifecycleModal,
  lifecycleBlocker,
  cancelPermissionQuery,
  voidPreparedPermissionQuery,
  holdOrder,
  onOpenRetrieve,
  onOpenCashMovement,
  paymentsViewPermissionQuery,
  canRefundPayments,
  openRefundModal,
  // OrderPrimaryAction
  kitchenReady,
  startNewOrder,
  onOpenPayment,
  readyKitchenTicketCount,
  kitchenTickets,
  closeBlockers,
  canCloseOrder,
  onOpenCloseOrder,
  hasOpenShift,
  canConfirmOrder,
  confirmCurrentOrder,
  goToPayment,
}) {
  return (
    // `xl:h-[calc(100vh-21rem)]` — a *definite* height, not just a cap —
    // accounts for the real chrome stacked above this sidebar on the POS
    // page (shift banner + toolbar + phase indicator + this element's own
    // sticky offset). The old `calc(100vh-2rem)` assumed the sidebar
    // started almost at the top of the viewport, which it never does, so
    // totals/the primary CTA could render below the fold with nothing wrong
    // visible until measured. It also had to be `max-height`, which turned
    // out to be a second bug: a flex child only grows into a parent's
    // *leftover* space when the parent has a definite height — with only a
    // max-height, the aside just shrank to fit its natural content instead
    // of filling the viewport, so OrderLines' flex-1 never got the extra
    // room a taller screen (e.g. 1920x1080) actually has to give it. No
    // `min-h` here: it used to force 620px regardless of viewport, fighting
    // this sizing at short viewports. `overflow-y-auto` stays only as a
    // last-resort safety net — the normal path for "more lines than fit" is
    // OrderLines' own flex-1 + overflow-y-auto below, which shrinks/scrolls
    // before this outer boundary ever needs to.
    <aside className="flex flex-col rounded-2xl border border-white/10 bg-[#0d1728]/95 p-3 shadow-xl shadow-black/20 xl:sticky xl:top-4 xl:h-[calc(100vh-21rem)] xl:overflow-y-auto xl:scrollbar-none">
      <OrderHeader
        navigate={navigate}
        draftLines={draftLines}
        customer={customer}
        setCustomer={setCustomer}
        onOpenCustomer={onOpenCustomer}
        draftOrder={draftOrder}
        isCancelledOrder={isCancelledOrder}
        isConfirmedOrder={isConfirmedOrder}
        isClosedOrder={isClosedOrder}
        orderType={orderType}
        canEditDraft={canEditDraft}
        isDraftMutationPending={isDraftMutationPending}
        handleOrderTypeChange={handleOrderTypeChange}
        selectedRestaurantTable={selectedRestaurantTable}
        restaurantPermissionQuery={restaurantPermissionQuery}
        seatingQuery={seatingQuery}
        effectiveRestaurantTableId={effectiveRestaurantTableId}
        handleTableSelect={handleTableSelect}
        currentCompanyId={currentCompanyId}
        currentBranchId={currentBranchId}
        invalidateRestaurantSeating={invalidateRestaurantSeating}
      />

      <OrderLines
        draftLines={draftLines}
        draftOrder={draftOrder}
        catalogCurrencyCode={catalogCurrencyCode}
        canEditDraft={canEditDraft}
        isLinePending={isLinePending}
        changeQty={changeQty}
        removeDraftLine={removeDraftLine}
        selectedLineId={selectedLineId}
        onSelectLine={onSelectLine}
        onEditQuantity={onEditQuantity}
      />

      <OrderSummary
        draftOrder={draftOrder}
        subtotal={subtotal}
        discountValue={discountValue}
        vat={vat}
        total={total}
        catalogCurrencyCode={catalogCurrencyCode}
        shouldShowPaymentPanel={shouldShowPaymentPanel}
        netPaidAmount={netPaidAmount}
        settlementCurrencyCode={settlementCurrencyCode}
        settlementMinorUnitDigits={settlementMinorUnitDigits}
        remainingAmount={remainingAmount}
        isFullyPaid={isFullyPaid}
      />

      <OrderSecondaryActions
        isClosedOrder={isClosedOrder}
        isCancelledOrder={isCancelledOrder}
        draftOrder={draftOrder}
        preparationStarted={preparationStarted}
        canRequestPreparedVoid={canRequestPreparedVoid}
        canRequestCancel={canRequestCancel}
        openLifecycleModal={openLifecycleModal}
        lifecycleBlocker={lifecycleBlocker}
        cancelPermissionQuery={cancelPermissionQuery}
        voidPreparedPermissionQuery={voidPreparedPermissionQuery}
        holdOrder={holdOrder}
        onOpenCashMovement={onOpenCashMovement}
        shouldShowPaymentPanel={shouldShowPaymentPanel}
        paymentsViewPermissionQuery={paymentsViewPermissionQuery}
        canRefundPayments={canRefundPayments}
        openRefundModal={openRefundModal}
        onOpenDiscount={onOpenDiscount}
        canEditDraft={canEditDraft}
        isDraftMutationPending={isDraftMutationPending}
      />

      <div className="mt-1 shrink-0">
        <OrderPrimaryAction
          isClosedOrder={isClosedOrder}
          isCancelledOrder={isCancelledOrder}
          isConfirmedOrder={isConfirmedOrder}
          isFullyPaid={isFullyPaid}
          kitchenReady={kitchenReady}
          draftOrder={draftOrder}
          startNewOrder={startNewOrder}
          onOpenPayment={onOpenPayment}
          remainingAmount={remainingAmount}
          settlementCurrencyCode={settlementCurrencyCode}
          settlementMinorUnitDigits={settlementMinorUnitDigits}
          readyKitchenTicketCount={readyKitchenTicketCount}
          kitchenTickets={kitchenTickets}
          closeBlockers={closeBlockers}
          canCloseOrder={canCloseOrder}
          onOpenCloseOrder={onOpenCloseOrder}
          hasOpenShift={hasOpenShift}
          canConfirmOrder={canConfirmOrder}
          confirmCurrentOrder={confirmCurrentOrder}
          goToPayment={goToPayment}
          orderType={orderType}
          total={total}
          catalogCurrencyCode={catalogCurrencyCode}
          onOpenRetrieve={onOpenRetrieve}
        />
      </div>
    </aside>
  );
}
