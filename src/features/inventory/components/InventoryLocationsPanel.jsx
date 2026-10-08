import { useMemo, useState } from "react";
import {
  CircleCheck,
  CirclePause,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
} from "lucide-react";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "../../../shared/components/ui";
import { formatDateTime } from "../../../shared/utils/formatters";
import { useI18n } from "../../../i18n/I18nContext";
import {
  useChangeInventoryLocationStatus,
  useCreateInventoryLocation,
  useInventoryLocationDetails,
  useInventoryLocations,
  useUpdateInventoryLocation,
} from "../hooks/useInventory";

const EMPTY_LOCATION_FORM = { code: "", name: "", isDefault: false, sortOrder: "0" };

function getErrorMessage(error, t) {
  return error?.message || t("inventory.common.requestFailed");
}

function statusTone(status) {
  return status === "Active" ? "success" : "warning";
}

function statusLabel(status, t) {
  return status === "Active" ? t("inventory.common.active") : t("inventory.common.suspended");
}

function parseSortOrder(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function LocationCard({ location, selected, onSelect }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-3 text-start transition hover:border-accent-line hover:bg-accent-soft ${
        selected ? "border-accent-line bg-accent-soft" : "border-line bg-raised"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="shrink-0 text-accent" />
            <div className="truncate text-sm font-black text-ink">{location.name}</div>
            {location.isDefault && <Star size={13} className="shrink-0 text-warning" />}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="font-semibold text-muted">{location.code}</span>
            <span>{t("inventory.locations.sortLine", { sort: location.sortOrder })}</span>
          </div>
        </div>
        <StatusBadge tone={statusTone(location.status)}>{statusLabel(location.status, t)}</StatusBadge>
      </div>
    </button>
  );
}

function LocationForm({
  mode,
  form,
  setForm,
  selectedLocation,
  canManage,
  isPending,
  onSubmit,
  onStatusChange,
}) {
  const { t } = useI18n();
  const nextStatus = selectedLocation?.status === "Active" ? "Suspended" : "Active";
  const suspendBlocked =
    nextStatus === "Suspended" && selectedLocation?.isDefault && selectedLocation?.status === "Active";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_140px]">
        <label className="text-sm font-semibold text-muted">
          {t("inventory.locations.field.code")}
          <input
            value={form.code}
            onChange={(event) => setForm((draft) => ({ ...draft, code: event.target.value }))}
            maxLength={50}
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
          />
        </label>
        <label className="text-sm font-semibold text-muted">
          {t("inventory.locations.field.name")}
          <input
            value={form.name}
            onChange={(event) => setForm((draft) => ({ ...draft, name: event.target.value }))}
            maxLength={200}
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
          />
        </label>
        <label className="text-sm font-semibold text-muted">
          {t("inventory.locations.field.sortOrder")}
          <input
            type="number"
            min="0"
            value={form.sortOrder}
            onChange={(event) =>
              setForm((draft) => ({ ...draft, sortOrder: event.target.value }))
            }
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
          />
        </label>
      </div>

      {mode === "create" ? (
        <label className="flex items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(event) =>
              setForm((draft) => ({ ...draft, isDefault: event.target.checked }))
            }
            disabled={!canManage || isPending}
          />
          {t("inventory.locations.field.setAsDefault")}
        </label>
      ) : (
        <div className="rounded-xl border border-line bg-raised px-3 py-2 text-sm text-muted">
          {t("inventory.locations.defaultFlagReadOnlyNotice")}
          {selectedLocation?.isDefault && (
            <span className="ml-1 font-semibold text-warning">
              {t("inventory.locations.isDefaultForBranch")}
            </span>
          )}
        </div>
      )}

      {!canManage && (
        <div className="rounded-xl border border-warning bg-warning-soft px-3 py-2 text-sm text-warning">
          {t("inventory.locations.notice.configurePermissionRequired")}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!canManage || isPending}
          className="flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mode === "edit" ? <Pencil size={15} /> : <Plus size={15} />}
          {isPending
            ? t("inventory.common.saving")
            : mode === "edit"
              ? t("inventory.locations.action.saveLocation")
              : t("inventory.locations.action.createLocation")}
        </button>
        {mode === "edit" && selectedLocation && (
          <button
            type="button"
            disabled={!canManage || isPending}
            onClick={() => onStatusChange(nextStatus)}
            title={suspendBlocked ? t("inventory.locations.defaultCannotSuspendTooltip") : undefined}
            className="flex h-10 items-center gap-2 rounded-xl border border-line bg-raised px-4 text-sm font-bold text-ink transition hover:border-accent-line hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            {nextStatus === "Active" ? <CircleCheck size={15} /> : <CirclePause size={15} />}
            {nextStatus === "Active" ? t("inventory.common.activate") : t("inventory.common.suspend")}
          </button>
        )}
      </div>
    </form>
  );
}

