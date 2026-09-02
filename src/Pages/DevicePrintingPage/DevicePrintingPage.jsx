import { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { formatDateTime } from "../../shared/utils/formatters";
import { useI18n } from "../../i18n/I18nContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import { useDevices } from "../../features/devices/hooks/useDevices";
import { usePrintJobs } from "../../features/devices/hooks/usePrintJobs";
import { PrintJobStatusBadge } from "../../features/devices/components/PrintJobStatusBadge";
import { PrintJobErrorMessage } from "../../features/devices/components/PrintJobErrorMessage";
import { DevicesModal } from "../../features/devices/components/DevicesModal";
import { ROUTES } from "../../utils/routes";

const DEVICES_VIEW_PERMISSION = "Devices.View";
const STATUS_OPTIONS = ["Queued", "Claimed", "Printing", "Succeeded", "Failed"];
const DOCUMENT_TYPE_OPTIONS = ["TestPrint"];

function PrintJobDetailsDialog({ printJob, onClose, t }) {
  return (
    <DevicesModal title={t("printing.details.title")} onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
            <div className="text-slate-500">{t("printing.job.device")}</div>
            <div className="mt-1 font-semibold text-slate-200">{printJob.deviceCode} — {printJob.deviceName}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
            <div className="text-slate-500">{t("printing.job.edgeAgent")}</div>
            <div className="mt-1 font-semibold text-slate-200">
              {printJob.edgeAgentCode ? `${printJob.edgeAgentCode} — ${printJob.edgeAgentName}` : "—"}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
            <div className="text-slate-500">{t("printing.job.status")}</div>
            <div className="mt-1"><PrintJobStatusBadge status={printJob.status} /></div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
            <div className="text-slate-500">{t("printing.job.attemptCount")}</div>
            <div className="mt-1 font-semibold text-slate-200">{printJob.attemptCount}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
            <div className="text-slate-500">{t("printing.job.createdAt")}</div>
            <div className="mt-1 font-semibold text-slate-200">{formatDateTime(printJob.createdAtUtc)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
            <div className="text-slate-500">{t("printing.job.claimedAt")}</div>
            <div className="mt-1 font-semibold text-slate-200">
              {printJob.claimedAtUtc ? formatDateTime(printJob.claimedAtUtc) : "—"}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
            <div className="text-slate-500">{t("printing.job.startedAt")}</div>
            <div className="mt-1 font-semibold text-slate-200">
              {printJob.startedAtUtc ? formatDateTime(printJob.startedAtUtc) : "—"}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
            <div className="text-slate-500">{t("printing.job.completedAt")}</div>
            <div className="mt-1 font-semibold text-slate-200">
              {printJob.completedAtUtc ? formatDateTime(printJob.completedAtUtc) : "—"}
            </div>
          </div>
        </div>
        {printJob.status === "Failed" && <PrintJobErrorMessage printJob={printJob} />}
      </div>
    </DevicesModal>
  );
}

export default function DevicePrintingPage() {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();

  const [deviceId, setDeviceId] = useState("");
  const [status, setStatus] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);

  const viewPermissionQuery = useHasPermission(currentCompanyId, DEVICES_VIEW_PERMISSION);
  const canQuery =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !viewPermissionQuery.isLoading &&
    viewPermissionQuery.hasPermission;

  const devicesQuery = useDevices(currentCompanyId, currentBranchId, {}, canQuery);
  const filters = useMemo(() => ({ deviceId, status, documentType }), [deviceId, status, documentType]);
  const printJobsQuery = usePrintJobs(currentCompanyId, currentBranchId, filters, canQuery);
  const jobs = printJobsQuery.data || [];

  return (
    <AppLayout activePath={ROUTES.DEVICE_PRINTING}>
      <main className="space-y-4" dir="rtl">
        <header className="rounded-2xl border border-white/10 bg-[#0c1424]/85 p-4 shadow-xl shadow-black/20">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Printer size={16} className="text-blue-300" />
            {t("nav.devicePrinting")}
          </div>
          <h1 className="mt-1 text-2xl font-black text-white">{t("printing.title")}</h1>
          <p className="mt-0.5 text-[11px] text-slate-500">{t("printing.subtitle")}</p>
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
            <section className="grid gap-2 rounded-2xl border border-white/10 bg-[#0c1424] p-3 md:grid-cols-4">
              <label className="text-[11px] font-semibold text-slate-400">
                {t("printing.job.device")}
                <select
                  value={deviceId}
                  onChange={(event) => setDeviceId(event.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                >
                  <option value="">{t("devices.filters.all")}</option>
                  {(devicesQuery.data || []).map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.code} — {device.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] font-semibold text-slate-400">
                {t("printing.job.status")}
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                >
                  <option value="">{t("devices.filters.all")}</option>
                  {STATUS_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {t(`printing.enum.status.${value.toLowerCase()}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] font-semibold text-slate-400">
                {t("printing.job.documentType")}
                <select
                  value={documentType}
                  onChange={(event) => setDocumentType(event.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                >
                  <option value="">{t("devices.filters.all")}</option>
                  {DOCUMENT_TYPE_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {t("printing.documentType.testPrint")}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => {
                  setDeviceId("");
                  setStatus("");
                  setDocumentType("");
                }}
                className="mt-auto h-10 rounded-xl border border-white/10 bg-white/[0.035] px-3 text-xs font-bold text-slate-200"
              >
                {t("devices.filters.reset")}
              </button>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
              {printJobsQuery.isLoading && <LoadingState label={t("devices.loading")} />}
              {printJobsQuery.isError && (
                <ErrorState
                  title={t("devices.error.title")}
                  message={printJobsQuery.error?.message || t("devices.error.message")}
                />
              )}
              {!printJobsQuery.isLoading && !printJobsQuery.isError && jobs.length === 0 && (
                <EmptyState title={t("printing.list.empty.title")} message={t("printing.list.empty.message")} />
              )}
              {!printJobsQuery.isLoading && !printJobsQuery.isError && jobs.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-start text-slate-500">
                        <th className="pb-2 text-start font-medium">{t("printing.job.device")}</th>
                        <th className="pb-2 text-start font-medium">{t("printing.job.documentType")}</th>
                        <th className="pb-2 text-start font-medium">{t("printing.job.status")}</th>
                        <th className="pb-2 text-start font-medium">{t("printing.job.createdAt")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr
                          key={job.printJobId}
                          onClick={() => setSelectedJob(job)}
                          className="cursor-pointer border-t border-white/5 hover:bg-white/[0.03]"
                        >
                          <td className="py-2.5 font-bold text-white">{job.deviceCode}</td>
                          <td className="py-2.5 text-slate-300">{job.documentType}</td>
                          <td className="py-2.5">
                            <PrintJobStatusBadge status={job.status} />
                          </td>
                          <td className="py-2.5 text-slate-300">{formatDateTime(job.createdAtUtc)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {selectedJob && (
          <PrintJobDetailsDialog printJob={selectedJob} onClose={() => setSelectedJob(null)} t={t} />
        )}
      </main>
    </AppLayout>
  );
}
