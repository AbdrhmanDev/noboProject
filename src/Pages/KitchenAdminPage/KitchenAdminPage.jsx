import { useMemo, useState } from "react";
import {
  ArrowRightLeft,
  ChefHat,
  CircleCheck,
  CirclePause,
  CookingPot,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Route,
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
import { useBranch } from "../../features/branches/context/BranchContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import {
  useChangeKitchenStationStatus,
  useCreateKitchenStation,
  useKitchenStationDetails,
  useKitchenStations,
  useProductVariantKitchenRoutes,
  useSetProductVariantKitchenRoute,
  useUpdateKitchenStation,
} from "../../features/kitchen/hooks/useKitchen";
import { useSellableCatalog } from "../../features/pos/hooks/useSellableCatalog";

const KITCHEN_VIEW_PERMISSION = "Kitchen.View";
const KITCHEN_MANAGE_PERMISSION = "Kitchen.Manage";
const EMPTY_STATION_FORM = {
  code: "",
  name: "",
  sortOrder: "0",
};
const EMPTY_ROUTE_FORM = {
  kitchenStationId: "",
  sortOrder: "0",
};

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

function variantLabel(item) {
  return item.variantName && item.variantName !== item.productName
    ? `${item.productName} - ${item.variantName}`
    : item.productName;
}

function StationCard({ station, selected, onSelect }) {
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
            <CookingPot size={15} className="shrink-0 text-blue-300" />
            <div className="truncate text-sm font-black text-white">{station.code}</div>
          </div>
          <div className="mt-1 truncate text-xs text-slate-400">{station.name}</div>
        </div>
        <StatusBadge tone={statusTone(station.status)}>{station.status}</StatusBadge>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <div className="rounded-lg bg-white/[0.03] p-2">
          <div className="text-slate-500">Sort</div>
          <div className="mt-1 font-semibold text-slate-200">{station.sortOrder}</div>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-2">
          <div className="text-slate-500">Routes</div>
          <div className="mt-1 font-semibold text-slate-200">{station.routeCount}</div>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-2">
          <div className="text-slate-500">Created</div>
          <div className="mt-1 font-semibold text-slate-200">
            {formatDateTime(station.createdAtUtc)}
          </div>
        </div>
      </div>
    </button>
  );
}

