import { Plus, Trash2 } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { formatMoney } from "../../../shared/utils/formatters";
import { InventoryItemPicker } from "./InventoryItemPicker";

// Draft-only editor: quantity/cost text inputs stay decimal-safe by keeping
// the raw string in state and only parsing to a number at save time (the
// parent already does that) — this avoids the classic "0.10" -> "0.1"
// re-render fight controlled numeric inputs cause.
export function PurchaseOrderLineEditor({ lines, onChange, items, currencyCode, disabled }) {
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
      <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 px-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 lg:grid">
        <span>{t("procurement.po.form.item")}</span>
        <span>{t("procurement.po.form.orderedQuantity")}</span>
        <span>{t("procurement.po.form.unitCost")}</span>
        <span>{t("procurement.po.form.lineTotal")}</span>
        <span />
      </div>

      {lines.map((line) => {
        const item = items.find((candidate) => candidate.inventoryItemId === line.inventoryItemId);
        const quantity = Number(line.orderedQuantity);
        const unitCost = Number(line.unitCost);
        const lineTotal = Number.isFinite(quantity) && Number.isFinite(unitCost) ? quantity * unitCost : 0;

        return (
          <div
            key={line.key}
            className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-2.5 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-center"
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
              className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
            />
            <input
              type="text"
              inputMode="decimal"
              value={line.unitCost}
              onChange={(event) => updateLine(line.key, { unitCost: event.target.value })}
              placeholder={t("procurement.po.form.unitCost")}
              disabled={disabled}
              className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
            />
            <div className="text-xs font-bold text-slate-200">
              {item && currencyCode ? formatMoney(lineTotal, currencyCode, 2) : lineTotal.toFixed(2)}
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeLine(line.key)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-400/25 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
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
          className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 text-xs font-bold text-slate-300 hover:bg-white/[0.03]"
        >
          <Plus size={14} />
          {t("procurement.po.form.addItem")}
        </button>
      )}
    </div>
  );
}
