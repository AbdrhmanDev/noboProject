import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Radar } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { formatDateTime } from "../../shared/utils/formatters";
import { useI18n } from "../../i18n/I18nContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import { useEdgeAgents } from "../../features/devices/hooks/useEdgeAgents";
import { useDiscoveredDevices } from "../../features/devices/hooks/useDiscovery";
import { DiscoveredCandidateCard } from "../../features/devices/components/DiscoveredCandidateCard";
import { ConfirmMatchDialog } from "../../features/devices/components/ConfirmMatchDialog";
import { RegisterDeviceFromCandidateDialog } from "../../features/devices/components/RegisterDeviceFromCandidateDialog";
import { ROUTES } from "../../utils/routes";

const DEVICES_VIEW_PERMISSION = "Devices.View";
const EDGE_AGENTS_VIEW_PERMISSION = "EdgeAgents.View";
const DEVICES_MANAGE_PERMISSION = "Devices.Manage";

export default function DeviceDiscoveryPage() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const queryClient = useQueryClient();

  const [edgeAgentId, setEdgeAgentId] = useState(searchParams.get("edgeAgentId") || "");
  const [linkCandidate, setLinkCandidate] = useState(null);
  const [registerCandidate, setRegisterCandidate] = useState(null);

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
  const discoveryQuery = useDiscoveredDevices(
    currentCompanyId,
    currentBranchId,
    edgeAgentId || null,
    {},
    canQuery && Boolean(edgeAgentId),
  );

  const selectAgent = (value) => {
    setEdgeAgentId(value);
    setSearchParams(value ? { edgeAgentId: value } : {});
  };

  const handleConfirmSuccess = (dialogSetter) => {
    dialogSetter(null);
    toast.success(t("devices.toast.discoveryRefreshed"));
  };

  const reports = discoveryQuery.data || [];

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
            ) : reports.length === 0 ? (
              <EmptyState
                title={t("devices.discovery.empty.title")}
                message={t("devices.discovery.empty.message")}
              />
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <section key={report.discoveryReportId} className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{t("devices.discovery.reportedAt", { time: formatDateTime(report.reportedAtUtc) })}</span>
                      <span>{t("devices.discovery.candidateCount", { count: report.candidateCount })}</span>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      {report.candidates.map((candidate) => (
                        <DiscoveredCandidateCard
                          key={candidate.discoveryId}
                          candidate={candidate}
                          canManage={canManage}
                          onLinkExisting={() => setLinkCandidate(candidate)}
                          onRegisterNew={() => setRegisterCandidate(candidate)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
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
      </main>
    </AppLayout>
  );
}
