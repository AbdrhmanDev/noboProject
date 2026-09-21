import {
  CheckCircle2,
  ChefHat,
  Clock3,
  Coffee,
  CookingPot,
  ShoppingBag,
  StickyNote,
  Timer,
  Trash2,
  Truck,
  UserRound,
} from "lucide-react";

// Order type shown big at the top of every ticket. DineIn is the in-cafe / at-the-table order.
const FULFILLMENT_TYPES = {
  DineIn: { label: "في الكافيه", icon: Coffee, tone: "bg-accent-soft text-accent" },
  Takeaway: { label: "تيك أواي", icon: ShoppingBag, tone: "bg-success-soft text-success" },
  Delivery: { label: "دليفري", icon: Truck, tone: "bg-warning-soft text-warning" },
};

const STATUS_STYLES = {
  New: { label: "جديد", tone: "bg-accent-soft text-accent" },
  Preparing: { label: "قيد التحضير", tone: "bg-warning-soft text-warning" },
  Ready: { label: "جاهز", tone: "bg-success-soft text-success" },
};

function formatTicketAge(createdAtUtc) {
  const createdAt = new Date(createdAtUtc).getTime();
  if (!Number.isFinite(createdAt)) return "--";

  const minutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60000));
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `${minutes} د`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} س ${remainder} د` : `${hours} س`;
}

function formatTicketTime(value) {
  if (!value) return "--";

  return new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

/**
 * One kitchen order as a card: order type, table number (dine-in), the cashier who took it, every
 * item with its modifiers and notes, and the order note. A ready order stays on the board until
 * the trash button removes it. `createdByName`, `kitchenNote` and the
 * per-item `note` are optional — they render only when the API provides them.
 */
export function KitchenTicketCard({ ticket, canManage, isMutating, onStart, onReady, onDismiss }) {
  const type = FULFILLMENT_TYPES[ticket.fulfillmentType] || {
    label: ticket.fulfillmentType,
    icon: ChefHat,
    tone: "bg-inset text-muted",
  };
  const TypeIcon = type.icon;
  const status = STATUS_STYLES[ticket.status] || { label: ticket.status, tone: "bg-inset text-muted" };
  const table = ticket.restaurantTable;
  const cashierName = ticket.createdByName || ticket.cashierName;
  const orderNote = ticket.kitchenNote || ticket.note;

  return (
    <article
      className={`flex h-[420px] flex-col overflow-hidden rounded-2xl border bg-surface shadow-[var(--shadow-surface)] ${
        ticket.status === "Ready" ? "border-success" : "border-line"
      }`}
    >
      <div className={`flex items-center justify-between gap-3 px-4 py-3 ${type.tone}`}>
        <div className="flex items-center gap-2 text-lg font-black">
          <TypeIcon size={20} />
          {type.label}
        </div>
        <span className="rounded-full bg-surface/80 px-2.5 py-1 text-[11px] font-bold text-ink">
          {status.label}
        </span>
      </div>

      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <div className="min-w-0">
          {table ? (
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] font-semibold text-subtle">طاولة</span>
              <span className="text-3xl font-black leading-none text-ink">{table.code}</span>
              {table.name && table.name !== table.code && (
                <span className="truncate text-[11px] text-subtle">{table.name}</span>
              )}
            </div>
          ) : (
            <div className="text-xs font-semibold text-subtle">
              طلب #{ticket.kitchenTicketId.slice(-6)}
            </div>
          )}
          {cashierName && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted">
              <UserRound size={13} className="text-accent" />
              الكاشير: {cashierName}
            </div>
          )}
        </div>
        <div className="shrink-0 text-end text-[11px] text-subtle">
          <div className="flex items-center justify-end gap-1 font-bold text-ink">
            <Timer size={13} className="text-warning" />
            {formatTicketAge(ticket.createdAtUtc)}
          </div>
          <div className="mt-0.5 flex items-center justify-end gap-1">
            <Clock3 size={12} />
            {formatTicketTime(ticket.createdAtUtc)}
          </div>
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-2 scrollbar-none">
        {ticket.items.map((item) => (
          <div key={item.kitchenTicketItemId} className="rounded-xl border border-line bg-raised p-3">
            <div className="flex items-start gap-3">
              <span className="grid h-9 min-w-9 place-items-center rounded-lg bg-accent px-1.5 text-base font-black text-white">
                {Number(item.quantity)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black text-ink">{item.productName}</div>
                <div className="mt-0.5 text-[11px] text-subtle">
                  {item.variantName} · {item.salesUnitOfMeasure.symbol || item.salesUnitOfMeasure.code}
                </div>
              </div>
            </div>
            {item.modifiers.length > 0 && (
              <div className="mt-2 space-y-0.5 border-t border-line pt-2">
                {item.modifiers.map((modifier) => (
                  <div
                    key={`${item.kitchenTicketItemId}-${modifier.modifierGroupName}-${modifier.modifierOptionName}`}
                    className="text-[11px] font-semibold text-accent"
                  >
                    + {modifier.modifierGroupName}: {modifier.modifierOptionName}
                  </div>
                ))}
              </div>
            )}
            {item.note && (
              <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-warning-soft px-2 py-1.5 text-[11px] font-semibold text-warning">
                <StickyNote size={13} className="mt-0.5 shrink-0" />
                {item.note}
              </div>
            )}
          </div>
        ))}
      </div>

      {orderNote && (
        <div className="mx-4 mb-2 flex items-start gap-2 rounded-xl border border-warning/40 bg-warning-soft px-3 py-2 text-xs font-bold text-warning">
          <StickyNote size={15} className="mt-0.5 shrink-0" />
          <span className="min-w-0 break-words">{orderNote}</span>
        </div>
      )}

      <div className="px-4 pb-4">
        {ticket.status === "New" && (
          <button
            type="button"
            disabled={!canManage || isMutating}
            onClick={() => onStart(ticket)}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 text-xs font-black text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CookingPot size={16} />
            بدء التحضير
          </button>
        )}
        {ticket.status === "Preparing" && (
          <button
            type="button"
            disabled={!canManage || isMutating}
            onClick={() => onReady(ticket)}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-black text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 size={16} />
            جاهز
          </button>
        )}
        {ticket.status === "Ready" && (
          <button
            type="button"
            onClick={() => onDismiss?.(ticket)}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-danger/40 bg-danger-soft text-xs font-black text-danger transition hover:brightness-110"
          >
            <Trash2 size={16} />
            إزالة من الشاشة
          </button>
        )}
        {!canManage && ticket.status !== "Ready" && (
          <p className="mt-2 text-center text-[10px] text-subtle">
            صلاحية Kitchen.Manage مطلوبة لتغيير حالة التذكرة
          </p>
        )}
      </div>
    </article>
  );
}
