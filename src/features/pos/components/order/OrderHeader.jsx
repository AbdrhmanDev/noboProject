import { useRef, useState } from "react";
import { ArrowLeftRight, Combine, Loader2, ShoppingCart, UserRound, X } from "lucide-react";
import { useI18n } from "../../../../i18n/I18nContext";
import { labelFor } from "../../utils/brandAccents";
import { ROUTES } from "../../../../utils/routes";
import { RestaurantSeatingOnboarding } from "../../../restaurant/components/RestaurantSeatingOnboarding";
import { ShortcutHint } from "../../../shortcuts/components/ShortcutHint";
import { ROVING_ITEM_SELECTOR, useGridArrowNav } from "../../../shortcuts/rovingFocus";

const ORDER_TYPES = ["Takeaway", "DineIn", "Delivery"];
const ORDER_TYPE_SHORTCUT_ACTION = {
  Takeaway: "pos.orderType.takeaway",
  DineIn: "pos.orderType.dineIn",
};

export function OrderHeader({
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
  isDraftMutationPending,
  handleOrderTypeChange,
  selectedRestaurantTable,
  restaurantPermissionQuery,
  seatingQuery,
  effectiveRestaurantTableId,
  handleTableSelect,
  mergeFeatureEnabled = false,
  canMergeTables = false,
  isMergePending = false,
  onMergeTable,
  currentCompanyId,
  currentBranchId,
  invalidateRestaurantSeating,
}) {
  const { t } = useI18n();
  const tableGridRef = useRef(null);
  const handleTableGridKeyDown = useGridArrowNav(tableGridRef, ROVING_ITEM_SELECTOR);
  // Once the order has a table, the table grid collapses to a summary row with two actions that
  // reopen it in a mode:
  //  - "transfer": pick a FREE table; moves the order through the same handleTableSelect ->
  //    updateDraftContext path as the first pick. The backend only allows this while the order is
  //    still a Draft (canEditDraft) -- after Confirm it's locked.
  //  - "merge": pick an OCCUPIED table, confirm, and its order is merged into this one by the
  //    backend (onMergeTable -> POSPage's mergeWithTable). Disabled until the merge endpoint ships
  //    (mergeFeatureEnabled / canMergeTables).
  const [pickerMode, setPickerMode] = useState(null);
  const [mergeCandidate, setMergeCandidate] = useState(null);
  const showTableGrid = !selectedRestaurantTable || pickerMode !== null;
  const isMergeMode = pickerMode === "merge";
  const canTransferTable = canEditDraft && !isDraftMutationPending;
  const closePicker = () => {
    setPickerMode(null);
    setMergeCandidate(null);
  };

  return (
    <>
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <ShoppingCart size={16} className="shrink-0 text-pos-primary-text" />
          <h2 className="pos-fs-base shrink-0 font-bold text-pos-text">
            {draftOrder?.orderNumberFormatted ? (
              <>
                {t("pos.cart.orderNo", { number: "" })}
                <span className="pos-num">{draftOrder.orderNumberFormatted}</span>
              </>
            ) : (
              t("pos.cart.title")
            )}
          </h2>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isCancelledOrder
                ? "bg-pos-danger/10 text-pos-danger-text"
                : isConfirmedOrder || isClosedOrder
                  ? "bg-success-soft text-success"
                  : "bg-pos-tint text-pos-primary-text"
            }`}
          >
            {labelFor(t, "pos.status", draftOrder?.status || "New")}
          </span>
          {isDraftMutationPending && (
            <span className="flex items-center text-pos-primary-text" title={t("pos.cart.saving")}>
              <Loader2 size={11} className="animate-spin" />
            </span>
          )}
          <span className="truncate text-[11px] text-pos-muted">
            · {t("pos.cart.itemsCount", { count: draftLines.reduce((sum, item) => sum + Number(item.quantity), 0) })}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenCustomer}
          disabled={!canEditDraft || !canViewCustomers}
          className="pos-control pos-fs-secondary shrink-0 border border-pos-border bg-pos-card px-3 font-medium !text-pos-primary-text transition hover:border-pos-primary hover:bg-pos-tint disabled:cursor-not-allowed disabled:opacity-50"
        >
          {customer ? customer.name : t("pos.cart.selectCustomer")}
        </button>
      </div>
      {customer && (
        <div className="mb-2 flex items-center justify-between rounded-xl bg-pos-tint px-3 py-2 text-xs text-pos-text">
          <span className="flex items-center gap-1.5">
            <UserRound size={13} className="text-pos-primary-text" />
            {customer.name}
            {customer.phone && <span className="text-[10px] text-pos-muted">· {customer.phone}</span>}
          </span>
          <button type="button" onClick={onClearCustomer} disabled={!canEditDraft} className="disabled:cursor-not-allowed disabled:opacity-50">
            <X size={14} />
          </button>
        </div>
      )}
      <div className="mb-1.5 space-y-2">
        <div className="grid grid-cols-3 gap-1 rounded-pos bg-pos-bg p-0.5">
          {ORDER_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              disabled={!canEditDraft || isDraftMutationPending}
              onClick={() => handleOrderTypeChange(type)}
              className={`pos-fs-name flex min-h-11 items-center justify-center gap-1 rounded-pos px-2 transition disabled:cursor-not-allowed disabled:opacity-50 ${
                orderType === type
                  ? "bg-pos-primary-strong text-white"
                  : "text-pos-text hover:bg-pos-tint"
              }`}
            >
              {t(`pos.type.${type}`)}
              {ORDER_TYPE_SHORTCUT_ACTION[type] && (
                <ShortcutHint action={ORDER_TYPE_SHORTCUT_ACTION[type]} />
              )}
            </button>
          ))}
        </div>
        {orderType === "DineIn" && (
          <div className="space-y-2">
            {selectedRestaurantTable ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-pos border border-pos-border bg-pos-bg px-2.5 py-1.5">
                <div className="min-w-0">
                  <div className="text-[10px] text-pos-muted">{t("pos.table.label")}</div>
                  <div className="truncate text-sm font-bold text-pos-text">
                    <span className="pos-num">{selectedRestaurantTable.code}</span>
                    <span className="ms-1 text-[11px] font-normal text-pos-muted">· {selectedRestaurantTable.floorName}</span>
                  </div>
                </div>
                {pickerMode ? (
                  <button
                    type="button"
                    onClick={closePicker}
                    className="pos-control pos-fs-label flex shrink-0 items-center gap-1 border border-pos-border bg-pos-card px-3 font-bold text-pos-text transition hover:bg-pos-tint"
                  >
                    <X size={14} />
                    {t("pos.table.transferCancel")}
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPickerMode("transfer")}
                      disabled={!canTransferTable}
                      title={canEditDraft ? undefined : t("pos.table.transferLocked")}
                      className="pos-control pos-fs-label flex items-center gap-1.5 border border-pos-primary bg-pos-card px-3 font-bold text-pos-primary-text transition hover:bg-pos-tint disabled:cursor-not-allowed disabled:border-pos-border disabled:text-pos-muted disabled:opacity-60"
                    >
                      <ArrowLeftRight size={14} />
                      {t("pos.table.transfer")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickerMode("merge")}
                      disabled={!canMergeTables}
                      title={mergeFeatureEnabled ? undefined : t("pos.merge.notAvailable")}
                      className="pos-control pos-fs-label flex items-center gap-1.5 border border-pos-primary bg-pos-card px-3 font-bold text-pos-primary-text transition hover:bg-pos-tint disabled:cursor-not-allowed disabled:border-pos-border disabled:text-pos-muted disabled:opacity-60"
                    >
                      <Combine size={14} />
                      {t("pos.merge.button")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 text-[10px] text-pos-muted">
                <span>{t("pos.table.label")}</span>
                <span className="text-pos-primary-text">{t("pos.table.required")}</span>
              </div>
            )}
            {selectedRestaurantTable && !canEditDraft && (
              <p className="text-[10px] text-pos-muted">{t("pos.table.transferLocked")}</p>
            )}
            {selectedRestaurantTable && !mergeFeatureEnabled && (
              <p className="text-[10px] text-pos-muted">{t("pos.merge.notAvailable")}</p>
            )}
            {pickerMode && (
              <p className="text-[11px] font-bold text-pos-primary-text">
                {isMergeMode ? t("pos.merge.pick") : t("pos.table.transferPick")}
              </p>
            )}
            {isMergeMode && mergeCandidate && (
              <div className="space-y-2 rounded-pos border border-pos-primary bg-pos-tint p-2.5">
                <p className="text-xs font-bold text-pos-text">
                  {t("pos.merge.confirm", { table: mergeCandidate.code, current: selectedRestaurantTable?.code })}
                </p>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    disabled={isMergePending}
                    onClick={async () => {
                      await onMergeTable(mergeCandidate);
                      closePicker();
                    }}
                    className="pos-control pos-fs-label flex flex-1 items-center justify-center gap-1.5 bg-pos-primary-strong px-3 font-bold text-white transition hover:bg-pos-primary-strong-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isMergePending ? <Loader2 size={14} className="animate-spin" /> : <Combine size={14} />}
                    {t("pos.merge.confirmButton")}
                  </button>
                  <button
                    type="button"
                    disabled={isMergePending}
                    onClick={() => setMergeCandidate(null)}
                    className="pos-control pos-fs-label border border-pos-border bg-pos-card px-3 font-bold text-pos-text transition hover:bg-pos-bg disabled:opacity-60"
                  >
                    {t("pos.table.transferCancel")}
                  </button>
                </div>
              </div>
            )}
            {restaurantPermissionQuery.isLoading && (
              <p className="rounded-lg bg-pos-bg px-2 py-2 text-[10px] text-pos-muted">
                {t("pos.table.checking")}
              </p>
            )}
            {!restaurantPermissionQuery.isLoading && !restaurantPermissionQuery.hasPermission && (
              <p className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-2 py-2 text-[10px] text-amber-100">
                {t("pos.table.permission")}
              </p>
            )}
            {seatingQuery.isLoading && (
              <p className="rounded-lg bg-pos-bg px-2 py-2 text-[10px] text-pos-muted">
                {t("pos.table.loading")}
              </p>
            )}
            {seatingQuery.isError && (
              <p className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-2 py-2 text-[10px] text-rose-100">
                {t("pos.table.loadError")}
              </p>
            )}
            {!seatingQuery.isLoading &&
              !seatingQuery.isError &&
              seatingQuery.data &&
              !seatingQuery.data.some((floor) => floor.tables.length > 0) && (
                <>
                  <RestaurantSeatingOnboarding
                    onCompleted={() =>
                      invalidateRestaurantSeating(currentCompanyId, currentBranchId)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.RESTAURANT_ADMIN)}
                    className="block w-full text-[10px] font-semibold text-pos-primary-text hover:underline"
                  >
                    {t("pos.table.manage")}
                  </button>
                </>
              )}
            {showTableGrid && (
            <div ref={tableGridRef} onKeyDown={handleTableGridKeyDown}>
              {seatingQuery.data?.map((floor) => (
                <div key={floor.restaurantFloorId}>
                  <div className="mb-1 text-[10px] font-bold text-pos-muted">{floor.name}</div>
                  <div className="grid grid-cols-3 gap-1">
                    {floor.tables.map((table) => (
                      <button
                        key={table.restaurantTableId}
                        type="button"
                        data-roving-item=""
                        disabled={
                          isMergeMode
                            ? !table.isOccupied ||
                              table.restaurantTableId === effectiveRestaurantTableId ||
                              isMergePending
                            : !canEditDraft || isDraftMutationPending || table.isOccupied
                        }
                        onClick={() => {
                          if (isMergeMode) {
                            setMergeCandidate(table);
                            return;
                          }
                          handleTableSelect(table);
                          closePicker();
                        }}
                        className={`min-h-11 rounded-lg border px-2 py-2 text-[11px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 disabled:cursor-not-allowed disabled:opacity-45 ${
                          isMergeMode && mergeCandidate?.restaurantTableId === table.restaurantTableId
                            ? "border-pos-primary bg-pos-tint text-pos-text"
                            : effectiveRestaurantTableId === table.restaurantTableId
                              ? "border-success bg-success-soft text-pos-text"
                              : "border-pos-border bg-pos-bg text-pos-text hover:bg-pos-tint"
                        }`}
                      >
                        <span className="block truncate font-bold">{table.code}</span>
                        <span className="block truncate text-[9px] text-pos-muted">
                          {table.isOccupied
                            ? t("pos.table.open", { count: table.openSalesOrderCount })
                            : table.name || t("pos.table.available")}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
