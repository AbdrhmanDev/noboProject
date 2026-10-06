import { Plus, Trash2 } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { formatMoney } from "../../../shared/utils/formatters";
import { formatPurchaseAmount } from "../utils/procurementFormatters";
import { InventoryItemPicker } from "./InventoryItemPicker";

// Draft-only editor: quantity/cost text inputs stay decimal-safe by keeping
// the raw string in state and only parsing to a number at save time (the
// parent already does that) — this avoids the classic "0.10" -> "0.1"
// re-render fight controlled numeric inputs cause.
//
// currencyCode is the PO's (or, pre-save, the Company's default) currency —
// null only in the brief window before either is known, in which case line
// totals fall back to a numeric-only display (see formatPurchaseAmount).
export function PurchaseOrderLineEditor({ lines, onChange, items, disabled, currencyCode, currencyMinorUnitDigits }) {
  const { t } = useI18n();

  const addLine = () => {
    onChange([...lines, { key: crypto.randomUUID(), inventoryItemId: "", orderedQuantity: "", unitCost: "" }]);
  };

  const updateLine = (key, patch) => {
    onChange(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  };

  const removeLine = (key) => {
    onChange(lines.filter((line) => line.key !== key));
  };

  const selectedIds = lines.map((line) => line.inventoryItemId).filter(Boolean);

  return (
    <div className="space-y-2">
      <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 px-1 text-xs font-bold uppercase tracking-wide text-subtle lg:grid">
        <span>{t("procurement.po.form.item")}</span>
        <span>{t("procurement.po.form.orderedQuantity")}</span>
        <span>{t("procurement.po.form.unitCost")}</span>
        <span>{t("procurement.po.form.lineTotal")}</span>
        <span />
      </div>

      {lines.map((line) => {
        const quantity = Number(line.orderedQuantity);
        const unitCost = Number(line.unitCost);
        const lineTotal = Number.isFinite(quantity) && Number.isFinite(unitCost) ? quantity * unitCost : 0;

        return (
          <div
            key={line.key}
            className="grid grid-cols-2 gap-2 rounded-xl border border-line bg-raised p-2.5 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-center"
          >
            <div className="col-span-2 lg:col-span-1">
              <InventoryItemPicker
                items={items}
                value={line.inventoryItemId}
                onChange={(inventoryItemId) => updateLine(line.key, { inventoryItemId })}
                excludeIds={selectedIds.filter((id) => id !== line.inventoryItemId)}
                disabled={disabled}
              />
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={line.orderedQuantity}
              onChange={(event) => updateLine(line.key, { orderedQuantity: event.target.value })}
              placeholder={t("procurement.po.form.orderedQuantity")}
              disabled={disabled}
              className="h-10 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
            />
            <input
              type="text"
              inputMode="decimal"
              value={line.unitCost}
              onChange={(event) => updateLine(line.key, { unitCost: event.target.value })}
              placeholder={t("procurement.po.form.unitCost")}
              disabled={disabled}
              className="h-10 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
            />
            <div className="text-sm font-bold text-ink">
              {currencyCode
                ? formatMoney(lineTotal, currencyCode, currencyMinorUnitDigits ?? undefined)
                : formatPurchaseAmount(lineTotal)}
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeLine(line.key)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-danger bg-danger-soft text-danger hover:brightness-110"
                aria-label={t("procurement.po.form.removeLine")}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      })}

      {!disabled && (
        <button
          type="button"
          onClick={addLine}
          className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line text-sm font-bold text-muted hover:bg-raised"
        >
          <Plus size={14} />
          {t("procurement.po.form.addItem")}
        </button>
      )}
    </div>
  );
}
