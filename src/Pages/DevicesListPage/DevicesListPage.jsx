import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HardDrive, Plus, Search } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { useI18n } from "../../i18n/I18nContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import { useDevices } from "../../features/devices/hooks/useDevices";
import { useEdgeAgents } from "../../features/devices/hooks/useEdgeAgents";
import { DeviceHealthBadge, DeviceStatusBadge } from "../../features/devices/components/DeviceStatusBadge";
import { DeviceFormDialog } from "../../features/devices/components/DeviceFormDialog";
import { ROUTES, deviceDetailsPath } from "../../utils/routes";

const DEVICES_VIEW_PERMISSION = "Devices.View";
const DEVICES_MANAGE_PERMISSION = "Devices.Manage";

const DEVICE_TYPE_OPTIONS = [
  "ReceiptPrinter",
  "KitchenPrinter",
  "BarcodeScanner",
  "CashDrawer",
  "CustomerDisplay",
  "KdsDevice",
  "PaymentTerminal",
  "Scale",
];
const STATUS_OPTIONS = ["Active", "Inactive"];
const HEALTH_OPTIONS = ["Unknown", "Online", "Offline", "Degraded", "Error"];
const CERTIFICATION_OPTIONS = ["Unknown", "Certified", "Compatible", "AdapterRequired", "Unsupported"];

function lowerFirst(value) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

