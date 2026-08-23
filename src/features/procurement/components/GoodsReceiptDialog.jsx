import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "../../../i18n/I18nContext";
import { useOperationalInventoryLocations } from "../../inventory/hooks/useInventory";
import { ProcurementModal } from "./ProcurementModal";
import { usePostPurchaseGoodsReceipt } from "../hooks/usePurchaseOrders";
import { getProcurementErrorMessageKey, grnNumberDisplay, purchaseOrderNumberDisplay } from "../utils/procurementFormatters";

function getErrorMessage(error, t) {
  const key = getProcurementErrorMessageKey(error);
  return key ? t(key) : error?.message || t("procurement.error.message");
}

export function GoodsReceiptDialog({ companyId, branchId, purchaseOrder, onClose, onSuccess }) {
  const { t } = useI18n();

  // One idempotency key per receiving session — generated once when this
  // dialog mounts (lazy initializer, never re-run), reused across the
  // user's submit + any retry, and only ever replaced by a fresh mount
  // (i.e. closing this dialog and opening a new receiving session).
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const locationsQuery = useOperationalInventoryLocations(companyId, branchId);
  const receiptMutation = usePostPurchaseGoodsReceipt(companyId, branchId, purchaseOrder.purchaseOrderId);

  const [inventoryLocationId, setInventoryLocationId] = useState("");
  const [note, setNote] = useState("");
  const [quantities, setQuantities] = useState({});
  const [formError, setFormError] = useState("");

  const locations = locationsQuery.data || [];
  const receivableLines = purchaseOrder.lines.filter((line) => line.orderedQuantity - line.receivedQuantity > 0);

  const setLineQuantity = (purchaseOrderLineId, value) => {
    setQuantities((current) => ({ ...current, [purchaseOrderLineId]: value }));
    setFormError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!inventoryLocationId) {
      setFormError(t("procurement.receipt.form.locationRequired"));
      return;
    }

    const lines = [];
    for (const line of receivableLines) {
      const raw = quantities[line.purchaseOrderLineId];
      if (raw === undefined || raw === "" || Number(raw) === 0) continue;

      const remaining = line.orderedQuantity - line.receivedQuantity;
      const receivedQuantity = Number(raw);
      if (!Number.isFinite(receivedQuantity) || receivedQuantity <= 0) {
        setFormError(t("procurement.receipt.form.quantityInvalid"));
        return;
      }
      if (receivedQuantity > remaining) {
        setFormError(t("procurement.receipt.form.exceedsRemaining", { item: line.inventoryItemName }));
        return;
      }
      lines.push({ purchaseOrderLineId: line.purchaseOrderLineId, receivedQuantity });
    }

    if (lines.length === 0) {
      setFormError(t("procurement.receipt.form.noQuantities"));
      return;
    }

    try {
      const receipt = await receiptMutation.mutateAsync({
        inventoryLocationId,
        note: note.trim() || null,
        lines,
        idempotencyKey,
      });
      const grn = grnNumberDisplay(receipt.grnNumber, receipt.grnNumberFormatted);
      toast.success(
        receipt.wasAlreadyProcessed
          ? t("procurement.toast.receiptAlreadyProcessed", { grn })
          : t("procurement.toast.receiptPosted", { grn }),
      );
      onSuccess();
    } catch (error) {
      // Concurrency: another user may have received first, so PO details
      // (Ordered/Previously Received/Remaining) is refetched by the mutation
      // hook regardless of outcome — this dialog just surfaces the friendly
      // message and lets the operator retry with corrected numbers.
      setFormError(getErrorMessage(error, t));
    }
  };

  return (
    <ProcurementModal title={t("procurement.receipt.title")} onClose={onClose} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">{t("procurement.po.title")}</span>
            <span className="font-bold text-slate-100">
              {purchaseOrderNumberDisplay(purchaseOrder.purchaseOrderNumber, purchaseOrder.purchaseOrderNumberFormatted)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-slate-500">{t("procurement.po.form.supplier")}</span>
            <span className="font-bold text-slate-100">{purchaseOrder.supplierName}</span>
          </div>
        </div>

        {formError && (
          <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {formError}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-400">
            {t("procurement.receipt.destinationLocation")}
            <select
              value={inventoryLocationId}
              onChange={(event) => setInventoryLocationId(event.target.value)}
              disabled={locationsQuery.isLoading}
              className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
            >
              <option value="">{t("procurement.receipt.locationSelectPlaceholder")}</option>
              {locations.map((location) => (
                <option key={location.inventoryLocationId} value={location.inventoryLocationId}>
                  {location.code} — {location.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-400">
            {t("procurement.po.form.note")}
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60"
            />
          </label>
        </div>

        <div className="space-y-2">
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 px-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 lg:grid">
            <span>{t("procurement.po.form.item")}</span>
            <span>{t("procurement.receipt.ordered")}</span>
            <span>{t("procurement.receipt.previouslyReceived")}</span>
            <span>{t("procurement.receipt.remaining")}</span>
            <span>{t("procurement.receipt.receiveNow")}</span>
          </div>
          {receivableLines.map((line) => {
            const remaining = line.orderedQuantity - line.receivedQuantity;
            return (
              <div
                key={line.purchaseOrderLineId}
                className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-2.5 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] lg:items-center"
              >
                <div className="col-span-2 text-xs font-bold text-slate-100 lg:col-span-1">
                  {line.inventoryItemName}
                  <span className="ms-1 text-slate-500">({line.baseUnitOfMeasure.symbol})</span>
                </div>
                <div className="text-xs text-slate-300">{line.orderedQuantity}</div>
                <div className="text-xs text-slate-300">{line.receivedQuantity}</div>
                <div className="text-xs font-bold text-amber-300">{remaining}</div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantities[line.purchaseOrderLineId] ?? ""}
                  onChange={(event) => setLineQuantity(line.purchaseOrderLineId, event.target.value)}
                  placeholder="0"
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none focus:border-emerald-400/60"
                />
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={receiptMutation.isPending || !inventoryLocationId}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-black text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {receiptMutation.isPending ? t("procurement.actions.saving") : t("procurement.actions.receiveGoods")}
        </button>
      </form>
    </ProcurementModal>
  );
}
