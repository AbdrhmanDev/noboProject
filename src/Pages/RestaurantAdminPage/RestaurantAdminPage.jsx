import { useMemo, useState } from "react";
import {
  Armchair,
  CircleCheck,
  CirclePause,
  Layers3,
  LayoutGrid,
  Pencil,
  Plus,
  Power,
  RefreshCw,
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
  useChangeRestaurantFloorStatus,
  useChangeRestaurantTableStatus,
  useCreateRestaurantFloor,
  useCreateRestaurantTable,
  useRestaurantFloorDetails,
  useRestaurantFloors,
  useRestaurantTableDetails,
  useRestaurantTables,
  useUpdateRestaurantFloor,
  useUpdateRestaurantTable,
} from "../../features/restaurant/hooks/useRestaurantSeating";

const RESTAURANT_VIEW_PERMISSION = "Restaurant.View";
const RESTAURANT_MANAGE_PERMISSION = "Restaurant.Manage";
const EMPTY_FLOOR_FORM = { name: "", sortOrder: "0" };
const EMPTY_TABLE_FORM = { code: "", name: "", sortOrder: "0" };

function getErrorMessage(error, t) {
  return error?.message || t("restaurantAdmin.common.requestFailed");
}

function statusTone(status) {
  return status === "Active" ? "success" : "warning";
}

function statusLabel(status, t) {
  return status === "Active" ? t("restaurantAdmin.common.active") : t("restaurantAdmin.common.suspended");
}

