import { useI18n } from "../../../../i18n/I18nContext";
import { OrderHeader } from "./OrderHeader";
import { OrderLines } from "./OrderLines";
import { OrderSummary } from "./OrderSummary";
import { OrderSecondaryActions } from "./OrderSecondaryActions";
import { ReceiptText } from "lucide-react";
import { OrderPrimaryAction } from "./OrderPrimaryAction";

export function OrderSidebar({
  // OrderHeader
  navigate,
  draftLines,
  customer,
  onClearCustomer,
  onOpenCustomer,
  canViewCustomers,
  draftOrder,
  isCancelledOrder,
  isConfirmedOrder,
  isClosedOrder,
  orderType,
  canEditDraft,
  canEditDraftLines,
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
  modifierGroupsByVariantId,
  onChangeLineModifiers,
  sizeVariantsByVariantId,
  onChangeLineVariant,
  onAddLineInSize,
  // OrderSummary
  onOpenDiscount,
  paymentMethods,
  selectedPaymentMethod,
  onSelectPaymentMethod,
  kitchenNote,
  onKitchenNoteChange,
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
  onOpenRetrieve,
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
  onOpenShiftReport,
}) {
  const { t } = useI18n();
  return (
    // Touch-first redesign: this now renders as the body of OrderBottomSheet instead of a
    // permanent viewport-height column, so it sizes to its own content (the sheet itself caps and
    // scrolls the overall height) rather than forcing a definite 100dvh-minus-chrome box.
    <div className="flex flex-col gap-0 p-3">
      <OrderHeader
        navigate={navigate}
        draftLines={draftLines}
        customer={customer}
        onClearCustomer={onClearCustomer}
        onOpenCustomer={onOpenCustomer}
        canViewCustomers={canViewCustomers}
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
        canEditDraft={canEditDraftLines}
        isLinePending={isLinePending}
        changeQty={changeQty}
        removeDraftLine={removeDraftLine}
        selectedLineId={selectedLineId}
        onSelectLine={onSelectLine}
        onEditQuantity={onEditQuantity}
        modifierGroupsByVariantId={modifierGroupsByVariantId}
        onChangeLineModifiers={onChangeLineModifiers}
        sizeVariantsByVariantId={sizeVariantsByVariantId}
        onChangeLineVariant={onChangeLineVariant}
        onAddLineInSize={onAddLineInSize}
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
        shouldShowPaymentPanel={shouldShowPaymentPanel}
        paymentsViewPermissionQuery={paymentsViewPermissionQuery}
        canRefundPayments={canRefundPayments}
        openRefundModal={openRefundModal}
        onOpenDiscount={onOpenDiscount}
        canEditDraft={canEditDraft}
        isDraftMutationPending={isDraftMutationPending}
        selectedLineId={selectedLineId}
        removeDraftLine={removeDraftLine}
        canEditDraftLines={canEditDraftLines}
        paymentMethods={paymentMethods}
        selectedPaymentMethod={selectedPaymentMethod}
        onSelectPaymentMethod={onSelectPaymentMethod}
        kitchenNote={kitchenNote}
        onKitchenNoteChange={onKitchenNoteChange}
      />

      <div className="mt-1 flex shrink-0 items-end gap-1.5">
        <div className="min-w-0 flex-1">
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
        {hasOpenShift && onOpenShiftReport && (
          <button
            type="button"
            onClick={onOpenShiftReport}
            aria-label={t("pos.quick.zReport")}
            title={t("pos.quick.zReport")}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-pos border border-pos-border bg-pos-card text-pos-text transition hover:border-pos-primary hover:bg-pos-tint"
          >
            <ReceiptText size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
