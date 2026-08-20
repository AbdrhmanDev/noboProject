import type { RetrievableSalesOrder } from "../../sales-orders/types/draftSalesOrder.types";

// UI-only operational presentation — never a backend status. Derived purely
// from real fields (RestaurantTableAdmin.status, and Draft/Confirmed
// RestaurantTableId/IsFullyPaid/RemainingAmount off the retrievable-orders
// endpoint). No Reserved state exists here: this backend has no
// reservation/booking domain, so it is never fabricated.
export type FloorTableOperationalState =
  | "AVAILABLE"
  | "OCCUPIED"
  | "WAITING_PAYMENT"
  | "PAID"
  | "UNAVAILABLE";

export type FloorViewTable = {
  restaurantTableId: string;
  restaurantFloorId: string;
  floorName: string;
  code: string;
  name: string | null;
  sortOrder: number;
  adminStatus: "Active" | "Suspended" | null;
  isOccupied: boolean | null;
  openSalesOrderCount: number | null;
  // Every active (Draft/Confirmed) Dine-In order actually associated with
  // this table by RestaurantTableId, most-recently-updated first. The
  // backend's own openSalesOrderCount can be >1, so this is deliberately an
  // array, never a single "the" order picked arbitrarily.
  orders: RetrievableSalesOrder[];
};

// Deterministic precedence: a suspended table is never anything but
// UNAVAILABLE, regardless of whether it happens to have an order attached.
// Otherwise the most-recently-updated active order (if any) decides the
// state; no order at all means AVAILABLE.
export function deriveTableOperationalState(table: FloorViewTable): FloorTableOperationalState {
  if (table.adminStatus === "Suspended") return "UNAVAILABLE";

  const primaryOrder = table.orders[0] || null;
  if (!primaryOrder) return "AVAILABLE";

  if (primaryOrder.status === "Draft") return "OCCUPIED";

  // Confirmed
  if (primaryOrder.isFullyPaid) return "PAID";
  if (primaryOrder.remainingAmount > 0) return "WAITING_PAYMENT";

  return "OCCUPIED";
}

export const OPERATIONAL_STATE_TONE: Record<
  FloorTableOperationalState,
  "success" | "warning" | "info" | "neutral" | "danger"
> = {
  AVAILABLE: "success",
  OCCUPIED: "info",
  WAITING_PAYMENT: "warning",
  PAID: "success",
  UNAVAILABLE: "neutral",
};

export const OPERATIONAL_STATE_LABEL_KEYS: Record<FloorTableOperationalState, string> = {
  AVAILABLE: "restaurantFloor.state.available",
  OCCUPIED: "restaurantFloor.state.occupied",
  WAITING_PAYMENT: "restaurantFloor.state.waitingPayment",
  PAID: "restaurantFloor.state.paid",
  UNAVAILABLE: "restaurantFloor.state.unavailable",
};
