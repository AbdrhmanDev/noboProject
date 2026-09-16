import { HashRouter, Routes, Route } from "react-router-dom";
import GlobalStyle from "./styles/GlobalStyle";
import { AppProviders } from "./app/providers/AppProviders";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import { PublicOnlyRoute } from "./features/auth/components/PublicOnlyRoute";
import { RouteAccessGate } from "./features/companies/components/RouteAccessGate";
import { LandingRouteResolver } from "./features/companies/components/LandingRouteResolver";
import {
  ENTITLEMENT_INVENTORY,
  ENTITLEMENT_POS,
  ENTITLEMENT_PROCUREMENT,
  ENTITLEMENT_RESTAURANT,
  ENTITLEMENT_RESTAURANT_KITCHEN,
} from "./features/companies/constants/entitlementCodes";
import {
  CUSTOMERS_VIEW_PERMISSION,
  KITCHEN_VIEW_PERMISSION,
  POS_CONFIGURE_PERMISSION,
  POS_VIEW_PERMISSION,
  RESTAURANT_VIEW_PERMISSION,
  SALES_ORDERS_VIEW_PERMISSION,
} from "./features/authorization/constants/applicationPermissions";
import LoginPage from "./Pages/loginPage/Login";
import RegisterPage from "./Pages/registerPage/Register";
import ConfirmEmailPage from "./Pages/confirmEmailPage/ConfirmEmail";
import InviteAcceptPage from "./Pages/InviteAcceptPage/InviteAcceptPage";
import Dashboard from "./Pages/DashboardPage/Dashboard";
import POSPage from "./Pages/POSPage/POSPage";
import POSShiftHistoryPage from "./Pages/POSShiftHistoryPage/POSShiftHistoryPage";
import POSTerminalAdminPage from "./Pages/POSTerminalAdminPage/POSTerminalAdminPage";
import CatalogAdminPage from "./Pages/CatalogAdminPage/CatalogAdminPage";
import PaymentMethodsAdminPage from "./Pages/PaymentMethodsAdminPage/PaymentMethodsAdminPage";
import PricingAdminPage from "./Pages/PricingAdminPage/PricingAdminPage";
import TaxAdminPage from "./Pages/TaxAdminPage/TaxAdminPage";
import RestaurantAdminPage from "./Pages/RestaurantAdminPage/RestaurantAdminPage";
import RestaurantFloorPage from "./Pages/RestaurantFloorPage/RestaurantFloorPage";
import RestaurantReservationsPage from "./Pages/RestaurantReservationsPage/RestaurantReservationsPage";
import KitchenPage from "./Pages/KitchenPage/KitchenPage";
import KitchenAdminPage from "./Pages/KitchenAdminPage/KitchenAdminPage";
import SalesPage from "./Pages/SalesPage/SalesPage";
import SalesOrderDetailsPage from "./Pages/SalesOrderDetailsPage/SalesOrderDetailsPage";
import PurchasesPage from "./Pages/PurchasesPage/PurchasesPage";
import PurchaseOrderEditorPage from "./Pages/PurchaseOrderEditorPage/PurchaseOrderEditorPage";
import PurchaseOrderDetailsPage from "./Pages/PurchaseOrderDetailsPage/PurchaseOrderDetailsPage";
import DeviceOverviewPage from "./Pages/DeviceOverviewPage/DeviceOverviewPage";
import DevicesListPage from "./Pages/DevicesListPage/DevicesListPage";
import DeviceDetailsPage from "./Pages/DeviceDetailsPage/DeviceDetailsPage";
import EdgeAgentsListPage from "./Pages/EdgeAgentsListPage/EdgeAgentsListPage";
import EdgeAgentDetailsPage from "./Pages/EdgeAgentDetailsPage/EdgeAgentDetailsPage";
import DeviceDiscoveryPage from "./Pages/DeviceDiscoveryPage/DeviceDiscoveryPage";
import DevicePrintingPage from "./Pages/DevicePrintingPage/DevicePrintingPage";
import PlatformOverviewPage from "./Pages/PlatformOverviewPage/PlatformOverviewPage";
import PlatformCompaniesPage from "./Pages/PlatformCompaniesPage/PlatformCompaniesPage";
import PlatformCompanyDetailsPage from "./Pages/PlatformCompanyDetailsPage/PlatformCompanyDetailsPage";
import PlatformCompanyEntitlementsPage from "./Pages/PlatformCompanyEntitlementsPage/PlatformCompanyEntitlementsPage";
import PlatformStaffPage from "./Pages/PlatformStaffPage/PlatformStaffPage";
import InventoryPage from "./Pages/InventoryPage/InventoryPage";
import InventoryAdminPage from "./Pages/InventoryAdminPage/InventoryAdminPage";
import CustomersPage from "./Pages/CustomersPage/CustomersPage";
import SuppliersPage from "./Pages/SuppliersPage/SuppliersPage";
import AccountingPage from "./Pages/AccountingPage/AccountingPage";
import ReportsPage from "./Pages/ReportsPage/ReportsPage";
import ProjectsPage from "./Pages/ProjectsPage/ProjectsPage";
import HRPage from "./Pages/HRPage/HRPage";
import SettingsPage from "./Pages/SettingsPage/SettingsPage";
import UsersAccessPage from "./Pages/UsersAccessPage/UsersAccessPage";
import MorePage from "./Pages/MorePage/MorePage";
import ProfilePage from "./Pages/ProfilePage/ProfilePage";
import NotFound from "./Pages/NotFound/notFound";
import { ROUTES } from "./utils/routes";
import { ShortcutProvider } from "./features/shortcuts/ShortcutProvider";
import { ShortcutHelpDialog } from "./features/shortcuts/components/ShortcutHelpDialog";

