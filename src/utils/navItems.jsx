import {
  Home, ScanLine, ChefHat, ShoppingBag, ShoppingCart, Boxes, Contact,
  Calculator, BarChart3, Briefcase, UserCog, Settings, MoreHorizontal, Package,
  Coins, ReceiptText, WalletCards, Armchair, Printer, ShieldCheck, UsersRound,
} from "lucide-react";
import { ROUTES } from "./routes";
import { ENTITLEMENT_POS } from "../features/companies/constants/entitlementCodes";

export const NAV_ITEMS = [
  { icon: Home, labelKey: "nav.dashboard", to: ROUTES.DASHBOARD },
  { icon: ScanLine, labelKey: "nav.pos", to: ROUTES.POS, permission: "Pos.View", entitlement: ENTITLEMENT_POS, shortcutAction: "navigation.pos" },
  { icon: ChefHat, labelKey: "nav.kitchen", kind: "group", module: "kitchen" },
  { icon: Package, labelKey: "nav.catalog", to: ROUTES.CATALOG_ADMIN, permission: "Catalog.View", shortcutAction: "navigation.catalog" },
  { icon: Coins, labelKey: "nav.pricing", to: ROUTES.PRICING_ADMIN, permission: "Pricing.View", shortcutAction: "navigation.pricing" },
  { icon: ReceiptText, labelKey: "nav.tax", to: ROUTES.TAX_ADMIN, permission: "Tax.View", shortcutAction: "navigation.tax" },
  { icon: WalletCards, labelKey: "nav.payments", to: ROUTES.PAYMENT_METHODS_ADMIN, permission: "Payments.Configure", shortcutAction: "navigation.payments" },
  { icon: Printer, labelKey: "nav.devices", kind: "group", module: "devices" },
  { icon: Armchair, labelKey: "nav.restaurant", kind: "group", module: "restaurant" },
  { icon: Boxes, labelKey: "nav.inventory", kind: "group", module: "inventory" },
  { icon: ShoppingBag, labelKey: "nav.sales", to: ROUTES.SALES, permission: "SalesOrders.View" },
  { icon: ShoppingCart, labelKey: "nav.purchases", kind: "group", module: "procurement" },
  { icon: Contact, labelKey: "nav.customers", to: ROUTES.CUSTOMERS, comingSoon: true },
  { icon: Calculator, labelKey: "nav.accounting", to: ROUTES.ACCOUNTING, comingSoon: true },
  { icon: BarChart3, labelKey: "nav.reports", to: ROUTES.REPORTS, comingSoon: true },
  { icon: Briefcase, labelKey: "nav.projects", to: ROUTES.PROJECTS, comingSoon: true },
  { icon: UserCog, labelKey: "nav.hr", to: ROUTES.HR, comingSoon: true },
  // NOBO-internal Control Plane -- NOT a Commercial App and NOT gated by company
  // entitlement/permission at all (see PlatformNavGroup); visible only to platform staff.
  { icon: ShieldCheck, labelKey: "nav.platform", kind: "group", module: "platform" },
  { icon: UsersRound, labelKey: "nav.usersAccess", to: ROUTES.USERS_ACCESS, permissions: ["Users.View", "Roles.View"] },
  { icon: Settings, labelKey: "nav.settings", to: ROUTES.SETTINGS },
  { icon: MoreHorizontal, labelKey: "nav.more", to: ROUTES.MORE },
];
