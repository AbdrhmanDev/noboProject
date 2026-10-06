import { Boxes, History, LayoutDashboard, PackageSearch } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";

const TABS = [
  ["overview", "inventory.tabs.overview", LayoutDashboard],
  ["stock", "inventory.tabs.stock", PackageSearch],
  ["ledger", "inventory.tabs.ledger", History],
];

// Odoo-style app bar for the Inventory module: module name + its menu as tabs. Theme-aware.
export function InventoryOperationsHeader({ tab, setTab }) {
  const { t } = useI18n();

  return (
    <header className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-line bg-surface px-4 py-2.5 shadow-[var(--shadow-surface)]">
      <div className="flex items-center gap-2 text-lg font-bold text-ink">
        <Boxes size={18} className="text-accent" />
        {t("nav.inventory")}
      </div>
      <nav className="flex flex-wrap gap-1" aria-label={t("nav.inventory")}>
        {TABS.map(([value, labelKey, Icon]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            aria-current={tab === value ? "page" : undefined}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-bold transition ${
              tab === value ? "bg-accent-soft text-accent" : "text-muted hover:bg-hover hover:text-ink"
            }`}
          >
            <Icon size={15} />
            {t(labelKey)}
          </button>
        ))}
      </nav>
    </header>
  );
}
