import { useRef } from "react";
import { Loader2, ShoppingCart, UserRound, X } from "lucide-react";
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
  currentCompanyId,
  currentBranchId,
  invalidateRestaurantSeating,
}) {
  const tableGridRef = useRef(null);
  const handleTableGridKeyDown = useGridArrowNav(tableGridRef, ROVING_ITEM_SELECTOR);

  return (
    <>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <ShoppingCart size={16} className="shrink-0 text-pos-primary-text" />
          <h2 className="pos-fs-base shrink-0 font-bold text-pos-text">
            {draftOrder?.orderNumberFormatted ? `طلب ${draftOrder.orderNumberFormatted}` : "سلة المشتريات"}
          </h2>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isCancelledOrder
                ? "bg-pos-danger/10 text-pos-danger"
                : isConfirmedOrder || isClosedOrder
                  ? "bg-success-soft text-success"
                  : "bg-pos-tint text-pos-primary-text"
            }`}
          >
            {draftOrder?.status || "New"}
          </span>
          {isDraftMutationPending && (
            <span className="flex items-center text-pos-primary-text" title="جارٍ الحفظ">
              <Loader2 size={11} className="animate-spin" />
            </span>
          )}
          <span className="truncate text-[11px] text-pos-muted">
            · {draftLines.reduce((sum, item) => sum + Number(item.quantity), 0)} صنف
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenCustomer}
          disabled={!canEditDraft || !canViewCustomers}
          className="pos-control pos-fs-secondary shrink-0 border border-pos-border bg-pos-card px-3 font-medium !text-pos-primary-text transition hover:border-pos-primary hover:bg-pos-tint disabled:cursor-not-allowed disabled:opacity-50"
        >
          {customer ? customer.name : "اختيار عميل"}
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
      <div className="mb-2 space-y-2">
        <div className="grid grid-cols-3 gap-1 rounded-pos bg-pos-bg p-1">
          {ORDER_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              disabled={!canEditDraft || isDraftMutationPending}
              onClick={() => handleOrderTypeChange(type)}
              className={`pos-fs-name flex min-h-11 items-center justify-center gap-1 rounded-pos px-2 transition disabled:cursor-not-allowed disabled:opacity-50 ${
                orderType === type
                  ? "bg-pos-primary text-white"
                  : "text-pos-text hover:bg-pos-tint"
              }`}
            >
              {type}
              {ORDER_TYPE_SHORTCUT_ACTION[type] && (
                <ShortcutHint action={ORDER_TYPE_SHORTCUT_ACTION[type]} />
              )}
            </button>
          ))}
        </div>
        {orderType === "DineIn" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-[10px] text-pos-muted">
              <span>Table</span>
              <span className="text-pos-primary-text">
                {selectedRestaurantTable
                  ? `${selectedRestaurantTable.floorName} · ${selectedRestaurantTable.code}`
                  : "Required"}
              </span>
            </div>
            {restaurantPermissionQuery.isLoading && (
              <p className="rounded-lg bg-pos-bg px-2 py-2 text-[10px] text-pos-muted">
                Checking restaurant access...
              </p>
            )}
            {!restaurantPermissionQuery.isLoading && !restaurantPermissionQuery.hasPermission && (
              <p className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-2 py-2 text-[10px] text-amber-100">
                Restaurant.View permission is required.
              </p>
            )}
            {seatingQuery.isLoading && (
              <p className="rounded-lg bg-pos-bg px-2 py-2 text-[10px] text-pos-muted">
                Loading tables...
              </p>
            )}
            {seatingQuery.isError && (
              <p className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-2 py-2 text-[10px] text-rose-100">
                Unable to load restaurant seating.
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
                    Manage in Restaurant Admin
                  </button>
                </>
              )}
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
                        disabled={!canEditDraft || isDraftMutationPending || table.isOccupied}
                        onClick={() => handleTableSelect(table)}
                        className={`min-h-11 rounded-lg border px-2 py-2 text-[11px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 disabled:cursor-not-allowed disabled:opacity-45 ${
                          effectiveRestaurantTableId === table.restaurantTableId
                            ? "border-success bg-success-soft text-pos-text"
                            : "border-pos-border bg-pos-bg text-pos-text hover:bg-pos-tint"
                        }`}
                      >
                        <span className="block truncate font-bold">{table.code}</span>
                        <span className="block truncate text-[9px] text-pos-muted">
                          {table.isOccupied
                            ? `${table.openSalesOrderCount} open`
                            : table.name || "Available"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
