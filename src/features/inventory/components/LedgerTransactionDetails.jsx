import { ErrorState, LoadingState } from "../../../shared/components/ui";
import { formatDateTime } from "../../../shared/utils/formatters";
import { useI18n } from "../../../i18n/I18nContext";
import { useInventoryStockTransactionDetails } from "../hooks/useInventory";
import { getTransactionTypeTone, shortId } from "../utils/inventoryTransactionLabels";
import { InventoryModal } from "./InventoryModal";

function getErrorMessage(error, t) {
  return error?.message || t("inventory.common.requestFailed");
}

export function LedgerTransactionDetails({ companyId, branchId, inventoryStockTransactionId, onClose }) {
  const { t } = useI18n();
  const detailsQuery = useInventoryStockTransactionDetails(
    companyId,
    branchId,
    inventoryStockTransactionId,
    Boolean(inventoryStockTransactionId),
  );
  const details = detailsQuery.data;

  return (
    <InventoryModal title={t("inventory.transactionDetails.title")} onClose={onClose} size="lg">
      {detailsQuery.isLoading && <LoadingState label={t("inventory.transactionDetails.loading")} />}
      {detailsQuery.isError && (
        <ErrorState
          title={t("inventory.transactionDetails.loadError")}
          message={getErrorMessage(detailsQuery.error, t)}
        />
      )}
      {details && (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-raised p-3">
              <div className="text-xs text-subtle">{t("inventory.transactionDetails.field.transaction")}</div>
              <div className="mt-1 text-sm font-black text-ink">
                #{shortId(details.inventoryStockTransactionId)}
              </div>
            </div>
            <div className="rounded-xl border border-line bg-raised p-3">
              <div className="text-xs text-subtle">{t("inventory.transactionDetails.field.type")}</div>
              <div className={`mt-1 text-sm font-black ${getTransactionTypeTone(details.transactionType)}`}>
                {t(`inventory.type.${details.transactionType}`)}
              </div>
            </div>
            <div className="rounded-xl border border-line bg-raised p-3">
              <div className="text-xs text-subtle">{t("inventory.transactionDetails.field.dateTime")}</div>
              <div className="mt-1 text-sm font-black text-ink">
                {formatDateTime(details.createdAtUtc)}
              </div>
            </div>
            <div className="rounded-xl border border-line bg-raised p-3">
              <div className="text-xs text-subtle">{t("inventory.transactionDetails.field.location")}</div>
              <div className="mt-1 text-sm font-black text-ink">
                {details.inventoryLocationName} ({details.inventoryLocationCode})
              </div>
            </div>
            <div className="rounded-xl border border-line bg-raised p-3">
              <div className="text-xs text-subtle">{t("inventory.transactionDetails.field.user")}</div>
              <div className="mt-1 text-sm font-black text-ink">
                {shortId(details.createdByUserId)}
              </div>
            </div>
            <div className="rounded-xl border border-line bg-raised p-3">
              <div className="text-xs text-subtle">{t("inventory.transactionDetails.field.reference")}</div>
              <div className="mt-1 text-sm font-black text-ink">
                {details.sourceSalesOrderId
                  ? t("inventory.transactionDetails.reference.salesOrder", {
                      id: shortId(details.sourceSalesOrderId),
                    })
                  : details.reversesInventoryStockTransactionId
                    ? t("inventory.transactionDetails.reference.reverses", {
                        id: shortId(details.reversesInventoryStockTransactionId),
                      })
                    : t("inventory.transactionDetails.reference.manual")}
              </div>
            </div>
          </div>

          {details.reason && (
            <div className="rounded-xl border border-line bg-raised p-3">
              <div className="text-xs text-subtle">{t("inventory.transactionDetails.field.reason")}</div>
              <p className="mt-1 text-sm text-ink">{details.reason}</p>
            </div>
          )}

          <div>
            <div className="mb-2 text-xs font-bold uppercase text-subtle">
              {t("inventory.transactionDetails.linesCount", { count: details.lines.length })}
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
