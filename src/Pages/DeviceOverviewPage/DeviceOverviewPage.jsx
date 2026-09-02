import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Cpu, HardDrive, Printer, Radar } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "../../shared/components/ui";
import { useI18n } from "../../i18n/I18nContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import { useDevices } from "../../features/devices/hooks/useDevices";
import { useEdgeAgents } from "../../features/devices/hooks/useEdgeAgents";
import { usePrintJobs } from "../../features/devices/hooks/usePrintJobs";
import { ROUTES } from "../../utils/routes";

const DEVICES_VIEW_PERMISSION = "Devices.View";

function StatTile({ label, value, tone = "neutral" }) {
  const toneClass =
    tone === "success"
      ? "text-emerald-300"
      : tone === "warning"
        ? "text-amber-300"
        : tone === "danger"
          ? "text-rose-300"
          : "text-white";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-black ${toneClass}`}>{value}</div>
    </div>
  );
}

function LinkCard({ icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-2 rounded-2xl border border-white/10 bg-[#0d1728] p-4 text-start transition hover:border-blue-400/40 hover:bg-blue-500/10"
    >
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-blue-300" />
        <span className="text-sm font-black text-white">{title}</span>
      </div>
      <p className="text-[11px] text-slate-500">{description}</p>
    </button>
  );
}

export default function DeviceOverviewPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();

  const viewPermissionQuery = useHasPermission(currentCompanyId, DEVICES_VIEW_PERMISSION);
  const canQuery =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !viewPermissionQuery.isLoading &&
    viewPermissionQuery.hasPermission;

  const devicesQuery = useDevices(currentCompanyId, currentBranchId, {}, canQuery);
  const edgeAgentsQuery = useEdgeAgents(currentCompanyId, currentBranchId, {}, canQuery);
  const printJobsQuery = usePrintJobs(currentCompanyId, currentBranchId, {}, canQuery);

  const isLoading = devicesQuery.isLoading || edgeAgentsQuery.isLoading || printJobsQuery.isLoading;
  const isError = devicesQuery.isError || edgeAgentsQuery.isError || printJobsQuery.isError;

  const deviceStats = useMemo(() => {
    const devices = devicesQuery.data || [];
    return {
      total: devices.length,
      active: devices.filter((device) => device.status === "Active").length,
      online: devices.filter((device) => device.healthStatus === "Online").length,
      needsAttention: devices.filter(
        (device) => device.healthStatus === "Degraded" || device.healthStatus === "Error",
      ).length,
    };
  }, [devicesQuery.data]);

  const agentStats = useMemo(() => {
    const agents = edgeAgentsQuery.data || [];
    return {
      total: agents.length,
      active: agents.filter((agent) => agent.status === "Active").length,
      pending: agents.filter((agent) => agent.status === "PendingEnrollment").length,
      offline: agents.filter((agent) => agent.healthStatus === "Offline" || agent.healthStatus === "Error").length,
    };
  }, [edgeAgentsQuery.data]);

  const printJobStats = useMemo(() => {
    const jobs = printJobsQuery.data || [];
    return {
      total: jobs.length,
      inFlight: jobs.filter((job) => ["Queued", "Claimed", "Printing"].includes(job.status)).length,
      succeeded: jobs.filter((job) => job.status === "Succeeded").length,
      failed: jobs.filter((job) => job.status === "Failed").length,
    };
  }, [printJobsQuery.data]);

  return (
    <AppLayout activePath={ROUTES.DEVICES_OVERVIEW}>
      <main className="space-y-4" dir="rtl">
        <PageHeader title={t("devices.overview.title")} />

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
        ) : isLoading ? (
          <LoadingState label={t("devices.loading")} />
        ) : isError ? (
          <ErrorState title={t("devices.error.title")} message={t("devices.error.message")} />
        ) : (
          <>
            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
              <div className="mb-3 text-sm font-black text-white">{t("devices.overview.devices")}</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatTile label={t("devices.overview.total")} value={deviceStats.total} />
                <StatTile label={t("devices.overview.active")} value={deviceStats.active} tone="success" />
                <StatTile label={t("devices.overview.online")} value={deviceStats.online} tone="success" />
                <StatTile
                  label={t("devices.overview.needsAttention")}
                  value={deviceStats.needsAttention}
                  tone={deviceStats.needsAttention > 0 ? "danger" : "neutral"}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
              <div className="mb-3 text-sm font-black text-white">{t("devices.overview.edgeAgents")}</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatTile label={t("devices.overview.total")} value={agentStats.total} />
                <StatTile label={t("devices.overview.active")} value={agentStats.active} tone="success" />
                <StatTile
                  label={t("devices.overview.pendingEnrollment")}
                  value={agentStats.pending}
                  tone={agentStats.pending > 0 ? "warning" : "neutral"}
                />
                <StatTile
                  label={t("devices.overview.offline")}
                  value={agentStats.offline}
                  tone={agentStats.offline > 0 ? "danger" : "neutral"}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
              <div className="mb-3 text-sm font-black text-white">{t("devices.overview.printing")}</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatTile label={t("devices.overview.total")} value={printJobStats.total} />
                <StatTile
                  label={t("devices.overview.inFlight")}
                  value={printJobStats.inFlight}
                  tone={printJobStats.inFlight > 0 ? "warning" : "neutral"}
                />
                <StatTile label={t("devices.overview.succeeded")} value={printJobStats.succeeded} tone="success" />
                <StatTile
                  label={t("devices.overview.failed")}
                  value={printJobStats.failed}
                  tone={printJobStats.failed > 0 ? "danger" : "neutral"}
                />
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <LinkCard
                icon={HardDrive}
                title={t("devices.overview.linkDevices")}
                description={t("devices.overview.linkDevicesDesc")}
                onClick={() => navigate(ROUTES.DEVICES_LIST)}
              />
              <LinkCard
                icon={Cpu}
                title={t("devices.overview.linkAgents")}
                description={t("devices.overview.linkAgentsDesc")}
                onClick={() => navigate(ROUTES.EDGE_AGENTS)}
              />
              <LinkCard
                icon={Radar}
                title={t("devices.overview.linkDiscovery")}
                description={t("devices.overview.linkDiscoveryDesc")}
                onClick={() => navigate(ROUTES.DEVICE_DISCOVERY)}
              />
              <LinkCard
                icon={Printer}
                title={t("devices.overview.linkPrinting")}
                description={t("devices.overview.linkPrintingDesc")}
                onClick={() => navigate(ROUTES.DEVICE_PRINTING)}
              />
            </section>
          </>
        )}
      </main>
    </AppLayout>
  );
}
