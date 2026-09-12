import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Radar, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { formatDateTime } from "../../shared/utils/formatters";
import { useI18n } from "../../i18n/I18nContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useCurrentBranch } from "../../features/branches/hooks/useCurrentBranch";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import { useEdgeAgents } from "../../features/devices/hooks/useEdgeAgents";
import { useDeviceHardwareBinding, useDevices } from "../../features/devices/hooks/useDevices";
import { useLatestDiscoveredDevices, useRequestDiscoveryRefresh } from "../../features/devices/hooks/useDiscovery";
import { usePosTerminals } from "../../features/pos/hooks/usePosTerminals";
import { useKitchenStations } from "../../features/kitchen/hooks/useKitchen";
import { DiscoveredCandidateCard } from "../../features/devices/components/DiscoveredCandidateCard";
import { ConfirmMatchDialog } from "../../features/devices/components/ConfirmMatchDialog";
import { RegisterDeviceFromCandidateDialog } from "../../features/devices/components/RegisterDeviceFromCandidateDialog";
import { RebindDeviceHardwareDialog } from "../../features/devices/components/RebindDeviceHardwareDialog";
import { ROUTES, deviceDetailsPath } from "../../utils/routes";

const DEVICES_VIEW_PERMISSION = "Devices.View";
const EDGE_AGENTS_VIEW_PERMISSION = "EdgeAgents.View";
const DEVICES_MANAGE_PERMISSION = "Devices.Manage";

