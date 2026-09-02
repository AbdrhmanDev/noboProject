import { Cpu, HardDrive, LayoutDashboard, Printer, Radar } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { useCompany } from "../../companies/context/CompanyContext";
import { useHasPermission } from "../../companies/hooks/useCompanies";
import { ROUTES } from "../../../utils/routes";
import { NavGroup } from "../../../components/NavGroup";

const DEVICES_VIEW_PERMISSION = "Devices.View";
const EDGE_AGENTS_VIEW_PERMISSION = "EdgeAgents.View";

export function DevicesNavGroup({ activePath, navigate, variant = "desktop" }) {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const devicesViewQuery = useHasPermission(currentCompanyId, DEVICES_VIEW_PERMISSION);
  const edgeAgentsViewQuery = useHasPermission(currentCompanyId, EDGE_AGENTS_VIEW_PERMISSION);
  const canViewDevices = Boolean(currentCompanyId) && devicesViewQuery.hasPermission;
  const canViewEdgeAgents = Boolean(currentCompanyId) && edgeAgentsViewQuery.hasPermission;

  const items = [
    {
      to: ROUTES.DEVICES_OVERVIEW,
      labelKey: "nav.devicesOverview",
      icon: LayoutDashboard,
      visible: canViewDevices,
    },
    {
      to: ROUTES.DEVICES_LIST,
      labelKey: "nav.devicesList",
      icon: HardDrive,
      visible: canViewDevices,
    },
    {
      to: ROUTES.EDGE_AGENTS,
      labelKey: "nav.edgeAgents",
      icon: Cpu,
      visible: canViewEdgeAgents,
    },
    {
      to: ROUTES.DEVICE_DISCOVERY,
      labelKey: "nav.deviceDiscovery",
      icon: Radar,
      visible: canViewDevices && canViewEdgeAgents,
    },
    {
      to: ROUTES.DEVICE_PRINTING,
      labelKey: "nav.devicePrinting",
      icon: Printer,
      visible: canViewDevices,
    },
  ];

  if (variant === "mobile") {
    const target = items.find((item) => item.visible);
    if (!target) return null;

    const isActive = activePath === target.to;
    return (
      <button
        type="button"
        onClick={() => navigate(target.to)}
        className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
          isActive ? "border-blue-400/50 bg-blue-500/20 text-white" : "border-white/10 bg-white/5 text-gray-300"
        }`}
      >
        <Printer size={14} />
        {t("nav.devices")}
      </button>
    );
  }

  return (
    <NavGroup icon={Printer} labelKey="nav.devices" activePath={activePath} navigate={navigate} items={items} />
  );
}
