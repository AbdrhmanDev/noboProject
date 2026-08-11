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

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

function statusTone(status) {
  return status === "Active" ? "success" : "warning";
}

function parseSortOrder(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function FloorCard({ floor, selected, onSelect }) {
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
          <div className="mt-1 text-xs text-slate-500">Sort {floor.sortOrder}</div>
        </div>
        <StatusBadge tone={statusTone(floor.status)}>{floor.status}</StatusBadge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg bg-white/[0.03] p-2">
          <div className="text-slate-500">Tables</div>
          <div className="mt-1 font-semibold text-slate-200">{floor.tableCount}</div>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-2">
          <div className="text-slate-500">Created</div>
          <div className="mt-1 font-semibold text-slate-200">
            {formatDateTime(floor.createdAtUtc)}
          </div>
        </div>
      </div>
    </button>
  );
}

function TableCard({ table, selected, onSelect }) {
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
            {table.name || "Unnamed table"}
          </div>
        </div>
        <StatusBadge tone={statusTone(table.status)}>{table.status}</StatusBadge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg bg-white/[0.03] p-2">
          <div className="text-slate-500">Sort</div>
          <div className="mt-1 font-semibold text-slate-200">{table.sortOrder}</div>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-2">
          <div className="text-slate-500">Created</div>
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
          Floor name
          <input
            value={form.name}
            onChange={(event) => setForm((draft) => ({ ...draft, name: event.target.value }))}
            maxLength={200}
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
        <label className="text-xs font-semibold text-slate-400">
          Sort Order
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
          Restaurant.Manage permission is required for configuration changes.
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!canManage || isPending}
          className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mode === "edit" ? <Pencil size={15} /> : <Plus size={15} />}
          {isPending ? "Saving..." : mode === "edit" ? "Save floor" : "Create floor"}
        </button>
        {mode === "edit" && selectedFloor && (
          <button
            type="button"
            disabled={!canManage || isPending}
            onClick={() => onStatusChange(nextStatus)}
            className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-xs font-bold text-slate-100 transition hover:border-blue-400/40 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {nextStatus === "Active" ? <CircleCheck size={15} /> : <CirclePause size={15} />}
            {nextStatus === "Active" ? "Activate" : "Suspend"}
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
          Code
          <input
            value={form.code}
            onChange={(event) => setForm((draft) => ({ ...draft, code: event.target.value }))}
            maxLength={50}
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
        <label className="text-xs font-semibold text-slate-400">
          Name
          <input
            value={form.name}
            onChange={(event) => setForm((draft) => ({ ...draft, name: event.target.value }))}
            maxLength={200}
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
        <label className="text-xs font-semibold text-slate-400">
          Sort Order
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
        Floor: {selectedFloor?.name || "Select a floor first"}. Floor moves are not exposed by the backend contract.
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!canManage || isPending || !selectedFloor}
          className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mode === "edit" ? <Pencil size={15} /> : <Plus size={15} />}
          {isPending ? "Saving..." : mode === "edit" ? "Save table" : "Create table"}
        </button>
        {mode === "edit" && selectedTable && (
          <button
            type="button"
            disabled={!canManage || isPending}
            onClick={() => onStatusChange(nextStatus)}
            className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-xs font-bold text-slate-100 transition hover:border-blue-400/40 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {nextStatus === "Active" ? <CircleCheck size={15} /> : <CirclePause size={15} />}
            {nextStatus === "Active" ? "Activate" : "Suspend"}
          </button>
        )}
      </div>
    </form>
  );
}

