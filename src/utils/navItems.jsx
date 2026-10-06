import {
  Home, ScanLine, ChefHat, ShoppingBag, ShoppingCart, Boxes,
  Settings, MoreHorizontal, Package,
  Coins, ReceiptText, WalletCards, Armchair, Printer, ShieldCheck, ShieldAlert, UsersRound, FileText,
  Building2, Cpu, ShieldHalf,
} from "lucide-react";
import { ROUTES } from "./routes";
import { ENTITLEMENT_POS } from "../features/companies/constants/entitlementCodes";
import {
  PAYMENTS_REFUND_PERMISSION,
  POS_VIEW_PERMISSION,
  SALES_ORDERS_APPLY_DISCOUNT_PERMISSION,
  SALES_ORDERS_VIEW_PERMISSION,
} from "../features/authorization/constants/applicationPermissions";

export const NAV_ITEMS = [
  { icon: Home, labelKey: "nav.dashboard", to: ROUTES.DASHBOARD },
  { icon: ScanLine, labelKey: "nav.pos", to: ROUTES.POS, permission: POS_VIEW_PERMISSION, entitlement: ENTITLEMENT_POS, shortcutAction: "navigation.pos" },
  { icon: ChefHat, labelKey: "nav.kitchen", kind: "group", module: "kitchen" },
  { icon: Package, labelKey: "nav.catalog", to: ROUTES.CATALOG_ADMIN, permission: "Catalog.View", shortcutAction: "navigation.catalog" },
  { icon: Coins, labelKey: "nav.pricing", to: ROUTES.PRICING_ADMIN, permission: "Pricing.View", shortcutAction: "navigation.pricing" },
  { icon: ReceiptText, labelKey: "nav.tax", to: ROUTES.TAX_ADMIN, permission: "Tax.View", shortcutAction: "navigation.tax" },
  { icon: WalletCards, labelKey: "nav.payments", to: ROUTES.PAYMENT_METHODS_ADMIN, permission: "Payments.Configure", shortcutAction: "navigation.payments" },
  { icon: FileText, labelKey: "nav.invoiceTemplates", to: ROUTES.INVOICE_TEMPLATES_ADMIN, permission: "InvoiceTemplates.View" },
  { icon: Building2, labelKey: "nav.branches", to: ROUTES.BRANCHES_ADMIN, permission: "Branches.View" },
  { icon: Cpu, labelKey: "nav.generationUnits", to: ROUTES.GENERATION_UNITS_ADMIN, permission: "Compliance.Manage" },
  { icon: ShieldHalf, labelKey: "nav.companyProfile", to: ROUTES.COMPANY_PROFILE, permission: "CompanyProfile.View" },
  { icon: Printer, labelKey: "nav.devices", kind: "group", module: "devices" },
  { icon: Armchair, labelKey: "nav.restaurant", kind: "group", module: "restaurant" },
  { icon: Boxes, labelKey: "nav.inventory", kind: "group", module: "inventory" },
  { icon: ShoppingBag, labelKey: "nav.sales", to: ROUTES.SALES, permission: SALES_ORDERS_VIEW_PERMISSION },
  { icon: ShoppingCart, labelKey: "nav.purchases", kind: "group", module: "procurement" },
  // NOBO-internal Control Plane -- NOT a Commercial App and NOT gated by company
  // entitlement/permission at all (see PlatformNavGroup); visible only to platform staff.
  { icon: ShieldCheck, labelKey: "nav.platform", kind: "group", module: "platform" },
  { icon: UsersRound, labelKey: "nav.usersAccess", to: ROUTES.USERS_ACCESS, permissions: ["Users.View", "Roles.View"] },
  { icon: ShieldCheck, labelKey: "nav.approvalPolicies", to: ROUTES.APPROVAL_POLICIES, permission: "Company.Manage" },
  // Presentation-level only -- Payments.Refund + POS.REFUNDS just controls whether this nav entry
  // is shown to someone who could plausibly be an approver. The backend independently re-checks
  // permission/branch/entitlement/PIN on every approve attempt regardless (never trust this gate).
  { icon: ShieldAlert, labelKey: "nav.approvals", to: ROUTES.APPROVALS, permissions: [PAYMENTS_REFUND_PERMISSION, SALES_ORDERS_APPLY_DISCOUNT_PERMISSION], entitlement: ENTITLEMENT_POS },
  { icon: Settings, labelKey: "nav.settings", to: ROUTES.SETTINGS },
  { icon: MoreHorizontal, labelKey: "nav.more", to: ROUTES.MORE },
];
