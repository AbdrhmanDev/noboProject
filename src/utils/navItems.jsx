import {
  Home, ScanLine, ChefHat, ShoppingBag, ShoppingCart, Boxes, Contact, Truck,
  Calculator, BarChart3, Briefcase, UserCog, Settings, MoreHorizontal, Package,
} from "lucide-react";
import { ROUTES } from "./routes";

export const NAV_ITEMS = [
  { icon: Home, labelKey: "nav.dashboard", to: ROUTES.DASHBOARD },
  { icon: ScanLine, labelKey: "nav.pos", to: ROUTES.POS },
  { icon: ChefHat, labelKey: "KDS", to: ROUTES.KITCHEN },
  { icon: Package, labelKey: "nav.catalog", to: ROUTES.CATALOG_ADMIN },
  { icon: ShoppingBag, labelKey: "nav.sales", to: ROUTES.SALES },
  { icon: ShoppingCart, labelKey: "nav.purchases", to: ROUTES.PURCHASES },
  { icon: Boxes, labelKey: "nav.inventory", to: ROUTES.INVENTORY },
  { icon: Contact, labelKey: "nav.customers", to: ROUTES.CUSTOMERS },
  { icon: Truck, labelKey: "nav.suppliers", to: ROUTES.SUPPLIERS },
  { icon: Calculator, labelKey: "nav.accounting", to: ROUTES.ACCOUNTING },
  { icon: BarChart3, labelKey: "nav.reports", to: ROUTES.REPORTS },
  { icon: Briefcase, labelKey: "nav.projects", to: ROUTES.PROJECTS },
  { icon: UserCog, labelKey: "nav.hr", to: ROUTES.HR },
  { icon: Settings, labelKey: "nav.settings", to: ROUTES.SETTINGS },
  { icon: MoreHorizontal, labelKey: "nav.more", to: ROUTES.MORE },
];