export default function RestaurantAdminPage() {
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
      showNotice("Sort order must be zero or greater.");
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
        showNotice("Restaurant floor created.");
        return;
      }

      const updated = await updateFloorMutation.mutateAsync({
        name: floorForm.name,
        sortOrder,
      });
      setFloorForm({ name: updated.name, sortOrder: String(updated.sortOrder) });
      showNotice("Restaurant floor updated.");
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const changeFloorStatus = async (status) => {
    try {
      const updated = await floorStatusMutation.mutateAsync({ status });
      setFloorForm({ name: updated.name, sortOrder: String(updated.sortOrder) });
      showNotice(`Restaurant floor ${status.toLowerCase()}.`);
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const submitTable = async () => {
    const sortOrder = parseSortOrder(tableForm.sortOrder);
    if (sortOrder === null) {
      showNotice("Sort order must be zero or greater.");
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
        showNotice("Restaurant table created.");
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
      showNotice("Restaurant table updated.");
    } catch (error) {
      showNotice(getErrorMessage(error));
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
      showNotice(`Restaurant table ${status.toLowerCase()}.`);
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  return (
    <AppLayout>
      <main className="space-y-4" dir="rtl">
        <PageHeader
          title="Restaurant Configuration"
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
                Refresh
              </button>
              <button
                type="button"
                onClick={startCreateFloor}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white"
              >
                <Plus size={14} />
                New floor
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
            ["floors", "Floors", Layers3],
            ["tables", "Tables", LayoutGrid],
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
            title="Company and branch required"
            message="Select a company and branch to configure restaurant floors and tables."
          />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label="Checking Restaurant permissions..." />
        ) : !viewPermissionQuery.hasPermission ? (
          <ErrorState
            title="Permission required"
            message="Restaurant.View permission is required to view restaurant configuration."
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
                  <option value="">All floors</option>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
              {floorsQuery.isLoading && <LoadingState label="Loading floors..." />}
              {floorsQuery.isError && (
                <ErrorState title="Unable to load floors" message={getErrorMessage(floorsQuery.error)} />
              )}
              {!floorsQuery.isLoading && !floorsQuery.isError && floorsQuery.data?.length === 0 && (
                <EmptyState title="No floors found" message="No restaurant floors match the current filter." />
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
                    {floorMode === "create" ? "Create floor" : "Floor details"}
                  </div>
                  <h2 className="mt-1 text-xl font-black text-white">
                    {floorMode === "create" ? "New floor" : selectedFloor?.name || "Loading floor"}
                  </h2>
                </div>
                {selectedFloor && (
                  <StatusBadge tone={statusTone(selectedFloor.status)}>
                    {selectedFloor.status}
                  </StatusBadge>
                )}
              </div>
              {floorMode === "edit" && floorDetailsQuery.isLoading && (
                <LoadingState label="Loading floor details..." />
              )}
              {floorMode === "edit" && floorDetailsQuery.isError && (
                <ErrorState title="Unable to load floor details" message={getErrorMessage(floorDetailsQuery.error)} />
              )}
              {(floorMode === "create" || selectedFloor) && (
                <div className="space-y-4">
                  {selectedFloor && (
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                        <div className="text-[11px] text-slate-500">Created</div>
                        <div className="mt-1 text-sm font-black text-white">
                          {formatDateTime(selectedFloor.createdAtUtc)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                        <div className="text-[11px] text-slate-500">Sort Order</div>
                        <div className="mt-1 text-sm font-black text-white">{selectedFloor.sortOrder}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                        <div className="text-[11px] text-slate-500">Tables</div>
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
              <div className="mb-3 text-sm font-black text-white">Floor</div>
              <div className="max-h-[calc(100vh-330px)] min-h-[320px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                {floorsQuery.isLoading && <LoadingState label="Loading floors..." />}
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
                <div className="text-sm font-black text-white">Tables</div>
                <select
                  value={tableStatus}
                  onChange={(event) => setTableStatus(event.target.value)}
                  className="h-9 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                >
                  <option value="">All</option>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
              {!selectedFloorId ? (
                <EmptyState title="Select a floor" message="Choose a floor to manage its tables." />
              ) : tablesQuery.isLoading ? (
                <LoadingState label="Loading tables..." />
              ) : tablesQuery.isError ? (
                <ErrorState title="Unable to load tables" message={getErrorMessage(tablesQuery.error)} />
              ) : tablesQuery.data?.length === 0 ? (
                <EmptyState title="No tables found" message="No tables match the current filter." />
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
                    {tableMode === "create" ? "Create table" : "Table details"}
                  </div>
                  <h2 className="mt-1 text-xl font-black text-white">
                    {tableMode === "create" ? "New table" : selectedTable?.code || "Loading table"}
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
                  New table
                </button>
              </div>
              {tableMode === "edit" && tableDetailsQuery.isLoading && (
                <LoadingState label="Loading table details..." />
              )}
              {tableMode === "edit" && tableDetailsQuery.isError && (
                <ErrorState title="Unable to load table details" message={getErrorMessage(tableDetailsQuery.error)} />
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
                Occupancy is backend-derived from open DineIn Draft/Confirmed sales orders.
                Admin does not own occupy/release state.
              </div>
            </section>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