function StationForm({
  mode,
  form,
  setForm,
  canManage,
  isPending,
  selectedStation,
  onSubmit,
  onStatusChange,
}) {
  const isEdit = mode === "edit";
  const nextStatus = selectedStation?.status === "Active" ? "Suspended" : "Active";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_120px]">
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
            onChange={(event) => setForm((draft) => ({ ...draft, sortOrder: event.target.value }))}
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
      </div>
      {!canManage && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          Kitchen.Manage permission is required for configuration changes.
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!canManage || isPending}
          className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isEdit ? <Pencil size={15} /> : <Plus size={15} />}
          {isPending ? "Saving..." : isEdit ? "Save station" : "Create station"}
        </button>
        {isEdit && selectedStation && (
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

function RouteRow({ route, canManage, isPending, onDisable }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1728] p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-white">
            <Route size={14} className="text-blue-300" />
            {route.kitchenStationCode} · {route.kitchenStationName}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Sort {route.sortOrder} · Updated {formatDateTime(route.updatedAtUtc)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge tone={route.kitchenStationStatus === "Active" ? "success" : "warning"}>
            {route.kitchenStationStatus}
          </StatusBadge>
          <StatusBadge tone={route.isEnabled ? "info" : "neutral"}>
            {route.isEnabled ? "Enabled" : "Disabled"}
          </StatusBadge>
          {route.isEnabled && (
            <button
              type="button"
              disabled={!canManage || isPending}
              onClick={onDisable}
              className="rounded-lg border border-white/10 bg-white/[0.035] px-2 py-1 text-[10px] font-bold text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Disable
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KitchenAdminPage() {
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const [tab, setTab] = useState("stations");
  const [stationSearch, setStationSearch] = useState("");
  const [stationStatus, setStationStatus] = useState("");
  const [selectedStationId, setSelectedStationId] = useState(null);
  const [stationMode, setStationMode] = useState("create");
  const [stationForm, setStationForm] = useState(EMPTY_STATION_FORM);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [routeSearch, setRouteSearch] = useState("");
  const [routeForm, setRouteForm] = useState(EMPTY_ROUTE_FORM);
  const [notice, setNotice] = useState("");

  const viewPermissionQuery = useHasPermission(currentCompanyId, KITCHEN_VIEW_PERMISSION);
  const managePermissionQuery = useHasPermission(currentCompanyId, KITCHEN_MANAGE_PERMISSION);
  const canRead =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !viewPermissionQuery.isLoading &&
    viewPermissionQuery.hasPermission;
  const canManage = !managePermissionQuery.isLoading && managePermissionQuery.hasPermission;
  const stationFilters = useMemo(
    () => ({
      status: stationStatus,
      search: stationSearch.trim() || undefined,
    }),
    [stationSearch, stationStatus],
  );
  const stationsQuery = useKitchenStations(
    currentCompanyId,
    currentBranchId,
    stationFilters,
    canRead,
  );
  const stationDetailsQuery = useKitchenStationDetails(
    currentCompanyId,
    currentBranchId,
    selectedStationId,
    canRead && Boolean(selectedStationId),
  );
  const catalogQuery = useSellableCatalog(currentCompanyId, currentBranchId, canRead);
  const routesQuery = useProductVariantKitchenRoutes(
    currentCompanyId,
    currentBranchId,
    selectedVariantId,
    canRead && Boolean(selectedVariantId),
  );
  const createStationMutation = useCreateKitchenStation(currentCompanyId, currentBranchId);
  const updateStationMutation = useUpdateKitchenStation(
    currentCompanyId,
    currentBranchId,
    selectedStationId,
  );
  const statusMutation = useChangeKitchenStationStatus(
    currentCompanyId,
    currentBranchId,
    selectedStationId,
  );
  const routeMutation = useSetProductVariantKitchenRoute(
    currentCompanyId,
    currentBranchId,
    selectedVariantId,
  );
  const selectedStation = stationDetailsQuery.data || null;
  const isStationMutating =
    createStationMutation.isPending ||
    updateStationMutation.isPending ||
    statusMutation.isPending;
  const variants = useMemo(() => {
    const items = catalogQuery.data?.items ?? [];
    return items
      .filter((item) =>
        `${item.productName} ${item.variantName} ${item.sku || ""}`
          .toLowerCase()
          .includes(routeSearch.toLowerCase()),
      )
      .slice(0, 80);
  }, [catalogQuery.data?.items, routeSearch]);
  const activeStations = (stationsQuery.data ?? []).filter(
    (station) => station.status === "Active",
  );

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const startCreateStation = () => {
    setStationMode("create");
    setSelectedStationId(null);
    setStationForm(EMPTY_STATION_FORM);
  };

  const selectStation = (station) => {
    setStationMode("edit");
    setSelectedStationId(station.kitchenStationId);
    setStationForm({
      code: station.code,
      name: station.name,
      sortOrder: String(station.sortOrder),
    });
  };

  const submitStation = async () => {
    const sortOrder = parseSortOrder(stationForm.sortOrder);
    if (sortOrder === null) {
      showNotice("Sort order must be zero or greater.");
      return;
    }

    try {
      if (stationMode === "create") {
        const created = await createStationMutation.mutateAsync({
          code: stationForm.code,
          name: stationForm.name,
          sortOrder,
        });
        setStationMode("edit");
        setSelectedStationId(created.kitchenStationId);
        setStationForm({
          code: created.code,
          name: created.name,
          sortOrder: String(created.sortOrder),
        });
        showNotice("Kitchen station created.");
        return;
      }

      const updated = await updateStationMutation.mutateAsync({
        code: stationForm.code,
        name: stationForm.name,
        sortOrder,
      });
      setStationForm({
        code: updated.code,
        name: updated.name,
        sortOrder: String(updated.sortOrder),
      });
      showNotice("Kitchen station updated.");
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const changeStationStatus = async (status) => {
    try {
      const updated = await statusMutation.mutateAsync({ status });
      setStationForm({
        code: updated.code,
        name: updated.name,
        sortOrder: String(updated.sortOrder),
      });
      showNotice(`Kitchen station ${status.toLowerCase()}.`);
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const submitRoute = async () => {
    const sortOrder = parseSortOrder(routeForm.sortOrder);
    if (!routeForm.kitchenStationId || sortOrder === null) {
      showNotice("Select an active station and valid sort order.");
      return;
    }

    try {
      await routeMutation.mutateAsync({
        kitchenStationId: routeForm.kitchenStationId,
        payload: {
          isEnabled: true,
          sortOrder,
        },
      });
      showNotice("Kitchen route saved.");
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const disableRoute = async (route) => {
    try {
      await routeMutation.mutateAsync({
        kitchenStationId: route.kitchenStationId,
        payload: {
          isEnabled: false,
          sortOrder: route.sortOrder,
        },
      });
      showNotice("Kitchen route disabled.");
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  return (
    <AppLayout>
      <main className="space-y-4" dir="rtl">
        <PageHeader
          title="Kitchen Configuration"
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => stationsQuery.refetch()}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
              <button
                type="button"
                onClick={startCreateStation}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white"
              >
                <Plus size={14} />
                New station
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
            ["stations", "Stations", ChefHat],
            ["routing", "Routing", ArrowRightLeft],
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
            message="Select a company and branch to configure Kitchen."
          />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label="Checking Kitchen permissions..." />
        ) : !viewPermissionQuery.hasPermission ? (
          <ErrorState
            title="Permission required"
            message="Kitchen.View permission is required to view Kitchen configuration."
          />
        ) : tab === "stations" ? (
          <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
              <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_140px]">
                <label className="relative block">
                  <Search
                    size={15}
                    className="pointer-events-none absolute right-3 top-3 text-slate-500"
                  />
                  <input
                    value={stationSearch}
                    onChange={(event) => setStationSearch(event.target.value)}
                    maxLength={100}
                    className="h-10 w-full rounded-xl border border-white/10 bg-black/20 pr-9 pl-3 text-xs text-white outline-none focus:border-blue-400/60"
                    placeholder="Search code or name"
                  />
                </label>
                <select
                  value={stationStatus}
                  onChange={(event) => setStationStatus(event.target.value)}
                  className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-blue-400/60"
                >
                  <option value="">All</option>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              {stationsQuery.isLoading && <LoadingState label="Loading stations..." />}
              {stationsQuery.isError && (
                <ErrorState
                  title="Unable to load stations"
                  message={getErrorMessage(stationsQuery.error)}
                />
              )}
              {!stationsQuery.isLoading &&
                !stationsQuery.isError &&
                stationsQuery.data?.length === 0 && (
                  <EmptyState
                    title="No stations found"
                    message="No kitchen stations match the current filters."
                  />
                )}
              {!stationsQuery.isLoading &&
                !stationsQuery.isError &&
                Boolean(stationsQuery.data?.length) && (
                  <div className="max-h-[calc(100vh-360px)] min-h-[360px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                    {stationsQuery.data.map((station) => (
                      <StationCard
                        key={station.kitchenStationId}
                        station={station}
                        selected={selectedStationId === station.kitchenStationId}
                        onSelect={() => selectStation(station)}
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
                    {stationMode === "create" ? "Create station" : "Station details"}
                  </div>
                  <h2 className="mt-1 text-xl font-black text-white">
                    {stationMode === "create"
                      ? "New Kitchen station"
                      : selectedStation?.code || "Loading station"}
                  </h2>
                </div>
                {selectedStation && (
                  <StatusBadge tone={statusTone(selectedStation.status)}>
                    {selectedStation.status}
                  </StatusBadge>
                )}
              </div>

              {stationMode === "edit" && stationDetailsQuery.isLoading && (
                <LoadingState label="Loading station details..." />
              )}
              {stationMode === "edit" && stationDetailsQuery.isError && (
                <ErrorState
                  title="Unable to load station details"
                  message={getErrorMessage(stationDetailsQuery.error)}
                />
              )}
              {(stationMode === "create" || selectedStation) && (
                <div className="space-y-4">
                  {selectedStation && (
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                        <div className="text-[11px] text-slate-500">Name</div>
                        <div className="mt-1 text-sm font-black text-white">
                          {selectedStation.name}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                        <div className="text-[11px] text-slate-500">Created</div>
                        <div className="mt-1 text-sm font-black text-white">
                          {formatDateTime(selectedStation.createdAtUtc)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                        <div className="text-[11px] text-slate-500">Routes</div>
                        <div className="mt-1 text-sm font-black text-white">
                          {selectedStation.routes.length}
                        </div>
                      </div>
                    </div>
                  )}

                  <StationForm
                    mode={stationMode}
                    form={stationForm}
                    setForm={setStationForm}
                    canManage={canManage}
                    isPending={isStationMutating}
                    selectedStation={selectedStation}
                    onSubmit={submitStation}
                    onStatusChange={changeStationStatus}
                  />

                  {selectedStation && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                      <div className="mb-2 flex items-center gap-2 text-sm font-black">
                        <Route size={16} className="text-blue-300" />
                        Station route summary
                      </div>
                      {selectedStation.routes.length === 0 ? (
                        <EmptyState
                          title="No routes"
                          message="This station is not assigned to any product variants."
                        />
                      ) : (
                        <div className="max-h-72 space-y-2 overflow-y-auto pr-1 scrollbar-none">
                          {selectedStation.routes.map((route) => (
                            <div
                              key={route.productVariantKitchenRouteId}
                              className="rounded-xl border border-white/10 bg-[#0d1728] p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-xs font-black text-white">
                                    {route.productName}
                                    {route.variantName ? ` - ${route.variantName}` : ""}
                                  </div>
                                  <div className="mt-1 text-[11px] text-slate-500">
                                    {route.sku || "No SKU"} · Sort {route.sortOrder}
                                  </div>
                                </div>
                                <StatusBadge tone={route.isEnabled ? "info" : "neutral"}>
                                  {route.isEnabled ? "Enabled" : "Disabled"}
                                </StatusBadge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
              <label className="relative mb-3 block">
                <Search
                  size={15}
                  className="pointer-events-none absolute right-3 top-3 text-slate-500"
                />
                <input
                  value={routeSearch}
                  onChange={(event) => setRouteSearch(event.target.value)}
                  className="h-10 w-full rounded-xl border border-white/10 bg-black/20 pr-9 pl-3 text-xs text-white outline-none focus:border-blue-400/60"
                  placeholder="Search product, variant, or SKU"
                />
              </label>

              {catalogQuery.isLoading && <LoadingState label="Loading sellable items..." />}
              {catalogQuery.isError && (
                <ErrorState
                  title="Unable to load item selector"
                  message={getErrorMessage(catalogQuery.error)}
                />
              )}
              {!catalogQuery.isLoading && !catalogQuery.isError && variants.length === 0 && (
                <EmptyState
                  title="No variants found"
                  message="No sellable product variants match the current search."
                />
              )}
              {!catalogQuery.isLoading && !catalogQuery.isError && variants.length > 0 && (
                <div className="max-h-[calc(100vh-330px)] min-h-[360px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                  {variants.map((item) => (
                    <button
                      type="button"
                      key={item.productVariantId}
                      onClick={() => {
                        setSelectedVariantId(item.productVariantId);
                        setRouteForm(EMPTY_ROUTE_FORM);
                      }}
                      className={`w-full rounded-xl border p-3 text-start transition hover:border-blue-400/40 hover:bg-blue-500/10 ${
                        selectedVariantId === item.productVariantId
                          ? "border-blue-400/60 bg-blue-500/15"
                          : "border-white/10 bg-[#0d1728]"
                      }`}
                    >
                      <div className="text-sm font-black text-white">{variantLabel(item)}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {item.categoryName || "Uncategorized"} · {item.sku || "No SKU"}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
              <div className="mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ArrowRightLeft size={15} className="text-blue-300" />
                  Product Variant Kitchen Routes
                </div>
                <h2 className="mt-1 text-xl font-black text-white">
                  {selectedVariantId ? "Route assignment" : "Select a variant"}
                </h2>
              </div>

              {!selectedVariantId ? (
                <EmptyState
                  title="Select a product variant"
                  message="Choose a sellable variant to inspect or change its kitchen routes."
                />
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                    <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_120px_auto]">
                      <label className="text-xs font-semibold text-slate-400">
                        Kitchen Station
                        <select
                          value={routeForm.kitchenStationId}
                          onChange={(event) =>
                            setRouteForm((draft) => ({
                              ...draft,
                              kitchenStationId: event.target.value,
                            }))
                          }
                          disabled={!canManage || routeMutation.isPending}
                          className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
                        >
                          <option value="">Select active station</option>
                          {activeStations.map((station) => (
                            <option
                              key={station.kitchenStationId}
                              value={station.kitchenStationId}
                            >
                              {station.code} · {station.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs font-semibold text-slate-400">
                        Sort
                        <input
                          type="number"
                          min="0"
                          value={routeForm.sortOrder}
                          onChange={(event) =>
                            setRouteForm((draft) => ({
                              ...draft,
                              sortOrder: event.target.value,
                            }))
                          }
                          disabled={!canManage || routeMutation.isPending}
                          className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={submitRoute}
                        disabled={!canManage || routeMutation.isPending}
                        className="mt-auto flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Route size={15} />
                        Assign / enable
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      A variant can have zero routes. Disabling every route is valid and means no
                      future kitchen ticket routing for that variant.
                    </div>
                  </div>

                  {routesQuery.isLoading && <LoadingState label="Loading routes..." />}
                  {routesQuery.isError && (
                    <ErrorState
                      title="Unable to load routes"
                      message={getErrorMessage(routesQuery.error)}
                    />
                  )}
                  {!routesQuery.isLoading &&
                    !routesQuery.isError &&
                    routesQuery.data?.length === 0 && (
                      <EmptyState
                        title="No kitchen routes"
                        message="This product variant currently has zero kitchen routes."
                      />
                    )}
                  {!routesQuery.isLoading &&
                    !routesQuery.isError &&
                    Boolean(routesQuery.data?.length) && (
                      <div className="space-y-2">
                        {routesQuery.data.map((route) => (
                          <RouteRow
                            key={route.productVariantKitchenRouteId}
                            route={route}
                            canManage={canManage}
                            isPending={routeMutation.isPending}
                            onDisable={() => disableRoute(route)}
                          />
                        ))}
                      </div>
                    )}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
