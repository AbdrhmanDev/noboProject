import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, History, RefreshCw } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../../../shared/components/ui";
import { formatDateTime } from "../../../shared/utils/formatters";
import {
  useActiveInventoryItems,
  useInventoryLocations,
  useInventoryStockTransactions,
} from "../hooks/useInventory";
import {
  INVENTORY_TRANSACTION_TYPES,
  getTransactionTypeLabel,
  getTransactionTypeTone,
  shortId,
} from "../utils/inventoryTransactionLabels";
import { LedgerTransactionDetails } from "./LedgerTransactionDetails";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

function toUtcStart(value) {
  return value ? `${value}T00:00:00.000Z` : undefined;
}

function toUtcEnd(value) {
  return value ? `${value}T23:59:59.999Z` : undefined;
}

function referenceLabel(transaction) {
  if (transaction.sourceSalesOrderId) return `Sales Order #${shortId(transaction.sourceSalesOrderId)}`;
  if (transaction.reversesInventoryStockTransactionId) {
    return `Reverses #${shortId(transaction.reversesInventoryStockTransactionId)}`;
  }
  return "-";
}

export function InventoryLedgerPanel({ companyId, branchId, canView }) {
  const [locationId, setLocationId] = useState("");
  const [itemId, setItemId] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);

  const locationsQuery = useInventoryLocations(companyId, branchId, {}, canView);
  const activeItemsQuery = useActiveInventoryItems(companyId, canView);

  const filters = useMemo(
    () => ({
      inventoryLocationId: locationId || undefined,
      inventoryItemId: itemId || undefined,
      transactionType: transactionType || undefined,
      createdFromUtc: toUtcStart(dateFrom),
      createdToUtc: toUtcEnd(dateTo),
      pageNumber,
      pageSize: 25,
    }),
    [locationId, itemId, transactionType, dateFrom, dateTo, pageNumber],
  );
  const transactionsQuery = useInventoryStockTransactions(companyId, branchId, filters, canView);
  const page = transactionsQuery.data;

  const resetPage = () => setPageNumber(1);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-white">Inventory Ledger</h2>
        <button
          type="button"
          onClick={() => transactionsQuery.refetch()}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="grid gap-2 rounded-2xl border border-white/10 bg-[#0c1424] p-3 sm:grid-cols-5">
        <label className="text-[11px] font-semibold text-slate-400">
          Location
          <select
            value={locationId}
            onChange={(event) => {
              setLocationId(event.target.value);
              resetPage();
            }}
            className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
          >
            <option value="">All locations</option>
            {(locationsQuery.data || []).map((location) => (
              <option key={location.inventoryLocationId} value={location.inventoryLocationId}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] font-semibold text-slate-400">
          Item
          <select
            value={itemId}
            onChange={(event) => {
              setItemId(event.target.value);
              resetPage();
            }}
            className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
          >
            <option value="">All items</option>
            {(activeItemsQuery.data || []).map((item) => (
              <option key={item.inventoryItemId} value={item.inventoryItemId}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] font-semibold text-slate-400">
          Type
          <select
            value={transactionType}
            onChange={(event) => {
              setTransactionType(event.target.value);
              resetPage();
            }}
            className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
          >
            <option value="">All types</option>
            {INVENTORY_TRANSACTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {getTransactionTypeLabel(type)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] font-semibold text-slate-400">
          From
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
              resetPage();
            }}
            className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
          />
        </label>
        <label className="text-[11px] font-semibold text-slate-400">
          To
          <input
            type="date"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value);
              resetPage();
            }}
            className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
          />
        </label>
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
        {transactionsQuery.isLoading && <LoadingState label="Loading ledger..." />}
        {transactionsQuery.isError && (
          <ErrorState
            title="Unable to load inventory ledger"
            message={getErrorMessage(transactionsQuery.error)}
          />
        )}
        {!transactionsQuery.isLoading && !transactionsQuery.isError && page?.items.length === 0 && (
          <EmptyState
            title="No transactions found"
            message="No inventory stock transactions match the current filters."
          />
        )}
        {!transactionsQuery.isLoading && !transactionsQuery.isError && Boolean(page?.items.length) && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-right text-slate-500">
                    <th className="pb-2 font-medium">Date/time</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Location</th>
                    <th className="pb-2 font-medium">Lines</th>
                    <th className="pb-2 font-medium">Reference</th>
                    <th className="pb-2 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {page.items.map((transaction) => (
                    <tr
                      key={transaction.inventoryStockTransactionId}
                      onClick={() =>
                        setSelectedTransactionId(transaction.inventoryStockTransactionId)
                      }
                      className="cursor-pointer border-b border-white/5 hover:bg-white/[0.03]"
                    >
                      <td className="py-2.5 text-slate-300">
                        {formatDateTime(transaction.createdAtUtc)}
                      </td>
                      <td className={`py-2.5 font-bold ${getTransactionTypeTone(transaction.transactionType)}`}>
                        {getTransactionTypeLabel(transaction.transactionType)}
                      </td>
                      <td className="py-2.5 text-slate-300">
                        {transaction.inventoryLocationName} ({transaction.inventoryLocationCode})
                      </td>
                      <td className="py-2.5 text-slate-400">{transaction.lineCount}</td>
                      <td className="py-2.5 text-slate-400">{referenceLabel(transaction)}</td>
                      <td className="max-w-[220px] truncate py-2.5 text-slate-400">
                        {transaction.reason || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>
                Page {page.pageNumber} of {page.totalPages || 1} · {page.totalCount} transactions
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={page.pageNumber <= 1}
                  onClick={() => setPageNumber((value) => Math.max(1, value - 1))}
                  className="rounded-lg border border-white/10 p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  disabled={page.pageNumber >= page.totalPages}
                  onClick={() => setPageNumber((value) => value + 1)}
                  className="rounded-lg border border-white/10 p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <div className="flex items-center gap-2 text-[11px] text-slate-600">
        <History size={13} />
        The ledger is an immutable history. Corrections require a new manual adjustment.
      </div>

      {selectedTransactionId && (
        <LedgerTransactionDetails
          companyId={companyId}
          branchId={branchId}
          inventoryStockTransactionId={selectedTransactionId}
          onClose={() => setSelectedTransactionId(null)}
        />
      )}
    </div>
  );
}
