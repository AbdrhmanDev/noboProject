import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, HardDrive, Pencil, Power } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { formatDateTime } from "../../shared/utils/formatters";
import { useI18n } from "../../i18n/I18nContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import {
  useDeviceDetails,
  useDeviceHardwareBinding,
  useUpdateDeviceStatus,
} from "../../features/devices/hooks/useDevices";
import { useEdgeAgentDetails } from "../../features/devices/hooks/useEdgeAgents";
import { usePrintJobs } from "../../features/devices/hooks/usePrintJobs";
import { DeviceHealthBadge, DeviceStatusBadge, CertificationBadge } from "../../features/devices/components/DeviceStatusBadge";
import { PrintJobStatusBadge } from "../../features/devices/components/PrintJobStatusBadge";
import { DeviceReadinessChecklist } from "../../features/devices/components/DeviceReadinessChecklist";
import { TestPrintPanel } from "../../features/devices/components/TestPrintPanel";
import { DeviceFormDialog } from "../../features/devices/components/DeviceFormDialog";
import { DeviceConfirmActionDialog } from "../../features/devices/components/DeviceConfirmActionDialog";
import { ROUTES, edgeAgentDetailsPath } from "../../utils/routes";

const DEVICES_VIEW_PERMISSION = "Devices.View";
const DEVICES_MANAGE_PERMISSION = "Devices.Manage";

function lowerFirst(value) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-black text-white">{value ?? "—"}</div>
    </div>
  );
}

