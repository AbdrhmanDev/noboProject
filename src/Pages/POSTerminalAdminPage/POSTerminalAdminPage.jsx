import { useMemo, useState } from "react";
import {
  CircleCheck,
  CirclePause,
  Clock3,
  Monitor,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from "../../shared/components/ui";
import { formatDateTime } from "../../shared/utils/formatters";
import { useI18n } from "../../i18n/I18nContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import {
  useCreatePosTerminal,
  usePosTerminalDetails,
  usePosTerminals,
  useUpdatePosTerminal,
} from "../../features/pos/hooks/usePosTerminals";
import {
  POS_CONFIGURE_PERMISSION,
  POS_VIEW_PERMISSION,
} from "../../features/authorization/constants/applicationPermissions";

const EMPTY_FORM = {
  code: "",
  name: "",
  status: "Active",
};

function statusTone(status) {
  return status === "Active" ? "success" : "warning";
}

function statusLabel(status, t) {
  return status === "Active" ? t("posTerminalAdmin.common.active") : t("posTerminalAdmin.common.suspended");
}

function getErrorMessage(error, t) {
  return error?.message || t("posTerminalAdmin.common.requestFailed");
}

function formatAmount(value) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function TerminalCard({ terminal, selected, onSelect }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-3 text-start transition hover:border-blue-400/40 hover:bg-blue-500/10 ${
        selected ? "border-blue-400/60 bg-blue-500/15" : "border-white/10 bg-[#0d1728]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Monitor size={15} className="shrink-0 text-blue-300" />
            <div className="truncate text-sm font-black text-white">{terminal.code}</div>
          </div>
          <div className="mt-1 truncate text-xs text-slate-400">{terminal.name}</div>
        </div>
        <StatusBadge tone={statusTone(terminal.status)}>{statusLabel(terminal.status, t)}</StatusBadge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg bg-white/[0.03] p-2">
          <div className="text-slate-500">{t("posTerminalAdmin.card.created")}</div>
          <div className="mt-1 font-semibold text-slate-200">
            {formatDateTime(terminal.createdAtUtc)}
          </div>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-2">
          <div className="text-slate-500">{t("posTerminalAdmin.card.openShift")}</div>
          <div className="mt-1 font-semibold text-slate-200">
            {terminal.openShift ? t("posTerminalAdmin.common.yes") : t("posTerminalAdmin.common.no")}
          </div>
        </div>
      </div>
    </button>
  );
}

function OpenShiftNotice({ openShift }) {
  const { t } = useI18n();
  if (!openShift) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3 text-xs text-slate-400">
        {t("posTerminalAdmin.openShift.none")}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-3">
      <div className="flex items-center gap-2 text-xs font-bold text-amber-100">
        <Clock3 size={15} className="text-amber-300" />
        {t("posTerminalAdmin.openShift.active")}
      </div>
      <div className="mt-2 grid gap-2 text-[11px] text-slate-300 sm:grid-cols-3">
        <div>
          <div className="text-slate-500">{t("posTerminalAdmin.openShift.opened")}</div>
          <div className="font-semibold">{formatDateTime(openShift.openedAtUtc)}</div>
        </div>
        <div>
          <div className="text-slate-500">{t("posTerminalAdmin.openShift.openingFloat")}</div>
          <div className="font-semibold">{formatAmount(openShift.openingFloatAmount)}</div>
        </div>
        <div>
          <div className="text-slate-500">{t("posTerminalAdmin.openShift.expectedCash")}</div>
          <div className="font-semibold">{formatAmount(openShift.expectedCashAmount)}</div>
        </div>
      </div>
    </div>
  );
}

