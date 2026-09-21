export type KitchenTicketStatus = "New" | "Preparing" | "Ready" | "Cancelled";

export type OperationalKitchenStation = {
  kitchenStationId: string;
  code: string;
  name: string;
  sortOrder: number;
  status: "Active";
};

export type OpenKitchenTicketRestaurantTable = {
  restaurantTableId: string;
  code: string;
  name: string | null;
};

export type OpenKitchenTicketUnitOfMeasure = {
  code: string;
  name: string;
  symbol: string;
};

export type OpenKitchenTicketItemModifier = {
  modifierGroupName: string;
  modifierOptionName: string;
};

export type OpenKitchenTicketItem = {
  kitchenTicketItemId: string;
  salesOrderLineId: string;
  lineNumber: number;
  productName: string;
  variantName: string;
  quantity: number;
  salesUnitOfMeasure: OpenKitchenTicketUnitOfMeasure;
  modifiers: OpenKitchenTicketItemModifier[];
  // Not sent by the API yet — the kitchen card shows it when present.
  note?: string | null;
};

export type OpenKitchenTicket = {
  kitchenTicketId: string;
  salesOrderId: string;
  status: Extract<KitchenTicketStatus, "New" | "Preparing">;
  createdAtUtc: string;
  startedAtUtc: string | null;
  fulfillmentType: "DineIn" | "Takeaway" | "Delivery" | string;
  restaurantTable: OpenKitchenTicketRestaurantTable | null;
  items: OpenKitchenTicketItem[];
  // Not sent by the API yet — the kitchen card shows them when present.
  createdByName?: string | null;
  kitchenNote?: string | null;
};

export type KitchenTicketLifecycleResponse = {
  kitchenTicketId: string;
  status: KitchenTicketStatus;
  startedAtUtc: string | null;
  startedByUserId: string | null;
  readyAtUtc: string | null;
  readyByUserId: string | null;
  wasAlreadyInState: boolean;
};

export type KitchenStationStatus = "Active" | "Suspended";

export type KitchenStationFilters = {
  status?: KitchenStationStatus | "";
  search?: string;
};

// Shape of a station as the API returns it (also the base of the list / details / update results).
export type KitchenStationBase = {
  kitchenStationId: string;
  branchId: string;
  code: string;
  name: string;
  sortOrder: number;
  status: KitchenStationStatus;
  createdAtUtc: string;
};

export type KitchenStationListItem = KitchenStationBase & {
  routeCount: number;
};

export type KitchenStationRouteSummary = {
  productVariantKitchenRouteId: string;
  productVariantId: string;
  productName: string;
  variantName: string;
  sku: string | null;
  isEnabled: boolean;
  sortOrder: number;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type KitchenStationDetails = KitchenStationBase & {
  routes: KitchenStationRouteSummary[];
};

export type UpdateKitchenStationRequest = {
  code: string;
  name: string;
  sortOrder: number;
};

export type ChangeKitchenStationStatusRequest = {
  status: KitchenStationStatus;
};

export type SetProductVariantKitchenRouteRequest = {
  isEnabled: boolean;
  sortOrder: number;
};

export type SetProductVariantKitchenRouteResponse = {
  productVariantKitchenRouteId: string;
  branchId: string;
  productVariantId: string;
  kitchenStationId: string;
  isEnabled: boolean;
  sortOrder: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  wasCreated: boolean;
};

export type ProductVariantKitchenRoute = {
  productVariantKitchenRouteId: string;
  branchId: string;
  productVariantId: string;
  kitchenStationId: string;
  kitchenStationCode: string;
  kitchenStationName: string;
  kitchenStationStatus: KitchenStationStatus;
  isEnabled: boolean;
  sortOrder: number;
  createdAtUtc: string;
  updatedAtUtc: string;
};
