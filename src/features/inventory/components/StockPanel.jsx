import { useMemo, useState } from "react";
import { ArrowUpDown, PackageSearch, RefreshCw, Search } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../../../shared/components/ui";
import {
  useActiveInventoryItems,
  useInventoryLocations,
  useInventoryLocationStock,
  useOperationalInventoryLocations,
} from "../hooks/useInventory";
import { StockAdjustmentDialog } from "./StockAdjustmentDialog";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

function quantityTone(quantity) {
  if (quantity < 0) return "text-rose-300";
  if (quantity === 0) return "text-slate-500";
  return "text-slate-100";
}

export function StockPanel({ companyId, branchId, canView, canAdjust, notify }) {
  const [locationId, setLocationId] = useState("");
  const [search, setSearch] = useState("");
  const [adjustDialog, setAdjustDialog] = useState(null);

  const locationsQuery = useInventoryLocations(companyId, branchId, {}, canView);
  const operationalLocationsQuery = useOperationalInventoryLocations(companyId, branchId, canAdjust);
  const activeItemsQuery = useActiveInventoryItems(companyId, canAdjust);
  const stockQuery = useInventoryLocationStock(
    companyId,
    branchId,
    locationId,
    canView && Boolean(locationId),
  );

  const locations = locationsQuery.data || [];
  const filteredItems = useMemo(() => {
    const items = stockQuery.data?.items || [];
    const term = search.trim().toLowerCase();
    if (!term) return items;

    return items.filter(
      (item) =>
        item.code.toLowerCase().includes(term) || item.name.toLowerCase().includes(term),
    );
  }, [stockQuery.data, search]);

  const openAdjustDialog = (initialInventoryItemId) => {
    setAdjustDialog({
      initialLocationId: locationId || "",
      initialInventoryItemId: initialInventoryItemId || "",
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_1fr] sm:max-w-xl">
          <select
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-blue-400/60"
          >
            <option value="">Select location...</option>
            {locations.map((location) => (
              <option key={location.inventoryLocationId} value={location.inventoryLocationId}>
                {location.name} ({location.code})
                {location.status === "Suspended" ? " · Suspended" : ""}
              </option>
            ))}
          </select>
          <label className="relative block">
            <Search
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search item code or name"
              disabled={!locationId}
              className="h-10 w-full rounded-xl border border-white/10 bg-black/20 pr-9 pl-3 text-xs text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {locationId && (
            <button
              type="button"
              onClick={() => stockQuery.refetch()}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          )}
          {canAdjust && (
            <button
              type="button"
              onClick={() => openAdjustDialog()}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white"
            >
              <ArrowUpDown size={14} />
              Adjust Stock
            </button>
          )}
        </div>
      </div>

      {!locationId ? (
        <EmptyState
          title="Select an inventory location"
          message="Choose a location to view its current stock on hand."
        />
      ) : (
        <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
          {stockQuery.isLoading && <LoadingState label="Loading stock..." />}
          {stockQuery.isError && (
            <ErrorState title="Unable to load stock" message={getErrorMessage(stockQuery.error)} />
          )}
          {!stockQuery.isLoading && !stockQuery.isError && filteredItems.length === 0 && (
            <EmptyState
              title="No stock recorded"
              message={
                search.trim()
                  ? "No items match the current search."
                  : "No inventory item has a recorded balance at this location yet."
              }
            />
          )}
          {!stockQuery.isLoading && !stockQuery.isError && filteredItems.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-right text-slate-500">
                    <th className="pb-2 font-medium">Code</th>
                    <th className="pb-2 font-medium">Item</th>
                    <th className="pb-2 font-medium">UOM</th>
                    <th className="pb-2 font-medium">Quantity on hand</th>
                    {canAdjust && <th className="pb-2 font-medium"></th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.inventoryItemId} className="border-b border-white/5">
                      <td className="py-2.5 text-slate-300">{item.code}</td>
                      <td className="py-2.5 text-slate-100">{item.name}</td>
                      <td className="py-2.5 text-slate-400">{item.baseUnitOfMeasure.symbol}</td>
                      <td className={`py-2.5 font-bold ${quantityTone(Number(item.quantityOnHand))}`}>
                        {item.quantityOnHand}
                      </td>
                      {canAdjust && (
                        <td className="py-2.5 text-left">
                          <button
                            type="button"
                            onClick={() => openAdjustDialog(item.inventoryItemId)}
                            className="rounded-lg border border-white/10 px-2 py-1 text-[11px] font-bold text-blue-300 hover:bg-blue-500/10"
                          >
                            Adjust
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {!canAdjust && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          <PackageSearch size={13} className="mb-0.5 mr-1 inline text-amber-300" />
          Inventory.AdjustStock permission is required to record manual stock adjustments.
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
