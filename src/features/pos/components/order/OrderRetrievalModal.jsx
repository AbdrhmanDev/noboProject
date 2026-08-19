import { useRef, useState } from "react";
import { AlertTriangle, ClipboardList, Search } from "lucide-react";
import { PosModal } from "../PosModal";
import { EmptyState, ErrorState, LoadingState } from "../../../../shared/components/ui";
import { formatMoney } from "../../../../shared/utils/formatters";
import { formatRelativeTime, shortOrderReference } from "../../utils/posFormatters";
import { useRetrievableSalesOrders } from "../../../sales-orders/hooks/useDraftSalesOrder";
import { ROVING_ITEM_SELECTOR, useAutoFocusFirstItem, useGridArrowNav } from "../../../shortcuts/rovingFocus";

const PAGE_SIZE = 20;
const STATUS_FILTERS = [
  { id: "", label: "All" },
  { id: "Draft", label: "Draft" },
  { id: "Confirmed", label: "Confirmed" },
];

const FULFILLMENT_LABELS = {
  DineIn: "Dine-In",
  Takeaway: "Takeaway",
  Delivery: "Delivery",
};

function OrderRow({ order, onSelect, disabled }) {
  const isConfirmed = order.status === "Confirmed";

  return (
    <button
      type="button"
      data-roving-item=""
      disabled={disabled}
      onClick={() => onSelect(order.salesOrderId)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0d1728] px-3 py-2.5 text-right transition hover:border-blue-400/50 hover:bg-[#111f36] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isConfirmed ? "bg-emerald-500/15 text-emerald-300" : "bg-blue-500/15 text-blue-300"
            }`}
          >
            {order.status}
          </span>
          <span className="text-[10px] text-slate-400">
            {FULFILLMENT_LABELS[order.fulfillmentType] || order.fulfillmentType || "—"}
            {order.fulfillmentType === "DineIn" && order.restaurantTableCode
              ? ` · Table ${order.restaurantTableCode}`
              : ""}
          </span>
          {isConfirmed &&
            (order.isFullyPaid ? (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                Paid
              </span>
            ) : (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-300">
                Remaining {formatMoney(order.remainingAmount, order.currencyCode, 2)}
              </span>
            ))}
        </div>
        <div className="mt-1 text-[10px] text-slate-500">
          Updated {formatRelativeTime(order.updatedAtUtc)} · {shortOrderReference(order.salesOrderId)}
        </div>
      </div>
      <div className="shrink-0 text-sm font-black text-white">
        {formatMoney(order.payableAmount, order.currencyCode, 2)}
      </div>
    </button>
  );
}

export function OrderRetrievalModal({
  currentCompanyId,
  currentBranchId,
  onClose,
  onSelectOrder,
  activatingOrderId,
}) {
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const listRef = useRef(null);
  const handleListKeyDown = useGridArrowNav(listRef, ROVING_ITEM_SELECTOR);

  const searchTerm = searchInput.trim();
  const isGuidSearch = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    searchTerm,
  );

  // Filters/search live in the query key, so switching them naturally starts
  // a fresh, separately-cached page sequence — no manual page/items reset.
  const query = useRetrievableSalesOrders(
    currentCompanyId,
    currentBranchId,
    {
      pageSize: PAGE_SIZE,
      status: statusFilter,
      search: isGuidSearch ? searchTerm : "",
    },
    true,
  );

  const items = query.data ? query.data.pages.flatMap((page) => page.items) : [];
  const isInitialLoading = query.isLoading;
  const hasMore = Boolean(query.hasNextPage);

  useAutoFocusFirstItem(listRef, ROVING_ITEM_SELECTOR, items.length > 0 && !isInitialLoading);

  return (
    <PosModal title="Retrieve Order" onClose={onClose} size="lg">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1.5">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.id || "all"}
                type="button"
                onClick={() => setStatusFilter(filter.id)}
                className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold transition ${
                  statusFilter === filter.id
                    ? "border-blue-400/70 bg-blue-500/15 text-blue-100"
                    : "border-white/10 bg-black/10 text-slate-400 hover:bg-white/10"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/10 px-2.5 py-1.5 text-[10px] text-slate-500">
          <Search size={13} className="shrink-0" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Advanced: exact order reference (ID)"
            className="w-full bg-transparent text-[11px] text-slate-200 outline-none placeholder:text-slate-600"
          />
        </label>
        {searchTerm && !isGuidSearch && (
          <div className="flex items-center gap-1.5 text-[10px] text-amber-300">
            <AlertTriangle size={12} />
            No matching order reference.
          </div>
        )}

        {isInitialLoading && <LoadingState label="Loading orders..." />}

        {query.isError && (
          <ErrorState
            title="Unable to load orders"
            message={query.error?.message || "Please try again."}
          />
        )}
        {query.isError && (
          <button
            type="button"
            onClick={() => query.refetch()}
            className="w-full rounded-xl border border-white/10 bg-white/[0.035] py-2 text-xs font-bold text-slate-100 hover:bg-white/10"
          >
            Retry
          </button>
        )}

        {!isInitialLoading && !query.isError && items.length === 0 && (
          <EmptyState
            title="No active orders to retrieve"
            message="Draft and confirmed orders that haven't been closed or cancelled will appear here."
          />
        )}

        {!isInitialLoading && !query.isError && items.length > 0 && (
          <>
            <div
              ref={listRef}
              onKeyDown={handleListKeyDown}
              className="max-h-[50vh] space-y-2 overflow-y-auto pr-1 scrollbar-none"
            >
              {items.map((order) => (
                <OrderRow
                  key={order.salesOrderId}
                  order={order}
                  onSelect={onSelectOrder}
                  disabled={Boolean(activatingOrderId)}
                />
              ))}
            </div>

            {activatingOrderId && (
              <div className="flex items-center justify-center gap-2 rounded-lg bg-blue-500/10 py-2 text-[11px] font-semibold text-blue-200">
                <ClipboardList size={13} className="animate-pulse" />
                Opening order...
              </div>
            )}

            {hasMore && !activatingOrderId && (
              <button
                type="button"
                disabled={query.isFetchingNextPage}
                onClick={() => query.fetchNextPage()}
                className="w-full rounded-xl border border-white/10 bg-white/[0.035] py-2 text-xs font-bold text-slate-100 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {query.isFetchingNextPage ? "Loading more..." : "Load more"}
              </button>
            )}
          </>
        )}
      </div>
    </PosModal>
  );
}
