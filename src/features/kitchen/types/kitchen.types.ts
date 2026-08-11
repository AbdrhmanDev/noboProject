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

export type CreateKitchenStationRequest = {
  code: string;
  name: string;
  sortOrder: number;
};

export type CreateKitchenStationResponse = {
  kitchenStationId: string;
  branchId: string;
  code: string;
  name: string;
  sortOrder: number;
  status: KitchenStationStatus;
  createdAtUtc: string;
};

export type KitchenStationListItem = CreateKitchenStationResponse & {
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

export type KitchenStationDetails = CreateKitchenStationResponse & {
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
