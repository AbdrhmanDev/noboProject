import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronsLeft } from "lucide-react";
import NoboLogo from "./NoboLogo";
import logoDark from "../assets/nobo-logo-dark.png";
import Header from "./Header";
import Footer from "./Footer";
import { useI18n } from "../i18n/I18nContext";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useCurrentUserProfile } from "../features/auth/hooks/useCurrentUserProfile";
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
import { PlatformNavGroup } from "../features/platform/components/PlatformNavGroup";
import { PermissionNavItem } from "./PermissionNavItem";
import { ComingSoonNavItem } from "./ComingSoonNavItem";

const NAV_GROUPS = {
  inventory: InventoryNavGroup,
  kitchen: KitchenNavGroup,
  restaurant: RestaurantNavGroup,
  procurement: ProcurementNavGroup,
  devices: DevicesNavGroup,
  platform: PlatformNavGroup,
};

// Design-only grouping of the existing NAV_ITEMS into titled sections. Each section takes one of the
// four logo-bar colours (see styles/sidebar.css). Items keep their own order, permissions and
// routes; anything not listed here falls into the last section so nothing is ever dropped.
const SIDEBAR_SECTIONS = [
  { id: "operations", titleKey: "nav.section.operations", accent: "blue", labelKeys: ["nav.pos", "nav.kitchen", "nav.restaurant"] },
  { id: "setup", titleKey: "nav.section.setup", accent: "yellow", labelKeys: ["nav.catalog", "nav.pricing", "nav.tax", "nav.payments", "nav.devices"] },
  { id: "backOffice", titleKey: "nav.section.backOffice", accent: "green", labelKeys: ["nav.inventory", "nav.sales", "nav.purchases"] },
];
const SIDEBAR_ADMIN_SECTION = { id: "admin", titleKey: "nav.section.admin", accent: "pink" };
const SIDEBAR_SOON_SECTION = { id: "soon", titleKey: "nav.comingSoon", accent: "muted" };

function buildSidebarSections(items) {
  const soonItems = items.filter((item) => item.comingSoon);
  const liveItems = items.filter((item) => !item.comingSoon);
  const assigned = new Set(SIDEBAR_SECTIONS.flatMap((section) => section.labelKeys));
  const sections = SIDEBAR_SECTIONS.map((section) => ({
    ...section,
    items: liveItems.filter((item) => section.labelKeys.includes(item.labelKey)),
  }));
  const adminItems = liveItems.filter((item) => !assigned.has(item.labelKey));
  return [
    ...sections,
    ...(soonItems.length ? [{ ...SIDEBAR_SOON_SECTION, items: soonItems }] : []),
    ...(adminItems.length ? [{ ...SIDEBAR_ADMIN_SECTION, items: adminItems }] : []),
  ];
}

const NAV_SECTIONS = buildSidebarSections(NAV_ITEMS.slice(1));

const SIDEBAR_COLLAPSE_STORAGE_KEY = "nobo-sidebar-collapsed";

