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