function parseSortOrder(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

const BULK_TABLE_PREFIX = "T-";
const BULK_TABLE_DEFAULT_COUNT = 20;
const BULK_TABLE_MAX_COUNT = 100;

// Fills the selected floor up to N numbered tables (T-1 ... T-N) in one action. Only the codes
// that don't exist on the floor yet are created -- existing tables are never touched -- each one
// through the same create-table call the single-table form uses, one at a time, stopping at the
// first failure. sortOrder = the table's number, so the floor shows them in order.
function BulkCreateTables({ existingTables, createTable, disabled, onDone }) {
  const { t } = useI18n();
  const [count, setCount] = useState(String(BULK_TABLE_DEFAULT_COUNT));
  const [progress, setProgress] = useState(null);

  const target = Number(count);
  const isValidTarget = Number.isInteger(target) && target >= 1 && target <= BULK_TABLE_MAX_COUNT;
  const existingCodes = new Set(existingTables.map((table) => table.code.trim().toUpperCase()));
  const missingNumbers = isValidTarget
    ? Array.from({ length: target }, (_, index) => index + 1).filter(
        (number) => !existingCodes.has(`${BULK_TABLE_PREFIX}${number}`.toUpperCase()),
      )
    : [];
  const isRunning = progress !== null;

  const run = async () => {
    if (!missingNumbers.length) return;
    const confirmed = window.confirm(
      t("restaurantAdmin.bulk.confirmCreate", {
        count: missingNumbers.length,
        first: `${BULK_TABLE_PREFIX}${missingNumbers[0]}`,
        last: `${BULK_TABLE_PREFIX}${missingNumbers[missingNumbers.length - 1]}`,
      }),
    );
    if (!confirmed) return;

    let created = 0;
    setProgress({ done: 0, total: missingNumbers.length });
    try {
      for (const number of missingNumbers) {
        await createTable({ code: `${BULK_TABLE_PREFIX}${number}`, name: null, sortOrder: number });
        created += 1;
        setProgress({ done: created, total: missingNumbers.length });
      }
      onDone(t("restaurantAdmin.bulk.createdNotice", { count: created }));
    } catch (error) {
      onDone(
        t("restaurantAdmin.bulk.partialStoppedNotice", {
          count: created,
          error: getErrorMessage(error, t),
        }),
      );
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="mb-4 rounded-xl border border-blue-400/20 bg-blue-500/[0.05] p-3">
      <div className="text-xs font-black text-white">{t("restaurantAdmin.bulk.heading")}</div>
      <p className="mt-1 text-[11px] leading-5 text-slate-400">
        {t("restaurantAdmin.bulk.description", { prefix: BULK_TABLE_PREFIX })}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-slate-300">
          {t("restaurantAdmin.bulk.upTo")}
          <input
            type="number"
            min={1}
            max={BULK_TABLE_MAX_COUNT}
            value={count}
            disabled={disabled || isRunning}
            onChange={(event) => setCount(event.target.value)}
            className="h-9 w-20 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-blue-400/60"
          />
          {t("restaurantAdmin.bulk.tablesSuffix")}
        </label>
        <button
          type="button"
          onClick={run}
          disabled={disabled || isRunning || missingNumbers.length === 0}
          className="flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={14} />
          {isRunning
            ? t("restaurantAdmin.bulk.creatingProgress", { done: progress.done, total: progress.total })
            : missingNumbers.length
              ? t("restaurantAdmin.bulk.createMissing", { count: missingNumbers.length })
              : isValidTarget
                ? t("restaurantAdmin.bulk.allExist")
                : t("restaurantAdmin.bulk.enterRange", { max: BULK_TABLE_MAX_COUNT })}
        </button>
      </div>
    </div>
  );
}

function FloorCard({ floor, selected, onSelect }) {
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
            <Layers3 size={15} className="shrink-0 text-blue-300" />
            <div className="truncate text-sm font-black text-white">{floor.name}</div>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {t("restaurantAdmin.floorCard.sortLine", { sort: floor.sortOrder })}
          </div>
        </div>
        <StatusBadge tone={statusTone(floor.status)}>{statusLabel(floor.status, t)}</StatusBadge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg bg-white/[0.03] p-2">
          <div className="text-slate-500">{t("restaurantAdmin.card.tables")}</div>
          <div className="mt-1 font-semibold text-slate-200">{floor.tableCount}</div>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-2">
          <div className="text-slate-500">{t("restaurantAdmin.card.created")}</div>
          <div className="mt-1 font-semibold text-slate-200">
            {formatDateTime(floor.createdAtUtc)}
          </div>
        </div>
      </div>
    </button>
  );
}

function TableCard({ table, selected, onSelect }) {
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
            <Armchair size={15} className="shrink-0 text-blue-300" />
            <div className="truncate text-sm font-black text-white">{table.code}</div>
          </div>
          <div className="mt-1 truncate text-xs text-slate-400">
            {table.name || t("restaurantAdmin.table.unnamed")}
          </div>
        </div>
        <StatusBadge tone={statusTone(table.status)}>{statusLabel(table.status, t)}</StatusBadge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg bg-white/[0.03] p-2">
          <div className="text-slate-500">{t("restaurantAdmin.card.sort")}</div>
          <div className="mt-1 font-semibold text-slate-200">{table.sortOrder}</div>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-2">
          <div className="text-slate-500">{t("restaurantAdmin.card.created")}</div>
          <div className="mt-1 font-semibold text-slate-200">
            {formatDateTime(table.createdAtUtc)}
          </div>
        </div>
      </div>
    </button>
  );
}

