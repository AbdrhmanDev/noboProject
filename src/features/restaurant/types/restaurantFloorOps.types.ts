// ---- Contract note ----
// This backend's OpenAPI document (confirmed via /openapi/v1.json) fully
// describes every request body and query parameter below, but — consistent
// with every other controller observed in this codebase so far — it does
// NOT describe response bodies (each GET/action here has only
// `"200": { "description": "OK" }`, no schema). Request-side fields
// (guestName/guestCount/isVip/note/startsAtUtc/endsAtUtc/etc.) are exact and
// reliable.
//
// GET /restaurant/floor-state's actual response root (confirmed against a
// real authenticated payload) is `{ floors: [...] }` — there is NO
// root-level `tables` array, and each floor's `tables` are NESTED inside
// it. The table object's session field is named `currentSession` (not
// `session`), and it also carries `configuredStatus`. The types below match
// that real shape exactly; RestaurantFloorStateTable (flattened, with
// floor context merged in) is a UI-only derived shape built by
// useFloorState, never sent or received over the wire.

export type RestaurantOperationalState =
  | "AVAILABLE"
  | "RESERVED_SOON"
  | "OCCUPIED"
  | "WAITING_PAYMENT"
  | "PAID_STILL_SEATED"
  | "UNAVAILABLE";

// Same shape already confirmed for Sales (SalesOrderListItemResult /
// SalesOrderRetrievalListItemResponse) — floor-state's activeOrders reuse
// this backend's one established "order summary" shape.
export type RestaurantActiveOrder = {
  salesOrderId: string;
  orderNumber: number;
  orderNumberFormatted: string;
  status: "Draft" | "Confirmed" | "Closed" | "Cancelled";
  currencyCode: string;
  currencyMinorUnitDigits: number;
  payableAmount: number;
  netPaidAmount: number;
  remainingAmount: number;
  isFullyPaid: boolean;
  createdAtUtc: string;
  updatedAtUtc: string | null;
};

export type RestaurantTableSession = {
  restaurantTableSessionId: string;
  restaurantTableId: string;
  reservationId: string | null;
  guestName: string | null;
  guestCount: number | null;
  isVip: boolean;
  note: string | null;
  openedAtUtc: string;
};

export type RestaurantNextReservation = {
  restaurantReservationId: string;
  guestName: string;
  guestCount: number | null;
  startsAtUtc: string;
  endsAtUtc: string;
  isVip: boolean;
  note: string | null;
};

// Exact wire shape of one table entry inside a floor's `tables` array.
export type RestaurantFloorStateApiTable = {
  restaurantTableId: string;
  code: string;
  name: string | null;
  sortOrder: number;
  configuredStatus: "Active" | "Suspended";
  operationalState: RestaurantOperationalState;
  currentSession: RestaurantTableSession | null;
  activeOrders: RestaurantActiveOrder[];
  nextReservation: RestaurantNextReservation | null;
};

// Exact wire shape of the response root: floors, each carrying its own
// nested tables. No root-level `tables` array exists.
export type RestaurantFloorStateApiFloor = {
  restaurantFloorId: string;
  name: string;
  sortOrder: number;
  tables: RestaurantFloorStateApiTable[];
};

export type RestaurantFloorStateResponse = {
  floors: RestaurantFloorStateApiFloor[];
};

// UI-only flattened shape: one entry per table with its floor context
// merged in (restaurantFloorId/floorName/floorSortOrder), built by
// useFloorState via useMemo — never mutates the server response, never
// sent/received over the wire.
export type RestaurantFloorStateTable = RestaurantFloorStateApiTable & {
  restaurantFloorId: string;
  floorName: string;
  floorSortOrder: number;
};

// Simple floor list (no nested tables) used for the floor filter dropdown.
export type RestaurantFloorStateFloor = {
  restaurantFloorId: string;
  name: string;
  sortOrder: number;
};

export type RestaurantFloorStateFilters = {
  reservedSoonWindowMinutes?: number;
};

// ---- Sessions (fully confirmed request contracts) ----

export type OpenRestaurantTableSessionRequest = {
  reservationId?: string | null;
  guestName?: string | null;
  guestCount?: number | null;
  isVip: boolean;
  note?: string | null;
};

export type UpdateRestaurantTableSessionRequest = {
  guestName?: string | null;
  guestCount?: number | null;
  isVip: boolean;
  note?: string | null;
};

// ---- Reservations ----

export type RestaurantReservationStatus = "Booked" | "Seated" | "Completed" | "Cancelled" | "NoShow";

export type CreateRestaurantReservationRequest = {
  restaurantTableId: string;
  guestName: string;
  guestCount?: number | null;
  startsAtUtc: string;
  endsAtUtc: string;
  isVip: boolean;
  note?: string | null;
};

export type UpdateRestaurantReservationRequest = {
  guestName: string;
  guestCount?: number | null;
  startsAtUtc: string;
  endsAtUtc: string;
  isVip: boolean;
  note?: string | null;
};

export type SeatRestaurantReservationRequest = {
  guestName?: string | null;
  guestCount?: number | null;
  isVip: boolean;
  note?: string | null;
};

export type RestaurantReservationListItem = {
  restaurantReservationId: string;
  restaurantTableId: string;
  restaurantTableCode: string;
  restaurantFloorName: string | null;
  guestName: string;
  guestCount: number | null;
  startsAtUtc: string;
  endsAtUtc: string;
  isVip: boolean;
  note: string | null;
  status: RestaurantReservationStatus;
  createdAtUtc: string | null;
};

export type RestaurantReservationsListFilters = {
  pageNumber?: number;
  pageSize?: number;
  startsFromUtc?: string;
  startsToUtc?: string;
  tableId?: string;
  status?: RestaurantReservationStatus | "";
};

export type RestaurantReservationsListResponse = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: RestaurantReservationListItem[];
};
