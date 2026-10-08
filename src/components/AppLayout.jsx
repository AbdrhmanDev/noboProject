import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronsLeft, FilePlus2, Menu, X } from "lucide-react";
import NoboLogo from "./NoboLogo";
import logoDark from "../assets/nobo-logo-dark.png";
import logoLight from "../assets/nobo-logo-light.png";
import Header from "./Header";
import Footer from "./Footer";
import "../shared/components/odoo/odoo.css";
import { env } from "../app/config/env";
import { useI18n } from "../i18n/I18nContext";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useCurrentUserProfile } from "../features/auth/hooks/useCurrentUserProfile";
import { useBranch } from "../features/branches/context/BranchContext";
import { isBranchEnterable, useMyBranches } from "../features/branches/hooks/useBranches";
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
  // Self-scoped (no Branches.View required) -- the top-bar branch switcher must work for a
  // cashier-only role too.
  const { data: branches = [] } = useMyBranches(currentCompanyId);
  const currentBranch = useCurrentBranch();
  const handleLogout = onLogout || logout;
  const currentCompany = companies.find((company) => company.companyId === currentCompanyId);
  const switchableCompanies = companies.filter(isCompanyEnterable);
  const switchableBranches = branches.filter(isBranchEnterable);

  const HomeIcon = NAV_ITEMS[0].icon;

  // Mobile (below lg): the same sidebar as a slide-in drawer, opened from the top bar's menu
  // button. Any navigation from inside it closes it first.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigateFromDrawer = (to) => {
    setMobileNavOpen(false);
    navigate(to);
  };
  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileNavOpen]);

  // `isCollapsed` / `go`: the desktop sidebar passes its own collapsed state and plain navigate;
  // the mobile drawer is always expanded and navigates through navigateFromDrawer.
  const renderNavItem = (item, isCollapsed, go) => {
    if (item.comingSoon) {
      return <ComingSoonNavItem key={item.labelKey} icon={item.icon} labelKey={item.labelKey} collapsed={isCollapsed} />;
    }

    if (item.kind === "group") {
      const GroupComponent = NAV_GROUPS[item.module];
      return (
        <GroupComponent
          key={item.module}
          activePath={activePath}
          navigate={go}
          collapsed={isCollapsed}
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
          hideWhenOwnSalesScope={item.hideWhenOwnSalesScope}
          activePath={activePath}
          navigate={go}
          shortcutAction={item.shortcutAction}
          collapsed={isCollapsed}
        />
      );
    }

    const isActive = activePath === item.to;
    return (
      <button
        key={item.labelKey}
        type="button"
        onClick={() => go(item.to)}
        aria-label={t(item.labelKey)}
        aria-current={isActive ? "page" : undefined}
        data-active={isActive}
        className="nobo-sb-item"
      >
        <item.icon size={20} className="nobo-sb-icon" />
        {isCollapsed ? (
          <span className="nobo-sb-tip">{t(item.labelKey)}</span>
        ) : (
          <span className="nobo-sb-label">{t(item.labelKey)}</span>
        )}
      </button>
    );
  };

  // Navigation + profile footer, shared by the desktop sidebar and the mobile drawer.
  const renderSidebarNav = (isCollapsed, go) => (
    <>
      <nav className="nobo-sb-nav scrollbar-none" aria-label={t("layout.home")}>
        <div className="nobo-sb-section" data-accent="blue">
          <div className="nobo-sb-items">
            <button
              type="button"
              onClick={() => go(ROUTES.DASHBOARD)}
              aria-label={t("layout.home")}
              aria-current={activePath === ROUTES.DASHBOARD ? "page" : undefined}
              data-active={activePath === ROUTES.DASHBOARD}
              className="nobo-sb-item"
            >
              <HomeIcon size={20} className="nobo-sb-icon" />
              {isCollapsed ? (
                <span className="nobo-sb-tip">{t("layout.home")}</span>
              ) : (
                <span className="nobo-sb-label">{t("layout.home")}</span>
              )}
            </button>
            {/* Deliberately NOT a PermissionNavItem: those all require currentCompanyId truthy,
                but the applicant Customer Registration flow is exactly for a user who may have NO
                company yet (its route bypasses CompanyGate too -- see AuthenticatedOnlyRoute).
                Always visible to any authenticated user; the backend is the real gate.
                SelfHosted exception: a single-restaurant offline install has no "register a new
                company with NOBO" use case at all, so this entry point is hidden there -- Cloud
                (where this is a real new-customer signup flow) is unaffected. */}
            {env.deploymentMode !== "SelfHosted" && (
              <button
                type="button"
                onClick={() => go(ROUTES.REGISTRATION_NEW)}
                aria-label={t("nav.myRegistration")}
                aria-current={activePath === ROUTES.REGISTRATION_NEW ? "page" : undefined}
                data-active={activePath === ROUTES.REGISTRATION_NEW}
                className="nobo-sb-item"
              >
                <FilePlus2 size={20} className="nobo-sb-icon" />
                {isCollapsed ? (
                  <span className="nobo-sb-tip">{t("nav.myRegistration")}</span>
                ) : (
                  <span className="nobo-sb-label">{t("nav.myRegistration")}</span>
                )}
              </button>
            )}
          </div>
        </div>
        {NAV_SECTIONS.map((section) => (
          <div key={section.id} className="nobo-sb-section" data-accent={section.accent}>
            <div className="nobo-sb-title">{t(section.titleKey)}</div>
            <div className="nobo-sb-items">{section.items.map((item) => renderNavItem(item, isCollapsed, go))}</div>
          </div>
        ))}
      </nav>

      <div className="nobo-sb-footer">
        <button
          type="button"
          onClick={() => go(ROUTES.PROFILE)}
          aria-label={displayName}
          className="nobo-sb-profile"
        >
          {/* Real identity only -- no fake seeded avatar image (Cashier Real Identity task).
              A plain initials circle needs no backend "avatar" concept that doesn't exist. */}
          <span className="nobo-sb-avatar">{initial}</span>
          {isCollapsed ? (
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
        {!isCollapsed && (
          <div className="nobo-sb-status">
            <div>
              <strong>{t("layout.systemStatus")}</strong>
              {t("layout.allServices")}
            </div>
            <span className="nobo-sb-dot" />
          </div>
        )}
      </div>
    </>
  );

  return (
    <div
      dir={dir}
      // --app-sidebar-w: the sidebar's CURRENT real width, exposed as a CSS var on this shared
      // ancestor (sidebar and <main> are flex siblings, so neither can read the other's own scoped
      // --sb-w/--sb-w-collapsed directly) so fixed-position POS elements anchored to the physical
      // right edge (FloatingOrderButton, PosStatusBar, OrderBottomSheet -- all deliberately anchored
      // to the physical side, not the logical one, per their own RTL-vs-chat-widget convention) can
      // offset themselves past it instead of rendering on top of it. Only set in `rtl`: that's the
      // only direction where the sidebar (first flex child, so visually at the inline-start side)
      // actually lands on the physical right where those elements anchor -- in `ltr` the sidebar
      // would be on the left instead, nowhere near them, so no offset is needed there.
      className={`bg-space min-h-screen w-full text-white flex flex-col lg:flex-row ${
        dir === "rtl" ? (collapsed ? "lg:[--app-sidebar-w:64px]" : "lg:[--app-sidebar-w:240px]") : ""
      }`}
    >
      {/* sidebar (RTL: sits on the right; the CSS is logical, so it mirrors with dir) */}
      <aside className="nobo-sidebar hidden lg:flex flex-col" data-collapsed={collapsed}>
        <div className="nobo-sb-top">
          {collapsed ? (
            <span className="nobo-sb-mark" aria-hidden="true">
              {/* Both crops are mounted; sidebar.css shows the one matching the sidebar's theme. */}
              <img src={logoDark} alt="" className="nobo-logo-dark" />
              <img src={logoLight} alt="" className="nobo-logo-light" />
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

        {/* Floating edge handle: pinned to the sidebar's own edge at mid-height, so it is always in reach. Same
            toggle as the one in the header; the chevron turns to say which way the sidebar will move. */}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? t("layout.expandSidebar") : t("layout.collapseSidebar")}
          aria-expanded={!collapsed}
          className="nobo-sb-edge"
        >
          <ChevronsLeft size={16} />
        </button>

        {renderSidebarNav(collapsed, navigate)}
      </aside>

      {/* Mobile drawer (below lg): the same sidebar, always expanded, sliding in over a backdrop.
          Kept mounted so the slide can animate both ways; `inert` while closed keeps it out of
          tab order and screen readers. */}
      <div
        className="nobo-sidebar-backdrop"
        data-open={mobileNavOpen}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden="true"
      />
      <aside
        id="nobo-mobile-nav"
        className="nobo-sidebar nobo-sidebar-drawer flex flex-col"
        data-collapsed="false"
        data-open={mobileNavOpen}
        aria-label={t("layout.menu")}
        inert={!mobileNavOpen}
      >
        <div className="nobo-sb-top">
          <NoboLogo className="nobo-sb-logo" />
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label={t("layout.closeMenu")}
            className="nobo-sb-toggle"
          >
            <X size={16} />
          </button>
        </div>
        {renderSidebarNav(false, navigateFromDrawer)}
      </aside>

      {/* main */}
      {/* Every back-office page takes the Odoo look (`odoo-root`: Odoo colour tokens, black buttons,
          see shared/components/odoo/odoo.css). The POS keeps its own touch-first design. */}
      <main className={`min-w-0 flex-1 overflow-x-hidden ${isPos ? "p-1.5" : "odoo-root p-3 sm:p-4 md:p-6"}`}>
        {/* Mobile top bar (below lg): the menu button that opens the drawer, plus the logo. It
            replaces the old horizontal scrolling row of nav buttons. */}
        <div className={`flex items-center gap-2 lg:hidden ${isPos ? "mb-1.5" : "mb-3"}`}>
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label={t("layout.openMenu")}
            aria-expanded={mobileNavOpen}
            aria-controls="nobo-mobile-nav"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-gray-200 transition hover:bg-white/10"
          >
            <Menu size={20} />
          </button>
          <NoboLogo className="h-7 w-auto" />
        </div>
        {/* On the POS route the clock/theme/logout/shortcuts controls move down into PosStatusBar's
            own fixed bottom bar (POSPage.jsx) instead of taking a row of their own at the top --
            that row is prime real estate for the actual workspace (product grid / basket /
            payment) on a screen where every pixel of vertical space matters for how fast the
            cashier can work. (Previously this route also rendered a second, normal-flow copy of
            those controls here via Footer's `children` -- that copy and PosStatusBar's own fixed
            bar both ended up claiming the same strip at the bottom of the screen, and the fixed
            one simply covered the other, hiding logout/theme entirely. Dropped here now that
            PosStatusBar renders them for real.) Every other route keeps this row at the top, in
            its own full row, exactly as before. */}
        {!isPos && (
          <Header
            onLogout={handleLogout}
            companyName={currentCompany ? getCompanyDisplayName(currentCompany) : ""}
            onSwitchCompany={switchableCompanies.length > 1 ? clearCompany : undefined}
            branchName={currentBranch ? currentBranch.name : ""}
            onSwitchBranch={switchableBranches.length > 1 ? clearBranch : undefined}
          />
        )}
        {children}
        {!isPos && <Footer />}
      </main>
    </div>
  );
}
