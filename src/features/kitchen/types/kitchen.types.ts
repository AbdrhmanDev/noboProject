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
