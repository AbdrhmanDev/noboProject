import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, History, RefreshCw } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../../../shared/components/ui";
import { formatDateTime } from "../../../shared/utils/formatters";
import { useI18n } from "../../../i18n/I18nContext";
import {
  useActiveInventoryItems,
  useInventoryLocations,
  useInventoryStockTransactions,
} from "../hooks/useInventory";
import {
  INVENTORY_TRANSACTION_TYPES,
  getTransactionTypeTone,
  shortId,
} from "../utils/inventoryTransactionLabels";
import { LedgerTransactionDetails } from "./LedgerTransactionDetails";

function getErrorMessage(error, t) {
  return error?.message || t("inventory.common.requestFailed");
}

function toUtcStart(value) {
  return value ? `${value}T00:00:00.000Z` : undefined;
}

function toUtcEnd(value) {
  return value ? `${value}T23:59:59.999Z` : undefined;
}

function referenceLabel(transaction, t) {
  if (transaction.sourceSalesOrderId) {
    return t("inventory.transactionDetails.reference.salesOrder", {
      id: shortId(transaction.sourceSalesOrderId),
    });
  }
  if (transaction.reversesInventoryStockTransactionId) {
    return t("inventory.transactionDetails.reference.reverses", {
      id: shortId(transaction.reversesInventoryStockTransactionId),
    });
  }
  return "-";
}

// `initialTransactionType`: opens pre-filtered on one movement type (Inventory Overview cards).
export function InventoryLedgerPanel({ companyId, branchId, canView, initialTransactionType = "" }) {
  const { t } = useI18n();
  const [locationId, setLocationId] = useState("");
  const [itemId, setItemId] = useState("");
  const [transactionType, setTransactionType] = useState(initialTransactionType);
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
        <h2 className="text-sm font-bold text-ink">{t("inventory.ledger.heading")}</h2>
        <button
          type="button"
          onClick={() => transactionsQuery.refetch()}
          className="flex items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-sm font-bold text-ink"
        >
          <RefreshCw size={14} />
          {t("inventory.common.refresh")}
        </button>
      </div>

      <div className="grid gap-2 rounded-xl border border-line bg-surface p-3 sm:grid-cols-5">
        <label className="text-xs font-semibold text-muted">
          {t("inventory.ledger.field.location")}
          <select
            value={locationId}
            onChange={(event) => {
              setLocationId(event.target.value);
              resetPage();
            }}
            className="mt-1 h-10 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none"
          >
            <option value="">{t("inventory.ledger.field.allLocations")}</option>
            {(locationsQuery.data || []).map((location) => (
              <option key={location.inventoryLocationId} value={location.inventoryLocationId}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-muted">
          {t("inventory.ledger.field.item")}
          <select
            value={itemId}
            onChange={(event) => {
              setItemId(event.target.value);
              resetPage();
            }}
            className="mt-1 h-10 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none"
          >
            <option value="">{t("inventory.ledger.field.allItems")}</option>
            {(activeItemsQuery.data || []).map((item) => (
              <option key={item.inventoryItemId} value={item.inventoryItemId}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-muted">
          {t("inventory.ledger.field.type")}
          <select
            value={transactionType}
            onChange={(event) => {
              setTransactionType(event.target.value);
              resetPage();
            }}
            className="mt-1 h-10 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none"
          >
            <option value="">{t("inventory.ledger.field.allTypes")}</option>
            {INVENTORY_TRANSACTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`inventory.type.${type}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-muted">
          {t("inventory.ledger.field.from")}
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
              resetPage();
            }}
            className="mt-1 h-10 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none"
          />
        </label>
        <label className="text-xs font-semibold text-muted">
          {t("inventory.ledger.field.to")}
          <input
            type="date"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value);
              resetPage();
            }}
            className="mt-1 h-10 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none"
          />
        </label>
      </div>

      <section className="rounded-xl border border-line bg-surface p-3">
        {transactionsQuery.isLoading && <LoadingState label={t("inventory.ledger.loading")} />}
        {transactionsQuery.isError && (
          <ErrorState
            title={t("inventory.ledger.loadError")}
            message={getErrorMessage(transactionsQuery.error, t)}
          />
        )}
        {!transactionsQuery.isLoading && !transactionsQuery.isError && page?.items.length === 0 && (
          <EmptyState
            title={t("inventory.ledger.emptyTransactions.title")}
            message={t("inventory.ledger.emptyTransactions.message")}
          />
        )}
        {!transactionsQuery.isLoading && !transactionsQuery.isError && Boolean(page?.items.length) && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-right text-subtle">
                    <th className="pb-2 font-medium">{t("inventory.ledger.col.dateTime")}</th>
                    <th className="pb-2 font-medium">{t("inventory.ledger.col.type")}</th>
                    <th className="pb-2 font-medium">{t("inventory.ledger.col.location")}</th>
                    <th className="pb-2 font-medium">{t("inventory.ledger.col.lines")}</th>
                    <th className="pb-2 font-medium">{t("inventory.ledger.col.reference")}</th>
                    <th className="pb-2 font-medium">{t("inventory.ledger.col.reason")}</th>
                  </tr>
                </thead>
                <tbody>
                  {page.items.map((transaction) => (
                    <tr
                      key={transaction.inventoryStockTransactionId}
                      onClick={() =>
                        setSelectedTransactionId(transaction.inventoryStockTransactionId)
                      }
                      className="cursor-pointer border-b border-line hover:bg-hover"
                    >
                      <td className="py-2.5 text-muted">
                        {formatDateTime(transaction.createdAtUtc)}
                      </td>
                      <td className={`py-2.5 font-bold ${getTransactionTypeTone(transaction.transactionType)}`}>
                        {t(`inventory.type.${transaction.transactionType}`)}
                      </td>
                      <td className="py-2.5 text-muted">
                        {transaction.inventoryLocationName} ({transaction.inventoryLocationCode})
                      </td>
                      <td className="py-2.5 text-muted">{transaction.lineCount}</td>
                      <td className="py-2.5 text-muted">{referenceLabel(transaction, t)}</td>
                      <td className="max-w-[220px] truncate py-2.5 text-muted">
                        {transaction.reason || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-muted">
              <span>
                {t("inventory.ledger.pageOfTransactions", {
                  page: page.pageNumber,
                  total: page.totalPages || 1,
                  count: page.totalCount,
                })}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={page.pageNumber <= 1}
                  onClick={() => setPageNumber((value) => Math.max(1, value - 1))}
                  className="rounded-lg border border-line p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  disabled={page.pageNumber >= page.totalPages}
                  onClick={() => setPageNumber((value) => value + 1)}
                  className="rounded-lg border border-line p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <div className="flex items-center gap-2 text-xs text-subtle">
        <History size={13} />
        {t("inventory.ledger.immutableNotice")}
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
