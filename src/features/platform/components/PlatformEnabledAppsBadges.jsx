import { Package, ShoppingCart, Truck, UtensilsCrossed } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";

// Root App entitlement codes only (POS/INVENTORY/RESTAURANT/PROCUREMENT) -- exactly what the
// backend's EnabledAppCodes field returns (Platform Customer Control Center, Phase 4/5). Never
// infers enabled apps from tenant permissions; a code not present here means not effectively
// enabled, full stop -- no other visual state exists for "maybe enabled".
const APP_ICONS = {
  POS: ShoppingCart,
  INVENTORY: Package,
  RESTAURANT: UtensilsCrossed,
  PROCUREMENT: Truck,
};

export function PlatformEnabledAppsBadges({ codes, size = "sm" }) {
  const { t } = useI18n();
  const list = codes || [];

  if (list.length === 0) {
    return <span className="text-[11px] text-slate-500">{t("platform.apps.none")}</span>;
  }

  const padding = size === "lg" ? "px-2.5 py-1 text-[11px]" : "px-2 py-0.5 text-[10px]";
  const iconSize = size === "lg" ? 12 : 10;

  return (
    <div className="flex flex-wrap gap-1">
      {list.map((code) => {
        const Icon = APP_ICONS[code];
        return (
          <span
            key={code}
            className={`inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 font-bold text-emerald-300 ${padding}`}
          >
            {Icon && <Icon size={iconSize} />}
            {t(`platform.apps.${code}`) || code}
          </span>
        );
      })}
    </div>
  );
}