function FloorForm({
  mode,
  form,
  setForm,
  selectedFloor,
  canManage,
  isPending,
  onSubmit,
  onStatusChange,
}) {
  const { t } = useI18n();
  const nextStatus = selectedFloor?.status === "Active" ? "Suspended" : "Active";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
        <label className="text-xs font-semibold text-slate-400">
          {t("restaurantAdmin.field.floorName")}
          <input
            value={form.name}
            onChange={(event) => setForm((draft) => ({ ...draft, name: event.target.value }))}
            maxLength={200}
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
        <label className="text-xs font-semibold text-slate-400">
          {t("restaurantAdmin.field.sortOrder")}
          <input
            type="number"
            min="0"
            value={form.sortOrder}
            onChange={(event) =>
              setForm((draft) => ({ ...draft, sortOrder: event.target.value }))
            }
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
      </div>
      {!canManage && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {t("restaurantAdmin.notice.managePermissionRequired")}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!canManage || isPending}
          className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mode === "edit" ? <Pencil size={15} /> : <Plus size={15} />}
          {isPending
            ? t("restaurantAdmin.common.saving")
            : mode === "edit"
              ? t("restaurantAdmin.action.saveFloor")
              : t("restaurantAdmin.action.createFloor")}
        </button>
        {mode === "edit" && selectedFloor && (
          <button
            type="button"
            disabled={!canManage || isPending}
            onClick={() => onStatusChange(nextStatus)}
            className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-xs font-bold text-slate-100 transition hover:border-blue-400/40 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {nextStatus === "Active" ? <CircleCheck size={15} /> : <CirclePause size={15} />}
            {nextStatus === "Active" ? t("restaurantAdmin.common.activate") : t("restaurantAdmin.common.suspend")}
          </button>
        )}
      </div>
    </form>
  );
}

function TableForm({
  mode,
  form,
  setForm,
  selectedTable,
  selectedFloor,
  canManage,
  isPending,
  onSubmit,
  onStatusChange,
}) {
  const { t } = useI18n();
  const nextStatus = selectedTable?.status === "Active" ? "Suspended" : "Active";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_140px]">
        <label className="text-xs font-semibold text-slate-400">
          {t("restaurantAdmin.field.code")}
          <input
            value={form.code}
            onChange={(event) => setForm((draft) => ({ ...draft, code: event.target.value }))}
            maxLength={50}
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
        <label className="text-xs font-semibold text-slate-400">
          {t("restaurantAdmin.field.name")}
          <input
            value={form.name}
            onChange={(event) => setForm((draft) => ({ ...draft, name: event.target.value }))}
            maxLength={200}
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
        <label className="text-xs font-semibold text-slate-400">
          {t("restaurantAdmin.field.sortOrder")}
          <input
            type="number"
            min="0"
            value={form.sortOrder}
            onChange={(event) =>
              setForm((draft) => ({ ...draft, sortOrder: event.target.value }))
            }
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-slate-400">
        {t("restaurantAdmin.table.floorNotice", {
          name: selectedFloor?.name || t("restaurantAdmin.table.selectFloorFirst"),
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!canManage || isPending || !selectedFloor}
          className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mode === "edit" ? <Pencil size={15} /> : <Plus size={15} />}
          {isPending
            ? t("restaurantAdmin.common.saving")
            : mode === "edit"
              ? t("restaurantAdmin.action.saveTable")
              : t("restaurantAdmin.action.createTable")}
        </button>
        {mode === "edit" && selectedTable && (
          <button
            type="button"
            disabled={!canManage || isPending}
            onClick={() => onStatusChange(nextStatus)}
            className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-xs font-bold text-slate-100 transition hover:border-blue-400/40 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {nextStatus === "Active" ? <CircleCheck size={15} /> : <CirclePause size={15} />}
            {nextStatus === "Active" ? t("restaurantAdmin.common.activate") : t("restaurantAdmin.common.suspend")}
          </button>
        )}
      </div>
    </form>
  );
}