function TerminalForm({
  mode,
  form,
  setForm,
  canConfigure,
  isPending,
  onSubmit,
  onStatusChange,
  selectedTerminal,
}) {
  const { t } = useI18n();
  const isEdit = mode === "edit";
  const nextStatus = form.status === "Active" ? "Suspended" : "Active";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-400">
          {t("posTerminalAdmin.field.code")}
          <input
            value={form.code}
            onChange={(event) => setForm((draft) => ({ ...draft, code: event.target.value }))}
            maxLength={50}
            disabled={!canConfigure || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
        <label className="text-xs font-semibold text-slate-400">
          {t("posTerminalAdmin.field.name")}
          <input
            value={form.name}
            onChange={(event) => setForm((draft) => ({ ...draft, name: event.target.value }))}
            maxLength={200}
            disabled={!canConfigure || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
      </div>
      {isEdit && (
        <label className="block text-xs font-semibold text-slate-400">
          {t("posTerminalAdmin.field.status")}
          <select
            value={form.status}
            onChange={(event) =>
              setForm((draft) => ({ ...draft, status: event.target.value }))
            }
            disabled={!canConfigure || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          >
            <option value="Active">{t("posTerminalAdmin.common.active")}</option>
            <option value="Suspended">{t("posTerminalAdmin.common.suspended")}</option>
          </select>
        </label>
      )}
      {!canConfigure && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {t("posTerminalAdmin.notice.configurePermissionRequired")}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!canConfigure || isPending}
          className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isEdit ? <Pencil size={15} /> : <Plus size={15} />}
          {isPending
            ? t("posTerminalAdmin.common.saving")
            : isEdit
              ? t("posTerminalAdmin.action.saveTerminal")
              : t("posTerminalAdmin.action.createTerminal")}
        </button>
        {isEdit && selectedTerminal && (
          <button
            type="button"
            disabled={!canConfigure || isPending}
            onClick={() => onStatusChange(nextStatus)}
            className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-xs font-bold text-slate-100 transition hover:border-blue-400/40 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {nextStatus === "Active" ? <CircleCheck size={15} /> : <CirclePause size={15} />}
            {nextStatus === "Active" ? t("posTerminalAdmin.common.activate") : t("posTerminalAdmin.common.suspend")}
          </button>
        )}
      </div>
    </form>
  );
}

export default function POSTerminalAdminPage() {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const [selectedTerminalId, setSelectedTerminalId] = useState(null);
  const [mode, setMode] = useState("create");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [notice, setNotice] = useState("");

  const viewPermissionQuery = useHasPermission(currentCompanyId, POS_VIEW_PERMISSION);
  const configurePermissionQuery = useHasPermission(
    currentCompanyId,
    POS_CONFIGURE_PERMISSION,
  );
  const filters = useMemo(
    () => ({
      status: statusFilter,
      search: search.trim() || undefined,
    }),
    [search, statusFilter],
  );
  const canRead =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !viewPermissionQuery.isLoading &&
    viewPermissionQuery.hasPermission;
  const terminalsQuery = usePosTerminals(
    currentCompanyId,
    currentBranchId,
    canRead,
    filters,
  );
  const detailsQuery = usePosTerminalDetails(
    currentCompanyId,
    currentBranchId,
    selectedTerminalId,
    canRead && Boolean(selectedTerminalId),
  );
  const createMutation = useCreatePosTerminal(currentCompanyId, currentBranchId);
  const updateMutation = useUpdatePosTerminal(
    currentCompanyId,
    currentBranchId,
    selectedTerminalId,
  );
  const canConfigure =
    !configurePermissionQuery.isLoading && configurePermissionQuery.hasPermission;
  const selectedTerminal = detailsQuery.data || null;
  const isMutating = createMutation.isPending || updateMutation.isPending;

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const startCreate = () => {
    setMode("create");
    setSelectedTerminalId(null);
    setForm(EMPTY_FORM);
  };

  const selectTerminal = (terminal) => {
    setMode("edit");
    setSelectedTerminalId(terminal.posTerminalId);
    setForm({
      code: terminal.code,
      name: terminal.name,
      status: terminal.status,
    });
  };

  const submitCreate = async () => {
    try {
      const terminal = await createMutation.mutateAsync({
        code: form.code,
        name: form.name,
      });
      setMode("edit");
      setSelectedTerminalId(terminal.posTerminalId);
      setForm({
        code: terminal.code,
        name: terminal.name,
        status: terminal.status,
      });
      showNotice(t("posTerminalAdmin.notice.terminalCreated"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  const submitUpdate = async (status = form.status) => {
    if (!selectedTerminalId) return;

    try {
      await updateMutation.mutateAsync({
        code: form.code,
        name: form.name,
        status,
      });
      setForm((draft) => ({ ...draft, status }));
      showNotice(t("posTerminalAdmin.notice.terminalUpdated"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  const submitForm = () => {
    if (mode === "create") {
      submitCreate();
      return;
    }

    submitUpdate();
  };

  return (
    <AppLayout>
      <main className="space-y-4" dir="rtl">
        <PageHeader
          title={t("posTerminalAdmin.pageTitle")}
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => terminalsQuery.refetch()}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
              >
                <RefreshCw size={14} />
                {t("posTerminalAdmin.refresh")}
              </button>
              <button
                type="button"
                onClick={startCreate}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white"
              >
                <Plus size={14} />
                {t("posTerminalAdmin.action.newTerminal")}
              </button>
            </div>
          }
        />

        {notice && (
          <div className="rounded-xl border border-blue-400/25 bg-blue-500/10 px-3 py-2 text-xs text-blue-100">
            {notice}
          </div>
        )}

        {!currentCompanyId || !currentBranchId ? (
          <EmptyState
            title={t("posTerminalAdmin.gate.companyRequired.title")}
            message={t("posTerminalAdmin.gate.companyRequired.message")}
          />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label={t("posTerminalAdmin.gate.checkingPermissions")} />
        ) : !viewPermissionQuery.hasPermission ? (
          <ErrorState
            title={t("posTerminalAdmin.gate.permissionRequired.title")}
            message={t("posTerminalAdmin.gate.permissionRequired.message")}
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
              <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_140px]">
                <label className="relative block">
                  <Search
                    size={15}
                    className="pointer-events-none absolute right-3 top-3 text-slate-500"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    maxLength={200}
                    className="h-10 w-full rounded-xl border border-white/10 bg-black/20 pr-9 pl-3 text-xs text-white outline-none focus:border-blue-400/60"
                    placeholder={t("posTerminalAdmin.field.searchCodeOrName")}
                  />
                </label>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-blue-400/60"
                >
                  <option value="">{t("posTerminalAdmin.common.all")}</option>
                  <option value="Active">{t("posTerminalAdmin.common.active")}</option>
                  <option value="Suspended">{t("posTerminalAdmin.common.suspended")}</option>
                </select>
              </div>

              {terminalsQuery.isLoading && <LoadingState label={t("posTerminalAdmin.loadingTerminals")} />}
              {terminalsQuery.isError && (
                <ErrorState
                  title={t("posTerminalAdmin.loadTerminalsError")}
                  message={getErrorMessage(terminalsQuery.error, t)}
                />
              )}
              {!terminalsQuery.isLoading &&
                !terminalsQuery.isError &&
                terminalsQuery.data?.length === 0 && (
                  <EmptyState
                    title={t("posTerminalAdmin.emptyTerminals.title")}
                    message={t("posTerminalAdmin.emptyTerminals.message")}
                  />
                )}
              {!terminalsQuery.isLoading &&
                !terminalsQuery.isError &&
                Boolean(terminalsQuery.data?.length) && (
                  <div className="max-h-[calc(100vh-330px)] min-h-[360px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                    {terminalsQuery.data.map((terminal) => (
                      <TerminalCard
                        key={terminal.posTerminalId}
                        terminal={terminal}
                        selected={selectedTerminalId === terminal.posTerminalId}
                        onSelect={() => selectTerminal(terminal)}
                      />
                    ))}
                  </div>
                )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Power size={15} className="text-blue-300" />
                    {mode === "create"
                      ? t("posTerminalAdmin.terminalDetails.createLabel")
                      : t("posTerminalAdmin.terminalDetails.detailsLabel")}
                  </div>
                  <h2 className="mt-1 text-xl font-black text-white">
                    {mode === "create"
                      ? t("posTerminalAdmin.terminalDetails.newTerminalTitle")
                      : selectedTerminal?.code || t("posTerminalAdmin.terminalDetails.loadingTerminalTitle")}
                  </h2>
                </div>
                {selectedTerminal && (
                  <StatusBadge tone={statusTone(selectedTerminal.status)}>
                    {statusLabel(selectedTerminal.status, t)}
                  </StatusBadge>
                )}
              </div>

              {mode === "edit" && detailsQuery.isLoading && (
                <LoadingState label={t("posTerminalAdmin.loadingTerminalDetails")} />
              )}
              {mode === "edit" && detailsQuery.isError && (
                <ErrorState
                  title={t("posTerminalAdmin.loadTerminalDetailsError")}
                  message={getErrorMessage(detailsQuery.error, t)}
                />
              )}
              {(mode === "create" || selectedTerminal) && (
                <div className="space-y-4">
                  {selectedTerminal && (
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                        <div className="text-[11px] text-slate-500">{t("posTerminalAdmin.field.name")}</div>
                        <div className="mt-1 text-sm font-black text-white">
                          {selectedTerminal.name}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                        <div className="text-[11px] text-slate-500">{t("posTerminalAdmin.card.created")}</div>
                        <div className="mt-1 text-sm font-black text-white">
                          {formatDateTime(selectedTerminal.createdAtUtc)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                        <div className="text-[11px] text-slate-500">{t("posTerminalAdmin.card.openShift")}</div>
                        <div className="mt-1 text-sm font-black text-white">
                          {selectedTerminal.openShift
                            ? t("posTerminalAdmin.common.active")
                            : t("posTerminalAdmin.common.none")}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTerminal && (
                    <OpenShiftNotice openShift={selectedTerminal.openShift} />
                  )}

                  <TerminalForm
                    mode={mode}
                    form={form}
                    setForm={setForm}
                    canConfigure={canConfigure}
                    isPending={isMutating}
                    onSubmit={submitForm}
                    onStatusChange={submitUpdate}
                    selectedTerminal={selectedTerminal}
                  />
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
