import { HashRouter, Routes, Route } from "react-router-dom";
import GlobalStyle from "./styles/GlobalStyle";
import { I18nProvider } from "./i18n/I18nContext";
import { UserProvider } from "./context/UserContext";
import LoginPage from "./Pages/loginPage/Login";
import SignupPage from "./Pages/signupPage/Signup";
import Dashboard from "./Pages/DashboardPage/Dashboard";
import POSPage from "./Pages/POSPage/POSPage";
import SalesPage from "./Pages/SalesPage/SalesPage";
import PurchasesPage from "./Pages/PurchasesPage/PurchasesPage";
import InventoryPage from "./Pages/InventoryPage/InventoryPage";
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

export default function App() {
  return (
    <I18nProvider>
      <UserProvider>
        <HashRouter>
          <div className="nobo-root">
            <GlobalStyle />
            <Routes>
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />
              <Route path={ROUTES.SIGNUP} element={<SignupPage />} />
              <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
              <Route path={ROUTES.POS} element={<POSPage />} />
              <Route path={ROUTES.SALES} element={<SalesPage />} />
              <Route path={ROUTES.PURCHASES} element={<PurchasesPage />} />
              <Route path={ROUTES.INVENTORY} element={<InventoryPage />} />
              <Route path={ROUTES.CUSTOMERS} element={<CustomersPage />} />
              <Route path={ROUTES.SUPPLIERS} element={<SuppliersPage />} />
              <Route path={ROUTES.ACCOUNTING} element={<AccountingPage />} />
              <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
              <Route path={ROUTES.PROJECTS} element={<ProjectsPage />} />
              <Route path={ROUTES.HR} element={<HRPage />} />
              <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
              <Route path={ROUTES.MORE} element={<MorePage />} />
              <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
              <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
            </Routes>
          </div>
        </HashRouter>
      </UserProvider>
    </I18nProvider>
  );
}
