import { useMemo, useState } from "react";
import { ArrowUpDown, MapPin, PackageSearch, RefreshCw } from "lucide-react";
import { ErrorState, LoadingState } from "../../../shared/components/ui";
import { useI18n } from "../../../i18n/I18nContext";
import { ControlPanel } from "../../../shared/components/odoo/ControlPanel";
import { ListView } from "../../../shared/components/odoo/ListView";
import {
  useActiveInventoryItems,
  useInventoryLocations,
  useInventoryLocationStock,
  useOperationalInventoryLocations,
} from "../hooks/useInventory";
import { StockAdjustmentDialog } from "./StockAdjustmentDialog";

const STOCK_STATES = ["inStock", "out", "negative"];

function stockState(item) {
  const quantity = Number(item.quantityOnHand);
  if (quantity < 0) return "negative";
  if (quantity === 0) return "out";
  return "inStock";
}

const QUANTITY_TONE = { negative: "text-danger", out: "text-subtle", inStock: "text-ink" };

// Stock on hand, Odoo style: control panel (location, search, Filters by stock state, Group By
// stock state / unit) over a list. Everything filters the one location's stock already loaded --
// the stock endpoint has no server-side search. Adjustments keep using StockAdjustmentDialog.
export function StockPanel({ companyId, branchId, canView, canAdjust, notify }) {
  const { t } = useI18n();
  const [pickedLocationId, setPickedLocationId] = useState("");
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [groupBy, setGroupBy] = useState("");
  const [adjustDialog, setAdjustDialog] = useState(null);

  const locationsQuery = useInventoryLocations(companyId, branchId, {}, canView);
  const operationalLocationsQuery = useOperationalInventoryLocations(companyId, branchId, canAdjust);
  const activeItemsQuery = useActiveInventoryItems(companyId, canAdjust);

  const locations = useMemo(() => locationsQuery.data || [], [locationsQuery.data]);
  // Defaults to the branch's default location (else the first one) instead of an empty page.
  const locationId =
    pickedLocationId ||
    locations.find((location) => location.isDefault && location.status !== "Suspended")?.inventoryLocationId ||
    locations[0]?.inventoryLocationId ||
    "";

  const stockQuery = useInventoryLocationStock(companyId, branchId, locationId, canView && Boolean(locationId));

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (stockQuery.data?.items || []).filter(
      (item) =>
        (!stateFilter || stockState(item) === stateFilter) &&
        (!term || item.code.toLowerCase().includes(term) || item.name.toLowerCase().includes(term)),
    );
  }, [stockQuery.data, search, stateFilter]);

  const groups = useMemo(() => {
    if (!groupBy) return null;
    const map = new Map();
    for (const item of visibleItems) {
      const key = groupBy === "state" ? stockState(item) : item.baseUnitOfMeasure?.symbol || "—";
      const label = groupBy === "state" ? t(`inventory.stock.state.${key}`) : key;
      if (!map.has(key)) map.set(key, { key, label, rows: [] });
      map.get(key).rows.push(item);
    }
    return [...map.values()];
  }, [groupBy, visibleItems, t]);

  const openAdjustDialog = (initialInventoryItemId) => {
    setAdjustDialog({ initialLocationId: locationId || "", initialInventoryItemId: initialInventoryItemId || "" });
  };

  const facets = [
    stateFilter && { id: "state", label: t(`inventory.stock.state.${stateFilter}`), onRemove: () => setStateFilter("") },
    groupBy && {
      id: "group",
      label: `${t("odoo.groupBy")}: ${t(`inventory.stock.groupBy.${groupBy}`)}`,
      onRemove: () => setGroupBy(""),
    },
  ].filter(Boolean);

  const columns = [
    { key: "code", header: t("inventory.stock.col.code"), render: (item) => <span className="text-muted">{item.code}</span> },
    { key: "name", header: t("inventory.stock.col.item"), render: (item) => <span className="font-bold">{item.name}</span> },
    { key: "uom", header: t("inventory.stock.col.uom"), render: (item) => <span className="text-muted">{item.baseUnitOfMeasure.symbol}</span> },
    {
      key: "qty",
      header: t("inventory.stock.col.onHand"),
      align: "end",
      render: (item) => <span className={`font-bold ${QUANTITY_TONE[stockState(item)]}`}>{item.quantityOnHand}</span>,
    },
    ...(canAdjust
      ? [
          {
            key: "adjust",
            header: "",
            align: "end",
            render: (item) => (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openAdjustDialog(item.inventoryItemId);
                }}
                className="rounded-md border border-line px-2.5 py-1 text-xs font-bold text-accent transition hover:bg-accent-soft"
              >
                {t("inventory.stock.adjust")}
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-3">
      <ControlPanel
        breadcrumbs={[t("nav.inventory"), t("inventory.tabs.stock")]}
        actions={
          <>
            {canAdjust && (
              <button
                type="button"
                onClick={() => openAdjustDialog()}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-bold text-white transition hover:bg-accent-strong"
              >
                <ArrowUpDown size={14} />
                {t("inventory.stock.adjustStock")}
              </button>
            )}
            <button
              type="button"
              onClick={() => stockQuery.refetch()}
              disabled={!locationId}
              aria-label={t("inventory.stock.refresh")}
              title={t("inventory.stock.refresh")}
              className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition hover:bg-hover disabled:opacity-40"
            >
              <RefreshCw size={14} />
            </button>
          </>
        }
        search={{ value: search, onChange: setSearch, placeholder: t("inventory.stock.searchPlaceholder") }}
        facets={facets}
        filters={STOCK_STATES.map((value) => ({
          id: value,
          label: t(`inventory.stock.state.${value}`),
          active: stateFilter === value,
          onToggle: () => setStateFilter((current) => (current === value ? "" : value)),
        }))}
        groupBy={["state", "uom"].map((value) => ({
          id: value,
          label: t(`inventory.stock.groupBy.${value}`),
          active: groupBy === value,
          onSelect: () => setGroupBy((current) => (current === value ? "" : value)),
        }))}
      />

      {locations.length > 0 && (
        <label className="flex w-fit items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-muted">
          <MapPin size={15} className="text-accent" />
          {t("inventory.overview.location")}
          <select
            value={locationId}
            onChange={(event) => setPickedLocationId(event.target.value)}
            className="h-8 rounded-md border border-line bg-canvas px-2 text-ink outline-none"
          >
            {locations.map((location) => (
              <option key={location.inventoryLocationId} value={location.inventoryLocationId}>
                {location.name} ({location.code})
                {location.status === "Suspended" ? ` · ${t("inventory.stock.suspended")}` : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      {(locationsQuery.isLoading || stockQuery.isLoading) && <LoadingState label={t("inventory.overview.loading")} />}
      {stockQuery.isError && <ErrorState title={t("inventory.overview.stockError")} message={stockQuery.error?.message} />}

      {!stockQuery.isLoading && !stockQuery.isError && (
        <ListView
          columns={columns}
          rows={groups ? undefined : visibleItems}
          groups={groups ?? undefined}
          getRowKey={(item) => item.inventoryItemId}
          emptyLabel={
            !locationId
              ? t("inventory.overview.noLocations.message")
              : search.trim() || stateFilter
                ? t("inventory.stock.noMatch")
                : t("inventory.stock.empty")
          }
        />
      )}

      {!canAdjust && (
        <div className="flex items-center gap-2 rounded-xl border border-warning bg-warning-soft px-3 py-2 text-xs text-warning">
          <PackageSearch size={14} className="shrink-0" />
          {t("inventory.stock.adjustPermission")}
        </div>
      )}

      {adjustDialog && (
        <StockAdjustmentDialog
          companyId={companyId}
          branchId={branchId}
          locations={operationalLocationsQuery.data || []}
          items={activeItemsQuery.data || []}
          initialLocationId={adjustDialog.initialLocationId}
          initialInventoryItemId={adjustDialog.initialInventoryItemId}
          onClose={() => setAdjustDialog(null)}
          onSuccess={notify}
        />
      )}
    </div>
  );
}
