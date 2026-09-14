import { HashRouter, Routes, Route } from "react-router-dom";
import GlobalStyle from "./styles/GlobalStyle";
import { AppProviders } from "./app/providers/AppProviders";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import { PublicOnlyRoute } from "./features/auth/components/PublicOnlyRoute";
import { EntitlementGate } from "./features/companies/components/EntitlementGate";
import {
  ENTITLEMENT_INVENTORY,
  ENTITLEMENT_POS,
  ENTITLEMENT_PROCUREMENT,
  ENTITLEMENT_RESTAURANT,
  ENTITLEMENT_RESTAURANT_KITCHEN,
} from "./features/companies/constants/entitlementCodes";
import LoginPage from "./Pages/loginPage/Login";
import RegisterPage from "./Pages/registerPage/Register";
import ConfirmEmailPage from "./Pages/confirmEmailPage/ConfirmEmail";
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
import PlatformCompaniesPage from "./Pages/PlatformCompaniesPage/PlatformCompaniesPage";
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
import MorePage from "./Pages/MorePage/MorePage";
import ProfilePage from "./Pages/ProfilePage/ProfilePage";
import NotFound from "./Pages/NotFound/notFound";
import { ROUTES } from "./utils/routes";
import { ShortcutProvider } from "./features/shortcuts/ShortcutProvider";
import { ShortcutHelpDialog } from "./features/shortcuts/components/ShortcutHelpDialog";

export default function App() {
  const protectedPage = (page) => <ProtectedRoute>{page}</ProtectedRoute>;
  // Direct-URL safety net for the Commercial Apps touched by this task (section 15) -- backend
  // remains the real security boundary regardless of this gate.
  const entitlementGatedPage = (page, code) =>
    protectedPage(<EntitlementGate code={code}>{page}</EntitlementGate>);

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
              <Route path={ROUTES.DASHBOARD} element={protectedPage(<Dashboard />)} />
              <Route path={ROUTES.POS} element={entitlementGatedPage(<POSPage />, ENTITLEMENT_POS)} />
              <Route path={ROUTES.POS_SHIFT_HISTORY} element={entitlementGatedPage(<POSShiftHistoryPage />, ENTITLEMENT_POS)} />
              <Route path={ROUTES.POS_TERMINALS_ADMIN} element={entitlementGatedPage(<POSTerminalAdminPage />, ENTITLEMENT_POS)} />
              <Route path={ROUTES.CATALOG_ADMIN} element={protectedPage(<CatalogAdminPage />)} />
              <Route path={ROUTES.PAYMENT_METHODS_ADMIN} element={protectedPage(<PaymentMethodsAdminPage />)} />
              <Route path={ROUTES.PRICING_ADMIN} element={protectedPage(<PricingAdminPage />)} />
              <Route path={ROUTES.TAX_ADMIN} element={protectedPage(<TaxAdminPage />)} />
              <Route path={ROUTES.RESTAURANT_ADMIN} element={entitlementGatedPage(<RestaurantAdminPage />, ENTITLEMENT_RESTAURANT)} />
              <Route path={ROUTES.RESTAURANT_FLOOR} element={entitlementGatedPage(<RestaurantFloorPage />, ENTITLEMENT_RESTAURANT)} />
              <Route path={ROUTES.RESTAURANT_RESERVATIONS} element={entitlementGatedPage(<RestaurantReservationsPage />, ENTITLEMENT_RESTAURANT)} />
              <Route path={ROUTES.KITCHEN} element={entitlementGatedPage(<KitchenPage />, ENTITLEMENT_RESTAURANT_KITCHEN)} />
              <Route path={ROUTES.KITCHEN_ADMIN} element={entitlementGatedPage(<KitchenAdminPage />, ENTITLEMENT_RESTAURANT_KITCHEN)} />
              <Route path={ROUTES.SALES} element={protectedPage(<SalesPage />)} />
              <Route path={ROUTES.SALES_ORDER_DETAILS} element={protectedPage(<SalesOrderDetailsPage />)} />
              <Route path={ROUTES.PURCHASES} element={entitlementGatedPage(<PurchasesPage />, ENTITLEMENT_PROCUREMENT)} />
              <Route path={ROUTES.PURCHASE_ORDER_NEW} element={entitlementGatedPage(<PurchaseOrderEditorPage />, ENTITLEMENT_PROCUREMENT)} />
              <Route path={ROUTES.PURCHASE_ORDER_EDIT} element={entitlementGatedPage(<PurchaseOrderEditorPage />, ENTITLEMENT_PROCUREMENT)} />
              <Route path={ROUTES.PURCHASE_ORDER_DETAILS} element={entitlementGatedPage(<PurchaseOrderDetailsPage />, ENTITLEMENT_PROCUREMENT)} />
              <Route path={ROUTES.DEVICES_OVERVIEW} element={protectedPage(<DeviceOverviewPage />)} />
              <Route path={ROUTES.DEVICES_LIST} element={protectedPage(<DevicesListPage />)} />
              <Route path={ROUTES.DEVICE_DETAILS} element={protectedPage(<DeviceDetailsPage />)} />
              <Route path={ROUTES.EDGE_AGENTS} element={protectedPage(<EdgeAgentsListPage />)} />
              <Route path={ROUTES.EDGE_AGENT_DETAILS} element={protectedPage(<EdgeAgentDetailsPage />)} />
              <Route path={ROUTES.DEVICE_DISCOVERY} element={protectedPage(<DeviceDiscoveryPage />)} />
              <Route path={ROUTES.DEVICE_PRINTING} element={protectedPage(<DevicePrintingPage />)} />
              {/* NOBO Control Plane -- auth-only at the router level; PlatformAccessGate inside
                  each page independently checks platform staff status (section 14). */}
              <Route path={ROUTES.PLATFORM_COMPANIES} element={protectedPage(<PlatformCompaniesPage />)} />
              <Route path={ROUTES.PLATFORM_COMPANY_ENTITLEMENTS} element={protectedPage(<PlatformCompanyEntitlementsPage />)} />
              <Route path={ROUTES.PLATFORM_STAFF} element={protectedPage(<PlatformStaffPage />)} />
              <Route path={ROUTES.INVENTORY} element={entitlementGatedPage(<InventoryPage />, ENTITLEMENT_INVENTORY)} />
              <Route path={ROUTES.INVENTORY_ADMIN} element={entitlementGatedPage(<InventoryAdminPage />, ENTITLEMENT_INVENTORY)} />
              <Route path={ROUTES.CUSTOMERS} element={protectedPage(<CustomersPage />)} />
              <Route path={ROUTES.SUPPLIERS} element={entitlementGatedPage(<SuppliersPage />, ENTITLEMENT_PROCUREMENT)} />
              <Route path={ROUTES.ACCOUNTING} element={protectedPage(<AccountingPage />)} />
              <Route path={ROUTES.REPORTS} element={protectedPage(<ReportsPage />)} />
              <Route path={ROUTES.PROJECTS} element={protectedPage(<ProjectsPage />)} />
              <Route path={ROUTES.HR} element={protectedPage(<HRPage />)} />
              <Route path={ROUTES.SETTINGS} element={protectedPage(<SettingsPage />)} />
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
