import { useMemo, useState } from "react";
import {
  ArrowRightLeft,
  ChefHat,
  CircleCheck,
  CirclePause,
  CookingPot,
  Pencil,
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
import { useI18n } from "../../i18n/I18nContext";
import {
  useChangeKitchenStationStatus,
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

function getErrorMessage(error, t) {
  return error?.message || t("kitchenAdmin.common.requestFailed");
}

function statusTone(status) {
  return status === "Active" ? "success" : "warning";
}

function statusLabel(status, t) {
  return status === "Active" ? t("kitchenAdmin.common.active") : t("kitchenAdmin.common.suspended");
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
            <CookingPot size={15} className="shrink-0 text-blue-300" />
            <div className="truncate text-sm font-black text-white">{station.code}</div>
          </div>
          <div className="mt-1 truncate text-xs text-slate-400">{station.name}</div>
        </div>
        <StatusBadge tone={statusTone(station.status)}>{statusLabel(station.status, t)}</StatusBadge>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <div className="rounded-lg bg-white/[0.03] p-2">
          <div className="text-slate-500">{t("kitchenAdmin.card.sort")}</div>
          <div className="mt-1 font-semibold text-slate-200">{station.sortOrder}</div>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-2">
          <div className="text-slate-500">{t("kitchenAdmin.card.routes")}</div>
          <div className="mt-1 font-semibold text-slate-200">{station.routeCount}</div>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-2">
          <div className="text-slate-500">{t("kitchenAdmin.card.created")}</div>
          <div className="mt-1 font-semibold text-slate-200">
            {formatDateTime(station.createdAtUtc)}
          </div>
        </div>
      </div>
    </button>
  );
}

function StationForm({
  form,
  setForm,
  canManage,
  isPending,
  selectedStation,
  onSubmit,
  onStatusChange,
}) {
  const { t } = useI18n();
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
          {t("kitchenAdmin.field.code")}
          <input
            value={form.code}
            onChange={(event) => setForm((draft) => ({ ...draft, code: event.target.value }))}
            maxLength={50}
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
        <label className="text-xs font-semibold text-slate-400">
          {t("kitchenAdmin.field.name")}
          <input
            value={form.name}
            onChange={(event) => setForm((draft) => ({ ...draft, name: event.target.value }))}
            maxLength={200}
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
        <label className="text-xs font-semibold text-slate-400">
          {t("kitchenAdmin.field.sortOrder")}
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
          {t("kitchenAdmin.notice.managePermissionRequired")}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!canManage || isPending}
          className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Pencil size={15} />
          {isPending ? t("kitchenAdmin.common.saving") : t("kitchenAdmin.action.saveStation")}
        </button>
        {selectedStation && (
          <button
            type="button"
            disabled={!canManage || isPending}
            onClick={() => onStatusChange(nextStatus)}
            className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-xs font-bold text-slate-100 transition hover:border-blue-400/40 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {nextStatus === "Active" ? <CircleCheck size={15} /> : <CirclePause size={15} />}
            {nextStatus === "Active" ? t("kitchenAdmin.common.activate") : t("kitchenAdmin.common.suspend")}
          </button>
        )}
      </div>
    </form>
  );
}

