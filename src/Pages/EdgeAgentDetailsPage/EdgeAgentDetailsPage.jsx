import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Cpu, KeyRound, Radar } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { formatDateTime } from "../../shared/utils/formatters";
import { useI18n } from "../../i18n/I18nContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import {
  useEdgeAgentDetails,
  useIssueEdgeAgentEnrollment,
  useUpdateEdgeAgentStatus,
} from "../../features/devices/hooks/useEdgeAgents";
import { useDevices } from "../../features/devices/hooks/useDevices";
import { EdgeAgentHealthBadge, EdgeAgentStatusBadge } from "../../features/devices/components/EdgeAgentStatusBadge";
import { DeviceHealthBadge, DeviceStatusBadge } from "../../features/devices/components/DeviceStatusBadge";
import { EnrollmentCredentialDialog } from "../../features/devices/components/EnrollmentCredentialDialog";
import { DeviceConfirmActionDialog } from "../../features/devices/components/DeviceConfirmActionDialog";
import { ROUTES, deviceDetailsPath } from "../../utils/routes";

const EDGE_AGENTS_VIEW_PERMISSION = "EdgeAgents.View";
const EDGE_AGENTS_MANAGE_PERMISSION = "EdgeAgents.Manage";
const DEVICES_VIEW_PERMISSION = "Devices.View";

const STATUS_TRANSITIONS = {
  PendingEnrollment: ["Active", "Revoked"],
  Active: ["Inactive", "Revoked"],
  Inactive: ["Active", "Revoked"],
  Revoked: [],
};

function InfoTile({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-black text-white">{value ?? "—"}</div>
    </div>
  );
}

