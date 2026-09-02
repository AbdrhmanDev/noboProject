import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cpu, KeyRound, Plus } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { formatDateTime } from "../../shared/utils/formatters";
import { useI18n } from "../../i18n/I18nContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import {
  useEdgeAgents,
  useIssueEdgeAgentEnrollment,
} from "../../features/devices/hooks/useEdgeAgents";
import { EdgeAgentHealthBadge, EdgeAgentStatusBadge } from "../../features/devices/components/EdgeAgentStatusBadge";
import { EdgeAgentPulseIndicator } from "../../features/devices/components/EdgeAgentPulseIndicator";
import { EdgeAgentFormDialog } from "../../features/devices/components/EdgeAgentFormDialog";
import { EnrollmentCredentialDialog } from "../../features/devices/components/EnrollmentCredentialDialog";
import { ROUTES, edgeAgentDetailsPath } from "../../utils/routes";

const EDGE_AGENTS_VIEW_PERMISSION = "EdgeAgents.View";
const EDGE_AGENTS_MANAGE_PERMISSION = "EdgeAgents.Manage";

export default function EdgeAgentsListPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [enrollment, setEnrollment] = useState(null);
  const [pendingAgentId, setPendingAgentId] = useState(null);

  const viewPermissionQuery = useHasPermission(currentCompanyId, EDGE_AGENTS_VIEW_PERMISSION);
  const managePermissionQuery = useHasPermission(currentCompanyId, EDGE_AGENTS_MANAGE_PERMISSION);
  const canQuery =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !viewPermissionQuery.isLoading &&
    viewPermissionQuery.hasPermission;
  const canManage = !managePermissionQuery.isLoading && managePermissionQuery.hasPermission;

  const agentsQuery = useEdgeAgents(currentCompanyId, currentBranchId, {}, canQuery);
  const issueEnrollmentMutation = useIssueEdgeAgentEnrollment(
    currentCompanyId,
    currentBranchId,
    pendingAgentId,
  );

  const openAgent = (edgeAgentId) => navigate(edgeAgentDetailsPath(edgeAgentId));

  const handleAgentCreated = async (agent) => {
    setShowCreateDialog(false);
    setPendingAgentId(agent.edgeAgentId);
    try {
      const result = await issueEnrollmentMutation.mutateAsync();
      setEnrollment(result);
    } catch (error) {
      toast.error(error?.message || t("devices.error.generic"));
    }
  };

  return (
    <AppLayout activePath={ROUTES.EDGE_AGENTS}>
      <main className="space-y-4" dir="rtl">
        <header className="rounded-2xl border border-white/10 bg-[#0c1424]/85 p-4 shadow-xl shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Cpu size={16} className="text-blue-300" />
                {t("nav.edgeAgents")}
              </div>
              <h1 className="mt-1 text-2xl font-black text-white">{t("devices.agents.title")}</h1>
              <p className="mt-0.5 text-[11px] text-slate-500">{t("devices.agents.subtitle")}</p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:brightness-110"
              >
                <Plus size={14} />
                {t("devices.agent.new")}
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
          <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
            {agentsQuery.isLoading && <LoadingState label={t("devices.loading")} />}
            {agentsQuery.isError && (
              <ErrorState
                title={t("devices.error.title")}
                message={agentsQuery.error?.message || t("devices.error.message")}
              />
            )}
            {!agentsQuery.isLoading && !agentsQuery.isError && (agentsQuery.data || []).length === 0 && (
              <EmptyState title={t("devices.agents.empty.title")} message={t("devices.agents.empty.message")} />
            )}
            {!agentsQuery.isLoading && !agentsQuery.isError && (agentsQuery.data || []).length > 0 && (
              <div className="space-y-2">
                {(agentsQuery.data || []).map((agent) => (
                  <button
                    key={agent.edgeAgentId}
                    type="button"
                    onClick={() => openAgent(agent.edgeAgentId)}
                    className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0d1728] p-3 text-start transition hover:border-blue-400/40"
                  >
                    <div className="flex items-center gap-2">
                      <EdgeAgentPulseIndicator health={agent.healthStatus} />
                      <div>
                        <div className="text-sm font-black text-white">{agent.code}</div>
                        <div className="text-[11px] text-slate-500">{agent.name}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <EdgeAgentStatusBadge status={agent.status} />
                      <EdgeAgentHealthBadge health={agent.healthStatus} />
                      <span className="text-[11px] text-slate-500">
                        {agent.lastHeartbeatAtUtc
                          ? formatDateTime(agent.lastHeartbeatAtUtc)
                          : t("devices.agents.neverHeartbeat")}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {showCreateDialog && currentCompanyId && currentBranchId && (
          <EdgeAgentFormDialog
            companyId={currentCompanyId}
            branchId={currentBranchId}
            onClose={() => setShowCreateDialog(false)}
            onSuccess={handleAgentCreated}
          />
        )}

        {issueEnrollmentMutation.isPending && !enrollment && (
          <div className="fixed inset-0 z-[100] grid place-items-center bg-[#030713]/75 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <KeyRound size={16} className="animate-pulse text-blue-300" />
              {t("devices.enrollment.issuing")}
            </div>
          </div>
        )}

        {enrollment && (
          <EnrollmentCredentialDialog enrollment={enrollment} onClose={() => setEnrollment(null)} />
        )}
      </main>
    </AppLayout>
  );
}