export default function DevicesListPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();

  const [deviceType, setDeviceType] = useState("");
  const [status, setStatus] = useState("");
  const [health, setHealth] = useState("");
  const [certification, setCertification] = useState("");
  const [edgeAgentId, setEdgeAgentId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const viewPermissionQuery = useHasPermission(currentCompanyId, DEVICES_VIEW_PERMISSION);
  const managePermissionQuery = useHasPermission(currentCompanyId, DEVICES_MANAGE_PERMISSION);
  const canQuery =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !viewPermissionQuery.isLoading &&
    viewPermissionQuery.hasPermission;
  const canManage = !managePermissionQuery.isLoading && managePermissionQuery.hasPermission;

  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  // Server-supported filters only (deviceType/status/health/certification) —
  // edgeAgentId is not a documented query param on GET /devices, so it (and
  // the debounced text search) are applied client-side below against the
  // already-fetched list, same as posTerminalId/kitchenStationId would be
  // when this page doesn't have a specific terminal/station context.
  const serverFilters = useMemo(
    () => ({ deviceType, status, health, certification }),
    [deviceType, status, health, certification],
  );

  const devicesQuery = useDevices(currentCompanyId, currentBranchId, serverFilters, canQuery);
  const edgeAgentsQuery = useEdgeAgents(currentCompanyId, currentBranchId, {}, canQuery);

  const devices = useMemo(() => {
    let items = devicesQuery.data || [];
    if (edgeAgentId) items = items.filter((device) => device.edgeAgentId === edgeAgentId);
    if (search) {
      items = items.filter(
        (device) =>
          device.code.toLowerCase().includes(search) || device.name.toLowerCase().includes(search),
      );
    }
    return items;
  }, [devicesQuery.data, edgeAgentId, search]);

  const resetFilters = () => {
    setDeviceType("");
    setStatus("");
    setHealth("");
    setCertification("");
    setEdgeAgentId("");
    setSearchInput("");
  };

  const openDevice = (deviceId) => navigate(deviceDetailsPath(deviceId));

  return (
    <AppLayout activePath={ROUTES.DEVICES_LIST}>
      <main className="space-y-4" dir="rtl">
        <header className="rounded-2xl border border-white/10 bg-[#0c1424]/85 p-4 shadow-xl shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <HardDrive size={16} className="text-blue-300" />
                {t("nav.devicesList")}
              </div>
              <h1 className="mt-1 text-2xl font-black text-white">{t("devices.list.title")}</h1>
              <p className="mt-0.5 text-[11px] text-slate-500">{t("devices.list.subtitle")}</p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:brightness-110"
              >
                <Plus size={14} />
                {t("devices.device.new")}
              </button>
            )}
          </div>
        </header>

        {!currentCompanyId || !currentBranchId ? (
          <EmptyState
            title={t("devices.companyRequired.title")}
            message={t("devices.companyRequired.message")}
          />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label={t("devices.loading")} />
        ) : !viewPermissionQuery.hasPermission ? (
          <ErrorState
            title={t("devices.permissionRequired.title")}
            message={t("devices.permissionRequired.message")}
          />
        ) : (
          <>
            <section className="grid gap-2 rounded-2xl border border-white/10 bg-[#0c1424] p-3 md:grid-cols-6">
              <label className="text-[11px] font-semibold text-slate-400 md:col-span-2">
                {t("devices.filters.search")}
                <div className="mt-1 flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3">
                  <Search size={13} className="shrink-0 text-slate-500" />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder={t("devices.filters.search")}
                    className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
                  />
                </div>
              </label>
              <label className="text-[11px] font-semibold text-slate-400">
                {t("devices.device.deviceType")}
                <select
                  value={deviceType}
                  onChange={(event) => setDeviceType(event.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                >
                  <option value="">{t("devices.filters.all")}</option>
                  {DEVICE_TYPE_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {t(`devices.enum.deviceType.${lowerFirst(value)}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] font-semibold text-slate-400">
                {t("devices.filters.status")}
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                >
                  <option value="">{t("devices.filters.all")}</option>
                  {STATUS_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {t(`devices.enum.deviceStatus.${lowerFirst(value)}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] font-semibold text-slate-400">
                {t("devices.filters.health")}
                <select
                  value={health}
                  onChange={(event) => setHealth(event.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                >
                  <option value="">{t("devices.filters.all")}</option>
                  {HEALTH_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {t(`devices.enum.deviceHealth.${lowerFirst(value)}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] font-semibold text-slate-400">
                {t("devices.filters.certification")}
                <select
                  value={certification}
                  onChange={(event) => setCertification(event.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                >
                  <option value="">{t("devices.filters.all")}</option>
                  {CERTIFICATION_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {t(`devices.enum.certification.${lowerFirst(value)}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] font-semibold text-slate-400">
                {t("devices.device.edgeAgent")}
                <select
                  value={edgeAgentId}
                  onChange={(event) => setEdgeAgentId(event.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                >
                  <option value="">{t("devices.filters.all")}</option>
                  {(edgeAgentsQuery.data || []).map((agent) => (
                    <option key={agent.edgeAgentId} value={agent.edgeAgentId}>
                      {agent.code} — {agent.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-auto h-10 rounded-xl border border-white/10 bg-white/[0.035] px-3 text-xs font-bold text-slate-200 md:col-start-6"
              >
                {t("devices.filters.reset")}
              </button>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-black text-white">{t("devices.list.title")}</div>
                <div className="text-[11px] text-slate-500">
                  {t("devices.totalCount", { count: devices.length })}
                </div>
              </div>

              {devicesQuery.isLoading && <LoadingState label={t("devices.loading")} />}
              {devicesQuery.isError && (
                <>
                  <ErrorState
                    title={t("devices.error.title")}
                    message={devicesQuery.error?.message || t("devices.error.message")}
                  />
                  <button
                    type="button"
                    onClick={() => devicesQuery.refetch()}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.035] py-2 text-xs font-bold text-slate-100 hover:bg-white/10"
                  >
                    {t("devices.retry")}
                  </button>
                </>
              )}
              {!devicesQuery.isLoading && !devicesQuery.isError && devices.length === 0 && (
                <EmptyState title={t("devices.list.empty.title")} message={t("devices.list.empty.message")} />
              )}

              {!devicesQuery.isLoading && !devicesQuery.isError && devices.length > 0 && (
                <>
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-start text-slate-500">
                          <th className="pb-2 text-start font-medium">{t("devices.device.code")}</th>
                          <th className="pb-2 text-start font-medium">{t("devices.device.name")}</th>
                          <th className="pb-2 text-start font-medium">{t("devices.device.deviceType")}</th>
                          <th className="pb-2 text-start font-medium">{t("devices.filters.status")}</th>
                          <th className="pb-2 text-start font-medium">{t("devices.filters.health")}</th>
                          <th className="pb-2 text-start font-medium">{t("devices.filters.certification")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {devices.map((device) => (
                          <tr
                            key={device.deviceId}
                            onClick={() => openDevice(device.deviceId)}
                            className="cursor-pointer border-t border-white/5 hover:bg-white/[0.03]"
                          >
                            <td className="py-2.5 font-bold text-white">{device.code}</td>
                            <td className="py-2.5 text-slate-200">{device.name}</td>
                            <td className="py-2.5 text-slate-300">
                              {t(`devices.enum.deviceType.${lowerFirst(device.deviceType)}`)}
                            </td>
                            <td className="py-2.5">
                              <DeviceStatusBadge status={device.status} />
                            </td>
                            <td className="py-2.5">
                              <DeviceHealthBadge health={device.healthStatus} />
                            </td>
                            <td className="py-2.5 text-slate-300">
                              {t(`devices.enum.certification.${lowerFirst(device.certificationStatus)}`)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-2 lg:hidden">
                    {devices.map((device) => (
                      <button
                        key={device.deviceId}
                        type="button"
                        onClick={() => openDevice(device.deviceId)}
                        className="flex w-full flex-col gap-2 rounded-xl border border-white/10 bg-[#0d1728] p-3 text-start transition hover:border-blue-400/40"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-black text-white">{device.code}</span>
                          <DeviceStatusBadge status={device.status} />
                        </div>
                        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                          <span>{device.name}</span>
                          <DeviceHealthBadge health={device.healthStatus} />
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {t(`devices.enum.deviceType.${lowerFirst(device.deviceType)}`)}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </section>
          </>
        )}

        {showCreateDialog && currentCompanyId && currentBranchId && (
          <DeviceFormDialog
            companyId={currentCompanyId}
            branchId={currentBranchId}
            onClose={() => setShowCreateDialog(false)}
            onSuccess={(device) => {
              setShowCreateDialog(false);
              openDevice(device.deviceId);
            }}
          />
        )}
      </main>
    </AppLayout>
  );
}
