// Frontend mirror of the backend's Nobo.Application.Authorization.ApplicationPermissions catalog
// -- same pattern as features/platform/constants/platformPermissions.ts already uses for the
// Platform Control Plane. This is NOT a copy of the whole backend file (47 constants total): it
// only centralizes the codes actually consumed by the POS/Sales/Payments/Customers/Restaurant/
// Kitchen frontend surface, per the POS Authorization Hardening task. Every value below was
// verified against the backend catalog during the POS Roles & Permissions Audit -- never guess or
// invent a code here; add one only once it is confirmed to exist server-side.
//
// This intentionally does NOT replace `features/users-access/constants/permissionMetadata.ts`,
// which serves a different purpose (the full company-wide permission list + UI labels for the
// role-assignment editor) and already lists every code below among many others unrelated to POS.

// ---- Sales Orders ----
export const SALES_ORDERS_VIEW_PERMISSION = "SalesOrders.View";
export const SALES_ORDERS_CREATE_PERMISSION = "SalesOrders.Create";
export const SALES_ORDERS_EDIT_DRAFT_PERMISSION = "SalesOrders.EditDraft";
export const SALES_ORDERS_CONFIRM_PERMISSION = "SalesOrders.Confirm";
export const SALES_ORDERS_CANCEL_PERMISSION = "SalesOrders.Cancel";
export const SALES_ORDERS_CLOSE_PERMISSION = "SalesOrders.Close";
export const SALES_ORDERS_VOID_PREPARED_PERMISSION = "SalesOrders.VoidPrepared";
export const SALES_ORDERS_APPLY_DISCOUNT_PERMISSION = "SalesOrders.ApplyDiscount";

// ---- Payments ----
export const PAYMENTS_VIEW_PERMISSION = "Payments.View";
export const PAYMENTS_RECEIVE_PERMISSION = "Payments.Receive";
export const PAYMENTS_REFUND_PERMISSION = "Payments.Refund";
export const PAYMENTS_CONFIGURE_PERMISSION = "Payments.Configure";

// ---- POS ----
export const POS_VIEW_PERMISSION = "Pos.View";
export const POS_CONFIGURE_PERMISSION = "Pos.Configure";
export const POS_OPEN_SHIFT_PERMISSION = "Pos.OpenShift";
export const POS_CLOSE_SHIFT_PERMISSION = "Pos.CloseShift";
export const POS_ADJUST_CASH_DRAWER_PERMISSION = "Pos.AdjustCashDrawer";
// Not currently checked anywhere in the frontend (no reprint UI exists yet) -- centralized anyway
// so the one real backend code is available the moment a print/reprint feature is built, rather
// than someone re-typing the literal string from scratch.
export const POS_PRINT_RECEIPT_PERMISSION = "Pos.PrintReceipt";

// ---- Customers (as reached from/related to POS) ----
export const CUSTOMERS_VIEW_PERMISSION = "Customers.View";
export const CUSTOMERS_MANAGE_PERMISSION = "Customers.Manage";

// ---- Restaurant / Kitchen (consumed by POS for dine-in + kitchen routing) ----
export const RESTAURANT_VIEW_PERMISSION = "Restaurant.View";
export const KITCHEN_VIEW_PERMISSION = "Kitchen.View";

// ---- Catalog / Pricing (consumed by POS's catalog panel for first-product/first-price onboarding) ----
export const CATALOG_MANAGE_PERMISSION = "Catalog.Manage";
export const PRICING_MANAGE_PERMISSION = "Pricing.Manage";
