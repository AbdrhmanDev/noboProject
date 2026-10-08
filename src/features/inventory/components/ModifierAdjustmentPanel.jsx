import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Plus, RefreshCw, SlidersHorizontal, Trash2 } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../../../shared/components/ui";
import { useI18n } from "../../../i18n/I18nContext";
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

function getErrorMessage(error, t) {
  return error?.message || t("inventory.common.requestFailed");
}

function ManageModifiersEmptyState({ title, message, onManageModifiers }) {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border border-dashed border-line bg-raised p-5 text-center">
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-5 text-subtle">{message}</p>
      <button
        type="button"
        onClick={onManageModifiers}
        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-accent-line bg-accent-soft px-4 py-2 text-sm font-bold text-accent transition hover:bg-accent-strong/20"
      >
        <ExternalLink size={14} />
        {t("inventory.modifierAdjustment.manageModifiers")}
      </button>
    </div>
  );
}

export function ModifierAdjustmentPanel({ companyId, canView, canConfigure }) {
  const { t } = useI18n();
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
      showNotice(t("inventory.modifierAdjustment.validation.selectItem"));
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
      showNotice(t("inventory.modifierAdjustment.notice.adjustmentSaved"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  const removeAdjustment = async (inventoryItemId) => {
    try {
      await removeAdjustmentMutation.mutateAsync({ inventoryItemId });
      showNotice(t("inventory.modifierAdjustment.notice.adjustmentRemoved"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
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
        <h2 className="text-sm font-bold text-ink">{t("inventory.modifierAdjustment.heading")}</h2>
        {modifierOptionId && (
          <button
            type="button"
            onClick={() => adjustmentsQuery.refetch()}
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

      <section className="rounded-xl border border-line bg-surface p-4 space-y-3">
        <ProductVariantPicker
          companyId={companyId}
          enabled={canView}
          productId={productId}
          onProductChange={selectProduct}
          productVariantId={productVariantId}
          onVariantChange={selectVariant}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-muted">
            {t("inventory.modifierAdjustment.field.modifierGroup")}
            <select
              value={modifierGroupId || ""}
              onChange={(event) => selectModifierGroup(event.target.value)}
              disabled={!productVariantId || variantModifierGroupsQuery.isLoading}
              className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
            >
              <option value="">{t("inventory.modifierAdjustment.field.selectModifierGroupPlaceholder")}</option>
              {enabledModifierGroups.map((group) => (
                <option key={group.modifierGroupId} value={group.modifierGroupId}>
                  {group.modifierGroupName}
                </option>
              ))}
            </select>
            {!productVariantId && (
              <p className="mt-1 text-xs text-subtle">{t("inventory.modifierAdjustment.hint.selectVariantFirst")}</p>
            )}
          </label>
          <label className="text-sm font-semibold text-muted">
            {t("inventory.modifierAdjustment.field.modifierOption")}
            <select
              value={modifierOptionId || ""}
              onChange={(event) => selectModifierOption(event.target.value)}
              disabled={!modifierGroupId || modifierGroupDetailsQuery.isLoading}
              className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
            >
              <option value="">{t("inventory.modifierAdjustment.field.selectModifierOptionPlaceholder")}</option>
              {modifierOptions.map((option) => (
                <option key={option.modifierOptionId} value={option.modifierOptionId}>
                  {option.name}
                </option>
              ))}
            </select>
            {!modifierGroupId && productVariantId && (
              <p className="mt-1 text-xs text-subtle">{t("inventory.modifierAdjustment.hint.selectGroupFirst")}</p>
            )}
          </label>
        </div>

        {productVariantId &&
          enabledModifierGroups.length === 0 &&
          !variantModifierGroupsQuery.isLoading && (
            <ManageModifiersEmptyState
              title={t("inventory.modifierAdjustment.emptyOptions.title")}
              message={t("inventory.modifierAdjustment.emptyOptions.messageNoGroups")}
              onManageModifiers={goToManageModifiers}
            />
          )}

        {modifierGroupId &&
          modifierOptions.length === 0 &&
          !modifierGroupDetailsQuery.isLoading && (
            <ManageModifiersEmptyState
              title={t("inventory.modifierAdjustment.emptyOptions.title")}
              message={t("inventory.modifierAdjustment.emptyOptions.messageNoOptions")}
              onManageModifiers={goToManageModifiers}
            />
          )}
      </section>

      {!modifierOptionId ? (
        <EmptyState
          title={t("inventory.modifierAdjustment.emptySelectOption.title")}
          message={t("inventory.modifierAdjustment.emptySelectOption.message")}
        />
      ) : (
        <section className="rounded-xl border border-line bg-surface p-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted">
            <SlidersHorizontal size={15} className="text-accent" />
            {t("inventory.modifierAdjustment.subheading")}
          </div>

          {adjustmentsQuery.isLoading && <LoadingState label={t("inventory.modifierAdjustment.loading")} />}
          {adjustmentsQuery.isError && (
            <ErrorState
              title={t("inventory.modifierAdjustment.loadError")}
              message={getErrorMessage(adjustmentsQuery.error, t)}
            />
          )}

          {!adjustmentsQuery.isLoading && !adjustmentsQuery.isError && (
            <div className="space-y-2">
              {adjustments.length === 0 && (
                <div className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-subtle">
                  {t("inventory.modifierAdjustment.emptyAdjustments")}
                </div>
              )}
              {adjustments.map((adjustment) => (
                <div
                  key={adjustment.inventoryItemId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-raised p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-ink">
                      {adjustment.inventoryItemName}
                    </div>
                    <div className="text-sm text-muted">{adjustment.inventoryItemCode}</div>
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
                      className={`h-9 w-28 rounded-lg border bg-canvas px-2 text-right text-sm outline-none focus:border-accent-line disabled:opacity-50 ${
                        adjustment.quantityDelta < 0
                          ? "border-danger text-danger"
                          : "border-line text-ink"
                      }`}
                    />
                    <span className="text-sm text-subtle">
                      {adjustment.baseUnitOfMeasure.symbol}
                    </span>
                    <button
                      type="button"
                      disabled={!canConfigure || removeAdjustmentMutation.isPending}
                      onClick={() => removeAdjustment(adjustment.inventoryItemId)}
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
                {t("inventory.modifierAdjustment.field.addItem")}
                <select
                  value={selectedInventoryItemId}
                  onChange={(event) => setSelectedInventoryItemId(event.target.value)}
                  disabled={activeItemsQuery.isLoading}
                  className="mt-1 h-10 w-56 rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
                >
                  <option value="">{t("inventory.modifierAdjustment.field.selectItemPlaceholder")}</option>
                  {availableItemsToAdd.map((item) => (
                    <option key={item.inventoryItemId} value={item.inventoryItemId}>
                      {item.name} ({item.baseUnitOfMeasure.symbol})
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-muted">
                {t("inventory.modifierAdjustment.field.quantityDelta")}
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantityInput}
                  onChange={(event) => setQuantityInput(event.target.value)}
                  className="mt-1 h-10 w-40 rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line"
                  placeholder={t("inventory.modifierAdjustment.field.quantityDeltaPlaceholder")}
                />
              </label>
              <button
                type="button"
                disabled={setAdjustmentMutation.isPending}
                onClick={() => submitAdjustment(selectedInventoryItemId, quantityInput)}
                className="flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={15} />
                {t("inventory.modifierAdjustment.action.addAdjustment")}
              </button>
            </div>
          )}
          {!canConfigure && (
            <div className="mt-4 rounded-xl border border-warning bg-warning-soft px-3 py-2 text-sm text-warning">
              {t("inventory.modifierAdjustment.notice.configurePermissionRequired")}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
