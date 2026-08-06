import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import GlobalStyle from "./styles/GlobalStyle";
import LoginPage from "./Pages/loginPage/Login";
import Dashboard from "./Pages/DashboardPage/Dashboard";
import { ROUTES } from "./utils/routes";

export default function App() {
  return (
    <HashRouter>
      <div className="nobo-root">
        <GlobalStyle />
        <Routes>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
        </Routes>
      </div>
    </HashRouter>
  );
}
