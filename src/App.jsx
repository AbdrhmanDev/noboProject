import { HashRouter, Routes, Route } from "react-router-dom";
import GlobalStyle from "./styles/GlobalStyle";
import { AppProviders } from "./app/providers/AppProviders";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import { PublicOnlyRoute } from "./features/auth/components/PublicOnlyRoute";
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
import KitchenPage from "./Pages/KitchenPage/KitchenPage";
import KitchenAdminPage from "./Pages/KitchenAdminPage/KitchenAdminPage";
import SalesPage from "./Pages/SalesPage/SalesPage";
import SalesOrderDetailsPage from "./Pages/SalesOrderDetailsPage/SalesOrderDetailsPage";
import PurchasesPage from "./Pages/PurchasesPage/PurchasesPage";
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
              <Route path={ROUTES.POS} element={protectedPage(<POSPage />)} />
              <Route path={ROUTES.POS_SHIFT_HISTORY} element={protectedPage(<POSShiftHistoryPage />)} />
              <Route path={ROUTES.POS_TERMINALS_ADMIN} element={protectedPage(<POSTerminalAdminPage />)} />
              <Route path={ROUTES.CATALOG_ADMIN} element={protectedPage(<CatalogAdminPage />)} />
              <Route path={ROUTES.PAYMENT_METHODS_ADMIN} element={protectedPage(<PaymentMethodsAdminPage />)} />
              <Route path={ROUTES.PRICING_ADMIN} element={protectedPage(<PricingAdminPage />)} />
              <Route path={ROUTES.TAX_ADMIN} element={protectedPage(<TaxAdminPage />)} />
              <Route path={ROUTES.RESTAURANT_ADMIN} element={protectedPage(<RestaurantAdminPage />)} />
              <Route path={ROUTES.RESTAURANT_FLOOR} element={protectedPage(<RestaurantFloorPage />)} />
              <Route path={ROUTES.KITCHEN} element={protectedPage(<KitchenPage />)} />
              <Route path={ROUTES.KITCHEN_ADMIN} element={protectedPage(<KitchenAdminPage />)} />
              <Route path={ROUTES.SALES} element={protectedPage(<SalesPage />)} />
              <Route path={ROUTES.SALES_ORDER_DETAILS} element={protectedPage(<SalesOrderDetailsPage />)} />
              <Route path={ROUTES.PURCHASES} element={protectedPage(<PurchasesPage />)} />
              <Route path={ROUTES.INVENTORY} element={protectedPage(<InventoryPage />)} />
              <Route path={ROUTES.INVENTORY_ADMIN} element={protectedPage(<InventoryAdminPage />)} />
              <Route path={ROUTES.CUSTOMERS} element={protectedPage(<CustomersPage />)} />
              <Route path={ROUTES.SUPPLIERS} element={protectedPage(<SuppliersPage />)} />
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
