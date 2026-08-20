import { useRef } from "react";
import { Crown, ShoppingCart, X } from "lucide-react";
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
}) {
  const tableGridRef = useRef(null);
  const handleTableGridKeyDown = useGridArrowNav(tableGridRef, ROVING_ITEM_SELECTOR);

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/15 text-blue-300">
            <ShoppingCart size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold">سلة المشتريات</h2>
            <span className="text-[10px] text-slate-500">
              {draftLines.reduce((sum, item) => sum + Number(item.quantity), 0)} صنف في الفاتورة
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenCustomer}
          className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-blue-300 hover:bg-blue-500/10"
        >
          {customer ? customer.name : "اختيار عميل"}
        </button>
      </div>
      {customer && (
        <div className="mb-2 flex items-center justify-between rounded-xl bg-blue-500/10 px-3 py-2 text-xs text-blue-100">
          <span className="flex items-center gap-1">
            <Crown size={13} className="text-amber-300" />
            {customer.name} · سعر VIP
          </span>
          <button type="button" onClick={() => setCustomer(null)}>
            <X size={14} />
          </button>
        </div>
      )}
      <div className="mb-3 space-y-2 rounded-xl border border-white/10 bg-white/[0.025] p-2">
        <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
          <span>Order status</span>
          <span className="flex items-center gap-1.5">
            {draftOrder?.orderNumberFormatted && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 font-bold text-slate-300">
                {draftOrder.orderNumberFormatted}
              </span>
            )}
            <span
              className={`rounded-full px-2 py-0.5 font-bold ${
                isCancelledOrder
                  ? "bg-rose-500/15 text-rose-300"
                  : isConfirmedOrder || isClosedOrder
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-blue-500/15 text-blue-300"
              }`}
            >
              {draftOrder?.status || "New"}
            </span>
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {ORDER_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              disabled={!canEditDraft || isDraftMutationPending}
              onClick={() => handleOrderTypeChange(type)}
              className={`flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                orderType === type
                  ? "border-blue-400 bg-blue-500/15 text-blue-100"
                  : "border-white/10 bg-black/10 text-slate-400 hover:bg-white/10"
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
            <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
              <span>Table</span>
              <span className="text-blue-300">
                {selectedRestaurantTable
                  ? `${selectedRestaurantTable.floorName} · ${selectedRestaurantTable.code}`
                  : "Required"}
              </span>
            </div>
            {restaurantPermissionQuery.isLoading && (
              <p className="rounded-lg bg-black/10 px-2 py-2 text-[10px] text-slate-500">
                Checking restaurant access...
              </p>
            )}
            {!restaurantPermissionQuery.isLoading && !restaurantPermissionQuery.hasPermission && (
              <p className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-2 py-2 text-[10px] text-amber-100">
                Restaurant.View permission is required.
              </p>
            )}
            {seatingQuery.isLoading && (
              <p className="rounded-lg bg-black/10 px-2 py-2 text-[10px] text-slate-500">
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
                    className="block w-full text-[10px] font-semibold text-blue-300 hover:text-blue-200"
                  >
                    Manage in Restaurant Admin
                  </button>
                </>
              )}
            <div ref={tableGridRef} onKeyDown={handleTableGridKeyDown}>
              {seatingQuery.data?.map((floor) => (
                <div key={floor.restaurantFloorId}>
                  <div className="mb-1 text-[10px] font-bold text-slate-400">{floor.name}</div>
                  <div className="grid grid-cols-3 gap-1">
                    {floor.tables.map((table) => (
                      <button
                        key={table.restaurantTableId}
                        type="button"
                        data-roving-item=""
                        disabled={!canEditDraft || isDraftMutationPending || table.isOccupied}
                        onClick={() => handleTableSelect(table)}
                        className={`rounded-lg border px-2 py-1.5 text-[10px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 disabled:cursor-not-allowed disabled:opacity-45 ${
                          effectiveRestaurantTableId === table.restaurantTableId
                            ? "border-emerald-400 bg-emerald-500/15 text-emerald-100"
                            : "border-white/10 bg-black/10 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        <span className="block truncate font-bold">{table.code}</span>
                        <span className="block truncate text-[9px] text-slate-500">
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
