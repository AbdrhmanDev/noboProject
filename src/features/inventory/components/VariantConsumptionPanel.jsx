import { useMemo, useState } from "react";
import { Layers, Plus, RefreshCw, Trash2 } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../../../shared/components/ui";
import { useActiveUnitsOfMeasure } from "../../catalog/hooks/useCatalog";
import {
  useActiveInventoryItems,
  useProductVariantInventoryConsumption,
  useRemoveProductVariantInventoryComponent,
  useSetProductVariantInventoryComponent,
} from "../hooks/useInventory";
import { parsePositiveQuantity } from "../utils/inventoryQuantity";
import { ProductVariantPicker } from "./ProductVariantPicker";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

export function VariantConsumptionPanel({ companyId, canView, canConfigure }) {
  const [productId, setProductId] = useState(null);
  const [productVariantId, setProductVariantId] = useState(null);
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState("");
  const [quantityInput, setQuantityInput] = useState("");
  const [notice, setNotice] = useState("");

  const unitsOfMeasureQuery = useActiveUnitsOfMeasure(canView);
  const activeItemsQuery = useActiveInventoryItems(companyId, canView);
  const consumptionQuery = useProductVariantInventoryConsumption(
    companyId,
    productVariantId,
    canView && Boolean(productVariantId),
  );
  const setComponentMutation = useSetProductVariantInventoryComponent(companyId, productVariantId);
  const removeComponentMutation = useRemoveProductVariantInventoryComponent(
    companyId,
    productVariantId,
  );

  const uomAllowsFractional = useMemo(() => {
    const map = new Map((unitsOfMeasureQuery.data || []).map((uom) => [uom.id, uom]));
    return (unitOfMeasureId) => map.get(unitOfMeasureId)?.allowsFractionalQuantity ?? true;
  }, [unitsOfMeasureQuery.data]);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const selectProduct = (nextProductId) => {
    setProductId(nextProductId);
    setProductVariantId(null);
    setSelectedInventoryItemId("");
    setQuantityInput("");
  };

  const selectVariant = (nextVariantId) => {
    setProductVariantId(nextVariantId);
    setSelectedInventoryItemId("");
    setQuantityInput("");
  };

  const submitComponent = async (inventoryItemId, quantityValue) => {
    if (!inventoryItemId) {
      showNotice("Select an inventory item.");
      return;
    }

    const item = (activeItemsQuery.data || []).find(
      (candidate) => candidate.inventoryItemId === inventoryItemId,
    );
    const allowsFractional = item ? uomAllowsFractional(item.baseUnitOfMeasure.id) : true;
    const parsed = parsePositiveQuantity(quantityValue, allowsFractional);

    if (parsed.amount === null) {
      showNotice(parsed.error);
      return;
    }

    try {
      await setComponentMutation.mutateAsync({
        inventoryItemId,
        payload: { quantityPerSalesUnit: parsed.amount },
      });
      setSelectedInventoryItemId("");
      setQuantityInput("");
      showNotice("Consumption component saved.");
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const removeComponent = async (inventoryItemId) => {
    try {
      await removeComponentMutation.mutateAsync({ inventoryItemId });
      showNotice("Consumption component removed.");
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const components = consumptionQuery.data?.components || [];
  const configuredItemIds = new Set(components.map((component) => component.inventoryItemId));
  const availableItemsToAdd = (activeItemsQuery.data || []).filter(
    (item) => !configuredItemIds.has(item.inventoryItemId),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-white">Variant Consumption</h2>
        {productVariantId && (
          <button
            type="button"
            onClick={() => consumptionQuery.refetch()}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        )}
      </div>

      {notice && (
        <div className="rounded-xl border border-blue-400/25 bg-blue-500/10 px-3 py-2 text-xs text-blue-100">
          {notice}
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
        <ProductVariantPicker
          companyId={companyId}
          enabled={canView}
          productId={productId}
          onProductChange={selectProduct}
          productVariantId={productVariantId}
          onVariantChange={selectVariant}
        />
      </section>

      {!productVariantId ? (
        <EmptyState
          title="Select a product variant"
          message="Choose a product and variant to view its inventory consumption components."
        />
      ) : (
        <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
          <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
            <Layers size={15} className="text-blue-300" />
            Components consumed per one sales unit of this variant
          </div>

          {consumptionQuery.isLoading && <LoadingState label="Loading consumption components..." />}
          {consumptionQuery.isError && (
            <ErrorState
              title="Unable to load consumption components"
              message={getErrorMessage(consumptionQuery.error)}
            />
          )}

          {!consumptionQuery.isLoading && !consumptionQuery.isError && (
            <div className="space-y-2">
              {components.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-500">
                  No consumption components configured for this variant yet.
                </div>
              )}
              {components.map((component) => (
                <div
                  key={component.inventoryItemId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-white">{component.name}</div>
                    <div className="text-xs text-slate-400">{component.code}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      defaultValue={String(component.quantityPerSalesUnit)}
                      disabled={!canConfigure || setComponentMutation.isPending}
                      onBlur={(event) => {
                        if (event.target.value === String(component.quantityPerSalesUnit)) return;
                        submitComponent(component.inventoryItemId, event.target.value);
                      }}
                      className="h-9 w-28 rounded-lg border border-white/10 bg-black/20 px-2 text-right text-xs text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
                    />
                    <span className="text-xs text-slate-500">
                      {component.baseUnitOfMeasure.symbol}
                    </span>
                    <button
                      type="button"
                      disabled={!canConfigure || removeComponentMutation.isPending}
                      onClick={() => removeComponent(component.inventoryItemId)}
                      className="rounded-lg border border-rose-400/25 p-2 text-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {canConfigure && (
            <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-white/10 pt-4">
              <label className="text-xs font-semibold text-slate-400">
                Add inventory item
                <select
                  value={selectedInventoryItemId}
                  onChange={(event) => setSelectedInventoryItemId(event.target.value)}
                  disabled={activeItemsQuery.isLoading}
                  className="mt-1 h-10 w-56 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
                >
                  <option value="">Select item...</option>
                  {availableItemsToAdd.map((item) => (
                    <option key={item.inventoryItemId} value={item.inventoryItemId}>
                      {item.name} ({item.baseUnitOfMeasure.symbol})
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-400">
                Quantity per sales unit
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantityInput}
                  onChange={(event) => setQuantityInput(event.target.value)}
                  className="mt-1 h-10 w-40 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-blue-400/60"
                  placeholder="0.00"
                />
              </label>
              <button
                type="button"
                disabled={setComponentMutation.isPending}
                onClick={() => submitComponent(selectedInventoryItemId, quantityInput)}
                className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={15} />
                Add component
              </button>
            </div>
          )}
          {!canConfigure && (
            <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              Inventory.Configure permission is required to change consumption components.
            </div>
          )}
        </section>
      )}
    </div>
  );
}