export default function EdgeAgentDetailsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { edgeAgentId } = useParams();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();

  const [enrollment, setEnrollment] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);

  const viewPermissionQuery = useHasPermission(currentCompanyId, EDGE_AGENTS_VIEW_PERMISSION);
  const managePermissionQuery = useHasPermission(currentCompanyId, EDGE_AGENTS_MANAGE_PERMISSION);
  const devicesViewPermissionQuery = useHasPermission(currentCompanyId, DEVICES_VIEW_PERMISSION);
  const canQuery =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !viewPermissionQuery.isLoading &&
    viewPermissionQuery.hasPermission;
  const canManage = !managePermissionQuery.isLoading && managePermissionQuery.hasPermission;
  const canViewDevices = !devicesViewPermissionQuery.isLoading && devicesViewPermissionQuery.hasPermission;

  const agentQuery = useEdgeAgentDetails(currentCompanyId, currentBranchId, edgeAgentId, canQuery);
  const agent = agentQuery.data;

  const devicesQuery = useDevices(
    currentCompanyId,
    currentBranchId,
    {},
    canQuery && canViewDevices,
  );
  const assignedDevices = useMemo(
    () => (devicesQuery.data || []).filter((device) => device.edgeAgentId === edgeAgentId),
    [devicesQuery.data, edgeAgentId],
  );

  const issueEnrollmentMutation = useIssueEdgeAgentEnrollment(currentCompanyId, currentBranchId, edgeAgentId);
  const updateStatusMutation = useUpdateEdgeAgentStatus(currentCompanyId, currentBranchId, edgeAgentId);

  const issueEnrollment = async () => {
    try {
      const result = await issueEnrollmentMutation.mutateAsync();
      setEnrollment(result);
    } catch (error) {
      toast.error(error?.message || t("devices.error.generic"));
    }
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;
    try {
      await updateStatusMutation.mutateAsync({ status: pendingStatus });
      toast.success(t("devices.toast.agentStatusUpdated"));
    } catch (error) {
      toast.error(error?.message || t("devices.error.generic"));
    } finally {
      setPendingStatus(null);
    }
  };

  const availableTransitions = agent ? STATUS_TRANSITIONS[agent.status] || [] : [];

  return (
    <AppLayout activePath={ROUTES.EDGE_AGENTS}>
      <main className="space-y-4" dir="rtl">
        <header className="rounded-2xl border border-white/10 bg-[#0c1424]/85 p-4 shadow-xl shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => navigate(ROUTES.EDGE_AGENTS)}
                className="mt-1 rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 hover:bg-white/10"
              >
                <ArrowRight size={16} />
              </button>
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Cpu size={16} className="text-blue-300" />
                  {t("nav.edgeAgents")}
                </div>
                <h1 className="mt-1 text-2xl font-black text-white">
                  {agent ? agent.code : t("devices.details.loadingTitle")}
                </h1>
                {agent && <p className="mt-0.5 text-[11px] text-slate-500">{agent.name}</p>}
              </div>
            </div>
            {agent && (
              <div className="flex flex-wrap items-center gap-2">
                <EdgeAgentStatusBadge status={agent.status} />
                {canManage && (
                  <button
                    type="button"
                    onClick={issueEnrollment}
                    disabled={issueEnrollmentMutation.isPending}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <KeyRound size={13} />
                    {t("devices.agent.issueEnrollment")}
                  </button>
                )}
                {canManage && canViewDevices && (
                  <button
                    type="button"
                    onClick={() => navigate(`${ROUTES.DEVICE_DISCOVERY}?edgeAgentId=${edgeAgentId}`)}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:brightness-110"
                  >
                    <Radar size={13} />
                    {t("devices.agent.viewDiscovery")}
                  </button>
                )}
              </div>
            )}
          </div>
          {canManage && agent && availableTransitions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-3">
              {availableTransitions.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setPendingStatus(status)}
                  className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] font-bold text-slate-100 hover:bg-white/10"
                >
                  {t(`devices.agent.transitionTo`, {
                    status: t(`devices.enum.edgeAgentStatus.${status.charAt(0).toLowerCase()}${status.slice(1)}`),
                  })}
                </button>
              ))}
            </div>
          )}
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
        ) : agentQuery.isLoading ? (
          <LoadingState label={t("devices.loading")} />
        ) : agentQuery.isError ? (
          <ErrorState
            title={t("devices.error.title")}
            message={agentQuery.error?.message || t("devices.error.message")}
          />
        ) : agent ? (
          <>
            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
              <div className="mb-3 text-sm font-black text-white">{t("devices.details.identity")}</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <InfoTile label={t("devices.agent.machineName")} value={agent.machineName} />
                <InfoTile label={t("devices.agent.platform")} value={agent.platform} />
                <InfoTile label={t("devices.agent.operatingSystem")} value={agent.operatingSystem} />
                <InfoTile label={t("devices.agent.agentVersion")} value={agent.agentVersion} />
                <InfoTile label={t("devices.details.created")} value={formatDateTime(agent.createdAtUtc)} />
                <InfoTile
                  label={t("devices.agent.enrolledAt")}
                  value={agent.enrolledAtUtc ? formatDateTime(agent.enrolledAtUtc) : "—"}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
              <div className="mb-3 text-sm font-black text-white">{t("devices.agent.heartbeat")}</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                  <div className="text-[11px] text-slate-500">{t("devices.filters.health")}</div>
                  <div className="mt-1">
                    <EdgeAgentHealthBadge health={agent.healthStatus} />
                  </div>
                </div>
                <InfoTile
                  label={t("devices.agent.lastHeartbeat")}
                  value={agent.lastHeartbeatAtUtc ? formatDateTime(agent.lastHeartbeatAtUtc) : "—"}
                />
                <InfoTile label={t("devices.agent.lastIpAddress")} value={agent.lastIpAddress} />
                <InfoTile label={t("devices.agent.lastReportedVersion")} value={agent.lastReportedAgentVersion} />
              </div>
              {agent.lastHealthMessage && (
                <p className="mt-2 text-[11px] text-slate-500">{agent.lastHealthMessage}</p>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
              <div className="mb-3 text-sm font-black text-white">{t("devices.agent.configAck")}</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <InfoTile label={t("devices.agent.configRevision")} value={agent.lastConfigurationRevision ?? "—"} />
                <InfoTile
                  label={t("devices.agent.configAckAt")}
                  value={
                    agent.lastConfigurationAcknowledgedAtUtc
                      ? formatDateTime(agent.lastConfigurationAcknowledgedAtUtc)
                      : "—"
                  }
                />
                <InfoTile label={t("devices.agent.configAckStatus")} value={agent.lastConfigurationAcknowledgmentStatus} />
              </div>
              {agent.lastConfigurationAcknowledgmentMessage && (
                <p className="mt-2 text-[11px] text-slate-500">
                  {agent.lastConfigurationAcknowledgmentMessage}
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
              <div className="mb-3 text-sm font-black text-white">{t("devices.agent.assignedDevices")}</div>
              {!canViewDevices ? (
                <EmptyState
                  title={t("devices.permissionRequired.title")}
                  message={t("devices.permissionRequired.message")}
                />
              ) : devicesQuery.isLoading ? (
                <LoadingState label={t("devices.loading")} />
              ) : assignedDevices.length === 0 ? (
                <EmptyState title={t("devices.agent.noAssignedDevices")} message="" />
              ) : (
                <div className="space-y-2">
                  {assignedDevices.map((device) => (
                    <button
                      key={device.deviceId}
                      type="button"
                      onClick={() => navigate(deviceDetailsPath(device.deviceId))}
                      className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0d1728] p-3 text-start hover:border-blue-400/40"
                    >
                      <div>
                        <div className="text-sm font-black text-white">{device.code}</div>
                        <div className="text-[11px] text-slate-500">{device.name}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DeviceStatusBadge status={device.status} />
                        <DeviceHealthBadge health={device.healthStatus} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}

        {enrollment && (
          <EnrollmentCredentialDialog enrollment={enrollment} onClose={() => setEnrollment(null)} />
        )}

        {pendingStatus && (
          <DeviceConfirmActionDialog
            title={t("devices.agent.transitionTo", {
              status: t(`devices.enum.edgeAgentStatus.${pendingStatus.charAt(0).toLowerCase()}${pendingStatus.slice(1)}`),
            })}
            message={t("devices.agent.confirmStatusChange")}
            confirmLabel={t("devices.actions.confirm")}
            tone={pendingStatus === "Revoked" ? "danger" : "primary"}
            isPending={updateStatusMutation.isPending}
            onConfirm={confirmStatusChange}
            onClose={() => setPendingStatus(null)}
          />
        )}
      </main>
    </AppLayout>
  );
}
