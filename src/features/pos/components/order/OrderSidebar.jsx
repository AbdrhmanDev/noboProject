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
  // OrderSummary
  onOpenDiscount,
  subtotal,
  discountValue,
  vat,
  total,
  shouldShowPaymentPanel,
  paymentState,
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
  paymentHistoryQuery,
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
}) {
  return (
    <aside className="flex min-h-[620px] flex-col rounded-2xl border border-white/10 bg-[#0d1728]/95 p-3 shadow-xl shadow-black/20 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto xl:scrollbar-none">
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
        isDraftMutationPending={isDraftMutationPending}
        changeQty={changeQty}
        removeDraftLine={removeDraftLine}
      />

      <OrderSummary
        draftOrder={draftOrder}
        canEditDraft={canEditDraft}
        isDraftMutationPending={isDraftMutationPending}
        onOpenDiscount={onOpenDiscount}
        subtotal={subtotal}
        discountValue={discountValue}
        vat={vat}
        total={total}
        catalogCurrencyCode={catalogCurrencyCode}
        shouldShowPaymentPanel={shouldShowPaymentPanel}
        paymentState={paymentState}
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
        onOpenRetrieve={onOpenRetrieve}
        onOpenCashMovement={onOpenCashMovement}
        shouldShowPaymentPanel={shouldShowPaymentPanel}
        paymentsViewPermissionQuery={paymentsViewPermissionQuery}
        paymentHistoryQuery={paymentHistoryQuery}
        paymentState={paymentState}
        canRefundPayments={canRefundPayments}
        openRefundModal={openRefundModal}
      />

      <div className="mt-3 shrink-0">
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
          orderType={orderType}
          total={total}
          catalogCurrencyCode={catalogCurrencyCode}
        />
      </div>
    </aside>
  );
}
