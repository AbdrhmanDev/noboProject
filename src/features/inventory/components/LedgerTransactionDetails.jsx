import { ErrorState, LoadingState } from "../../../shared/components/ui";
import { formatDateTime } from "../../../shared/utils/formatters";
import { useInventoryStockTransactionDetails } from "../hooks/useInventory";
import {
  getTransactionTypeLabel,
  getTransactionTypeTone,
  shortId,
} from "../utils/inventoryTransactionLabels";
import { InventoryModal } from "./InventoryModal";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

export function LedgerTransactionDetails({ companyId, branchId, inventoryStockTransactionId, onClose }) {
  const detailsQuery = useInventoryStockTransactionDetails(
    companyId,
    branchId,
    inventoryStockTransactionId,
    Boolean(inventoryStockTransactionId),
  );
  const details = detailsQuery.data;

  return (
    <InventoryModal title="Transaction Details" onClose={onClose} size="lg">
      {detailsQuery.isLoading && <LoadingState label="Loading transaction..." />}
      {detailsQuery.isError && (
        <ErrorState
          title="Unable to load transaction"
          message={getErrorMessage(detailsQuery.error)}
        />
      )}
      {details && (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <div className="text-[11px] text-slate-500">Transaction</div>
              <div className="mt-1 text-sm font-black text-white">
                #{shortId(details.inventoryStockTransactionId)}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <div className="text-[11px] text-slate-500">Type</div>
              <div className={`mt-1 text-sm font-black ${getTransactionTypeTone(details.transactionType)}`}>
                {getTransactionTypeLabel(details.transactionType)}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <div className="text-[11px] text-slate-500">Date/time</div>
              <div className="mt-1 text-sm font-black text-white">
                {formatDateTime(details.createdAtUtc)}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <div className="text-[11px] text-slate-500">Location</div>
              <div className="mt-1 text-sm font-black text-white">
                {details.inventoryLocationName} ({details.inventoryLocationCode})
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <div className="text-[11px] text-slate-500">User</div>
              <div className="mt-1 text-sm font-black text-white">
                {shortId(details.createdByUserId)}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <div className="text-[11px] text-slate-500">Reference</div>
              <div className="mt-1 text-sm font-black text-white">
                {details.sourceSalesOrderId
                  ? `Sales Order #${shortId(details.sourceSalesOrderId)}`
                  : details.reversesInventoryStockTransactionId
                    ? `Reverses #${shortId(details.reversesInventoryStockTransactionId)}`
                    : "Manual"}
              </div>
            </div>
          </div>

          {details.reason && (
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <div className="text-[11px] text-slate-500">Reason</div>
              <p className="mt-1 text-xs text-slate-200">{details.reason}</p>
            </div>
          )}

          <div>
            <div className="mb-2 text-[11px] font-bold uppercase text-slate-500">
              Lines ({details.lines.length})
            </div>
            <div className="space-y-2">
              {details.lines.map((line) => (
                <div
                  key={line.inventoryStockTransactionLineId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold text-white">
                      {line.inventoryItemName}
                    </div>
                    <div className="text-[11px] text-slate-500">{line.inventoryItemCode}</div>
                  </div>
                  <div
                    className={`text-sm font-black ${
                      line.quantityDelta < 0 ? "text-rose-300" : "text-emerald-300"
                    }`}
                  >
                    {line.quantityDelta > 0 ? "+" : ""}
                    {line.quantityDelta} {line.baseUnitOfMeasure.symbol}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </InventoryModal>
  );
}