function RouteRow({ route, canManage, isPending, onDisable }) {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1728] p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-white">
            <Route size={14} className="text-blue-300" />
            {route.kitchenStationCode} · {route.kitchenStationName}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {t("kitchenAdmin.route.sortUpdated", {
              sort: route.sortOrder,
              updated: formatDateTime(route.updatedAtUtc),
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge tone={route.kitchenStationStatus === "Active" ? "success" : "warning"}>
            {statusLabel(route.kitchenStationStatus, t)}
          </StatusBadge>
          <StatusBadge tone={route.isEnabled ? "info" : "neutral"}>
            {route.isEnabled ? t("kitchenAdmin.common.enabled") : t("kitchenAdmin.common.disabled")}
          </StatusBadge>
          {route.isEnabled && (
            <button
              type="button"
              disabled={!canManage || isPending}
              onClick={onDisable}
              className="rounded-lg border border-white/10 bg-white/[0.035] px-2 py-1 text-[10px] font-bold text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("kitchenAdmin.action.disable")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KitchenAdminPage() {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const [tab, setTab] = useState("stations");
  const [stationSearch, setStationSearch] = useState("");
  const [stationStatus, setStationStatus] = useState("");
  const [selectedStationId, setSelectedStationId] = useState(null);
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

  const selectStation = (station) => {
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
      showNotice(t("kitchenAdmin.notice.invalidSortOrder"));
      return;
    }

    try {
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
      showNotice(t("kitchenAdmin.notice.stationUpdated"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
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
      showNotice(
        status === "Active"
          ? t("kitchenAdmin.notice.stationActivated")
          : t("kitchenAdmin.notice.stationSuspended"),
      );
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  const submitRoute = async () => {
    const sortOrder = parseSortOrder(routeForm.sortOrder);
    if (!routeForm.kitchenStationId || sortOrder === null) {
      showNotice(t("kitchenAdmin.notice.selectStationAndSort"));
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
      showNotice(t("kitchenAdmin.notice.routeSaved"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
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
      showNotice(t("kitchenAdmin.notice.routeDisabled"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  return (
    <AppLayout>
      <main className="space-y-4" dir="rtl">
        <PageHeader
          title={t("kitchenAdmin.pageTitle")}
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => stationsQuery.refetch()}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
              >
                <RefreshCw size={14} />
                {t("kitchenAdmin.refresh")}
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
            ["stations", t("kitchenAdmin.tab.stations"), ChefHat],
            ["routing", t("kitchenAdmin.tab.routing"), ArrowRightLeft],
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
            title={t("kitchenAdmin.gate.companyRequired.title")}
            message={t("kitchenAdmin.gate.companyRequired.message")}
          />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label={t("kitchenAdmin.gate.checkingPermissions")} />
        ) : !viewPermissionQuery.hasPermission ? (
          <ErrorState
            title={t("kitchenAdmin.gate.permissionRequired.title")}
            message={t("kitchenAdmin.gate.permissionRequired.message")}
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
                    placeholder={t("kitchenAdmin.field.searchCodeOrName")}
                  />
                </label>
                <select
                  value={stationStatus}
                  onChange={(event) => setStationStatus(event.target.value)}
                  className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-blue-400/60"
                >
                  <option value="">{t("kitchenAdmin.common.all")}</option>
                  <option value="Active">{t("kitchenAdmin.common.active")}</option>
                  <option value="Suspended">{t("kitchenAdmin.common.suspended")}</option>
                </select>
              </div>

              {stationsQuery.isLoading && <LoadingState label={t("kitchenAdmin.loadingStations")} />}
              {stationsQuery.isError && (
                <ErrorState
                  title={t("kitchenAdmin.loadStationsError")}
                  message={getErrorMessage(stationsQuery.error, t)}
                />
              )}
              {!stationsQuery.isLoading &&
                !stationsQuery.isError &&
                stationsQuery.data?.length === 0 && (
                  <EmptyState
                    title={t("kitchenAdmin.emptyStations.title")}
                    message={t("kitchenAdmin.emptyStations.message")}
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
                    {t("kitchenAdmin.stationDetails.label")}
                  </div>
                  <h2 className="mt-1 text-xl font-black text-white">
                    {selectedStation?.code ||
                      (selectedStationId
                        ? t("kitchenAdmin.stationDetails.loading")
                        : t("kitchenAdmin.stationDetails.selectPrompt"))}
                  </h2>
                </div>
                {selectedStation && (
                  <StatusBadge tone={statusTone(selectedStation.status)}>
                    {statusLabel(selectedStation.status, t)}
                  </StatusBadge>
                )}
              </div>

              {selectedStationId && stationDetailsQuery.isLoading && (
                <LoadingState label={t("kitchenAdmin.loadingStationDetails")} />
              )}
              {selectedStationId && stationDetailsQuery.isError && (
                <ErrorState
                  title={t("kitchenAdmin.loadStationDetailsError")}
                  message={getErrorMessage(stationDetailsQuery.error, t)}
                />
              )}
              {selectedStation && (
                <div className="space-y-4">
                  {selectedStation && (
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                        <div className="text-[11px] text-slate-500">{t("kitchenAdmin.field.name")}</div>
                        <div className="mt-1 text-sm font-black text-white">
                          {selectedStation.name}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                        <div className="text-[11px] text-slate-500">{t("kitchenAdmin.card.created")}</div>
                        <div className="mt-1 text-sm font-black text-white">
                          {formatDateTime(selectedStation.createdAtUtc)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                        <div className="text-[11px] text-slate-500">{t("kitchenAdmin.card.routes")}</div>
                        <div className="mt-1 text-sm font-black text-white">
                          {selectedStation.routes.length}
                        </div>
                      </div>
                    </div>
                  )}

                  <StationForm
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
                        {t("kitchenAdmin.stationRouteSummary")}
                      </div>
                      {selectedStation.routes.length === 0 ? (
                        <EmptyState
                          title={t("kitchenAdmin.emptyRoutes.title")}
                          message={t("kitchenAdmin.emptyRoutes.message")}
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
                                    {t("kitchenAdmin.route.skuSort", {
                                      sku: route.sku || t("kitchenAdmin.common.noSku"),
                                      sort: route.sortOrder,
                                    })}
                                  </div>
                                </div>
                                <StatusBadge tone={route.isEnabled ? "info" : "neutral"}>
                                  {route.isEnabled ? t("kitchenAdmin.common.enabled") : t("kitchenAdmin.common.disabled")}
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
                  placeholder={t("kitchenAdmin.field.searchVariant")}
                />
              </label>

              {catalogQuery.isLoading && <LoadingState label={t("kitchenAdmin.loadingVariants")} />}
              {catalogQuery.isError && (
                <ErrorState
                  title={t("kitchenAdmin.loadVariantsError")}
                  message={getErrorMessage(catalogQuery.error, t)}
                />
              )}
              {!catalogQuery.isLoading && !catalogQuery.isError && variants.length === 0 && (
                <EmptyState
                  title={t("kitchenAdmin.emptyVariants.title")}
                  message={t("kitchenAdmin.emptyVariants.message")}
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
                        {item.categoryName || t("kitchenAdmin.common.uncategorized")} ·{" "}
                        {item.sku || t("kitchenAdmin.common.noSku")}
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
                  {t("kitchenAdmin.routing.heading")}
                </div>
                <h2 className="mt-1 text-xl font-black text-white">
                  {selectedVariantId
                    ? t("kitchenAdmin.routing.assignmentTitle")
                    : t("kitchenAdmin.routing.selectVariantTitle")}
                </h2>
              </div>

              {!selectedVariantId ? (
                <EmptyState
                  title={t("kitchenAdmin.emptySelectVariant.title")}
                  message={t("kitchenAdmin.emptySelectVariant.message")}
                />
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                    <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_120px_auto]">
                      <label className="text-xs font-semibold text-slate-400">
                        {t("kitchenAdmin.field.kitchenStation")}
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
                          <option value="">{t("kitchenAdmin.field.selectActiveStation")}</option>
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
                        {t("kitchenAdmin.field.sort")}
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
                        {t("kitchenAdmin.action.assignEnable")}
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {t("kitchenAdmin.routing.hint")}
                    </div>
                  </div>

                  {routesQuery.isLoading && <LoadingState label={t("kitchenAdmin.loadingRoutes")} />}
                  {routesQuery.isError && (
                    <ErrorState
                      title={t("kitchenAdmin.loadRoutesError")}
                      message={getErrorMessage(routesQuery.error, t)}
                    />
                  )}
                  {!routesQuery.isLoading &&
                    !routesQuery.isError &&
                    routesQuery.data?.length === 0 && (
                      <EmptyState
                        title={t("kitchenAdmin.emptyKitchenRoutes.title")}
                        message={t("kitchenAdmin.emptyKitchenRoutes.message")}
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
