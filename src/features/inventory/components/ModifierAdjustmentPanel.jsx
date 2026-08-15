import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Plus, RefreshCw, SlidersHorizontal, Trash2 } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../../../shared/components/ui";
import { ROUTES } from "../../../utils/routes";
import {
  useActiveUnitsOfMeasure,
  useModifierGroupDetails,
  useProductVariantModifierGroups,
} from "../../catalog/hooks/useCatalog";
import {
  useActiveInventoryItems,
  useModifierOptionInventoryAdjustments,
  useRemoveModifierOptionInventoryAdjustment,
  useSetModifierOptionInventoryAdjustment,
} from "../hooks/useInventory";
import { parseNonZeroQuantity } from "../utils/inventoryQuantity";
import { ProductVariantPicker } from "./ProductVariantPicker";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

function ManageModifiersEmptyState({ title, message, onManageModifiers }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.015] p-5 text-center">
      <h3 className="text-sm font-bold text-slate-200">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">{message}</p>
      <button
        type="button"
        onClick={onManageModifiers}
        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-200 transition hover:bg-blue-500/20"
      >
        <ExternalLink size={14} />
        Manage Modifiers
      </button>
    </div>
  );
}

export function ModifierAdjustmentPanel({ companyId, canView, canConfigure }) {
  const navigate = useNavigate();
  const [productId, setProductId] = useState(null);
  const [productVariantId, setProductVariantId] = useState(null);
  const [modifierGroupId, setModifierGroupId] = useState(null);
  const [modifierOptionId, setModifierOptionId] = useState(null);
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState("");
  const [quantityInput, setQuantityInput] = useState("");
  const [notice, setNotice] = useState("");

  const unitsOfMeasureQuery = useActiveUnitsOfMeasure(canView);
  const activeItemsQuery = useActiveInventoryItems(companyId, canView);
  const variantModifierGroupsQuery = useProductVariantModifierGroups(
    companyId,
    productVariantId,
    canView && Boolean(productVariantId),
  );
  const modifierGroupDetailsQuery = useModifierGroupDetails(
    companyId,
    modifierGroupId,
    canView && Boolean(modifierGroupId),
  );
  const adjustmentsQuery = useModifierOptionInventoryAdjustments(
    companyId,
    modifierOptionId,
    canView && Boolean(modifierOptionId),
  );
  const setAdjustmentMutation = useSetModifierOptionInventoryAdjustment(
    companyId,
    modifierOptionId,
  );
  const removeAdjustmentMutation = useRemoveModifierOptionInventoryAdjustment(
    companyId,
    modifierOptionId,
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
    setModifierGroupId(null);
    setModifierOptionId(null);
    setSelectedInventoryItemId("");
    setQuantityInput("");
  };

  const selectVariant = (nextVariantId) => {
    setProductVariantId(nextVariantId);
    setModifierGroupId(null);
    setModifierOptionId(null);
    setSelectedInventoryItemId("");
    setQuantityInput("");
  };

  const selectModifierGroup = (nextGroupId) => {
    setModifierGroupId(nextGroupId || null);
    setModifierOptionId(null);
    setSelectedInventoryItemId("");
    setQuantityInput("");
  };

  const selectModifierOption = (nextOptionId) => {
    setModifierOptionId(nextOptionId || null);
    setSelectedInventoryItemId("");
    setQuantityInput("");
  };

  const submitAdjustment = async (inventoryItemId, quantityValue) => {
    if (!inventoryItemId) {
      showNotice("Select an inventory item.");
      return;
    }

    const item = (activeItemsQuery.data || []).find(
      (candidate) => candidate.inventoryItemId === inventoryItemId,
    );
    const allowsFractional = item ? uomAllowsFractional(item.baseUnitOfMeasure.id) : true;
    const parsed = parseNonZeroQuantity(quantityValue, allowsFractional);

    if (parsed.amount === null) {
      showNotice(parsed.error);
      return;
    }

    try {
      await setAdjustmentMutation.mutateAsync({
        inventoryItemId,
        payload: { quantityDelta: parsed.amount },
      });
      setSelectedInventoryItemId("");
      setQuantityInput("");
      showNotice("Modifier inventory adjustment saved.");
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const removeAdjustment = async (inventoryItemId) => {
    try {
      await removeAdjustmentMutation.mutateAsync({ inventoryItemId });
      showNotice("Modifier inventory adjustment removed.");
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const goToManageModifiers = () => {
    navigate(ROUTES.CATALOG_ADMIN, { state: { tab: "modifiers" } });
  };

  const enabledModifierGroups = (variantModifierGroupsQuery.data?.items || []).filter(
    (group) => group.isEnabled && group.modifierGroupStatus === "Active",
  );
  const modifierOptions = (modifierGroupDetailsQuery.data?.options || []).filter(
    (option) => option.status === "Active",
  );
  const adjustments = adjustmentsQuery.data?.adjustments || [];
  const configuredItemIds = new Set(adjustments.map((adjustment) => adjustment.inventoryItemId));
  const availableItemsToAdd = (activeItemsQuery.data || []).filter(
    (item) => !configuredItemIds.has(item.inventoryItemId),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-white">Modifier Inventory Adjustments</h2>
        {modifierOptionId && (
          <button
            type="button"
            onClick={() => adjustmentsQuery.refetch()}
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

      <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4 space-y-3">
        <ProductVariantPicker
          companyId={companyId}
          enabled={canView}
          productId={productId}
          onProductChange={selectProduct}
          productVariantId={productVariantId}
          onVariantChange={selectVariant}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-400">
            Modifier group
            <select
              value={modifierGroupId || ""}
              onChange={(event) => selectModifierGroup(event.target.value)}
              disabled={!productVariantId || variantModifierGroupsQuery.isLoading}
              className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
            >
              <option value="">Select modifier group...</option>
              {enabledModifierGroups.map((group) => (
                <option key={group.modifierGroupId} value={group.modifierGroupId}>
                  {group.modifierGroupName}
                </option>
              ))}
            </select>
            {!productVariantId && (
              <p className="mt-1 text-[11px] text-slate-500">Select a variant first</p>
            )}
          </label>
          <label className="text-xs font-semibold text-slate-400">
            Modifier option
            <select
              value={modifierOptionId || ""}
              onChange={(event) => selectModifierOption(event.target.value)}
              disabled={!modifierGroupId || modifierGroupDetailsQuery.isLoading}
              className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
            >
              <option value="">Select modifier option...</option>
              {modifierOptions.map((option) => (
                <option key={option.modifierOptionId} value={option.modifierOptionId}>
                  {option.name}
                </option>
              ))}
            </select>
            {!modifierGroupId && productVariantId && (
              <p className="mt-1 text-[11px] text-slate-500">Select a modifier group first</p>
            )}
          </label>
        </div>

        {productVariantId &&
          enabledModifierGroups.length === 0 &&
          !variantModifierGroupsQuery.isLoading && (
            <ManageModifiersEmptyState
              title="No modifier options available"
              message="This variant has no enabled modifier groups yet. Modifier options are created and managed in Catalog before they can be linked to inventory adjustments."
              onManageModifiers={goToManageModifiers}
            />
          )}

        {modifierGroupId &&
          modifierOptions.length === 0 &&
          !modifierGroupDetailsQuery.isLoading && (
            <ManageModifiersEmptyState
              title="No modifier options available"
              message="This modifier group has no active modifier options yet. Modifier options are created and managed in Catalog before they can be linked to inventory adjustments."
              onManageModifiers={goToManageModifiers}
            />
          )}
      </section>

      {!modifierOptionId ? (
        <EmptyState
          title="Select a modifier option"
          message="Choose a product, variant, modifier group, and option to view its inventory adjustments."
        />
      ) : (
        <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
          <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
            <SlidersHorizontal size={15} className="text-blue-300" />
            Adjustment applied on top of the variant&apos;s base consumption when this option is
            selected (positive adds, negative reduces)
          </div>

          {adjustmentsQuery.isLoading && <LoadingState label="Loading inventory adjustments..." />}
          {adjustmentsQuery.isError && (
            <ErrorState
              title="Unable to load inventory adjustments"
              message={getErrorMessage(adjustmentsQuery.error)}
            />
          )}

          {!adjustmentsQuery.isLoading && !adjustmentsQuery.isError && (
            <div className="space-y-2">
              {adjustments.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-500">
                  No inventory adjustments configured for this modifier option yet.
                </div>
              )}
              {adjustments.map((adjustment) => (
                <div
                  key={adjustment.inventoryItemId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-white">
                      {adjustment.inventoryItemName}
                    </div>
                    <div className="text-xs text-slate-400">{adjustment.inventoryItemCode}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      defaultValue={String(adjustment.quantityDelta)}
                      disabled={!canConfigure || setAdjustmentMutation.isPending}
                      onBlur={(event) => {
                        if (event.target.value === String(adjustment.quantityDelta)) return;
                        submitAdjustment(adjustment.inventoryItemId, event.target.value);
                      }}
                      className={`h-9 w-28 rounded-lg border bg-black/20 px-2 text-right text-xs outline-none focus:border-blue-400/60 disabled:opacity-50 ${
                        adjustment.quantityDelta < 0
                          ? "border-rose-400/30 text-rose-200"
                          : "border-white/10 text-white"
                      }`}
                    />
                    <span className="text-xs text-slate-500">
                      {adjustment.baseUnitOfMeasure.symbol}
                    </span>
                    <button
                      type="button"
                      disabled={!canConfigure || removeAdjustmentMutation.isPending}
                      onClick={() => removeAdjustment(adjustment.inventoryItemId)}
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
                Quantity delta (+/-)
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantityInput}
                  onChange={(event) => setQuantityInput(event.target.value)}
                  className="mt-1 h-10 w-40 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-blue-400/60"
                  placeholder="e.g. 0.5 or -0.5"
                />
              </label>
              <button
                type="button"
                disabled={setAdjustmentMutation.isPending}
                onClick={() => submitAdjustment(selectedInventoryItemId, quantityInput)}
                className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={15} />
                Add adjustment
              </button>
            </div>
          )}
          {!canConfigure && (
            <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              Inventory.Configure permission is required to change modifier adjustments.
            </div>
          )}
        </section>
      )}
    </div>
  );
}