export default function AppLayout({ children, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = (location?.hash && location.hash.replace("#", "")) || location?.pathname || ROUTES.DASHBOARD;
  const isPos = activePath === ROUTES.POS;
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY);
      if (stored !== null) return stored === "true";
    } catch {
      // localStorage unavailable — fall through to the route-based default
    }
    return activePath === ROUTES.POS;
  });
  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSE_STORAGE_KEY, String(next));
      } catch {
        // localStorage unavailable — preference just won't persist
      }
      return next;
    });
  };
  const { t, dir } = useI18n();
  const { session, logout } = useAuth();
  const profileQuery = useCurrentUserProfile();
  // Real identity only (Cashier Real Identity task) -- displayName once /api/auth/me resolves,
  // the session's own real email as an immediate fallback (never a fake seeded name).
  const displayName = profileQuery.data?.displayName || session?.email || "";
  const initial = (displayName || "?").trim().charAt(0).toUpperCase();
  const { currentCompanyId, clearCompany } = useCompany();
  const { clearBranch } = useBranch();
  const { data: companies = [] } = useMyCompanies();
  const { data: branches = [] } = useBranches(currentCompanyId);
  const currentBranch = useCurrentBranch();
  const handleLogout = onLogout || logout;
  const currentCompany = companies.find((company) => company.companyId === currentCompanyId);
  const switchableCompanies = companies.filter(isCompanyEnterable);
  const switchableBranches = branches.filter(isBranchEnterable);

  const HomeIcon = NAV_ITEMS[0].icon;

  const renderNavItem = (item) => {
    if (item.comingSoon) {
      return <ComingSoonNavItem key={item.labelKey} icon={item.icon} labelKey={item.labelKey} collapsed={collapsed} />;
    }

    if (item.kind === "group") {
      const GroupComponent = NAV_GROUPS[item.module];
      return (
        <GroupComponent
          key={item.module}
          activePath={activePath}
          navigate={navigate}
          collapsed={collapsed}
        />
      );
    }

    if (item.permission || item.permissions) {
      return (
        <PermissionNavItem
          key={item.labelKey}
          icon={item.icon}
          labelKey={item.labelKey}
          to={item.to}
          permission={item.permission}
          permissions={item.permissions}
          entitlement={item.entitlement}
          activePath={activePath}
          navigate={navigate}
          shortcutAction={item.shortcutAction}
          collapsed={collapsed}
        />
      );
    }

    const isActive = activePath === item.to;
    return (
      <button
        key={item.labelKey}
        type="button"
        onClick={() => navigate(item.to)}
        aria-label={t(item.labelKey)}
        aria-current={isActive ? "page" : undefined}
        data-active={isActive}
        className="nobo-sb-item"
      >
        <item.icon size={20} className="nobo-sb-icon" />
        {collapsed ? (
          <span className="nobo-sb-tip">{t(item.labelKey)}</span>
        ) : (
          <span className="nobo-sb-label">{t(item.labelKey)}</span>
        )}
      </button>
    );
  };

  return (
    <div dir={dir} className="bg-space min-h-screen w-full text-white flex flex-col lg:flex-row">
      {/* sidebar (RTL: sits on the right; the CSS is logical, so it mirrors with dir) */}
      <aside className="nobo-sidebar hidden lg:flex flex-col" data-collapsed={collapsed}>
        <div className="nobo-sb-top">
          {collapsed ? (
            <span className="nobo-sb-mark" aria-hidden="true">
              <img src={logoDark} alt="" />
            </span>
          ) : (
            <NoboLogo className="nobo-sb-logo" />
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? t("layout.expandSidebar") : t("layout.collapseSidebar")}
            aria-expanded={!collapsed}
            className="nobo-sb-toggle"
          >
            <ChevronsLeft size={16} />
            {collapsed && <span className="nobo-sb-tip">{t("layout.expandSidebar")}</span>}
          </button>
        </div>

        <nav className="nobo-sb-nav scrollbar-none" aria-label={t("layout.home")}>
          <div className="nobo-sb-section" data-accent="blue">
            <div className="nobo-sb-items">
              <button
                type="button"
                onClick={() => navigate(ROUTES.DASHBOARD)}
                aria-label={t("layout.home")}
                aria-current={activePath === ROUTES.DASHBOARD ? "page" : undefined}
                data-active={activePath === ROUTES.DASHBOARD}
                className="nobo-sb-item"
              >
                <HomeIcon size={20} className="nobo-sb-icon" />
                {collapsed ? (
                  <span className="nobo-sb-tip">{t("layout.home")}</span>
                ) : (
                  <span className="nobo-sb-label">{t("layout.home")}</span>
                )}
              </button>
            </div>
          </div>
          {NAV_SECTIONS.map((section) => (
            <div key={section.id} className="nobo-sb-section" data-accent={section.accent}>
              <div className="nobo-sb-title">{t(section.titleKey)}</div>
              <div className="nobo-sb-items">{section.items.map(renderNavItem)}</div>
            </div>
          ))}
        </nav>

        <div className="nobo-sb-footer">
          <button
            type="button"
            onClick={() => navigate(ROUTES.PROFILE)}
            aria-label={displayName}
            className="nobo-sb-profile"
          >
            {/* Real identity only -- no fake seeded avatar image (Cashier Real Identity task).
                A plain initials circle needs no backend "avatar" concept that doesn't exist. */}
            <span className="nobo-sb-avatar">{initial}</span>
            {collapsed ? (
              <span className="nobo-sb-tip">{displayName}</span>
            ) : (
              <span className="nobo-sb-who">
                <div className="nobo-sb-who-name">{displayName}</div>
                {session?.email && session.email !== displayName && (
                  <div className="nobo-sb-who-mail">{session.email}</div>
                )}
              </span>
            )}
          </button>
          {!collapsed && (
            <div className="nobo-sb-status">
              <div>
                <strong>{t("layout.systemStatus")}</strong>
                {t("layout.allServices")}
              </div>
              <span className="nobo-sb-dot" />
            </div>
          )}
        </div>
      </aside>

      {/* main */}
      <main className={`min-w-0 flex-1 overflow-x-hidden ${isPos ? "p-1.5" : "p-3 sm:p-4 md:p-6"}`}>
        {/* On the POS route the clock/theme/logout/shortcuts controls move down and merge into the
            footer's own status line (Header `bare` inside Footer's `children`, below) instead of
            taking a row of their own at the top — that row is prime real estate for the actual
            workspace (product grid / basket / payment) on a screen where every pixel of vertical
            space matters for how fast the cashier can work. Every other route keeps it at the top,
            in its own full row, exactly as before. */}
        {!isPos && (
          <Header
            onLogout={handleLogout}
            companyName={currentCompany ? getCompanyDisplayName(currentCompany) : ""}
            onSwitchCompany={switchableCompanies.length > 1 ? clearCompany : undefined}
            branchName={currentBranch ? currentBranch.name : ""}
            onSwitchBranch={switchableBranches.length > 1 ? clearBranch : undefined}
          />
        )}
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

            if (item.permission || item.permissions) {
              return (
                <PermissionNavItem
                  key={i}
                  icon={item.icon}
                  labelKey={item.labelKey}
                  to={item.to}
                  permission={item.permission}
                  permissions={item.permissions}
                  entitlement={item.entitlement}
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
        <Footer compact={isPos}>
          {isPos && <Header bare onLogout={handleLogout} />}
        </Footer>
      </main>
    </div>
  );
}