export function InventoryLocationsPanel({ companyId, branchId, canView, canConfigure }) {
  const { t } = useI18n();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [mode, setMode] = useState("create");
  const [form, setForm] = useState(EMPTY_LOCATION_FORM);
  const [notice, setNotice] = useState("");

  const filters = useMemo(() => ({ status, search: search.trim() }), [status, search]);
  const locationsQuery = useInventoryLocations(companyId, branchId, filters, canView);
  const detailsQuery = useInventoryLocationDetails(
    companyId,
    branchId,
    selectedLocationId,
    canView && Boolean(selectedLocationId),
  );
  const createMutation = useCreateInventoryLocation(companyId, branchId);
  const updateMutation = useUpdateInventoryLocation(companyId, branchId, selectedLocationId);
  const statusMutation = useChangeInventoryLocationStatus(companyId, branchId, selectedLocationId);
  const selectedLocation = detailsQuery.data || null;
  const isPending =
    createMutation.isPending || updateMutation.isPending || statusMutation.isPending;

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const startCreate = () => {
    setMode("create");
    setSelectedLocationId(null);
    setForm(EMPTY_LOCATION_FORM);
  };

  const selectLocation = (location) => {
    setMode("edit");
    setSelectedLocationId(location.inventoryLocationId);
    setForm({
      code: location.code,
      name: location.name,
      isDefault: location.isDefault,
      sortOrder: String(location.sortOrder),
    });
  };

  const submitLocation = async () => {
    const sortOrder = parseSortOrder(form.sortOrder);
    if (sortOrder === null) {
      showNotice(t("inventory.locations.notice.invalidSortOrder"));
      return;
    }

    try {
      if (mode === "create") {
        const created = await createMutation.mutateAsync({
          code: form.code,
          name: form.name,
          isDefault: form.isDefault,
          sortOrder,
        });
        setMode("edit");
        setSelectedLocationId(created.inventoryLocationId);
        setForm({
          code: created.code,
          name: created.name,
          isDefault: created.isDefault,
          sortOrder: String(created.sortOrder),
        });
        showNotice(t("inventory.locations.notice.locationCreated"));
        return;
      }

      const updated = await updateMutation.mutateAsync({
        code: form.code,
        name: form.name,
        sortOrder,
      });
      setForm({
        code: updated.code,
        name: updated.name,
        isDefault: updated.isDefault,
        sortOrder: String(updated.sortOrder),
      });
      showNotice(t("inventory.locations.notice.locationUpdated"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  const changeStatus = async (nextStatus) => {
    try {
      const updated = await statusMutation.mutateAsync({ status: nextStatus });
      setForm({
        code: updated.code,
        name: updated.name,
        isDefault: updated.isDefault,
        sortOrder: String(updated.sortOrder),
      });
      showNotice(
        nextStatus === "Active"
          ? t("inventory.locations.notice.locationActivated")
          : t("inventory.locations.notice.locationSuspended"),
      );
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  if (!branchId) {
    return (
      <EmptyState
        title={t("inventory.locations.gate.branchRequired.title")}
        message={t("inventory.locations.gate.branchRequired.message")}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-ink">{t("inventory.locations.heading")}</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => locationsQuery.refetch()}
            className="flex items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-sm font-bold text-ink"
          >
            <RefreshCw size={14} />
            {t("inventory.common.refresh")}
          </button>
          <button
            type="button"
            onClick={startCreate}
            className="flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-bold text-white"
          >
            <Plus size={14} />
            {t("inventory.locations.action.newLocation")}
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-xl border border-accent-line bg-accent-soft px-3 py-2 text-sm text-accent">
          {notice}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <section className="rounded-xl border border-line bg-surface p-3">
          <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_130px]">
            <label className="relative block">
              <Search
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-subtle"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                maxLength={100}
                placeholder={t("inventory.locations.field.searchCodeOrName")}
                className="h-10 w-full rounded-xl border border-line bg-canvas pr-9 pl-3 text-sm text-ink outline-none focus:border-accent-line"
              />
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line"
            >
              <option value="">{t("inventory.common.allStatus")}</option>
              <option value="Active">{t("inventory.common.active")}</option>
              <option value="Suspended">{t("inventory.common.suspended")}</option>
            </select>
          </div>

          {locationsQuery.isLoading && <LoadingState label={t("inventory.locations.loading")} />}
          {locationsQuery.isError && (
            <ErrorState
              title={t("inventory.locations.loadError")}
              message={getErrorMessage(locationsQuery.error, t)}
            />
          )}
          {!locationsQuery.isLoading &&
            !locationsQuery.isError &&
            locationsQuery.data?.length === 0 && (
              <EmptyState
                title={t("inventory.locations.emptyLocations.title")}
                message={t("inventory.locations.emptyLocations.message")}
              />
            )}
          {!locationsQuery.isLoading &&
            !locationsQuery.isError &&
            Boolean(locationsQuery.data?.length) && (
              <div className="max-h-[calc(100vh-380px)] min-h-[300px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                {locationsQuery.data.map((location) => (
                  <LocationCard
                    key={location.inventoryLocationId}
                    location={location}
                    selected={selectedLocationId === location.inventoryLocationId}
                    onSelect={() => selectLocation(location)}
                  />
                ))}
              </div>
            )}
        </section>

        <section className="rounded-xl border border-line bg-surface p-4">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <MapPin size={15} className="text-accent" />
                {mode === "create"
                  ? t("inventory.locations.details.createLabel")
                  : t("inventory.locations.details.detailsLabel")}
              </div>
              <h2 className="mt-1 text-xl font-black text-ink">
                {mode === "create"
                  ? t("inventory.locations.details.newLocationTitle")
                  : selectedLocation?.name || t("inventory.locations.details.loadingLocationTitle")}
              </h2>
            </div>
            {selectedLocation && (
              <StatusBadge tone={statusTone(selectedLocation.status)}>
                {statusLabel(selectedLocation.status, t)}
              </StatusBadge>
            )}
          </div>

          {mode === "edit" && detailsQuery.isLoading && (
            <LoadingState label={t("inventory.locations.loadingDetails")} />
          )}
          {mode === "edit" && detailsQuery.isError && (
            <ErrorState
              title={t("inventory.locations.loadDetailsError")}
              message={getErrorMessage(detailsQuery.error, t)}
            />
          )}
          {(mode === "create" || selectedLocation) && (
            <div className="space-y-4">
              {selectedLocation && (
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-xl border border-line bg-raised p-3">
                    <div className="text-xs text-subtle">{t("inventory.locations.field.defaultLocation")}</div>
                    <div className="mt-1 text-sm font-black text-ink">
                      {selectedLocation.isDefault ? t("inventory.common.yes") : t("inventory.common.no")}
                    </div>
                  </div>
                  <div className="rounded-xl border border-line bg-raised p-3">
                    <div className="text-xs text-subtle">{t("inventory.locations.field.sortOrder")}</div>
                    <div className="mt-1 text-sm font-black text-ink">
                      {selectedLocation.sortOrder}
                    </div>
                  </div>
                  <div className="rounded-xl border border-line bg-raised p-3">
                    <div className="text-xs text-subtle">{t("inventory.common.created")}</div>
                    <div className="mt-1 text-sm font-black text-ink">
                      {formatDateTime(selectedLocation.createdAtUtc)}
                    </div>
                  </div>
                </div>
              )}

              <LocationForm
                mode={mode}
                form={form}
                setForm={setForm}
                selectedLocation={selectedLocation}
                canManage={canConfigure}
                isPending={isPending}
                onSubmit={submitLocation}
                onStatusChange={changeStatus}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
