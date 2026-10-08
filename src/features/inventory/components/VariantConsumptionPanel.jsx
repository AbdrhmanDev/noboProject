import { useMemo, useState } from "react";
import { Layers, Plus, RefreshCw, Trash2 } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../../../shared/components/ui";
import { useI18n } from "../../../i18n/I18nContext";
import { useActiveUnitsOfMeasure } from "../../catalog/hooks/useCatalog";
import {
  useActiveInventoryItems,
  useProductVariantInventoryConsumption,
  useRemoveProductVariantInventoryComponent,
  useSetProductVariantInventoryComponent,
} from "../hooks/useInventory";
import { parsePositiveQuantity } from "../utils/inventoryQuantity";
import { ProductVariantPicker } from "./ProductVariantPicker";

function getErrorMessage(error, t) {
  return error?.message || t("inventory.common.requestFailed");
}

export function VariantConsumptionPanel({ companyId, canView, canConfigure }) {
  const { t } = useI18n();
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
      showNotice(t("inventory.variantConsumption.validation.selectItem"));
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
      showNotice(t("inventory.variantConsumption.notice.componentSaved"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  const removeComponent = async (inventoryItemId) => {
    try {
      await removeComponentMutation.mutateAsync({ inventoryItemId });
      showNotice(t("inventory.variantConsumption.notice.componentRemoved"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
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
        <h2 className="text-sm font-bold text-ink">{t("inventory.variantConsumption.heading")}</h2>
        {productVariantId && (
          <button
            type="button"
            onClick={() => consumptionQuery.refetch()}
            className="flex items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-sm font-bold text-ink"
          >
            <RefreshCw size={14} />
            {t("inventory.common.refresh")}
          </button>
        )}
      </div>

      {notice && (
        <div className="rounded-xl border border-accent-line bg-accent-soft px-3 py-2 text-sm text-accent">
          {notice}
        </div>
      )}

      <section className="rounded-xl border border-line bg-surface p-4">
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
          title={t("inventory.variantConsumption.emptySelectVariant.title")}
          message={t("inventory.variantConsumption.emptySelectVariant.message")}
        />
      ) : (
        <section className="rounded-xl border border-line bg-surface p-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted">
            <Layers size={15} className="text-accent" />
            {t("inventory.variantConsumption.subheading")}
          </div>

          {consumptionQuery.isLoading && <LoadingState label={t("inventory.variantConsumption.loading")} />}
          {consumptionQuery.isError && (
            <ErrorState
              title={t("inventory.variantConsumption.loadError")}
              message={getErrorMessage(consumptionQuery.error, t)}
            />
          )}

          {!consumptionQuery.isLoading && !consumptionQuery.isError && (
            <div className="space-y-2">
              {components.length === 0 && (
                <div className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-subtle">
                  {t("inventory.variantConsumption.emptyComponents")}
                </div>
              )}
              {components.map((component) => (
                <div
                  key={component.inventoryItemId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-raised p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-ink">{component.name}</div>
                    <div className="text-sm text-muted">{component.code}</div>
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
                      className="h-9 w-28 rounded-lg border border-line bg-canvas px-2 text-right text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
                    />
                    <span className="text-sm text-subtle">
                      {component.baseUnitOfMeasure.symbol}
                    </span>
                    <button
                      type="button"
                      disabled={!canConfigure || removeComponentMutation.isPending}
                      onClick={() => removeComponent(component.inventoryItemId)}
                      className="rounded-lg border border-danger p-2 text-danger disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {canConfigure && (
            <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4">
              <label className="text-sm font-semibold text-muted">
                {t("inventory.variantConsumption.field.addItem")}
                <select
                  value={selectedInventoryItemId}
                  onChange={(event) => setSelectedInventoryItemId(event.target.value)}
                  disabled={activeItemsQuery.isLoading}
                  className="mt-1 h-10 w-56 rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
                >
                  <option value="">{t("inventory.variantConsumption.field.selectItemPlaceholder")}</option>
                  {availableItemsToAdd.map((item) => (
                    <option key={item.inventoryItemId} value={item.inventoryItemId}>
                      {item.name} ({item.baseUnitOfMeasure.symbol})
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-muted">
                {t("inventory.variantConsumption.field.quantityPerSalesUnit")}
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantityInput}
                  onChange={(event) => setQuantityInput(event.target.value)}
                  className="mt-1 h-10 w-40 rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line"
                  placeholder="0.00"
                />
              </label>
              <button
                type="button"
                disabled={setComponentMutation.isPending}
                onClick={() => submitComponent(selectedInventoryItemId, quantityInput)}
                className="flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={15} />
                {t("inventory.variantConsumption.action.addComponent")}
              </button>
            </div>
          )}
          {!canConfigure && (
            <div className="mt-4 rounded-xl border border-warning bg-warning-soft px-3 py-2 text-sm text-warning">
              {t("inventory.variantConsumption.notice.configurePermissionRequired")}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
