import { Armchair, Ban, CalendarClock, CircleCheck, Clock, ReceiptText } from "lucide-react";
import { differenceInMinutes } from "date-fns";
import type { ApiError } from "../../../shared/api/apiError";
import type {
  RestaurantOperationalState,
  RestaurantTableAttentionType,
} from "../types/restaurantFloorOps.types";

// Backend-authoritative states, rendered verbatim — never invented or
// reinterpreted client-side (floor-state is now the single source of truth
// for operational state; there is no client derivation left).
export const OPERATIONAL_STATE_LABEL_KEYS: Record<RestaurantOperationalState, string> = {
  AVAILABLE: "restaurantFloor.state.available",
  RESERVED_SOON: "restaurantFloor.state.reservedSoon",
  OCCUPIED: "restaurantFloor.state.occupied",
  WAITING_PAYMENT: "restaurantFloor.state.waitingPayment",
  PAID_STILL_SEATED: "restaurantFloor.state.paidStillSeated",
  UNAVAILABLE: "restaurantFloor.state.unavailable",
};

export const OPERATIONAL_STATE_ICON = {
  AVAILABLE: CircleCheck,
  RESERVED_SOON: CalendarClock,
  OCCUPIED: Armchair,
  WAITING_PAYMENT: Clock,
  PAID_STILL_SEATED: ReceiptText,
  UNAVAILABLE: Ban,
} as const;

// Restrained, professional per-state palette (color is never the only
// indicator — every tile also carries an icon + localized text).
// Floor-plan table colour (RestaurantTableTile) -- the ONLY thing a table shows besides its number,
// driven by the table's open orders (not its operational state):
//   empty     no open order (none at all, or everything already paid)        -> no colour
//   notSent   an open order is still a Draft: taken, not yet sent (confirmed)
//             to the kitchen, so it isn't on the kitchen screen yet           -> yellow
//   inKitchen every open order is Confirmed, i.e. sent to the kitchen screen  -> green
// "Not sent" wins over "in kitchen": one unsent order on the table is what needs attention.
export type TableTone = "empty" | "notSent" | "inKitchen";

export function getTableTone(table: {
  activeOrders: { status: string; isFullyPaid: boolean }[];
}): TableTone {
  const openOrders = table.activeOrders.filter(
    (order) => order.status !== "Closed" && order.status !== "Cancelled" && !order.isFullyPaid,
  );
  if (openOrders.length === 0) return "empty";
  if (openOrders.some((order) => order.status === "Draft")) return "notSent";
  return "inKitchen";
}

export const TABLE_TONES: TableTone[] = ["empty", "notSent", "inKitchen"];

export const TABLE_TONE_LABEL_KEYS: Record<TableTone, string> = {
  empty: "restaurantFloor.tone.empty",
  notSent: "restaurantFloor.tone.notSent",
  inKitchen: "restaurantFloor.tone.inKitchen",
};

// The table top itself...
export const TABLE_TONE_CLASSES: Record<TableTone, string> = {
  empty: "border-white/15 bg-white/[0.03] group-hover:border-white/30",
  notSent: "border-amber-400/80 bg-amber-400/25 group-hover:border-amber-300",
  inKitchen: "border-emerald-400/70 bg-emerald-500/20 group-hover:border-emerald-400",
};

// ...the chairs around it...
export const TABLE_TONE_CHAIR_CLASSES: Record<TableTone, string> = {
  empty: "bg-white/15",
  notSent: "bg-amber-400/90",
  inKitchen: "bg-emerald-400/80",
};

// ...the number on it...
export const TABLE_TONE_TEXT_CLASSES: Record<TableTone, string> = {
  empty: "text-slate-300",
  notSent: "text-amber-100",
  inKitchen: "text-emerald-50",
};

// ...and its legend swatch (RestaurantFloorPage).
export const TABLE_TONE_SWATCH_CLASSES: Record<TableTone, string> = {
  empty: "border-white/25 bg-white/[0.03]",
  notSent: "border-amber-400 bg-amber-400/40",
  inKitchen: "border-emerald-400 bg-emerald-500/30",
};