export default function RestaurantAdminPage() {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const [tab, setTab] = useState("floors");
  const [floorStatus, setFloorStatus] = useState("");
  const [tableStatus, setTableStatus] = useState("");
  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [floorMode, setFloorMode] = useState("create");
  const [tableMode, setTableMode] = useState("create");
  const [floorForm, setFloorForm] = useState(EMPTY_FLOOR_FORM);
  const [tableForm, setTableForm] = useState(EMPTY_TABLE_FORM);
  const [notice, setNotice] = useState("");

  const viewPermissionQuery = useHasPermission(currentCompanyId, RESTAURANT_VIEW_PERMISSION);
  const managePermissionQuery = useHasPermission(
    currentCompanyId,
    RESTAURANT_MANAGE_PERMISSION,
  );
  const canRead =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !viewPermissionQuery.isLoading &&
    viewPermissionQuery.hasPermission;
  const canManage = !managePermissionQuery.isLoading && managePermissionQuery.hasPermission;
  const floorFilters = useMemo(() => ({ status: floorStatus }), [floorStatus]);
  const tableFilters = useMemo(() => ({ status: tableStatus }), [tableStatus]);
  const floorsQuery = useRestaurantFloors(
    currentCompanyId,
    currentBranchId,
    floorFilters,
    canRead,
  );
  const floorDetailsQuery = useRestaurantFloorDetails(
    currentCompanyId,
    currentBranchId,
    selectedFloorId,
    canRead && Boolean(selectedFloorId),
  );
  const tablesQuery = useRestaurantTables(
    currentCompanyId,
    currentBranchId,
    selectedFloorId,
    tableFilters,
    canRead && Boolean(selectedFloorId),
  );
  const tableDetailsQuery = useRestaurantTableDetails(
    currentCompanyId,
    currentBranchId,
    selectedFloorId,
    selectedTableId,
    canRead && Boolean(selectedFloorId) && Boolean(selectedTableId),
  );
  const createFloorMutation = useCreateRestaurantFloor(currentCompanyId, currentBranchId);
  const updateFloorMutation = useUpdateRestaurantFloor(
    currentCompanyId,
    currentBranchId,
    selectedFloorId,
  );
  const floorStatusMutation = useChangeRestaurantFloorStatus(
    currentCompanyId,
    currentBranchId,
    selectedFloorId,
  );
  const createTableMutation = useCreateRestaurantTable(
    currentCompanyId,
    currentBranchId,
    selectedFloorId,
  );
  const updateTableMutation = useUpdateRestaurantTable(
    currentCompanyId,
    currentBranchId,
    selectedFloorId,
    selectedTableId,
  );
  const tableStatusMutation = useChangeRestaurantTableStatus(
    currentCompanyId,
    currentBranchId,
    selectedFloorId,
    selectedTableId,
  );
  const selectedFloor = floorDetailsQuery.data || null;
  const selectedTable = tableDetailsQuery.data || null;
  const isFloorPending =
    createFloorMutation.isPending ||
    updateFloorMutation.isPending ||
    floorStatusMutation.isPending;
  const isTablePending =
    createTableMutation.isPending ||
    updateTableMutation.isPending ||
    tableStatusMutation.isPending;

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const startCreateFloor = () => {
    setFloorMode("create");
    setSelectedFloorId(null);
    setSelectedTableId(null);
    setFloorForm(EMPTY_FLOOR_FORM);
  };

  const selectFloor = (floor) => {
    setFloorMode("edit");
    setSelectedFloorId(floor.restaurantFloorId);
    setSelectedTableId(null);
    setFloorForm({ name: floor.name, sortOrder: String(floor.sortOrder) });
    setTableMode("create");
    setTableForm(EMPTY_TABLE_FORM);
  };

  const selectTable = (table) => {
    setTableMode("edit");
    setSelectedTableId(table.restaurantTableId);
    setTableForm({
      code: table.code,
      name: table.name || "",
      sortOrder: String(table.sortOrder),
    });
  };

  const submitFloor = async () => {
    const sortOrder = parseSortOrder(floorForm.sortOrder);
    if (sortOrder === null) {
      showNotice(t("restaurantAdmin.notice.invalidSortOrder"));
      return;
    }

    try {
      if (floorMode === "create") {
        const created = await createFloorMutation.mutateAsync({
          name: floorForm.name,
          sortOrder,
        });
        setFloorMode("edit");
        setSelectedFloorId(created.restaurantFloorId);
        setFloorForm({ name: created.name, sortOrder: String(created.sortOrder) });
        showNotice(t("restaurantAdmin.notice.floorCreated"));
        return;
      }

      const updated = await updateFloorMutation.mutateAsync({
        name: floorForm.name,
        sortOrder,
      });
      setFloorForm({ name: updated.name, sortOrder: String(updated.sortOrder) });
      showNotice(t("restaurantAdmin.notice.floorUpdated"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  const changeFloorStatus = async (status) => {
    try {
      const updated = await floorStatusMutation.mutateAsync({ status });
      setFloorForm({ name: updated.name, sortOrder: String(updated.sortOrder) });
      showNotice(
        status === "Active"
          ? t("restaurantAdmin.notice.floorActivated")
          : t("restaurantAdmin.notice.floorSuspended"),
      );
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  const submitTable = async () => {
    const sortOrder = parseSortOrder(tableForm.sortOrder);
    if (sortOrder === null) {
      showNotice(t("restaurantAdmin.notice.invalidSortOrder"));
      return;
    }

    try {
      if (tableMode === "create") {
        const created = await createTableMutation.mutateAsync({
          code: tableForm.code,
          name: tableForm.name.trim() || null,
          sortOrder,
        });
        setTableMode("edit");
        setSelectedTableId(created.restaurantTableId);
        setTableForm({
          code: created.code,
          name: created.name || "",
          sortOrder: String(created.sortOrder),
        });
        showNotice(t("restaurantAdmin.notice.tableCreated"));
        return;
      }

      const updated = await updateTableMutation.mutateAsync({
        code: tableForm.code,
        name: tableForm.name.trim() || null,
        sortOrder,
      });
      setTableForm({
        code: updated.code,
        name: updated.name || "",
        sortOrder: String(updated.sortOrder),
      });
      showNotice(t("restaurantAdmin.notice.tableUpdated"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  const changeTableStatus = async (status) => {
    try {
      const updated = await tableStatusMutation.mutateAsync({ status });
      setTableForm({
        code: updated.code,
        name: updated.name || "",
        sortOrder: String(updated.sortOrder),
      });
      showNotice(
        status === "Active"
          ? t("restaurantAdmin.notice.tableActivated")
          : t("restaurantAdmin.notice.tableSuspended"),
      );
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  return (
    <AppLayout>
      <main className="space-y-4" dir="rtl">
        <PageHeader
          title={t("restaurantAdmin.pageTitle")}
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  floorsQuery.refetch();
                  if (selectedFloorId) tablesQuery.refetch();
                }}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
              >
                <RefreshCw size={14} />
                {t("restaurantAdmin.refresh")}
              </button>
              <button
                type="button"
                onClick={startCreateFloor}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white"
              >
                <Plus size={14} />
                {t("restaurantAdmin.action.newFloor")}
              </button>
            </div>
          }
        />

        {notice && (
          <div className="rounded-xl border border-blue-400/25 bg-blue-500/10 px-3 py-2 text-xs text-blue-100">
            {notice}
          </div>
        )}

        <div className="flex gap-2 rounded-2xl border border-white/10 bg-[#0c1424] p-2">
          {[
            ["floors", t("restaurantAdmin.tab.floors"), Layers3],
            ["tables", t("restaurantAdmin.tab.tables"), LayoutGrid],
          ].map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                tab === id ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {!currentCompanyId || !currentBranchId ? (
          <EmptyState
            title={t("restaurantAdmin.gate.companyRequired.title")}
            message={t("restaurantAdmin.gate.companyRequired.message")}
          />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label={t("restaurantAdmin.gate.checkingPermissions")} />
        ) : !viewPermissionQuery.hasPermission ? (
          <ErrorState
            title={t("restaurantAdmin.gate.permissionRequired.title")}
            message={t("restaurantAdmin.gate.permissionRequired.message")}
          />
        ) : tab === "floors" ? (
          <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
              <div className="mb-3 flex items-center gap-2">
                <select
                  value={floorStatus}
                  onChange={(event) => setFloorStatus(event.target.value)}
                  className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-blue-400/60"
                >
                  <option value="">{t("restaurantAdmin.field.allFloors")}</option>
                  <option value="Active">{t("restaurantAdmin.common.active")}</option>
                  <option value="Suspended">{t("restaurantAdmin.common.suspended")}</option>
                </select>
              </div>
              {floorsQuery.isLoading && <LoadingState label={t("restaurantAdmin.loadingFloors")} />}
              {floorsQuery.isError && (
                <ErrorState title={t("restaurantAdmin.loadFloorsError")} message={getErrorMessage(floorsQuery.error, t)} />
              )}
              {!floorsQuery.isLoading && !floorsQuery.isError && floorsQuery.data?.length === 0 && (
                <EmptyState title={t("restaurantAdmin.emptyFloors.title")} message={t("restaurantAdmin.emptyFloors.message")} />
              )}
              {!floorsQuery.isLoading && !floorsQuery.isError && Boolean(floorsQuery.data?.length) && (
                <div className="max-h-[calc(100vh-350px)] min-h-[360px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                  {floorsQuery.data.map((floor) => (
                    <FloorCard
                      key={floor.restaurantFloorId}
                      floor={floor}
                      selected={selectedFloorId === floor.restaurantFloorId}
                      onSelect={() => selectFloor(floor)}
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
                    {floorMode === "create"
                      ? t("restaurantAdmin.floorDetails.createLabel")
                      : t("restaurantAdmin.floorDetails.detailsLabel")}
                  </div>
                  <h2 className="mt-1 text-xl font-black text-white">
                    {floorMode === "create"
                      ? t("restaurantAdmin.floorDetails.newFloorTitle")
                      : selectedFloor?.name || t("restaurantAdmin.floorDetails.loadingFloorTitle")}
                  </h2>
                </div>
                {selectedFloor && (
                  <StatusBadge tone={statusTone(selectedFloor.status)}>
                    {statusLabel(selectedFloor.status, t)}
                  </StatusBadge>
                )}
              </div>
              {floorMode === "edit" && floorDetailsQuery.isLoading && (
                <LoadingState label={t("restaurantAdmin.loadingFloorDetails")} />
              )}
              {floorMode === "edit" && floorDetailsQuery.isError && (
                <ErrorState title={t("restaurantAdmin.loadFloorDetailsError")} message={getErrorMessage(floorDetailsQuery.error, t)} />
              )}
              {(floorMode === "create" || selectedFloor) && (
                <div className="space-y-4">
                  {selectedFloor && (
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                        <div className="text-[11px] text-slate-500">{t("restaurantAdmin.card.created")}</div>
                        <div className="mt-1 text-sm font-black text-white">
                          {formatDateTime(selectedFloor.createdAtUtc)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                        <div className="text-[11px] text-slate-500">{t("restaurantAdmin.field.sortOrder")}</div>
                        <div className="mt-1 text-sm font-black text-white">{selectedFloor.sortOrder}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                        <div className="text-[11px] text-slate-500">{t("restaurantAdmin.card.tables")}</div>
                        <div className="mt-1 text-sm font-black text-white">{selectedFloor.tables.length}</div>
                      </div>
                    </div>
                  )}
                  <FloorForm
                    mode={floorMode}
                    form={floorForm}
                    setForm={setFloorForm}
                    selectedFloor={selectedFloor}
                    canManage={canManage}
                    isPending={isFloorPending}
                    onSubmit={submitFloor}
                    onStatusChange={changeFloorStatus}
                  />
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[360px_380px_1fr]">
            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
              <div className="mb-3 text-sm font-black text-white">{t("restaurantAdmin.floorHeading")}</div>
              <div className="max-h-[calc(100vh-330px)] min-h-[320px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                {floorsQuery.isLoading && <LoadingState label={t("restaurantAdmin.loadingFloors")} />}
                {!floorsQuery.isLoading && floorsQuery.data?.map((floor) => (
                  <FloorCard
                    key={floor.restaurantFloorId}
                    floor={floor}
                    selected={selectedFloorId === floor.restaurantFloorId}
                    onSelect={() => selectFloor(floor)}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="text-sm font-black text-white">{t("restaurantAdmin.tablesHeading")}</div>
                <select
                  value={tableStatus}
                  onChange={(event) => setTableStatus(event.target.value)}
                  className="h-9 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                >
                  <option value="">{t("restaurantAdmin.common.all")}</option>
                  <option value="Active">{t("restaurantAdmin.common.active")}</option>
                  <option value="Suspended">{t("restaurantAdmin.common.suspended")}</option>
                </select>
              </div>
              {!selectedFloorId ? (
                <EmptyState title={t("restaurantAdmin.emptySelectFloor.title")} message={t("restaurantAdmin.emptySelectFloor.message")} />
              ) : tablesQuery.isLoading ? (
                <LoadingState label={t("restaurantAdmin.loadingTables")} />
              ) : tablesQuery.isError ? (
                <ErrorState title={t("restaurantAdmin.loadTablesError")} message={getErrorMessage(tablesQuery.error, t)} />
              ) : tablesQuery.data?.length === 0 ? (
                <EmptyState title={t("restaurantAdmin.emptyTables.title")} message={t("restaurantAdmin.emptyTables.message")} />
              ) : (
                <div className="max-h-[calc(100vh-360px)] min-h-[320px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                  {tablesQuery.data.map((table) => (
                    <TableCard
                      key={table.restaurantTableId}
                      table={table}
                      selected={selectedTableId === table.restaurantTableId}
                      onSelect={() => selectTable(table)}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Armchair size={15} className="text-blue-300" />
                    {tableMode === "create"
                      ? t("restaurantAdmin.tableDetails.createLabel")
                      : t("restaurantAdmin.tableDetails.detailsLabel")}
                  </div>
                  <h2 className="mt-1 text-xl font-black text-white">
                    {tableMode === "create"
                      ? t("restaurantAdmin.tableDetails.newTableTitle")
                      : selectedTable?.code || t("restaurantAdmin.tableDetails.loadingTableTitle")}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTableMode("create");
                    setSelectedTableId(null);
                    setTableForm(EMPTY_TABLE_FORM);
                  }}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
                >
                  <Plus size={14} />
                  {t("restaurantAdmin.action.newTable")}
                </button>
              </div>
              {canManage && selectedFloor && (
                <BulkCreateTables
                  key={selectedFloor.restaurantFloorId}
                  existingTables={selectedFloor.tables}
                  createTable={(payload) => createTableMutation.mutateAsync(payload)}
                  disabled={isTablePending}
                  onDone={showNotice}
                />
              )}
              {tableMode === "edit" && tableDetailsQuery.isLoading && (
                <LoadingState label={t("restaurantAdmin.loadingTableDetails")} />
              )}
              {tableMode === "edit" && tableDetailsQuery.isError && (
                <ErrorState title={t("restaurantAdmin.loadTableDetailsError")} message={getErrorMessage(tableDetailsQuery.error, t)} />
              )}
              {(tableMode === "create" || selectedTable) && (
                <TableForm
                  mode={tableMode}
                  form={tableForm}
                  setForm={setTableForm}
                  selectedTable={selectedTable}
                  selectedFloor={selectedFloor}
                  canManage={canManage}
                  isPending={isTablePending}
                  onSubmit={submitTable}
                  onStatusChange={changeTableStatus}
                />
              )}
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.025] p-3 text-xs leading-5 text-slate-400">
                {t("restaurantAdmin.occupancyNotice")}
              </div>
            </section>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
