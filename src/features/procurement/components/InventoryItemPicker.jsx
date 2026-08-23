import { useI18n } from "../../../i18n/I18nContext";

// Reuses the real Inventory Item source (useActiveInventoryItems) — never a
// duplicated Inventory configuration API. `excludeIds` lets a line hide
// items already chosen on other lines, without inventing a backend
// uniqueness rule (the backend stays authoritative on that).
export function InventoryItemPicker({ items, value, onChange, excludeIds = [], disabled }) {
  const { t } = useI18n();
  const available = items.filter((item) => item.inventoryItemId === value || !excludeIds.includes(item.inventoryItemId));

  return (
    <select
      value={value || ""}
      onChange={(event) => onChange(event.target.value || null)}
      disabled={disabled}
      className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
    >
      <option value="">{t("procurement.po.form.itemSelectPlaceholder")}</option>
      {available.map((item) => (
        <option key={item.inventoryItemId} value={item.inventoryItemId}>
          {item.code} — {item.name} ({item.baseUnitOfMeasure.symbol})
        </option>
      ))}
    </select>
  );
}
