import { Fragment } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useI18n } from "../i18n/I18nContext";
import { useUser } from "../context/UserContext";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useBranch } from "../features/branches/context/BranchContext";
import { isBranchEnterable, useBranches } from "../features/branches/hooks/useBranches";
import { useCurrentBranch } from "../features/branches/hooks/useCurrentBranch";
import {
  getCompanyDisplayName,
  isCompanyEnterable,
  useCompany,
} from "../features/companies/context/CompanyContext";
import { useMyCompanies } from "../features/companies/hooks/useCompanies";
import { ROUTES } from "../utils/routes";
import { NAV_ITEMS } from "../utils/navItems";
import { InventoryNavGroup } from "../features/inventory/components/InventoryNavGroup";
import { KitchenNavGroup } from "../features/kitchen/components/KitchenNavGroup";
import { RestaurantNavGroup } from "../features/restaurant/components/RestaurantNavGroup";
import { ProcurementNavGroup } from "../features/procurement/components/ProcurementNavGroup";
import { DevicesNavGroup } from "../features/devices/components/DevicesNavGroup";
import { PermissionNavItem } from "./PermissionNavItem";
import { ComingSoonNavItem } from "./ComingSoonNavItem";

const NAV_GROUPS = {
  inventory: InventoryNavGroup,
  kitchen: KitchenNavGroup,
  restaurant: RestaurantNavGroup,
  procurement: ProcurementNavGroup,
  devices: DevicesNavGroup,
};

