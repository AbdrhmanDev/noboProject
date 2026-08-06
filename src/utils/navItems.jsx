import {
  Home, ScanLine, ShoppingBag, ShoppingCart, Boxes, Contact, Truck,
  Calculator, BarChart3, Briefcase, UserCog, Settings, MoreHorizontal,
} from "lucide-react";
import { ROUTES } from "./routes";

export const NAV_ITEMS = [
  { icon: Home, label: "الرئيسية", to: ROUTES.DASHBOARD },
  { icon: ScanLine, label: "نقطة البيع POS", to: ROUTES.POS },
  { icon: ShoppingBag, label: "المبيعات", to: ROUTES.SALES },
  { icon: ShoppingCart, label: "المشتريات", to: ROUTES.PURCHASES },
  { icon: Boxes, label: "المخزون", to: ROUTES.INVENTORY },
  { icon: Contact, label: "العملاء (CRM)", to: ROUTES.CUSTOMERS },
  { icon: Truck, label: "الموردين", to: ROUTES.SUPPLIERS },
  { icon: Calculator, label: "المحاسبة", to: ROUTES.ACCOUNTING },
  { icon: BarChart3, label: "التقارير والتحليلات", to: ROUTES.REPORTS },
  { icon: Briefcase, label: "المشاريع", to: ROUTES.PROJECTS },
  { icon: UserCog, label: "الموارد البشرية", to: ROUTES.HR },
  { icon: Settings, label: "الإعدادات", to: ROUTES.SETTINGS },
  { icon: MoreHorizontal, label: "المزيد", to: ROUTES.MORE },
];
