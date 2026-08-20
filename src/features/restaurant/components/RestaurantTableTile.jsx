import { Armchair, Ban, CircleCheck, Clock, ReceiptText } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { formatMoney } from "../../../shared/utils/formatters";
import {
  OPERATIONAL_STATE_LABEL_KEYS,
  OPERATIONAL_STATE_TONE,
} from "../utils/restaurantFloorState";

const TONE_CLASSES = {
  success: "border-emerald-400/40 bg-emerald-500/[0.07] hover:border-emerald-400/70",
  info: "border-blue-400/40 bg-blue-500/[0.07] hover:border-blue-400/70",
  warning: "border-amber-400/40 bg-amber-500/[0.07] hover:border-amber-400/70",
  neutral: "border-white/10 bg-white/[0.02] opacity-60 hover:border-white/20",
  danger: "border-rose-400/40 bg-rose-500/[0.07] hover:border-rose-400/70",
};

const STATE_ICON = {
  AVAILABLE: CircleCheck,
  OCCUPIED: Armchair,
  WAITING_PAYMENT: Clock,
  PAID: ReceiptText,
  UNAVAILABLE: Ban,
};

// One restrained tile shape for Phase 1 (no per-table shape metadata exists
// on the backend yet). The component only needs `table`/`state`/`order` to
// render — a future persisted X/Y position could wrap this same tile in an
// absolutely-positioned container without touching its internals.
export function RestaurantTableTile({ table, state, order, canViewOrders, selected, onSelect }) {
  const { t } = useI18n();
  const Icon = STATE_ICON[state];
  const showFinancials = canViewOrders && order && (state === "WAITING_PAYMENT" || state === "PAID" || state === "OCCUPIED");
  const extraOrderCount = table.orders.length > 1 ? table.orders.length - 1 : 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={state === "UNAVAILABLE"}
      className={`flex min-h-[112px] w-full flex-col justify-between gap-2 rounded-2xl border p-3 text-start transition disabled:cursor-not-allowed ${
        TONE_CLASSES[OPERATIONAL_STATE_TONE[state]]
      } ${selected ? "ring-2 ring-blue-400/70" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-black text-white">{table.code}</div>
          {table.name && <div className="truncate text-[10px] text-slate-500">{table.name}</div>}
        </div>
        <Icon size={16} className="shrink-0 text-slate-300" />
      </div>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          {t(OPERATIONAL_STATE_LABEL_KEYS[state])}
        </div>

        {showFinancials && order.currencyCode && (
          <div className="mt-1 space-y-0.5 text-[11px]">
            {state === "WAITING_PAYMENT" ? (
              <>
                <div className="text-slate-300">
                  {t("restaurantFloor.card.total")} {formatMoney(order.payableAmount, order.currencyCode, 2)}
                </div>
                <div className="font-bold text-amber-300">
                  {t("restaurantFloor.card.remaining")} {formatMoney(order.remainingAmount, order.currencyCode, 2)}
                </div>
              </>
            ) : (
              <div className="font-bold text-slate-100">
                {formatMoney(order.payableAmount, order.currencyCode, 2)}
              </div>
            )}
          </div>
        )}

        {extraOrderCount > 0 && (
          <div className="mt-1 text-[9px] font-bold text-blue-300">
            +{extraOrderCount} {t("restaurantFloor.card.moreOrders")}
          </div>
        )}
      </div>
    </button>
  );
}
