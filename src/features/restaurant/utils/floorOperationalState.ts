import { Armchair, Ban, CalendarClock, CircleCheck, Clock, ReceiptText } from "lucide-react";
import { differenceInMinutes } from "date-fns";
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
export const OPERATIONAL_STATE_TILE_CLASSES: Record<RestaurantOperationalState, string> = {
  AVAILABLE: "border-emerald-400/40 bg-emerald-500/[0.07] hover:border-emerald-400/70",
  RESERVED_SOON: "border-violet-400/40 bg-violet-500/[0.07] hover:border-violet-400/70",
  OCCUPIED: "border-blue-400/40 bg-blue-500/[0.07] hover:border-blue-400/70",
  WAITING_PAYMENT: "border-amber-400/40 bg-amber-500/[0.07] hover:border-amber-400/70",
  PAID_STILL_SEATED: "border-teal-400/40 bg-teal-500/[0.07] hover:border-teal-400/70",
  UNAVAILABLE: "border-white/10 bg-white/[0.02] opacity-60 hover:border-white/20",
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
