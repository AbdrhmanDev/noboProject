// Application route constants
export const ROUTES = {
  LOGIN: "/",
  REGISTER: "/register",
  CONFIRM_EMAIL: "/confirm-email",
  FORGOT_PASSWORD: "/forgot-password",
  INVITE_ACCEPT: "/invite/:token",
  DASHBOARD: "/dashboard",
  REGISTRATION_NEW: "/registration/new",
  POS: "/POSPage",
  POS_SHIFT_HISTORY: "/pos/shifts",
  POS_TERMINALS_ADMIN: "/pos/terminals/admin",
  CATALOG_ADMIN: "/catalog/admin",
  PAYMENT_METHODS_ADMIN: "/payments/methods/admin",
  PRICING_ADMIN: "/pricing/admin",
  TAX_ADMIN: "/tax/admin",
  INVOICE_TEMPLATES_ADMIN: "/invoicing/templates/admin",
  INVOICE_TEMPLATE_DETAILS: "/invoicing/templates/admin/:templateId",
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
  COMPANY_PROFILE: "/company/profile",
  COMPANY_PROFILE_AMENDMENTS: "/company/profile/amendments",
  COMPANY_PROFILE_AMENDMENT_DETAILS: "/company/profile/amendments/:registrationId",
  BRANCHES_ADMIN: "/branches/admin",
  GENERATION_UNITS_ADMIN: "/compliance/generation-units",
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
  PLATFORM_OVERVIEW: "/platform/overview",
  PLATFORM_COMPANIES: "/platform/companies",
  PLATFORM_COMPANY_DETAILS: "/platform/companies/:companyId",
  PLATFORM_COMPANY_ENTITLEMENTS: "/platform/companies/:companyId/entitlements",
  PLATFORM_STAFF: "/platform/staff",
  PLATFORM_REGISTRATIONS: "/platform/registrations",
  PLATFORM_REGISTRATION_DETAILS: "/platform/registrations/:registrationId",
  ACCOUNTING: "/accounting",
  REPORTS: "/reports",
  PROJECTS: "/projects",
  HR: "/hr",
  SETTINGS: "/settings",
  USERS_ACCESS: "/settings/users",
  APPROVAL_POLICIES: "/settings/approval-policies",
  APPROVALS: "/settings/approvals",
  MORE: "/more",
  PROFILE: "/profile",
  NOT_FOUND: "*",
};

// Builds the concrete, navigable path for a dynamic route constant.
export function salesOrderDetailsPath(salesOrderId) {
  return `/sales/orders/${salesOrderId}`;
}

export function invoiceTemplateDetailsPath(templateId) {
  return `/invoicing/templates/admin/${templateId}`;
}

export function companyProfileAmendmentDetailsPath(registrationId) {
  return `/company/profile/amendments/${registrationId}`;
}

export function platformRegistrationDetailsPath(registrationId) {
  return `/platform/registrations/${registrationId}`;
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

export function platformCompanyDetailsPath(companyId) {
  return `/platform/companies/${companyId}`;
}

export function platformCompanyEntitlementsPath(companyId) {
  return `/platform/companies/${companyId}/entitlements`;
}