export const OPERATIONAL_STATE_BADGE_CLASSES: Record<RestaurantOperationalState, string> = {
  AVAILABLE: "bg-emerald-500/15 text-emerald-300",
  RESERVED_SOON: "bg-violet-500/15 text-violet-300",
  OCCUPIED: "bg-blue-500/15 text-blue-300",
  WAITING_PAYMENT: "bg-amber-500/15 text-amber-300",
  PAID_STILL_SEATED: "bg-teal-500/15 text-teal-300",
  UNAVAILABLE: "bg-white/10 text-gray-400",
};

export const OPERATIONAL_STATE_ICON_CLASSES: Record<RestaurantOperationalState, string> = {
  AVAILABLE: "text-emerald-300",
  RESERVED_SOON: "text-violet-300",
  OCCUPIED: "text-blue-300",
  WAITING_PAYMENT: "text-amber-300",
  PAID_STILL_SEATED: "text-teal-300",
  UNAVAILABLE: "text-slate-500",
};

// "24 min" style elapsed duration since the session opened — recomputed
// from the authoritative openedAtUtc on every render/refresh, never a
// client-side ticking timer state.
export function formatElapsedMinutes(openedAtUtc: string) {
  const minutes = differenceInMinutes(new Date(), new Date(openedAtUtc));
  return Math.max(0, minutes);
}

// Deliberately duplicated (not imported) from the Sales feature's identical
// helper — this feature stays decoupled from features/sales the same way
// Sales itself avoids depending on features/sales-orders. Primary
// human-facing identifier: prefers the backend-formatted "ORD-100096" and
// only falls back to formatting the raw numeric orderNumber if the
// formatted field is genuinely missing.
export function orderNumberDisplay(
  orderNumber?: number | null,
  orderNumberFormatted?: string | null,
) {
  if (orderNumberFormatted) return orderNumberFormatted;
  if (orderNumber !== undefined && orderNumber !== null) return `ORD-${orderNumber}`;
  return "";
}

// Attention is NOT a 7th operational state — it's a separate red overlay on
// top of whatever the real operational state already is.
export const ATTENTION_TYPE_LABEL_KEYS: Record<RestaurantTableAttentionType, string> = {
  GuestIssue: "restaurantFloor.attention.type.guestIssue",
  ServiceIssue: "restaurantFloor.attention.type.serviceIssue",
  Complaint: "restaurantFloor.attention.type.complaint",
  SpecialRequest: "restaurantFloor.attention.type.specialRequest",
  Other: "restaurantFloor.attention.type.other",
};

export const ATTENTION_STATUS_LABEL_KEYS = {
  Open: "restaurantFloor.attention.status.open",
  Acknowledged: "restaurantFloor.attention.status.acknowledged",
  Resolved: "restaurantFloor.attention.status.resolved",
} as const;

// Open attentions pulse (nobody has taken ownership yet); once every active
// attention has been acknowledged, the indicator stays visible but calm.
export function hasOpenAttention(activeAttentions: { status: string }[]) {
  return activeAttentions.some((attention) => attention.status === "Open");
}

// Release is now a transactional end-of-visit action with real business
// rejection reasons. These three codes are the ones the backend's finalized
// release lifecycle can return; everything else falls back to the generic
// error message. Raw codes are never shown to the user.
export const RELEASE_ERROR_MESSAGE_KEYS: Record<string, string> = {
  "RestaurantTableSession.DraftOrderPending": "restaurantFloor.releaseError.draftOrderPending",
  "SalesOrder.PaymentIncomplete": "restaurantFloor.releaseError.paymentIncomplete",
  "SalesOrder.KitchenIncomplete": "restaurantFloor.releaseError.kitchenIncomplete",
};

export function getReleaseErrorMessageKey(error: ApiError | null | undefined) {
  if (!error?.code) return null;
  return RELEASE_ERROR_MESSAGE_KEYS[error.code] || null;
}
