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
            <div className="rounded-xl border border-line bg-raised p-3">
              <div className="text-xs text-subtle">Transaction</div>
              <div className="mt-1 text-sm font-black text-ink">
                #{shortId(details.inventoryStockTransactionId)}
              </div>
            </div>
            <div className="rounded-xl border border-line bg-raised p-3">
              <div className="text-xs text-subtle">Type</div>
              <div className={`mt-1 text-sm font-black ${getTransactionTypeTone(details.transactionType)}`}>
                {getTransactionTypeLabel(details.transactionType)}
              </div>
            </div>
            <div className="rounded-xl border border-line bg-raised p-3">
              <div className="text-xs text-subtle">Date/time</div>
              <div className="mt-1 text-sm font-black text-ink">
                {formatDateTime(details.createdAtUtc)}
              </div>
            </div>
            <div className="rounded-xl border border-line bg-raised p-3">
              <div className="text-xs text-subtle">Location</div>
              <div className="mt-1 text-sm font-black text-ink">
                {details.inventoryLocationName} ({details.inventoryLocationCode})
              </div>
            </div>
            <div className="rounded-xl border border-line bg-raised p-3">
              <div className="text-xs text-subtle">User</div>
              <div className="mt-1 text-sm font-black text-ink">
                {shortId(details.createdByUserId)}
              </div>
            </div>
            <div className="rounded-xl border border-line bg-raised p-3">
              <div className="text-xs text-subtle">Reference</div>
              <div className="mt-1 text-sm font-black text-ink">
                {details.sourceSalesOrderId
                  ? `Sales Order #${shortId(details.sourceSalesOrderId)}`
                  : details.reversesInventoryStockTransactionId
                    ? `Reverses #${shortId(details.reversesInventoryStockTransactionId)}`
                    : "Manual"}
              </div>
            </div>
          </div>

          {details.reason && (
            <div className="rounded-xl border border-line bg-raised p-3">
              <div className="text-xs text-subtle">Reason</div>
              <p className="mt-1 text-sm text-ink">{details.reason}</p>
            </div>
          )}

          <div>
            <div className="mb-2 text-xs font-bold uppercase text-subtle">
              Lines ({details.lines.length})
            </div>
            <div className="space-y-2">
              {details.lines.map((line) => (
                <div
                  key={line.inventoryStockTransactionLineId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-raised p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-ink">
                      {line.inventoryItemName}
                    </div>
                    <div className="text-xs text-subtle">{line.inventoryItemCode}</div>
                  </div>
                  <div
                    className={`text-sm font-black ${
                      line.quantityDelta < 0 ? "text-danger" : "text-success"
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