export default function DeviceDiscoveryPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const currentBranch = useCurrentBranch();
  const queryClient = useQueryClient();

  const [edgeAgentId, setEdgeAgentId] = useState(searchParams.get("edgeAgentId") || "");
  const [linkCandidate, setLinkCandidate] = useState(null);
  const [registerCandidate, setRegisterCandidate] = useState(null);
  const [rebindDevice, setRebindDevice] = useState(null);

  // Part A: idle -> waiting (poll for a newer report) -> succeeded/timedOut/failed. Never
  // synchronous -- the Edge Agent may take up to a full heartbeat interval to even notice the
  // request, let alone finish a scan and report back.
  const [refreshState, setRefreshState] = useState("idle");
  const [refreshRequestedAtUtc, setRefreshRequestedAtUtc] = useState(null);
  const REFRESH_TIMEOUT_MS = 60000;
  const REFRESH_POLL_MS = 4000;

  const devicesViewQuery = useHasPermission(currentCompanyId, DEVICES_VIEW_PERMISSION);
  const edgeAgentsViewQuery = useHasPermission(currentCompanyId, EDGE_AGENTS_VIEW_PERMISSION);
  const manageQuery = useHasPermission(currentCompanyId, DEVICES_MANAGE_PERMISSION);
  const canQuery =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !devicesViewQuery.isLoading &&
    !edgeAgentsViewQuery.isLoading &&
    devicesViewQuery.hasPermission &&
    edgeAgentsViewQuery.hasPermission;
  const canManage = !manageQuery.isLoading && manageQuery.hasPermission;

  const edgeAgentsQuery = useEdgeAgents(currentCompanyId, currentBranchId, {}, canQuery);

  // "Current hardware state": the single latest discovery report for the selected agent, not the
  // historical list (see useDiscoveredDevices/GetDiscoveredDevices) -- avoids the same physical
  // queue/USB device showing once per past discovery session.
  //
  // The poll-stop decision lives inside this function, evaluated by TanStack Query itself against
  // its own latest fetched data -- deliberately not a React effect reacting to discoveryQuery.data
  // (that pattern is a lint-flagged setState-in-effect render cascade, and would also lag a render
  // behind). Only ever active while refreshState is "waiting"; idle/timedOut/failed never poll.
  const discoveryRefetchInterval = (query) => {
    if (refreshState !== "waiting") return false;
    const data = query.state.data;
    if (data && refreshRequestedAtUtc && new Date(data.reportedAtUtc).getTime() > new Date(refreshRequestedAtUtc).getTime()) {
      return false; // A fresher report already arrived -- stop polling, no need to wait for the timeout.
    }
    return REFRESH_POLL_MS;
  };

  const discoveryQuery = useLatestDiscoveredDevices(
    currentCompanyId,
    currentBranchId,
    edgeAgentId || null,
    canQuery && Boolean(edgeAgentId),
    discoveryRefetchInterval,
  );
  const refreshMutation = useRequestDiscoveryRefresh(currentCompanyId, currentBranchId, edgeAgentId || null);

  // Reused, not duplicated: these are the exact same lists DeviceFormDialog already fetches for
  // its POS Terminal / Kitchen Station selects, and the branch's own device registry -- used here
  // purely to resolve names/assignment for a matched candidate ("where is this device used"),
  // never to re-implement matching logic (that stays entirely backend-side).
  const devicesQuery = useDevices(currentCompanyId, currentBranchId, {}, canQuery);
  const posTerminalsQuery = usePosTerminals(currentCompanyId, currentBranchId, canQuery);
  const kitchenStationsQuery = useKitchenStations(currentCompanyId, currentBranchId, {}, canQuery);
  const rebindBindingQuery = useDeviceHardwareBinding(
    currentCompanyId,
    currentBranchId,
    rebindDevice?.deviceId,
    Boolean(rebindDevice),
  );

  const report = discoveryQuery.data || null;

  // Display-only derived value (not stored state, no effect involved): the latest report becoming
  // newer than the request is the only signal a refresh actually happened.
  const refreshSucceeded =
    refreshState === "waiting" &&
    Boolean(refreshRequestedAtUtc) &&
    Boolean(report) &&
    new Date(report.reportedAtUtc).getTime() > new Date(refreshRequestedAtUtc).getTime();
  const isRefreshWaiting = refreshState === "waiting" && !refreshSucceeded;

  // Honest timeout: the agent may be offline, or may simply not have reached its next heartbeat
  // yet -- either way, this stops polling instead of waiting forever. Calling setState here is
  // fine (unlike a synchronous effect body) because it only ever happens inside the timer
  // callback, i.e. in reaction to time passing, not directly from the render/deps it closed over.
  useEffect(() => {
    if (!isRefreshWaiting) return undefined;
    const timer = setTimeout(() => setRefreshState("timedOut"), REFRESH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isRefreshWaiting]);

  const selectAgent = (value) => {
    setEdgeAgentId(value);
    setSearchParams(value ? { edgeAgentId: value } : {});
    setRefreshState("idle");
    setRefreshRequestedAtUtc(null);
  };

  const handleRefreshDiscovery = async () => {
    try {
      const result = await refreshMutation.mutateAsync();
      setRefreshRequestedAtUtc(result.requestedAtUtc);
      setRefreshState("waiting");
    } catch {
      setRefreshState("failed");
    }
  };

  const handleConfirmSuccess = (dialogSetter) => {
    dialogSetter(null);
    toast.success(t("devices.toast.discoveryRefreshed"));
  };

  const selectedAgent = (edgeAgentsQuery.data || []).find(
    (agent) => agent.edgeAgentId === edgeAgentId,
  );
  const devices = devicesQuery.data || [];
  const posTerminals = posTerminalsQuery.data || [];
  const kitchenStations = kitchenStationsQuery.data || [];

  return (
    <AppLayout activePath={ROUTES.DEVICE_DISCOVERY}>
      <main className="space-y-4" dir="rtl">
        <header className="rounded-2xl border border-white/10 bg-[#0c1424]/85 p-4 shadow-xl shadow-black/20">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Radar size={16} className="text-blue-300" />
            {t("nav.deviceDiscovery")}
          </div>
          <h1 className="mt-1 text-2xl font-black text-white">{t("devices.discovery.title")}</h1>
          <p className="mt-0.5 text-[11px] text-slate-500">{t("devices.discovery.subtitle")}</p>
          <p className="mt-2 text-[11px] font-semibold text-blue-300">
            {t("devices.discovery.flowHint")}
          </p>
        </header>

        {!currentCompanyId || !currentBranchId ? (
          <EmptyState
            title={t("devices.companyRequired.title")}
            message={t("devices.companyRequired.message")}
          />
        ) : devicesViewQuery.isLoading || edgeAgentsViewQuery.isLoading ? (
          <LoadingState label={t("devices.loading")} />
        ) : !canQuery ? (
          <ErrorState
            title={t("devices.permissionRequired.title")}
            message={t("devices.permissionRequired.message")}
          />
        ) : (
          <>
            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
              <label className="block text-[11px] font-semibold text-slate-400 sm:max-w-sm">
                {t("devices.discovery.selectAgent")}
                <select
                  value={edgeAgentId}
                  onChange={(event) => selectAgent(event.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                >
                  <option value="">{t("devices.discovery.selectAgentPlaceholder")}</option>
                  {(edgeAgentsQuery.data || []).map((agent) => (
                    <option key={agent.edgeAgentId} value={agent.edgeAgentId}>
                      {agent.code} — {agent.name}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            {edgeAgentId && canManage && (
              <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0c1424] p-3">
                <div className="text-[11px] text-slate-400">
                  <span className="text-slate-500">{t("devices.discovery.lastDiscovery")}: </span>
                  <span className="font-semibold text-slate-200">
                    {report ? formatDateTime(report.reportedAtUtc) : t("devices.discovery.never")}
                  </span>
                  {isRefreshWaiting && (
                    <span className="ms-2 text-blue-300">{t("devices.discovery.refreshWaiting")}</span>
                  )}
                  {refreshSucceeded && (
                    <span className="ms-2 text-emerald-300">{t("devices.discovery.refreshSucceeded")}</span>
                  )}
                  {refreshState === "timedOut" && (
                    <span className="ms-2 text-amber-300">{t("devices.discovery.refreshTimedOut")}</span>
                  )}
                  {refreshState === "failed" && (
                    <span className="ms-2 text-rose-300">
                      {refreshMutation.error?.message || t("devices.error.generic")}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleRefreshDiscovery}
                  disabled={isRefreshWaiting || refreshMutation.isPending}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100 hover:border-blue-400/40 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw size={13} className={isRefreshWaiting ? "animate-spin" : ""} />
                  {isRefreshWaiting
                    ? t("devices.discovery.refreshing")
                    : t("devices.discovery.refreshAction")}
                </button>
              </section>
            )}

            {!edgeAgentId ? (
              <EmptyState
                title={t("devices.discovery.noAgentSelectedTitle")}
                message={t("devices.discovery.noAgentSelectedMessage")}
              />
            ) : discoveryQuery.isLoading ? (
              <LoadingState label={t("devices.loading")} />
            ) : discoveryQuery.isError ? (
              <ErrorState
                title={t("devices.error.title")}
                message={discoveryQuery.error?.message || t("devices.error.message")}
              />
            ) : !report || report.candidates.length === 0 ? (
              <EmptyState
                title={t("devices.discovery.empty.title")}
                message={t("devices.discovery.empty.message")}
              />
            ) : (
              <div className="space-y-4">
                <section className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {t("devices.discovery.reportedAt", { time: formatDateTime(report.reportedAtUtc) })}
                    </span>
                    <span>{t("devices.discovery.candidateCount", { count: report.candidateCount })}</span>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {report.candidates.map((candidate) => (
                      <DiscoveredCandidateCard
                        key={candidate.discoveryId}
                        candidate={candidate}
                        canManage={canManage}
                        devices={devices}
                        posTerminals={posTerminals}
                        kitchenStations={kitchenStations}
                        branchName={currentBranch?.name}
                        edgeAgentLabel={
                          selectedAgent ? `${selectedAgent.code} — ${selectedAgent.name}` : null
                        }
                        onLinkExisting={() => setLinkCandidate(candidate)}
                        onRegisterNew={() => setRegisterCandidate(candidate)}
                        onViewDevice={(deviceId) => navigate(deviceDetailsPath(deviceId))}
                        onReplaceHardware={(matchedDevice) => setRebindDevice(matchedDevice)}
                      />
                    ))}
                  </div>
                </section>
              </div>
            )}
          </>
        )}

        {linkCandidate && currentCompanyId && currentBranchId && (
          <ConfirmMatchDialog
            companyId={currentCompanyId}
            branchId={currentBranchId}
            edgeAgentId={edgeAgentId}
            candidate={linkCandidate}
            onClose={() => setLinkCandidate(null)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["devices"] });
              handleConfirmSuccess(setLinkCandidate);
            }}
          />
        )}

        {registerCandidate && currentCompanyId && currentBranchId && (
          <RegisterDeviceFromCandidateDialog
            companyId={currentCompanyId}
            branchId={currentBranchId}
            edgeAgentId={edgeAgentId}
            candidate={registerCandidate}
            onClose={() => setRegisterCandidate(null)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["devices"] });
              handleConfirmSuccess(setRegisterCandidate);
            }}
          />
        )}

        {rebindDevice && currentCompanyId && currentBranchId && (
          <RebindDeviceHardwareDialog
            companyId={currentCompanyId}
            branchId={currentBranchId}
            device={rebindDevice}
            currentBinding={rebindBindingQuery.data}
            edgeAgentId={edgeAgentId}
            candidates={report?.candidates}
            onClose={() => setRebindDevice(null)}
            onSuccess={() => setRebindDevice(null)}
          />
        )}
      </main>
    </AppLayout>
  );
}
