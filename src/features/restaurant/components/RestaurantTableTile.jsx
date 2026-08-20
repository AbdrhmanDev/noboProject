import { Crown, StickyNote } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { formatMoney } from "../../../shared/utils/formatters";
import {
  OPERATIONAL_STATE_ICON,
  OPERATIONAL_STATE_ICON_CLASSES,
  OPERATIONAL_STATE_LABEL_KEYS,
  OPERATIONAL_STATE_TILE_CLASSES,
  formatElapsedMinutes,
  orderNumberDisplay,
} from "../utils/floorOperationalState";

function formatTime(value) {
  return new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

// One restrained tile per operational state, matching the task's exact
// per-state contextual content — table code/name always lead, then status,
// then the state-specific context block (never fabricated: every line only
// renders when the underlying field is actually present).
export function RestaurantTableTile({ table, canManage, selected, onSelect }) {
  const { t } = useI18n();
  const state = table.operationalState;
  const Icon = OPERATIONAL_STATE_ICON[state];
  const session = table.currentSession;
  const primaryOrder = table.activeOrders[0] || null;
  const extraOrderCount = table.activeOrders.length > 1 ? table.activeOrders.length - 1 : 0;
  const isVip = (session && session.isVip) || (table.nextReservation && table.nextReservation.isVip);
  const hasNote = Boolean(session?.note);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={state === "UNAVAILABLE" && !canManage}
      className={`flex min-h-[124px] w-full flex-col justify-between gap-2 rounded-2xl border p-3 text-start transition disabled:cursor-not-allowed ${
        OPERATIONAL_STATE_TILE_CLASSES[state]
      } ${selected ? "ring-2 ring-blue-400/70" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-black text-white">{table.code}</span>
            {isVip && <Crown size={12} className="shrink-0 text-amber-300" />}
          </div>
          {table.name && <div className="truncate text-[10px] text-slate-500">{table.name}</div>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {hasNote && <StickyNote size={13} className="text-slate-500" />}
          <Icon size={16} className={OPERATIONAL_STATE_ICON_CLASSES[state]} />
        </div>
      </div>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          {t(OPERATIONAL_STATE_LABEL_KEYS[state])}
        </div>

        {state === "AVAILABLE" && table.nextReservation && (
          <div className="mt-1 text-[10px] text-slate-500">
            {t("restaurantFloor.card.availableNow")}
            <br />
            {t("restaurantFloor.card.reservedAt", { time: formatTime(table.nextReservation.startsAtUtc) })}
          </div>
        )}

        {state === "RESERVED_SOON" && table.nextReservation && (
          <div className="mt-1 space-y-0.5 text-[11px] text-slate-300">
            <div className="font-bold text-violet-200">{formatTime(table.nextReservation.startsAtUtc)}</div>
            <div className="truncate">{table.nextReservation.guestName}</div>
            {table.nextReservation.guestCount != null && (
              <div className="text-slate-500">
                {t("restaurantFloor.card.guestCount", { count: table.nextReservation.guestCount })}
              </div>
            )}
          </div>
        )}

        {state === "OCCUPIED" && session && (
          <div className="mt-1 space-y-0.5 text-[11px] text-slate-300">
            {session.guestCount != null && (
              <div>{t("restaurantFloor.card.guestCount", { count: session.guestCount })}</div>
            )}
            <div className="text-slate-500">
              {t("restaurantFloor.card.elapsedMinutes", { minutes: formatElapsedMinutes(session.openedAtUtc) })}
            </div>
          </div>
        )}

        {state === "WAITING_PAYMENT" && primaryOrder && (
          <div className="mt-1 space-y-0.5 text-[11px]">
            <div className="font-bold text-slate-100">
              {orderNumberDisplay(primaryOrder.orderNumber, primaryOrder.orderNumberFormatted)}
            </div>
            <div className="text-slate-300">
              {t("restaurantFloor.card.total")}{" "}
              {formatMoney(primaryOrder.payableAmount, primaryOrder.currencyCode, primaryOrder.currencyMinorUnitDigits)}
            </div>
            <div className="font-bold text-amber-300">
              {t("restaurantFloor.card.remaining")}{" "}
              {formatMoney(primaryOrder.remainingAmount, primaryOrder.currencyCode, primaryOrder.currencyMinorUnitDigits)}
            </div>
          </div>
        )}

        {state === "PAID_STILL_SEATED" && primaryOrder && (
          <div className="mt-1 space-y-0.5 text-[11px]">
            <div className="font-bold text-slate-100">
              {orderNumberDisplay(primaryOrder.orderNumber, primaryOrder.orderNumberFormatted)}
            </div>
            <div className="font-bold text-teal-300">
              {t("restaurantFloor.card.paid")}{" "}
              {formatMoney(primaryOrder.payableAmount, primaryOrder.currencyCode, primaryOrder.currencyMinorUnitDigits)}
            </div>
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