export default function App() {
  const protectedPage = (page) => <ProtectedRoute>{page}</ProtectedRoute>;
  // Direct-URL protection (Permission-Driven Tenant Application Shell task, sections 1/2): a
  // manually-typed URL must not render an unauthorized page just because sidebar visibility
  // hides it. Backend remains the real security boundary regardless of this gate -- this is UX
  // only. `permission`/`permissions` follow RouteAccessGate/PermissionNavItem's any-of semantics
  // by default (`matchMode: "all"` for the one route that needs every listed permission).
  const accessGatedPage = (page, access) =>
    protectedPage(<RouteAccessGate {...access}>{page}</RouteAccessGate>);

  return (
    <AppProviders>
      <HashRouter>
        <ShortcutProvider>
          <div className="nobo-root">
            <GlobalStyle />
            <Routes>
              <Route path={ROUTES.LOGIN} element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
              <Route path={ROUTES.REGISTER} element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
              <Route path={ROUTES.CONFIRM_EMAIL} element={<PublicOnlyRoute><ConfirmEmailPage /></PublicOnlyRoute>} />
              <Route path={ROUTES.INVITE_ACCEPT} element={<InviteAcceptPage />} />
              <Route
                path={ROUTES.DASHBOARD}
                element={protectedPage(<LandingRouteResolver><Dashboard /></LandingRouteResolver>)}
              />
              <Route path={ROUTES.POS} element={accessGatedPage(<POSPage />, { permission: POS_VIEW_PERMISSION, entitlement: ENTITLEMENT_POS })} />
              <Route path={ROUTES.POS_SHIFT_HISTORY} element={accessGatedPage(<POSShiftHistoryPage />, { permission: POS_VIEW_PERMISSION, entitlement: ENTITLEMENT_POS })} />
              <Route path={ROUTES.POS_TERMINALS_ADMIN} element={accessGatedPage(<POSTerminalAdminPage />, { permission: POS_CONFIGURE_PERMISSION, entitlement: ENTITLEMENT_POS })} />
              <Route path={ROUTES.CATALOG_ADMIN} element={accessGatedPage(<CatalogAdminPage />, { permission: "Catalog.View" })} />
              <Route path={ROUTES.PAYMENT_METHODS_ADMIN} element={accessGatedPage(<PaymentMethodsAdminPage />, { permission: "Payments.Configure" })} />
              <Route path={ROUTES.PRICING_ADMIN} element={accessGatedPage(<PricingAdminPage />, { permission: "Pricing.View" })} />
              <Route path={ROUTES.TAX_ADMIN} element={accessGatedPage(<TaxAdminPage />, { permission: "Tax.View" })} />
              <Route path={ROUTES.RESTAURANT_ADMIN} element={accessGatedPage(<RestaurantAdminPage />, { permission: "Restaurant.Manage", entitlement: ENTITLEMENT_RESTAURANT })} />
              <Route path={ROUTES.RESTAURANT_FLOOR} element={accessGatedPage(<RestaurantFloorPage />, { permission: RESTAURANT_VIEW_PERMISSION, entitlement: ENTITLEMENT_RESTAURANT })} />
              <Route path={ROUTES.RESTAURANT_RESERVATIONS} element={accessGatedPage(<RestaurantReservationsPage />, { permission: RESTAURANT_VIEW_PERMISSION, entitlement: ENTITLEMENT_RESTAURANT })} />
              <Route path={ROUTES.KITCHEN} element={accessGatedPage(<KitchenPage />, { permission: KITCHEN_VIEW_PERMISSION, entitlement: ENTITLEMENT_RESTAURANT_KITCHEN })} />
              <Route path={ROUTES.KITCHEN_ADMIN} element={accessGatedPage(<KitchenAdminPage />, { permission: "Kitchen.Manage", entitlement: ENTITLEMENT_RESTAURANT_KITCHEN })} />
              <Route path={ROUTES.SALES} element={accessGatedPage(<SalesPage />, { permission: SALES_ORDERS_VIEW_PERMISSION })} />
              <Route path={ROUTES.SALES_ORDER_DETAILS} element={accessGatedPage(<SalesOrderDetailsPage />, { permission: SALES_ORDERS_VIEW_PERMISSION })} />
              <Route path={ROUTES.PURCHASES} element={accessGatedPage(<PurchasesPage />, { permission: "Purchases.View", entitlement: ENTITLEMENT_PROCUREMENT })} />
              <Route path={ROUTES.PURCHASE_ORDER_NEW} element={accessGatedPage(<PurchaseOrderEditorPage />, { permission: "Purchases.Manage", entitlement: ENTITLEMENT_PROCUREMENT })} />
              <Route path={ROUTES.PURCHASE_ORDER_EDIT} element={accessGatedPage(<PurchaseOrderEditorPage />, { permission: "Purchases.Manage", entitlement: ENTITLEMENT_PROCUREMENT })} />
              <Route path={ROUTES.PURCHASE_ORDER_DETAILS} element={accessGatedPage(<PurchaseOrderDetailsPage />, { permission: "Purchases.View", entitlement: ENTITLEMENT_PROCUREMENT })} />
              <Route path={ROUTES.DEVICES_OVERVIEW} element={accessGatedPage(<DeviceOverviewPage />, { permission: "Devices.View" })} />
              <Route path={ROUTES.DEVICES_LIST} element={accessGatedPage(<DevicesListPage />, { permission: "Devices.View" })} />
              <Route path={ROUTES.DEVICE_DETAILS} element={accessGatedPage(<DeviceDetailsPage />, { permission: "Devices.View" })} />
              <Route path={ROUTES.EDGE_AGENTS} element={accessGatedPage(<EdgeAgentsListPage />, { permission: "EdgeAgents.View" })} />
              <Route path={ROUTES.EDGE_AGENT_DETAILS} element={accessGatedPage(<EdgeAgentDetailsPage />, { permission: "EdgeAgents.View" })} />
              <Route path={ROUTES.DEVICE_DISCOVERY} element={accessGatedPage(<DeviceDiscoveryPage />, { permissions: ["Devices.View", "EdgeAgents.View"], matchMode: "all" })} />
              <Route path={ROUTES.DEVICE_PRINTING} element={accessGatedPage(<DevicePrintingPage />, { permission: "Devices.View" })} />
              {/* NOBO Control Plane -- auth-only at the router level; PlatformAccessGate inside
                  each page independently checks platform staff status (section 14). */}
              <Route path={ROUTES.PLATFORM_OVERVIEW} element={protectedPage(<PlatformOverviewPage />)} />
              <Route path={ROUTES.PLATFORM_COMPANIES} element={protectedPage(<PlatformCompaniesPage />)} />
              <Route path={ROUTES.PLATFORM_COMPANY_DETAILS} element={protectedPage(<PlatformCompanyDetailsPage />)} />
              <Route path={ROUTES.PLATFORM_COMPANY_ENTITLEMENTS} element={protectedPage(<PlatformCompanyEntitlementsPage />)} />
              <Route path={ROUTES.PLATFORM_STAFF} element={protectedPage(<PlatformStaffPage />)} />
              <Route path={ROUTES.INVENTORY} element={accessGatedPage(<InventoryPage />, { permission: "Inventory.View", entitlement: ENTITLEMENT_INVENTORY })} />
              <Route path={ROUTES.INVENTORY_ADMIN} element={accessGatedPage(<InventoryAdminPage />, { permission: "Inventory.Configure", entitlement: ENTITLEMENT_INVENTORY })} />
              <Route path={ROUTES.CUSTOMERS} element={accessGatedPage(<CustomersPage />, { permission: CUSTOMERS_VIEW_PERMISSION })} />
              <Route path={ROUTES.SUPPLIERS} element={accessGatedPage(<SuppliersPage />, { permission: "Purchases.View", entitlement: ENTITLEMENT_PROCUREMENT })} />
              <Route path={ROUTES.ACCOUNTING} element={protectedPage(<AccountingPage />)} />
              <Route path={ROUTES.REPORTS} element={protectedPage(<ReportsPage />)} />
              <Route path={ROUTES.PROJECTS} element={protectedPage(<ProjectsPage />)} />
              <Route path={ROUTES.HR} element={protectedPage(<HRPage />)} />
              <Route path={ROUTES.SETTINGS} element={protectedPage(<SettingsPage />)} />
              <Route path={ROUTES.USERS_ACCESS} element={accessGatedPage(<UsersAccessPage />, { permissions: ["Users.View", "Roles.View"] })} />
              <Route path={ROUTES.MORE} element={protectedPage(<MorePage />)} />
              <Route path={ROUTES.PROFILE} element={protectedPage(<ProfilePage />)} />
              <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
            </Routes>
            <ShortcutHelpDialog />
          </div>
        </ShortcutProvider>
      </HashRouter>
    </AppProviders>
  );
}