export default function AppLayout({ children, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = (location?.hash && location.hash.replace("#", "")) || location?.pathname || ROUTES.DASHBOARD;
  const { t, dir } = useI18n();
  const { user } = useUser();
  const { logout } = useAuth();
  const { currentCompanyId, clearCompany } = useCompany();
  const { clearBranch } = useBranch();
  const { data: companies = [] } = useMyCompanies();
  const { data: branches = [] } = useBranches(currentCompanyId);
  const currentBranch = useCurrentBranch();
  const handleLogout = onLogout || logout;
  const currentCompany = companies.find((company) => company.companyId === currentCompanyId);
  const switchableCompanies = companies.filter(isCompanyEnterable);
  const switchableBranches = branches.filter(isBranchEnterable);

  return (
    <div dir={dir} className="bg-space min-h-screen w-full text-white flex flex-col lg:flex-row">
      {/* sidebar (RTL: sits on the right) */}
      <aside
        className="
          hidden
          lg:flex
          flex-col
          w-[285px]
          shrink-0
          bg-black
          border-l
          border-white/10
          px-5
          py-6
          relative
          overflow-hidden
        "
      >
        <div className="bg-stars absolute inset-0 pointer-events-none opacity-40" />
        <div className="flex items-center gap-3 mb-10">
          <div
            className="
              w-12
              h-12
              rounded-2xl
              bg-gradient-to-br
              from-cyan-400
              to-blue-600
              flex
              items-center
              justify-center
              text-xl
              font-black
              shadow-[0_0_25px_rgba(59,130,246,.5)]
            "
          >
            N
          </div>
          <div>
            <div className="text-2xl font-black brand-text">NOBO</div>
            <div className="text-xs text-gray-500">ERP III</div>
          </div>
        </div>
        <button
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className="
            w-full
            rounded-2xl
            py-4
            font-bold
            text-white
            mb-4
            transition
            duration-300
            hover:scale-[1.02]
            shadow-[0_0_30px_rgba(43,140,255,.35)]
            text-sm
          "
          style={{ background: "linear-gradient(90deg,#2b8cff,#4f6bff)" }}
        >
          {t("layout.home")}
        </button>
        <nav className="space-y-1 overflow-y-auto scrollbar-none">
          {NAV_ITEMS.slice(1).map((item, i, arr) => {
            const showDivider = item.comingSoon && !arr[i - 1]?.comingSoon;

            if (item.comingSoon) {
              return (
                <Fragment key={i}>
                  {showDivider && <div className="my-2 border-t border-white/10" />}
                  <ComingSoonNavItem icon={item.icon} labelKey={item.labelKey} />
                </Fragment>
              );
            }

            if (item.kind === "group") {
              const GroupComponent = NAV_GROUPS[item.module];
              return <GroupComponent key={i} activePath={activePath} navigate={navigate} />;
            }

            if (item.permission) {
              return (
                <PermissionNavItem
                  key={i}
                  icon={item.icon}
                  labelKey={item.labelKey}
                  to={item.to}
                  permission={item.permission}
                  activePath={activePath}
                  navigate={navigate}
                  shortcutAction={item.shortcutAction}
                />
              );
            }

            const isActive = activePath === item.to;
            return (
              <div
                key={i}
                onClick={() => navigate(item.to)}
                className={`
                  group
                  rounded-2xl
                  px-4
                  py-3.5
                  flex
                  items-center
                  gap-4
                  cursor-pointer
                  transition-all
                  duration-300
                  hover:bg-blue-500/10
                  hover:border
                  hover:border-blue-500/30
                  ${isActive ? "bg-blue-500/15 border border-blue-500/40" : ""}
                `}
              >
                <item.icon size={20} color={isActive ? "#2b8cff" : "#60a5fa"} className="group-hover:scale-110 transition" />
                <span className={`font-semibold tracking-wide ${isActive ? "text-white" : ""}`}>{t(item.labelKey)}</span>
              </div>
            );
          })}
        </nav>
<button
          onClick={() => navigate(ROUTES.PROFILE)}
          className="
            mt-auto
            rounded-3xl
            border
            border-white/10
            bg-white/5
            backdrop-blur-xl
            p-4
            flex
            items-center
            gap-3
            text-left
            cursor-pointer
            transition
            hover:border-blue-500/40
            hover:bg-blue-500/10
          "
        >
          <img
            src={user.avatarFile || user.avatar}
            alt=""
            className="w-14 h-14 rounded-full bg-gray-700 object-cover"
            style={{ boxShadow: "0 0 25px rgba(43,140,255,.3)" }}
          />
          <div>
            <div className="text-sm font-bold">{user.name}</div>
            <div className="text-[11px] text-gray-400">
              {user.role === "systemAdmin" ? t("layout.systemAdmin") : t(`profile.role${user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "SystemAdmin"}`)}
            </div>
          </div>
        </button>
        <div
          className="
            mt-4
            rounded-2xl
            bg-green-500/10
            border
            border-green-400/30
            p-3
            flex
            items-center
            justify-between
          "
        >
          <div>
            <div className="text-xs text-green-400">{t("layout.systemStatus")}</div>
            <div className="text-[11px] text-gray-400">{t("layout.allServices")}</div>
          </div>
          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
        </div>
      </aside>

      {/* main */}
      <main className="min-w-0 flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden">
        <Header
          onLogout={handleLogout}
          companyName={currentCompany ? getCompanyDisplayName(currentCompany) : ""}
          onSwitchCompany={switchableCompanies.length > 1 ? clearCompany : undefined}
          branchName={currentBranch ? currentBranch.name : ""}
          onSwitchBranch={switchableBranches.length > 1 ? clearBranch : undefined}
        />
        <nav className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none lg:hidden">
          {NAV_ITEMS.filter((item) => !item.comingSoon).map((item, i) => {
            if (item.kind === "group") {
              const GroupComponent = NAV_GROUPS[item.module];
              return (
                <GroupComponent
                  key={item.module}
                  activePath={activePath}
                  navigate={navigate}
                  variant="mobile"
                />
              );
            }

            if (item.permission) {
              return (
                <PermissionNavItem
                  key={i}
                  icon={item.icon}
                  labelKey={item.labelKey}
                  to={item.to}
                  permission={item.permission}
                  activePath={activePath}
                  navigate={navigate}
                  variant="mobile"
                />
              );
            }

            const isActive = activePath === item.to;
            return (
              <button
                key={item.to}
                type="button"
                onClick={() => navigate(item.to)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${isActive ? "border-blue-400/50 bg-blue-500/20 text-white" : "border-white/10 bg-white/5 text-gray-300"}`}
              >
                <item.icon size={14} />
                {t(item.labelKey)}
              </button>
            );
          })}
        </nav>
        {children}
        <Footer />
      </main>
    </div>
  );
}
