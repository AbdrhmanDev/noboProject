// Application route constants
export const ROUTES = {
  LOGIN: "/",
  REGISTER: "/register",
  CONFIRM_EMAIL: "/confirm-email",
  DASHBOARD: "/dashboard",
  POS: "/POSPage",
  POS_SHIFT_HISTORY: "/pos/shifts",
  POS_TERMINALS_ADMIN: "/pos/terminals/admin",
  CATALOG_ADMIN: "/catalog/admin",
  PAYMENT_METHODS_ADMIN: "/payments/methods/admin",
  PRICING_ADMIN: "/pricing/admin",
  TAX_ADMIN: "/tax/admin",
  RESTAURANT_ADMIN: "/restaurant/admin",
  RESTAURANT_FLOOR: "/restaurant/floor",
  RESTAURANT_RESERVATIONS: "/restaurant/reservations",
  KITCHEN: "/kitchen",
  KITCHEN_ADMIN: "/kitchen/admin",
  SALES: "/sales",
  SALES_ORDER_DETAILS: "/sales/orders/:orderId",
  PURCHASES: "/purchases",
  PURCHASE_ORDER_NEW: "/purchases/new",
  PURCHASE_ORDER_DETAILS: "/purchases/:purchaseOrderId",
  PURCHASE_ORDER_EDIT: "/purchases/:purchaseOrderId/edit",
  INVENTORY: "/inventory",
  INVENTORY_ADMIN: "/inventory/admin",
  CUSTOMERS: "/customers",
  SUPPLIERS: "/suppliers",
  DEVICES_OVERVIEW: "/devices",
  DEVICES_LIST: "/devices/list",
  DEVICE_DETAILS: "/devices/list/:deviceId",
  EDGE_AGENTS: "/devices/agents",
  EDGE_AGENT_DETAILS: "/devices/agents/:edgeAgentId",
  DEVICE_DISCOVERY: "/devices/discovery",
  DEVICE_PRINTING: "/devices/printing",
  ACCOUNTING: "/accounting",
  REPORTS: "/reports",
  PROJECTS: "/projects",
  HR: "/hr",
  SETTINGS: "/settings",
  MORE: "/more",
  PROFILE: "/profile",
  NOT_FOUND: "*",
};

// Builds the concrete, navigable path for a dynamic route constant.
export function salesOrderDetailsPath(salesOrderId) {
  return `/sales/orders/${salesOrderId}`;
}

export function purchaseOrderDetailsPath(purchaseOrderId) {
  return `/purchases/${purchaseOrderId}`;
}

export function purchaseOrderEditPath(purchaseOrderId) {
  return `/purchases/${purchaseOrderId}/edit`;
}

export function deviceDetailsPath(deviceId) {
  return `/devices/list/${deviceId}`;
}

export function edgeAgentDetailsPath(edgeAgentId) {
  return `/devices/agents/${edgeAgentId}`;
}