export default function DeviceDetailsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { deviceId } = useParams();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);

  const viewPermissionQuery = useHasPermission(currentCompanyId, DEVICES_VIEW_PERMISSION);
  const managePermissionQuery = useHasPermission(currentCompanyId, DEVICES_MANAGE_PERMISSION);
  const canQuery =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !viewPermissionQuery.isLoading &&
    viewPermissionQuery.hasPermission;
  const canManage = !managePermissionQuery.isLoading && managePermissionQuery.hasPermission;

  const deviceQuery = useDeviceDetails(currentCompanyId, currentBranchId, deviceId, canQuery);
  const device = deviceQuery.data;

  const hardwareBindingQuery = useDeviceHardwareBinding(
    currentCompanyId,
    currentBranchId,
    deviceId,
    canQuery,
  );

  const edgeAgentQuery = useEdgeAgentDetails(
    currentCompanyId,
    currentBranchId,
    device?.edgeAgentId,
    canQuery && Boolean(device?.edgeAgentId),
  );

  const printJobsFilters = useMemo(() => ({ deviceId }), [deviceId]);
  const printJobsQuery = usePrintJobs(currentCompanyId, currentBranchId, printJobsFilters, canQuery);

  const updateStatusMutation = useUpdateDeviceStatus(currentCompanyId, currentBranchId, deviceId);
  const nextStatus = device?.status === "Active" ? "Inactive" : "Active";

  const confirmStatusChange = async () => {
    try {
      await updateStatusMutation.mutateAsync({ status: nextStatus });
      setShowStatusConfirm(false);
    } catch {
      setShowStatusConfirm(false);
    }
  };

  return (
    <AppLayout activePath={ROUTES.DEVICES_LIST}>
      <main className="space-y-4" dir="rtl">
        <header className="rounded-2xl border border-white/10 bg-[#0c1424]/85 p-4 shadow-xl shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => navigate(ROUTES.DEVICES_LIST)}
                className="mt-1 rounded-lg border border-white/10 bg-white/[0.035] p-2 text-slate-300 hover:bg-white/10"
              >
                <ArrowRight size={16} />
              </button>
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <HardDrive size={16} className="text-blue-300" />
                  {t("nav.devicesList")}
                </div>
                <h1 className="mt-1 text-2xl font-black text-white">
                  {device ? device.code : t("devices.details.loadingTitle")}
                </h1>
                {device && <p className="mt-0.5 text-[11px] text-slate-500">{device.name}</p>}
              </div>
            </div>
            {device && (
              <div className="flex flex-wrap items-center gap-2">
                <DeviceStatusBadge status={device.status} />
                {canManage && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowEditDialog(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100 hover:bg-white/10"
                    >
                      <Pencil size={13} />
                      {t("devices.actions.edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowStatusConfirm(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100 hover:bg-white/10"
                    >
                      <Power size={13} />
                      {nextStatus === "Active" ? t("devices.actions.activate") : t("devices.actions.deactivate")}
                    </button>
                  </>
                )}
              </div>
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
        ) : deviceQuery.isLoading ? (
          <LoadingState label={t("devices.loading")} />
        ) : deviceQuery.isError ? (
          <ErrorState
            title={t("devices.error.title")}
            message={deviceQuery.error?.message || t("devices.error.message")}
          />
        ) : device ? (
          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
                <div className="mb-3 text-sm font-black text-white">{t("devices.details.identity")}</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <InfoTile label={t("devices.device.code")} value={device.code} />
                  <InfoTile label={t("devices.device.name")} value={device.name} />
                  <InfoTile
                    label={t("devices.device.deviceType")}
                    value={t(`devices.enum.deviceType.${lowerFirst(device.deviceType)}`)}
                  />
                  <InfoTile label={t("devices.device.manufacturer")} value={device.manufacturer} />
                  <InfoTile label={t("devices.device.model")} value={device.model} />
                  <InfoTile label={t("devices.device.serialNumber")} value={device.serialNumber} />
                  <InfoTile label={t("devices.device.firmwareVersion")} value={device.firmwareVersion} />
                  <InfoTile label={t("devices.details.created")} value={formatDateTime(device.createdAtUtc)} />
                  <InfoTile label={t("devices.details.updated")} value={formatDateTime(device.updatedAtUtc)} />
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
                <div className="mb-3 text-sm font-black text-white">{t("devices.details.assignment")}</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <InfoTile label={t("devices.device.posTerminal")} value={device.posTerminalId || t("devices.device.none")} />
                  <InfoTile label={t("devices.device.kitchenStation")} value={device.kitchenStationId || t("devices.device.none")} />
                  <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                    <div className="text-[11px] text-slate-500">{t("devices.device.edgeAgent")}</div>
                    {device.edgeAgentId ? (
                      <button
                        type="button"
                        onClick={() => navigate(edgeAgentDetailsPath(device.edgeAgentId))}
                        className="mt-1 text-sm font-black text-blue-300 hover:underline"
                      >
                        {edgeAgentQuery.data?.code || device.edgeAgentId}
                      </button>
                    ) : (
                      <div className="mt-1 text-sm font-black text-white">{t("devices.device.none")}</div>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
                <div className="mb-3 text-sm font-black text-white">{t("devices.details.hardwareBinding")}</div>
                {hardwareBindingQuery.isLoading ? (
                  <LoadingState label={t("devices.loading")} />
                ) : hardwareBindingQuery.data ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <InfoTile
                      label={t("devices.discovery.transportType")}
                      value={t(
                        `devices.enum.transportType.${lowerFirst(hardwareBindingQuery.data.transportType)}`,
                      )}
                    />
                    {hardwareBindingQuery.data.networkAddress && (
                      <InfoTile
                        label={t("devices.discovery.address")}
                        value={`${hardwareBindingQuery.data.networkAddress}${
                          hardwareBindingQuery.data.networkPort ? `:${hardwareBindingQuery.data.networkPort}` : ""
                        }`}
                      />
                    )}
                    {hardwareBindingQuery.data.comPort && (
                      <InfoTile label={t("devices.discovery.comPort")} value={hardwareBindingQuery.data.comPort} />
                    )}
                    {hardwareBindingQuery.data.usbSerialNumber && (
                      <InfoTile
                        label={t("devices.discovery.serialNumber")}
                        value={hardwareBindingQuery.data.usbSerialNumber}
                      />
                    )}
                    {hardwareBindingQuery.data.bluetoothIdentifier && (
                      <InfoTile
                        label={t("devices.details.bluetoothIdentifier")}
                        value={hardwareBindingQuery.data.bluetoothIdentifier}
                      />
                    )}
                    <InfoTile
                      label={t("devices.details.confirmedAt")}
                      value={formatDateTime(hardwareBindingQuery.data.confirmedAtUtc)}
                    />
                  </div>
                ) : (
                  <EmptyState
                    title={t("devices.details.noBindingTitle")}
                    message={t("devices.details.noBindingMessage")}
                  />
                )}
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
                <div className="mb-3 text-sm font-black text-white">{t("devices.details.connectivity")}</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <InfoTile
                    label={t("devices.device.connectionType")}
                    value={t(`devices.enum.connectionType.${lowerFirst(device.connectionType)}`)}
                  />
                  <InfoTile label={t("devices.details.lastSeen")} value={device.lastSeenAtUtc ? formatDateTime(device.lastSeenAtUtc) : "—"} />
                  <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                    <div className="text-[11px] text-slate-500">{t("devices.filters.health")}</div>
                    <div className="mt-1">
                      <DeviceHealthBadge health={device.healthStatus} />
                    </div>
                  </div>
                </div>
                {device.lastHealthMessage && (
                  <p className="mt-2 text-[11px] text-slate-500">{device.lastHealthMessage}</p>
                )}
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
                <div className="mb-3 text-sm font-black text-white">{t("devices.details.certification")}</div>
                <CertificationBadge certification={device.certificationStatus} />
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
                <div className="mb-3 text-sm font-black text-white">{t("devices.details.printHistory")}</div>
                {printJobsQuery.isLoading && <LoadingState label={t("devices.loading")} />}
                {!printJobsQuery.isLoading && (printJobsQuery.data || []).length === 0 && (
                  <EmptyState
                    title={t("printing.list.empty.title")}
                    message={t("printing.list.empty.message")}
                  />
                )}
                {!printJobsQuery.isLoading && (printJobsQuery.data || []).length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-start text-slate-500">
                          <th className="pb-2 text-start font-medium">{t("printing.job.documentType")}</th>
                          <th className="pb-2 text-start font-medium">{t("printing.job.status")}</th>
                          <th className="pb-2 text-start font-medium">{t("printing.job.createdAt")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(printJobsQuery.data || []).map((job) => (
                          <tr key={job.printJobId} className="border-t border-white/5">
                            <td className="py-2 text-slate-200">{job.documentType}</td>
                            <td className="py-2">
                              <PrintJobStatusBadge status={job.status} />
                            </td>
                            <td className="py-2 text-slate-300">{formatDateTime(job.createdAtUtc)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-4">
              <section>
                <div className="mb-2 text-sm font-black text-white">{t("devices.details.readiness")}</div>
                <DeviceReadinessChecklist
                  device={device}
                  hardwareBinding={hardwareBindingQuery.data}
                  edgeAgent={edgeAgentQuery.data}
                />
              </section>
              <TestPrintPanel
                companyId={currentCompanyId}
                branchId={currentBranchId}
                device={device}
                hardwareBinding={hardwareBindingQuery.data}
                edgeAgent={edgeAgentQuery.data}
                canManage={canManage}
              />
            </div>
          </div>
        ) : null}

        {showEditDialog && device && currentCompanyId && currentBranchId && (
          <DeviceFormDialog
            companyId={currentCompanyId}
            branchId={currentBranchId}
            device={device}
            onClose={() => setShowEditDialog(false)}
            onSuccess={() => setShowEditDialog(false)}
          />
        )}

        {showStatusConfirm && device && (
          <DeviceConfirmActionDialog
            title={nextStatus === "Active" ? t("devices.actions.activate") : t("devices.actions.deactivate")}
            message={
              nextStatus === "Active"
                ? t("devices.details.confirmActivate")
                : t("devices.details.confirmDeactivate")
            }
            confirmLabel={nextStatus === "Active" ? t("devices.actions.activate") : t("devices.actions.deactivate")}
            tone={nextStatus === "Active" ? "primary" : "danger"}
            isPending={updateStatusMutation.isPending}
            onConfirm={confirmStatusChange}
            onClose={() => setShowStatusConfirm(false)}
          />
        )}
      </main>
    </AppLayout>
  );
}
