import { useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Boxes,
  CircleCheck,
  CirclePause,
  Link2,
  ListChecks,
  MapPin,
  Package,
  PackageCheck,
  PackageX,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Printer,
  Search,
  SlidersHorizontal,
  Tags,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { useI18n } from "../../i18n/I18nContext";
import { env } from "../../app/config/env";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from "../../shared/components/ui";
import { useResolvedImageSrc } from "../../shared/hooks/useResolvedImageSrc";
import { formatDateTime } from "../../shared/utils/formatters";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useCurrentBranch } from "../../features/branches/hooks/useCurrentBranch";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import {
  useActiveUnitsOfMeasure,
  useBranchProductVariantAvailabilities,
  useBranchProductVariantAvailability,
  useCategories,
  useCategoryDetails,
  useChangeCategoryStatus,
  useChangeModifierGroupStatus,
  useChangeModifierOptionStatus,
  useChangeProductStatus,
  useChangeProductVariantStatus,
  useCreateCategory,
  useCreateModifierGroup,
  useCreateModifierOption,
  useCreateProduct,
  useCreateProductVariant,
  useDeleteProductImage,
  useModifierGroupDetails,
  useModifierGroups,
  useModifierOptionDetails,
  useModifierOptions,
  useProductDetails,
  useProductVariantBarcodes,
  useProductVariantModifierGroups,
  useProductVariantDetails,
  useProductVariants,
  useProducts,
  useSetBranchProductVariantAvailability,
  useSetProductVariantModifierGroup,
  useUpdateCategory,
  useUpdateModifierGroup,
  useUpdateModifierOption,
  useUpdateProduct,
  useUpdateProductVariant,
  useUploadProductImage,
} from "../../features/catalog/hooks/useCatalog";
import { useDevices, usePrintProductVariantLabel } from "../../features/devices/hooks/useDevices";

const CATALOG_VIEW_PERMISSION = "Catalog.View";
const CATALOG_MANAGE_PERMISSION = "Catalog.Manage";
const EMPTY_CATEGORY_FORM = { name: "", parentCategoryId: "", sortOrder: "0" };
const EMPTY_PRODUCT_FORM = {
  name: "",
  description: "",
  categoryId: "",
  sortOrder: "0",
  imageUrl: "",
};
const EMPTY_VARIANT_FORM = {
  name: "",
  sku: "",
  salesUnitOfMeasureId: "",
  sortOrder: "0",
  // "PerUnit" | "ByWeight" (Variable-Weight Products Phase E.2). Fixed at creation -- the backend
  // has no way to change it afterward (ProductVariant.SellingMode has no setter), so this only
  // ever matters on the create form; the edit form shows it read-only.
  sellingMode: "PerUnit",
};
const EMPTY_MODIFIER_GROUP_FORM = { name: "" };
const EMPTY_MODIFIER_OPTION_FORM = { name: "", sortOrder: "0" };
const EMPTY_ASSIGNMENT_FORM = {
  modifierGroupId: "",
  minSelections: "0",
  maxSelections: "1",
  sortOrder: "0",
  isEnabled: true,
};

function getErrorMessage(error, t) {
  return error?.message || t("catalogAdmin.requestFailed");
}

function statusTone(status) {
  return status === "Active" ? "success" : "warning";
}

function getAvailabilityState(availability, t) {
  if (!availability?.isConfigured) {
    return {
      label: t("catalogAdmin.availability.state.notConfigured.label"),
      description: t("catalogAdmin.availability.state.notConfigured.description"),
      className: "border-warning bg-warning-soft text-warning",
    };
  }

  if (availability.isAvailable) {
    return {
      label: t("catalogAdmin.availability.state.available.label"),
      description: t("catalogAdmin.availability.state.available.description"),
      className: "border-success bg-success-soft text-success",
    };
  }

  return {
    label: t("catalogAdmin.availability.state.unavailable.label"),
    description: t("catalogAdmin.availability.state.unavailable.description"),
    className: "border-danger bg-danger-soft text-danger",
  };
}

function AvailabilityBadge({ availability }) {
  const { t } = useI18n();
  const state = getAvailabilityState(availability, t);

  return (
    <span className={`rounded-full border px-2 py-1 text-xs font-bold ${state.className}`}>
      {state.label}
    </span>
  );
}

function parseSortOrder(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function EntityCard({ icon, title, meta, status, selected, onSelect, children }) {
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
            {icon}
            <div className="truncate text-sm font-black text-ink">{title}</div>
          </div>
          {meta && <div className="mt-1 truncate text-sm text-muted">{meta}</div>}
        </div>
        <StatusBadge tone={statusTone(status)}>{status}</StatusBadge>
      </div>
      {children}
    </button>
  );
}

function CategoryForm({
  mode,
  form,
  setForm,
  categories,
  selectedCategory,
  canManage,
  isPending,
  onSubmit,
  onStatusChange,
}) {
  const { t } = useI18n();
  const nextStatus = selectedCategory?.status === "Active" ? "Suspended" : "Active";
  const parentOptions = categories.filter(
    (category) => category.categoryId !== selectedCategory?.categoryId,
  );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 md:grid-cols-[1fr_220px_140px]">
        <label className="text-sm font-semibold text-muted">
          {t("catalogAdmin.field.name")}
          <input
            value={form.name}
            onChange={(event) => setForm((draft) => ({ ...draft, name: event.target.value }))}
            maxLength={200}
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
          />
        </label>
        <label className="text-sm font-semibold text-muted">
          {t("catalogAdmin.field.parent")}
          <select
            value={form.parentCategoryId}
            onChange={(event) =>
              setForm((draft) => ({ ...draft, parentCategoryId: event.target.value }))
            }
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
          >
            <option value="">{t("catalogAdmin.field.noParent")}</option>
            {parentOptions.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-muted">
          {t("catalogAdmin.field.sortOrder")}
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
      <ActionRow
        mode={mode}
        entity="category"
        selected={selectedCategory}
        canManage={canManage}
        isPending={isPending}
        nextStatus={nextStatus}
        onStatusChange={onStatusChange}
      />
    </form>
  );
}

function ProductForm({
  mode,
  form,
  setForm,
  categories,
  selectedProduct,
  canManage,
  isPending,
  onSubmit,
  onStatusChange,
  onUploadImage,
  onDeleteImage,
  isImageUploading,
  isImageDeleting,
}) {
  const { t } = useI18n();
  const nextStatus = selectedProduct?.status === "Active" ? "Suspended" : "Active";
  const isSelfHosted = env.deploymentMode === "SelfHosted";
  const fileInputRef = useRef(null);
  const { src: imagePreviewSrc, failed: imagePreviewFailed } = useResolvedImageSrc(
    isSelfHosted ? selectedProduct?.imageUrl : form.imageUrl,
  );

  const pickImageFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onUploadImage?.(file);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 md:grid-cols-[1fr_220px_140px]">
        <label className="text-sm font-semibold text-muted">
          {t("catalogAdmin.field.name")}
          <input
            value={form.name}
            onChange={(event) => setForm((draft) => ({ ...draft, name: event.target.value }))}
            maxLength={200}
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
          />
        </label>
        <label className="text-sm font-semibold text-muted">
          {t("catalogAdmin.field.category")}
          <select
            value={form.categoryId}
            onChange={(event) =>
              setForm((draft) => ({ ...draft, categoryId: event.target.value }))
            }
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
          >
            <option value="">{t("catalogAdmin.field.noCategory")}</option>
            {categories.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-muted">
          {t("catalogAdmin.field.sortOrder")}
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
      <label className="block text-sm font-semibold text-muted">
        {t("catalogAdmin.field.description")}
        <textarea
          value={form.description}
          onChange={(event) =>
            setForm((draft) => ({ ...draft, description: event.target.value }))
          }
          maxLength={1000}
          rows={3}
          disabled={!canManage || isPending}
          className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
        />
      </label>
      {isSelfHosted ? (
        <div className="flex items-end gap-3">
          <div className="flex-1 text-sm font-semibold text-muted">
            {t("catalogAdmin.field.image")}
            <div className="mt-1 flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pickImageFile} />
              <button
                type="button"
                disabled={!canManage || !selectedProduct || isImageUploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex h-11 items-center gap-1.5 rounded-xl border border-line bg-canvas px-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isImageUploading
                  ? t("catalogAdmin.image.uploading")
                  : selectedProduct?.imageUrl
                    ? t("catalogAdmin.image.replace")
                    : t("catalogAdmin.image.upload")}
              </button>
              {selectedProduct?.imageUrl && (
                <button
                  type="button"
                  disabled={!canManage || isImageDeleting}
                  onClick={() => onDeleteImage?.()}
                  className="flex h-11 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-semibold text-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isImageDeleting ? t("catalogAdmin.image.removing") : t("catalogAdmin.image.remove")}
                </button>
              )}
              {!selectedProduct && (
                <span className="text-xs text-subtle">{t("catalogAdmin.image.saveFirst")}</span>
              )}
            </div>
          </div>
          <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-raised">
            {imagePreviewSrc && !imagePreviewFailed ? (
              <img src={imagePreviewSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              <Package size={18} className="text-subtle" />
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-end gap-3">
          <label className="flex-1 text-sm font-semibold text-muted">
            {t("catalogAdmin.field.imageUrl")}
            <input
              value={form.imageUrl}
              onChange={(event) =>
                setForm((draft) => ({ ...draft, imageUrl: event.target.value }))
              }
              placeholder="/demo-products/burger.svg or https://…"
              maxLength={2048}
              disabled={!canManage || isPending}
              className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
            />
          </label>
          <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-raised">
            {imagePreviewSrc && !imagePreviewFailed ? (
              <img
                src={imagePreviewSrc}
                alt=""
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <Package size={18} className="text-subtle" />
            )}
          </div>
        </div>
      )}
      <ActionRow
        mode={mode}
        entity="product"
        selected={selectedProduct}
        canManage={canManage}
        isPending={isPending}
        nextStatus={nextStatus}
        onStatusChange={onStatusChange}
      />
    </form>
  );
}

function VariantForm({
  mode,
  form,
  setForm,
  units,
  selectedVariant,
  selectedProduct,
  canManage,
  isPending,
  onSubmit,
  onStatusChange,
}) {
  const { t } = useI18n();
  const nextStatus = selectedVariant?.status === "Active" ? "Suspended" : "Active";
  const isByWeight = form.sellingMode === "ByWeight";
  // The backend rejects ByWeight with anything but an active unit that measures mass and allows
  // a fractional reading (CreateProductVariantHandler) -- filtering the picker to only those
  // units is pure UX help; the server remains the authority that actually enforces this.
  const massUnits = units.filter((unit) => unit.dimension === "Mass" && unit.allowsFractionalQuantity);
  const visibleUnits = mode === "create" && isByWeight ? massUnits : units;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 md:grid-cols-[1fr_180px_220px_140px]">
        <label className="text-sm font-semibold text-muted">
          {t("catalogAdmin.field.name")}
          <input
            value={form.name}
            onChange={(event) => setForm((draft) => ({ ...draft, name: event.target.value }))}
            maxLength={200}
            disabled={!canManage || isPending || !selectedProduct}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
          />
        </label>
        <label className="text-sm font-semibold text-muted">
          {t("catalogAdmin.field.sku")}
          <input
            value={form.sku}
            onChange={(event) => setForm((draft) => ({ ...draft, sku: event.target.value }))}
            maxLength={100}
            disabled={!canManage || isPending || !selectedProduct}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
          />
        </label>
        <label className="text-sm font-semibold text-muted">
          {t("catalogAdmin.field.salesUom")}
          {mode === "create" ? (
            <select
              value={form.salesUnitOfMeasureId}
              onChange={(event) =>
                setForm((draft) => ({ ...draft, salesUnitOfMeasureId: event.target.value }))
              }
              disabled={!canManage || isPending || !selectedProduct}
              className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
            >
              <option value="">{t("catalogAdmin.field.selectUnit")}</option>
              {visibleUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.code} - {unit.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="mt-1 flex h-11 items-center rounded-xl border border-line bg-raised px-3 text-sm text-ink">
              {selectedVariant
                ? `${selectedVariant.salesUnitOfMeasureCode} - ${selectedVariant.salesUnitOfMeasureName}`
                : t("catalogAdmin.common.loading")}
            </div>
          )}
        </label>
        <label className="text-sm font-semibold text-muted">
          {t("catalogAdmin.field.sortOrder")}
          <input
            type="number"
            min="0"
            value={form.sortOrder}
            onChange={(event) =>
              setForm((draft) => ({ ...draft, sortOrder: event.target.value }))
            }
            disabled={!canManage || isPending || !selectedProduct}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
          />
        </label>
      </div>
      <div className="rounded-xl border border-line bg-raised px-3 py-2 text-sm text-muted">
        {t("catalogAdmin.variant.uomReadonlyNote")}
      </div>
      <div>
        <span className="text-sm font-semibold text-muted">{t("catalogAdmin.field.sellingMode")}</span>
        {mode === "create" ? (
          <>
            <div role="radiogroup" className="mt-1 flex flex-wrap gap-2">
              {["PerUnit", "ByWeight"].map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={form.sellingMode === option}
                  disabled={!canManage || isPending || !selectedProduct}
                  onClick={() =>
                    setForm((draft) => {
                      // Switching ByWeight<->PerUnit: a unit already valid for the OLD mode may
                      // not be valid for the new one (e.g. EA is fine for PerUnit, meaningless
                      // for ByWeight) -- clear it rather than silently keep an invalid selection
                      // the dropdown no longer even lists.
                      const stillValid =
                        option !== "ByWeight" ||
                        massUnits.some((unit) => unit.id === draft.salesUnitOfMeasureId);
                      return {
                        ...draft,
                        sellingMode: option,
                        salesUnitOfMeasureId: stillValid ? draft.salesUnitOfMeasureId : "",
                      };
                    })
                  }
                  className={`h-10 rounded-full border px-4 text-sm font-semibold transition ${
                    form.sellingMode === option
                      ? "border-accent-line bg-accent text-white"
                      : "border-line bg-canvas text-ink hover:border-accent-line"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {t(`catalogAdmin.sellingMode.${option}`)}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted">
              {isByWeight ? t("catalogAdmin.sellingMode.byWeightHint") : t("catalogAdmin.sellingMode.perUnitHint")}
            </p>
            {isByWeight && massUnits.length === 0 && (
              <p className="mt-1 text-xs text-warning">{t("catalogAdmin.sellingMode.noMassUnits")}</p>
            )}
          </>
        ) : (
          <>
            <div className="mt-1 flex h-11 items-center rounded-xl border border-line bg-raised px-3 text-sm text-ink">
              {selectedVariant ? t(`catalogAdmin.sellingMode.${selectedVariant.sellingMode}`) : t("catalogAdmin.common.loading")}
            </div>
            <p className="mt-1 text-xs text-muted">{t("catalogAdmin.sellingMode.readonlyNote")}</p>
          </>
        )}
      </div>
      <ActionRow
        mode={mode}
        entity="variant"
        selected={selectedVariant}
        canManage={canManage && Boolean(selectedProduct)}
        isPending={isPending}
        nextStatus={nextStatus}
        onStatusChange={onStatusChange}
      />
    </form>
  );
}

function BranchAvailabilityPanel({
  currentBranch,
  selectedVariant,
  availabilityQuery,
  canManage,
  isPending,
  onSetAvailability,
}) {
  const { t } = useI18n();

  if (!selectedVariant) {
    return (
      <EmptyState
        title={t("catalogAdmin.availability.selectVariant.title")}
        message={t("catalogAdmin.availability.selectVariant.message")}
      />
    );
  }

  if (!currentBranch) {
    return (
      <EmptyState
        title={t("catalogAdmin.availability.branchRequired.title")}
        message={t("catalogAdmin.availability.branchRequired.message")}
      />
    );
  }

  if (availabilityQuery.isLoading) {
    return <LoadingState label={t("catalogAdmin.availability.loading")} />;
  }

  if (availabilityQuery.isError) {
    return (
      <ErrorState
        title={t("catalogAdmin.availability.loadError")}
        message={getErrorMessage(availabilityQuery.error, t)}
      />
    );
  }

  const availability = availabilityQuery.data;
  const state = getAvailabilityState(availability, t);

  return (
    <div className="space-y-3 rounded-xl border border-line bg-raised p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <MapPin size={14} className="text-accent" />
            {t("catalogAdmin.availability.heading")}
          </div>
          <div className="mt-1 text-sm font-black text-ink">
            {t("catalogAdmin.availability.currentBranch", { name: currentBranch.name })}
          </div>
          <div className="mt-1 text-sm text-muted">{state.description}</div>
        </div>
        <AvailabilityBadge availability={availability} />
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <InfoTile label={t("catalogAdmin.field.variant")} value={availability?.variantName || selectedVariant.name} />
        <InfoTile label={t("catalogAdmin.field.product")} value={availability?.productName || selectedVariant.productName} />
        <InfoTile
          label={t("catalogAdmin.common.updated")}
          value={availability?.updatedAtUtc ? formatDateTime(availability.updatedAtUtc) : t("catalogAdmin.common.none")}
        />
      </div>

      {!availability?.isConfigured && (
        <div className="rounded-xl border border-warning bg-warning-soft px-3 py-2 text-sm text-warning">
          {t("catalogAdmin.availability.configureWarning")}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!canManage || isPending}
          onClick={() => onSetAvailability(true)}
          className="flex h-10 items-center gap-2 rounded-xl bg-success px-4 text-sm font-bold text-white disabled:opacity-50"
        >
          <PackageCheck size={15} />
          {t("catalogAdmin.availability.makeAvailable")}
        </button>
        <button
          type="button"
          disabled={!canManage || isPending}
          onClick={() => onSetAvailability(false)}
          className="flex h-10 items-center gap-2 rounded-xl border border-danger bg-danger-soft px-4 text-sm font-bold text-danger disabled:opacity-50"
        >
          <PackageX size={15} />
          {t("catalogAdmin.availability.makeUnavailable")}
        </button>
      </div>
    </div>
  );
}

// Minimal Print Label entry point (Section I of the label-printing task): pick a Label Printer
// device already registered in this branch, pick an active barcode (or leave it to the variant's
// Primary), a copy count, and print. No price is sent here -- ProductVariantAdmin carries no
// price (that lives in a separate price list, not this catalog-admin read model), so this entry
// point simply doesn't offer a "print price" option rather than faking one.
function PrintLabelPanel({ companyId, branchId, selectedVariant, canManage, showNotice }) {
  const { t } = useI18n();
  const [deviceId, setDeviceId] = useState("");
  const [barcodeId, setBarcodeId] = useState("");
  const [copies, setCopies] = useState("1");

  const devicesQuery = useDevices(
    companyId,
    branchId,
    { deviceType: "LabelPrinter" },
    Boolean(selectedVariant),
  );
  const barcodesQuery = useProductVariantBarcodes(
    companyId,
    selectedVariant?.productId,
    selectedVariant?.productVariantId,
    Boolean(selectedVariant),
  );
  const printMutation = usePrintProductVariantLabel(companyId, branchId, deviceId || null);

  if (!selectedVariant) return null;

  const devices = devicesQuery.data || [];
  const activeBarcodes = (barcodesQuery.data || []).filter((barcode) => barcode.isActive);

  const print = async () => {
    if (!deviceId) {
      showNotice(t("catalogAdmin.label.selectPrinterFirst"));
      return;
    }

    const copiesNumber = Number(copies);
    if (!Number.isInteger(copiesNumber) || copiesNumber < 1) {
      showNotice(t("catalogAdmin.label.copiesInvalid"));
      return;
    }

    try {
      await printMutation.mutateAsync({
        productVariantId: selectedVariant.productVariantId,
        barcodeId: barcodeId || null,
        copies: copiesNumber,
        price: null,
        currencyCode: null,
        secondaryText: null,
      });
      showNotice(t("catalogAdmin.label.jobSent"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  const inputClass =
    "w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-accent-line";

  return (
    <div className="space-y-3 rounded-xl border border-line bg-raised p-3">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Printer size={14} className="text-accent" />
        {t("catalogAdmin.label.heading")}
      </div>

      {devices.length === 0 ? (
        <div className="rounded-xl border border-warning bg-warning-soft px-3 py-2 text-sm text-warning">
          {t("catalogAdmin.label.noPrinters")}
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-muted">{t("catalogAdmin.label.printerField")}</label>
            <select className={inputClass} value={deviceId} onChange={(event) => setDeviceId(event.target.value)}>
              <option value="">{t("catalogAdmin.label.selectDevice")}</option>
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.name} ({device.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">{t("catalogAdmin.label.barcodeField")}</label>
            <select className={inputClass} value={barcodeId} onChange={(event) => setBarcodeId(event.target.value)}>
              <option value="">{t("catalogAdmin.label.usePrimaryBarcode")}</option>
              {activeBarcodes.map((barcode) => (
                <option key={barcode.id} value={barcode.id}>
                  {barcode.value}
                  {barcode.isPrimary ? ` (${t("catalogAdmin.label.primarySuffix")})` : ""}
                </option>
              ))}
            </select>
            {!barcodesQuery.isLoading && activeBarcodes.length === 0 && (
              <p className="mt-1 text-xs text-warning">{t("catalogAdmin.label.noActiveBarcode")}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">{t("catalogAdmin.label.copiesField")}</label>
            <input
              type="number"
              min={1}
              max={50}
              className={inputClass}
              value={copies}
              onChange={(event) => setCopies(event.target.value)}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={!canManage || devices.length === 0 || printMutation.isPending}
        onClick={print}
        className="flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Printer size={15} />
        {printMutation.isPending ? t("catalogAdmin.label.sending") : t("catalogAdmin.label.heading")}
      </button>
    </div>
  );
}

const ENTITY_LABEL_KEYS = {
  category: "catalogAdmin.entity.category",
  product: "catalogAdmin.entity.product",
  variant: "catalogAdmin.entity.variant",
  "modifier group": "catalogAdmin.entity.modifierGroup",
  "modifier option": "catalogAdmin.entity.modifierOption",
};

function ActionRow({ mode, entity, selected, canManage, isPending, nextStatus, onStatusChange }) {
  const { t } = useI18n();
  const entityLabel = t(ENTITY_LABEL_KEYS[entity] || "catalogAdmin.entity.item");

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="submit"
        disabled={!canManage || isPending}
        className="flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {mode === "edit" ? <Pencil size={15} /> : <Plus size={15} />}
        {isPending
          ? t("catalogAdmin.action.saving")
          : mode === "edit"
            ? t("catalogAdmin.action.save", { entity: entityLabel })
            : t("catalogAdmin.action.create", { entity: entityLabel })}
      </button>
      {mode === "edit" && selected && (
        <button
          type="button"
          disabled={!canManage || isPending}
          onClick={() => onStatusChange(nextStatus)}
          className="flex h-10 items-center gap-2 rounded-xl border border-line bg-raised px-4 text-sm font-bold text-ink transition hover:border-accent-line hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          {nextStatus === "Active" ? <CircleCheck size={15} /> : <CirclePause size={15} />}
          {nextStatus === "Active" ? t("catalogAdmin.action.activate") : t("catalogAdmin.action.suspend")}
        </button>
      )}
    </div>
  );
}

function CatalogModifiersAdmin({ currentCompanyId, currentBranchId, canRead, canManage, showNotice }) {
  const { t } = useI18n();
  const [groupStatus, setGroupStatus] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [groupPage, setGroupPage] = useState(1);
  const [optionStatus, setOptionStatus] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [groupMode, setGroupMode] = useState("create");
  const [optionMode, setOptionMode] = useState("create");
  const [groupForm, setGroupForm] = useState(EMPTY_MODIFIER_GROUP_FORM);
  const [optionForm, setOptionForm] = useState(EMPTY_MODIFIER_OPTION_FORM);
  const [assignmentProductId, setAssignmentProductId] = useState("");
  const [assignmentVariantId, setAssignmentVariantId] = useState("");
  const [assignmentForm, setAssignmentForm] = useState(EMPTY_ASSIGNMENT_FORM);

  const groupFilters = useMemo(
    () => ({
      status: groupStatus,
      search: groupSearch.trim(),
      pageNumber: groupPage,
      pageSize: 25,
    }),
    [groupPage, groupSearch, groupStatus],
  );
  const optionFilters = useMemo(() => ({ status: optionStatus }), [optionStatus]);
  const assignmentProductFilters = useMemo(() => ({ pageNumber: 1, pageSize: 100 }), []);

  const groupsQuery = useModifierGroups(currentCompanyId, groupFilters, canRead);
  const groupDetailsQuery = useModifierGroupDetails(
    currentCompanyId,
    selectedGroupId,
    canRead && Boolean(selectedGroupId),
  );
  const optionsQuery = useModifierOptions(
    currentCompanyId,
    selectedGroupId,
    optionFilters,
    canRead && Boolean(selectedGroupId),
  );
  const optionDetailsQuery = useModifierOptionDetails(
    currentCompanyId,
    selectedGroupId,
    selectedOptionId,
    canRead && Boolean(selectedGroupId) && Boolean(selectedOptionId),
  );
  const productsQuery = useProducts(
    currentCompanyId,
    assignmentProductFilters,
    canRead,
  );
  const assignmentProductQuery = useProductDetails(
    currentCompanyId,
    assignmentProductId,
    canRead && Boolean(assignmentProductId),
  );
  const assignmentsQuery = useProductVariantModifierGroups(
    currentCompanyId,
    assignmentVariantId,
    canRead && Boolean(assignmentVariantId),
  );

  const createGroupMutation = useCreateModifierGroup(currentCompanyId, currentBranchId);
  const updateGroupMutation = useUpdateModifierGroup(
    currentCompanyId,
    currentBranchId,
    selectedGroupId,
  );
  const groupStatusMutation = useChangeModifierGroupStatus(
    currentCompanyId,
    currentBranchId,
    selectedGroupId,
  );
  const createOptionMutation = useCreateModifierOption(
    currentCompanyId,
    currentBranchId,
    selectedGroupId,
  );
  const updateOptionMutation = useUpdateModifierOption(
    currentCompanyId,
    currentBranchId,
    selectedGroupId,
    selectedOptionId,
  );
  const optionStatusMutation = useChangeModifierOptionStatus(
    currentCompanyId,
    currentBranchId,
    selectedGroupId,
    selectedOptionId,
  );
  const assignmentMutation = useSetProductVariantModifierGroup(
    currentCompanyId,
    currentBranchId,
    assignmentVariantId,
    assignmentForm.modifierGroupId,
  );

  const selectedGroup = groupDetailsQuery.data || null;
  const selectedOption = optionDetailsQuery.data || null;
  const groups = groupsQuery.data?.items || [];
  const options = optionsQuery.data?.items || [];
  const assignmentProduct = assignmentProductQuery.data || null;
  const assignments = assignmentsQuery.data?.items || [];
  const isGroupPending =
    createGroupMutation.isPending ||
    updateGroupMutation.isPending ||
    groupStatusMutation.isPending;
  const isOptionPending =
    createOptionMutation.isPending ||
    updateOptionMutation.isPending ||
    optionStatusMutation.isPending;

  const startCreateGroup = () => {
    setGroupMode("create");
    setSelectedGroupId(null);
    setSelectedOptionId(null);
    setGroupForm(EMPTY_MODIFIER_GROUP_FORM);
    setOptionMode("create");
    setOptionForm(EMPTY_MODIFIER_OPTION_FORM);
  };

  const selectGroup = (group) => {
    setGroupMode("edit");
    setSelectedGroupId(group.modifierGroupId);
    setSelectedOptionId(null);
    setGroupForm({ name: group.name });
    setOptionMode("create");
    setOptionForm(EMPTY_MODIFIER_OPTION_FORM);
  };

  const selectOption = (option) => {
    setOptionMode("edit");
    setSelectedOptionId(option.modifierOptionId);
    setOptionForm({ name: option.name, sortOrder: String(option.sortOrder) });
  };

  const submitGroup = async () => {
    try {
      const result =
        groupMode === "create"
          ? await createGroupMutation.mutateAsync({ name: groupForm.name })
          : await updateGroupMutation.mutateAsync({ name: groupForm.name });
      setGroupMode("edit");
      setSelectedGroupId(result.modifierGroupId);
      setGroupForm({ name: result.name });
      showNotice(groupMode === "create" ? t("catalogAdmin.notice.groupCreated") : t("catalogAdmin.notice.groupUpdated"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  const submitOption = async () => {
    const sortOrder = parseSortOrder(optionForm.sortOrder);
    if (sortOrder === null) return showNotice(t("catalogAdmin.notice.sortOrderInvalid"));

    try {
      const result =
        optionMode === "create"
          ? await createOptionMutation.mutateAsync({ name: optionForm.name, sortOrder })
          : await updateOptionMutation.mutateAsync({ name: optionForm.name, sortOrder });
      setOptionMode("edit");
      setSelectedOptionId(result.modifierOptionId);
      setOptionForm({ name: result.name, sortOrder: String(result.sortOrder) });
      showNotice(optionMode === "create" ? t("catalogAdmin.notice.optionCreated") : t("catalogAdmin.notice.optionUpdated"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  const submitAssignment = async () => {
    const minSelections = parseSortOrder(assignmentForm.minSelections);
    const maxSelections = parseSortOrder(assignmentForm.maxSelections);
    const sortOrder = parseSortOrder(assignmentForm.sortOrder);
    if (minSelections === null || maxSelections === null || sortOrder === null) {
      return showNotice(t("catalogAdmin.notice.minMaxSortInvalid"));
    }
    if (maxSelections < 1) return showNotice(t("catalogAdmin.notice.maxSelectionsInvalid"));
    if (minSelections > maxSelections) {
      return showNotice(t("catalogAdmin.notice.minExceedsMax"));
    }
    if (!assignmentVariantId || !assignmentForm.modifierGroupId) {
      return showNotice(t("catalogAdmin.notice.selectVariantAndGroup"));
    }

    try {
      await assignmentMutation.mutateAsync({
        minSelections,
        maxSelections,
        sortOrder,
        isEnabled: assignmentForm.isEnabled,
      });
      showNotice(t("catalogAdmin.notice.assignmentSaved"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  const loadAssignment = (assignment) => {
    setAssignmentForm({
      modifierGroupId: assignment.modifierGroupId,
      minSelections: String(assignment.minSelections),
      maxSelections: String(assignment.maxSelections),
      sortOrder: String(assignment.sortOrder),
      isEnabled: assignment.isEnabled,
    });
  };

  const changeModifierStatus = async (mutation, status, labelKey) => {
    try {
      await mutation.mutateAsync({ status });
      showNotice(
        status === "Active"
          ? t("catalogAdmin.notice.entityActivated", { entity: t(labelKey) })
          : t("catalogAdmin.notice.entitySuspended", { entity: t(labelKey) }),
      );
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  return (
    <div className="grid gap-4 2xl:grid-cols-[380px_1fr]">
      <section className="rounded-xl border border-line bg-surface p-3">
        <div className="mb-3 flex flex-wrap gap-2">
          <label className="relative block min-w-[180px] flex-1">
            <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              value={groupSearch}
              onChange={(event) => {
                setGroupSearch(event.target.value);
                setGroupPage(1);
              }}
              maxLength={100}
              placeholder={t("catalogAdmin.modifiers.searchGroups")}
              className="h-10 w-full rounded-xl border border-line bg-canvas pr-9 pl-3 text-sm text-ink outline-none"
            />
          </label>
          <select
            value={groupStatus}
            onChange={(event) => {
              setGroupStatus(event.target.value);
              setGroupPage(1);
            }}
            className="h-10 rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none"
          >
            <option value="">{t("catalogAdmin.field.allStatus")}</option>
            <option value="Active">{t("catalogAdmin.common.active")}</option>
            <option value="Suspended">{t("catalogAdmin.common.suspended")}</option>
          </select>
          <button
            type="button"
            onClick={startCreateGroup}
            className="flex h-10 items-center gap-2 rounded-xl bg-accent px-3 text-sm font-bold text-white"
          >
            <Plus size={14} />
            {t("catalogAdmin.modifiers.newGroup")}
          </button>
        </div>
        {groupsQuery.isLoading && <LoadingState label={t("catalogAdmin.modifiers.loadingGroups")} />}
        {groupsQuery.isError && (
          <ErrorState title={t("catalogAdmin.modifiers.loadGroupsError")} message={getErrorMessage(groupsQuery.error, t)} />
        )}
        {!groupsQuery.isLoading && !groupsQuery.isError && groups.length === 0 && (
          <EmptyState title={t("catalogAdmin.modifiers.noGroups.title")} message={t("catalogAdmin.modifiers.noGroups.message")} />
        )}
        {!groupsQuery.isLoading && !groupsQuery.isError && groups.length > 0 && (
          <div className="max-h-[calc(100vh-420px)] min-h-[320px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
            {groups.map((group) => (
              <EntityCard
                key={group.modifierGroupId}
                icon={<SlidersHorizontal size={15} className="shrink-0 text-accent" />}
                title={group.name}
                meta={t("catalogAdmin.modifiers.optionsCount", { count: group.optionCount })}
                status={group.status}
                selected={selectedGroupId === group.modifierGroupId}
                onSelect={() => selectGroup(group)}
              >
                <div className="mt-3 text-xs text-subtle">
                  {t("catalogAdmin.common.createdOn", { date: formatDateTime(group.createdAtUtc) })}
                </div>
              </EntityCard>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between gap-2 text-sm text-muted">
          <span>
            {t("catalogAdmin.common.pageOf", { current: groupsQuery.data?.pageNumber || 1, total: groupsQuery.data?.totalPages || 0 })}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={groupPage <= 1}
              onClick={() => setGroupPage((page) => Math.max(1, page - 1))}
              className="rounded-lg border border-line px-3 py-1 disabled:opacity-40"
            >
              {t("catalogAdmin.common.prev")}
            </button>
            <button
              type="button"
              disabled={!groupsQuery.data || groupPage >= groupsQuery.data.totalPages}
              onClick={() => setGroupPage((page) => page + 1)}
              className="rounded-lg border border-line px-3 py-1 disabled:opacity-40"
            >
              {t("catalogAdmin.common.next")}
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-xl border border-line bg-surface p-4">
          <PanelTitle
            icon={<SlidersHorizontal size={15} className="text-accent" />}
            eyebrow={groupMode === "create" ? t("catalogAdmin.modifiers.group.createEyebrow") : t("catalogAdmin.modifiers.group.detailsEyebrow")}
            title={groupMode === "create" ? t("catalogAdmin.modifiers.group.newTitle") : selectedGroup?.name || t("catalogAdmin.common.loading")}
            status={selectedGroup?.status}
          />
          {groupMode === "edit" && groupDetailsQuery.isLoading && <LoadingState label={t("catalogAdmin.modifiers.group.loading")} />}
          {groupMode === "edit" && groupDetailsQuery.isError && (
            <ErrorState title={t("catalogAdmin.modifiers.group.loadError")} message={getErrorMessage(groupDetailsQuery.error, t)} />
          )}
          {(groupMode === "create" || selectedGroup) && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitGroup();
              }}
              className="space-y-3"
            >
              <label className="block text-sm font-semibold text-muted">
                {t("catalogAdmin.field.name")}
                <input
                  value={groupForm.name}
                  onChange={(event) => setGroupForm({ name: event.target.value })}
                  maxLength={200}
                  disabled={!canManage || isGroupPending}
                  className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none disabled:opacity-50"
                />
              </label>
              <ActionRow
                mode={groupMode}
                entity="modifier group"
                selected={selectedGroup}
                canManage={canManage}
                isPending={isGroupPending}
                nextStatus={selectedGroup?.status === "Active" ? "Suspended" : "Active"}
                onStatusChange={(status) =>
                  changeModifierStatus(groupStatusMutation, status, "catalogAdmin.entity.modifierGroup")
                }
              />
            </form>
          )}
        </div>

        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <ListChecks size={15} className="text-accent" />
                {t("catalogAdmin.modifiers.optionsHeading")}
              </div>
              <h2 className="mt-1 text-lg font-black text-ink">
                {selectedGroup?.name || t("catalogAdmin.modifiers.selectGroupFallback")}
              </h2>
            </div>
            <div className="flex gap-2">
              <select
                value={optionStatus}
                onChange={(event) => setOptionStatus(event.target.value)}
                className="h-10 rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none"
              >
                <option value="">{t("catalogAdmin.modifiers.allOptions")}</option>
                <option value="Active">{t("catalogAdmin.common.active")}</option>
                <option value="Suspended">{t("catalogAdmin.common.suspended")}</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setOptionMode("create");
                  setSelectedOptionId(null);
                  setOptionForm(EMPTY_MODIFIER_OPTION_FORM);
                }}
                disabled={!selectedGroup}
                className="flex h-10 items-center gap-2 rounded-xl bg-accent px-3 text-sm font-bold text-white disabled:opacity-50"
              >
                <Plus size={14} />
                {t("catalogAdmin.modifiers.newOption")}
              </button>
            </div>
          </div>
          {!selectedGroupId ? (
            <EmptyState title={t("catalogAdmin.modifiers.selectGroup.title")} message={t("catalogAdmin.modifiers.selectGroup.message")} />
          ) : optionsQuery.isLoading ? (
            <LoadingState label={t("catalogAdmin.modifiers.loadingOptions")} />
          ) : optionsQuery.isError ? (
            <ErrorState title={t("catalogAdmin.modifiers.loadOptionsError")} message={getErrorMessage(optionsQuery.error, t)} />
          ) : (
            <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
              <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                {options.length === 0 ? (
                  <EmptyState title={t("catalogAdmin.modifiers.noOptions.title")} message={t("catalogAdmin.modifiers.noOptions.message")} />
                ) : (
                  options.map((option) => (
                    <EntityCard
                      key={option.modifierOptionId}
                      icon={<ListChecks size={15} className="shrink-0 text-accent" />}
                      title={option.name}
                      meta={t("catalogAdmin.common.sortValue", { n: option.sortOrder })}
                      status={option.status}
                      selected={selectedOptionId === option.modifierOptionId}
                      onSelect={() => selectOption(option)}
                    />
                  ))
                )}
              </div>
              {(optionMode === "create" || selectedOption) && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitOption();
                  }}
                  className="space-y-3"
                >
                  <div className="grid gap-3 md:grid-cols-[1fr_140px]">
                    <label className="text-sm font-semibold text-muted">
                      {t("catalogAdmin.field.name")}
                      <input
                        value={optionForm.name}
                        onChange={(event) =>
                          setOptionForm((draft) => ({ ...draft, name: event.target.value }))
                        }
                        maxLength={200}
                        disabled={!canManage || isOptionPending}
                        className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none disabled:opacity-50"
                      />
                    </label>
                    <label className="text-sm font-semibold text-muted">
                      {t("catalogAdmin.field.sortOrder")}
                      <input
                        type="number"
                        min="0"
                        value={optionForm.sortOrder}
                        onChange={(event) =>
                          setOptionForm((draft) => ({ ...draft, sortOrder: event.target.value }))
                        }
                        disabled={!canManage || isOptionPending}
                        className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none disabled:opacity-50"
                      />
                    </label>
                  </div>
                  {optionMode === "edit" && optionDetailsQuery.isLoading && <LoadingState label={t("catalogAdmin.modifiers.option.loading")} />}
                  {optionMode === "edit" && optionDetailsQuery.isError && (
                    <ErrorState title={t("catalogAdmin.modifiers.option.loadError")} message={getErrorMessage(optionDetailsQuery.error, t)} />
                  )}
                  <ActionRow
                    mode={optionMode}
                    entity="modifier option"
                    selected={selectedOption}
                    canManage={canManage}
                    isPending={isOptionPending}
                    nextStatus={selectedOption?.status === "Active" ? "Suspended" : "Active"}
                    onStatusChange={(status) =>
                      changeModifierStatus(optionStatusMutation, status, "catalogAdmin.entity.modifierOption")
                    }
                  />
                </form>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-line bg-surface p-4">
          <PanelTitle
            icon={<Link2 size={15} className="text-accent" />}
            eyebrow={t("catalogAdmin.modifiers.assignmentsEyebrow")}
            title={t("catalogAdmin.modifiers.assignmentsTitle")}
          />
          <div className="grid gap-3 lg:grid-cols-2">
            <label className="text-sm font-semibold text-muted">
              {t("catalogAdmin.field.product")}
              <select
                value={assignmentProductId}
                onChange={(event) => {
                  setAssignmentProductId(event.target.value);
                  setAssignmentVariantId("");
                }}
                className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none"
              >
                <option value="">{t("catalogAdmin.field.selectProduct")}</option>
                {(productsQuery.data?.items || []).map((product) => (
                  <option key={product.productId} value={product.productId}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-muted">
              {t("catalogAdmin.field.variant")}
              <select
                value={assignmentVariantId}
                onChange={(event) => setAssignmentVariantId(event.target.value)}
                disabled={!assignmentProduct}
                className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none disabled:opacity-50"
              >
                <option value="">{t("catalogAdmin.field.selectVariant")}</option>
                {(assignmentProduct?.variants || []).map((variant) => (
                  <option key={variant.productVariantId} value={variant.productVariantId}>
                    {variant.name} {variant.sku ? `· ${variant.sku}` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {!assignmentVariantId ? (
            <div className="mt-4">
              <EmptyState title={t("catalogAdmin.modifiers.selectVariantForAssignment.title")} message={t("catalogAdmin.modifiers.selectVariantForAssignment.message")} />
            </div>
          ) : assignmentsQuery.isLoading ? (
            <LoadingState label={t("catalogAdmin.modifiers.loadingAssignments")} />
          ) : assignmentsQuery.isError ? (
            <ErrorState title={t("catalogAdmin.modifiers.loadAssignmentsError")} message={getErrorMessage(assignmentsQuery.error, t)} />
          ) : (
            <div className="mt-4 grid gap-4 xl:grid-cols-[320px_1fr]">
              <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                {assignments.length === 0 ? (
                  <EmptyState title={t("catalogAdmin.modifiers.noAssignments.title")} message={t("catalogAdmin.modifiers.noAssignments.message")} />
                ) : (
                  assignments.map((assignment) => (
                    <button
                      key={assignment.modifierGroupId}
                      type="button"
                      onClick={() => loadAssignment(assignment)}
                      className="w-full rounded-xl border border-line bg-raised p-3 text-start transition hover:border-accent-line hover:bg-accent-soft"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-ink">
                            {assignment.modifierGroupName}
                          </div>
                          <div className="mt-1 text-sm text-muted">
                            {t("catalogAdmin.modifiers.assignmentMeta", {
                              min: assignment.minSelections,
                              max: assignment.maxSelections,
                              sort: assignment.sortOrder,
                            })}
                          </div>
                        </div>
                        <StatusBadge tone={assignment.isEnabled ? "success" : "warning"}>
                          {assignment.isEnabled ? t("catalogAdmin.common.enabled") : t("catalogAdmin.common.disabled")}
                        </StatusBadge>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  submitAssignment();
                }}
                className="space-y-3"
              >
                <div className="grid gap-3 md:grid-cols-[1fr_120px_120px_120px]">
                  <label className="text-sm font-semibold text-muted">
                    {t("catalogAdmin.field.modifierGroup")}
                    <select
                      value={assignmentForm.modifierGroupId}
                      onChange={(event) =>
                        setAssignmentForm((draft) => ({
                          ...draft,
                          modifierGroupId: event.target.value,
                        }))
                      }
                      className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none"
                    >
                      <option value="">{t("catalogAdmin.field.selectGroup")}</option>
                      {groups.map((group) => (
                        <option key={group.modifierGroupId} value={group.modifierGroupId}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <NumberField label={t("catalogAdmin.field.min")} value={assignmentForm.minSelections} onChange={(value) => setAssignmentForm((draft) => ({ ...draft, minSelections: value }))} />
                  <NumberField label={t("catalogAdmin.field.max")} value={assignmentForm.maxSelections} onChange={(value) => setAssignmentForm((draft) => ({ ...draft, maxSelections: value }))} min="1" />
                  <NumberField label={t("catalogAdmin.field.sort")} value={assignmentForm.sortOrder} onChange={(value) => setAssignmentForm((draft) => ({ ...draft, sortOrder: value }))} />
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold text-muted">
                  <input
                    type="checkbox"
                    checked={assignmentForm.isEnabled}
                    onChange={(event) =>
                      setAssignmentForm((draft) => ({
                        ...draft,
                        isEnabled: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-line-strong bg-canvas"
                  />
                  {t("catalogAdmin.modifiers.enabledCheckboxLabel")}
                </label>
                <div className="rounded-xl border border-line bg-raised px-3 py-2 text-sm text-muted">
                  {t("catalogAdmin.modifiers.assignmentNote")}
                </div>
                <button
                  type="submit"
                  disabled={!canManage || assignmentMutation.isPending}
                  className="flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-white disabled:opacity-50"
                >
                  <Link2 size={15} />
                  {assignmentMutation.isPending ? t("catalogAdmin.action.saving") : t("catalogAdmin.modifiers.saveAssignment")}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function NumberField({ label, value, onChange, min = "0" }) {
  return (
    <label className="text-sm font-semibold text-muted">
      {label}
      <input
        type="number"
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none"
      />
    </label>
  );
}

const CATALOG_ADMIN_TABS = ["categories", "products", "modifiers"];

export default function CatalogAdminPage() {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const currentBranch = useCurrentBranch();
  const location = useLocation();
  const [tab, setTab] = useState(() =>
    CATALOG_ADMIN_TABS.includes(location.state?.tab) ? location.state.tab : "categories",
  );
  const [categoryStatus, setCategoryStatus] = useState("");
  const [productStatus, setProductStatus] = useState("");
  const [variantStatus, setVariantStatus] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryId, setProductCategoryId] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [categoryMode, setCategoryMode] = useState("create");
  const [productMode, setProductMode] = useState("create");
  const [variantMode, setVariantMode] = useState("create");
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);
  const [variantForm, setVariantForm] = useState(EMPTY_VARIANT_FORM);
  const [notice, setNotice] = useState("");

  const viewPermissionQuery = useHasPermission(currentCompanyId, CATALOG_VIEW_PERMISSION);
  const managePermissionQuery = useHasPermission(currentCompanyId, CATALOG_MANAGE_PERMISSION);
  const canRead =
    Boolean(currentCompanyId) &&
    !viewPermissionQuery.isLoading &&
    viewPermissionQuery.hasPermission;
  const canManage = !managePermissionQuery.isLoading && managePermissionQuery.hasPermission;

  const categoryFilters = useMemo(() => ({ status: categoryStatus }), [categoryStatus]);
  const allCategoryFilters = useMemo(() => ({}), []);
  const productFilters = useMemo(
    () => ({
      status: productStatus,
      categoryId: productCategoryId,
      search: productSearch.trim(),
      pageNumber: productPage,
      pageSize: 25,
    }),
    [productCategoryId, productPage, productSearch, productStatus],
  );
  const variantFilters = useMemo(() => ({ status: variantStatus }), [variantStatus]);
  const branchAvailabilityFilters = useMemo(
    () => ({
      search: productMode === "edit" ? productForm.name.trim() : "",
      pageNumber: 1,
      pageSize: 100,
    }),
    [productForm.name, productMode],
  );

  const categoriesQuery = useCategories(currentCompanyId, categoryFilters, canRead);
  const allCategoriesQuery = useCategories(currentCompanyId, allCategoryFilters, canRead);
  const categoryDetailsQuery = useCategoryDetails(
    currentCompanyId,
    selectedCategoryId,
    canRead && Boolean(selectedCategoryId),
  );
  const productsQuery = useProducts(currentCompanyId, productFilters, canRead);
  const productDetailsQuery = useProductDetails(
    currentCompanyId,
    selectedProductId,
    canRead && Boolean(selectedProductId),
  );
  const variantsQuery = useProductVariants(
    currentCompanyId,
    selectedProductId,
    variantFilters,
    canRead && Boolean(selectedProductId),
  );
  const variantDetailsQuery = useProductVariantDetails(
    currentCompanyId,
    selectedProductId,
    selectedVariantId,
    canRead && Boolean(selectedProductId) && Boolean(selectedVariantId),
  );
  const branchAvailabilityOverviewQuery = useBranchProductVariantAvailabilities(
    currentCompanyId,
    currentBranchId,
    branchAvailabilityFilters,
    canRead && Boolean(currentBranchId) && Boolean(selectedProductId),
  );
  const branchAvailabilityQuery = useBranchProductVariantAvailability(
    currentCompanyId,
    currentBranchId,
    selectedVariantId,
    canRead && Boolean(currentBranchId) && Boolean(selectedVariantId),
  );
  const unitsQuery = useActiveUnitsOfMeasure(canRead);

  const createCategoryMutation = useCreateCategory(currentCompanyId, currentBranchId);
  const updateCategoryMutation = useUpdateCategory(
    currentCompanyId,
    currentBranchId,
    selectedCategoryId,
  );
  const categoryStatusMutation = useChangeCategoryStatus(
    currentCompanyId,
    currentBranchId,
    selectedCategoryId,
  );
  const createProductMutation = useCreateProduct(currentCompanyId, currentBranchId);
  const updateProductMutation = useUpdateProduct(
    currentCompanyId,
    currentBranchId,
    selectedProductId,
  );
  const productStatusMutation = useChangeProductStatus(
    currentCompanyId,
    currentBranchId,
    selectedProductId,
  );
  const uploadProductImageMutation = useUploadProductImage(
    currentCompanyId,
    currentBranchId,
    selectedProductId,
  );
  const deleteProductImageMutation = useDeleteProductImage(
    currentCompanyId,
    currentBranchId,
    selectedProductId,
  );
  const createVariantMutation = useCreateProductVariant(
    currentCompanyId,
    currentBranchId,
    selectedProductId,
  );
  const updateVariantMutation = useUpdateProductVariant(
    currentCompanyId,
    currentBranchId,
    selectedProductId,
    selectedVariantId,
  );
  const variantStatusMutation = useChangeProductVariantStatus(
    currentCompanyId,
    currentBranchId,
    selectedProductId,
    selectedVariantId,
  );
  const setBranchAvailabilityMutation = useSetBranchProductVariantAvailability(
    currentCompanyId,
    currentBranchId,
    selectedVariantId,
  );

  const selectedCategory = categoryDetailsQuery.data || null;
  const selectedProduct = productDetailsQuery.data || null;
  const selectedVariant = variantDetailsQuery.data || null;
  const categories = allCategoriesQuery.data || [];
  const products = productsQuery.data?.items || [];
  const variants = variantsQuery.data || [];
  const branchAvailabilitySummary = useMemo(() => {
    const items = branchAvailabilityOverviewQuery.data?.items || [];
    return {
      available: items.filter((item) => item.isConfigured && item.isAvailable).length,
      unavailable: items.filter((item) => item.isConfigured && !item.isAvailable).length,
      missing: items.filter((item) => !item.isConfigured).length,
      total: branchAvailabilityOverviewQuery.data?.totalCount || 0,
    };
  }, [branchAvailabilityOverviewQuery.data]);
  const categoryPending =
    createCategoryMutation.isPending ||
    updateCategoryMutation.isPending ||
    categoryStatusMutation.isPending;
  const productPending =
    createProductMutation.isPending ||
    updateProductMutation.isPending ||
    productStatusMutation.isPending;
  const variantPending =
    createVariantMutation.isPending ||
    updateVariantMutation.isPending ||
    variantStatusMutation.isPending;

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const startCreateCategory = () => {
    setCategoryMode("create");
    setSelectedCategoryId(null);
    setCategoryForm(EMPTY_CATEGORY_FORM);
  };

  const startCreateProduct = () => {
    setProductMode("create");
    setSelectedProductId(null);
    setSelectedVariantId(null);
    setProductForm(EMPTY_PRODUCT_FORM);
    setVariantMode("create");
    setVariantForm(EMPTY_VARIANT_FORM);
  };

  const startCreateVariant = () => {
    setVariantMode("create");
    setSelectedVariantId(null);
    setVariantForm(EMPTY_VARIANT_FORM);
  };

  const selectCategory = (category) => {
    setCategoryMode("edit");
    setSelectedCategoryId(category.categoryId);
    setCategoryForm({
      name: category.name,
      parentCategoryId: category.parentCategoryId || "",
      sortOrder: String(category.sortOrder),
    });
  };

  const selectProduct = (product) => {
    setProductMode("edit");
    setSelectedProductId(product.productId);
    setSelectedVariantId(null);
    setVariantMode("create");
    setProductForm({
      name: product.name,
      description: product.description || "",
      categoryId: product.categoryId || "",
      sortOrder: String(product.sortOrder),
      imageUrl: product.imageUrl || "",
    });
    setVariantForm(EMPTY_VARIANT_FORM);
  };

  const selectVariant = (variant) => {
    setVariantMode("edit");
    setSelectedVariantId(variant.productVariantId);
    setVariantForm({
      name: variant.name,
      sku: variant.sku || "",
      salesUnitOfMeasureId: variant.salesUnitOfMeasureId,
      sortOrder: String(variant.sortOrder),
      // Display only in edit mode -- there is no backend operation that changes it afterward
      // (see submitVariant, which never sends this field on update).
      sellingMode: variant.sellingMode || "PerUnit",
    });
  };

  const submitCategory = async () => {
    const sortOrder = parseSortOrder(categoryForm.sortOrder);
    if (sortOrder === null) return showNotice(t("catalogAdmin.notice.sortOrderInvalid"));

    try {
      const payload = {
        name: categoryForm.name,
        parentCategoryId: categoryForm.parentCategoryId || null,
        sortOrder,
      };
      const result =
        categoryMode === "create"
          ? await createCategoryMutation.mutateAsync(payload)
          : await updateCategoryMutation.mutateAsync(payload);
      setCategoryMode("edit");
      setSelectedCategoryId(result.categoryId);
      setCategoryForm({
        name: result.name,
        parentCategoryId: result.parentCategoryId || "",
        sortOrder: String(result.sortOrder),
      });
      showNotice(categoryMode === "create" ? t("catalogAdmin.notice.categoryCreated") : t("catalogAdmin.notice.categoryUpdated"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  const submitProduct = async () => {
    const sortOrder = parseSortOrder(productForm.sortOrder);
    if (sortOrder === null) return showNotice(t("catalogAdmin.notice.sortOrderInvalid"));

    try {
      // SelfHosted: the image is managed entirely by the separate upload/remove endpoints, and
      // productForm.imageUrl is never kept in sync with them (there's no text field writing to it
      // in that mode) -- sending it here would silently overwrite a just-uploaded image back to
      // whatever stale value was loaded when the product was selected. Pass through the server's
      // own current value instead, so Save never touches the image either way.
      const payload = {
        name: productForm.name,
        description: productForm.description.trim() || null,
        categoryId: productForm.categoryId || null,
        sortOrder,
        imageUrl:
          env.deploymentMode === "SelfHosted"
            ? (selectedProduct?.imageUrl ?? null)
            : productForm.imageUrl.trim() || null,
      };
      const result =
        productMode === "create"
          ? await createProductMutation.mutateAsync(payload)
          : await updateProductMutation.mutateAsync(payload);
      setProductMode("edit");
      setSelectedProductId(result.productId);
      setProductForm({
        name: result.name,
        description: result.description || "",
        categoryId: result.categoryId || "",
        sortOrder: String(result.sortOrder),
        imageUrl: result.imageUrl || "",
      });
      showNotice(productMode === "create" ? t("catalogAdmin.notice.productCreated") : t("catalogAdmin.notice.productUpdated"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  const uploadProductImage = async (file) => {
    try {
      await uploadProductImageMutation.mutateAsync(file);
      showNotice(t("catalogAdmin.notice.imageUploaded"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  const deleteProductImage = async () => {
    try {
      await deleteProductImageMutation.mutateAsync();
      showNotice(t("catalogAdmin.notice.imageRemoved"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  const submitVariant = async () => {
    const sortOrder = parseSortOrder(variantForm.sortOrder);
    if (sortOrder === null) return showNotice(t("catalogAdmin.notice.sortOrderInvalid"));
    if (variantMode === "create" && !variantForm.salesUnitOfMeasureId) {
      return showNotice(t("catalogAdmin.notice.uomRequired"));
    }

    try {
      const payload = {
        name: variantForm.name,
        sku: variantForm.sku.trim() || null,
        sortOrder,
      };
      const result =
        variantMode === "create"
          ? await createVariantMutation.mutateAsync({
              ...payload,
              salesUnitOfMeasureId: variantForm.salesUnitOfMeasureId,
              // Never sent on update -- the backend has no operation that changes an existing
              // variant's selling mode (ProductVariant.SellingMode has no setter).
              sellingMode: variantForm.sellingMode,
            })
          : await updateVariantMutation.mutateAsync(payload);
      setVariantMode("edit");
      setSelectedVariantId(result.productVariantId);
      setVariantForm({
        name: result.name,
        sku: result.sku || "",
        salesUnitOfMeasureId: result.salesUnitOfMeasureId,
        sortOrder: String(result.sortOrder),
        sellingMode: result.sellingMode || "PerUnit",
      });
      showNotice(
        variantMode === "create"
          ? t("catalogAdmin.notice.variantCreated")
          : t("catalogAdmin.notice.variantUpdated"),
      );
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  const changeStatus = async (mutation, status, labelKey) => {
    try {
      await mutation.mutateAsync({ status });
      showNotice(
        status === "Active"
          ? t("catalogAdmin.notice.entityActivated", { entity: t(labelKey) })
          : t("catalogAdmin.notice.entitySuspended", { entity: t(labelKey) }),
      );
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  const setBranchAvailability = async (isAvailable) => {
    try {
      await setBranchAvailabilityMutation.mutateAsync({ isAvailable });
      showNotice(
        isAvailable
          ? t("catalogAdmin.notice.variantMarkedAvailable")
          : t("catalogAdmin.notice.variantMarkedUnavailable"),
      );
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  return (
    <AppLayout>
      <main className="odoo-root space-y-3" dir="rtl">
        <PageHeader
          title={t("catalogAdmin.pageTitle")}
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  categoriesQuery.refetch();
                  productsQuery.refetch();
                  if (selectedProductId) variantsQuery.refetch();
                }}
                className="flex items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-sm font-bold text-ink"
              >
                <RefreshCw size={14} />
                {t("catalogAdmin.refresh")}
              </button>
              {tab !== "modifiers" && (
                <button
                  type="button"
                  onClick={tab === "categories" ? startCreateCategory : startCreateProduct}
                  className="flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-bold text-white"
                >
                  <Plus size={14} />
                  {tab === "categories" ? t("catalogAdmin.newCategory") : t("catalogAdmin.newProduct")}
                </button>
              )}
            </div>
          }
        />

        {notice && (
          <div className="rounded-xl border border-accent-line bg-accent-soft px-3 py-2 text-sm text-accent">
            {notice}
          </div>
        )}

        <div className="flex gap-1 rounded-xl border border-line bg-surface p-1.5 shadow-[var(--shadow-surface)]">
          <button
            type="button"
            onClick={() => setTab("categories")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-bold transition ${
              tab === "categories" ? "bg-accent-soft text-accent" : "text-muted hover:bg-hover hover:text-ink"
            }`}
          >
            <Tags size={15} />
            {t("catalogAdmin.tab.categories")}
          </button>
          <button
            type="button"
            onClick={() => setTab("products")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-bold transition ${
              tab === "products" ? "bg-accent-soft text-accent" : "text-muted hover:bg-hover hover:text-ink"
            }`}
          >
            <Package size={15} />
            {t("catalogAdmin.tab.products")}
          </button>
          <button
            type="button"
            onClick={() => setTab("modifiers")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-bold transition ${
              tab === "modifiers" ? "bg-accent-soft text-accent" : "text-muted hover:bg-hover hover:text-ink"
            }`}
          >
            <SlidersHorizontal size={15} />
            {t("catalogAdmin.tab.modifiers")}
          </button>
        </div>

        {!currentCompanyId ? (
          <EmptyState title={t("catalogAdmin.gate.companyRequired.title")} message={t("catalogAdmin.gate.companyRequired.message")} />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label={t("catalogAdmin.gate.checkingPermissions")} />
        ) : !viewPermissionQuery.hasPermission ? (
          <ErrorState title={t("catalogAdmin.gate.permissionRequired.title")} message={t("catalogAdmin.gate.permissionRequired.message")} />
        ) : tab === "categories" ? (
          <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
            <section className="rounded-xl border border-line bg-surface p-3">
              <select
                value={categoryStatus}
                onChange={(event) => setCategoryStatus(event.target.value)}
                className="mb-3 h-10 rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none"
              >
                <option value="">{t("catalogAdmin.field.allCategories")}</option>
                <option value="Active">{t("catalogAdmin.common.active")}</option>
                <option value="Suspended">{t("catalogAdmin.common.suspended")}</option>
              </select>
              {categoriesQuery.isLoading && <LoadingState label={t("catalogAdmin.categories.loading")} />}
              {categoriesQuery.isError && (
                <ErrorState title={t("catalogAdmin.categories.loadError")} message={getErrorMessage(categoriesQuery.error, t)} />
              )}
              {!categoriesQuery.isLoading && !categoriesQuery.isError && categoriesQuery.data?.length === 0 && (
                <EmptyState title={t("catalogAdmin.categories.empty.title")} message={t("catalogAdmin.categories.empty.message")} />
              )}
              {!categoriesQuery.isLoading && !categoriesQuery.isError && Boolean(categoriesQuery.data?.length) && (
                <div className="max-h-[calc(100vh-350px)] min-h-[360px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                  {categoriesQuery.data.map((category) => (
                    <EntityCard
                      key={category.categoryId}
                      icon={<Tags size={15} className="shrink-0 text-accent" />}
                      title={category.name}
                      meta={category.parentCategoryName ? t("catalogAdmin.categories.parentMeta", { name: category.parentCategoryName }) : t("catalogAdmin.categories.rootCategory")}
                      status={category.status}
                      selected={selectedCategoryId === category.categoryId}
                      onSelect={() => selectCategory(category)}
                    >
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-raised p-2">
                          <div className="text-subtle">{t("catalogAdmin.common.sort")}</div>
                          <div className="mt-1 font-semibold text-ink">{category.sortOrder}</div>
                        </div>
                        <div className="rounded-lg bg-raised p-2">
                          <div className="text-subtle">{t("catalogAdmin.common.created")}</div>
                          <div className="mt-1 font-semibold text-ink">
                            {formatDateTime(category.createdAtUtc)}
                          </div>
                        </div>
                      </div>
                    </EntityCard>
                  ))}
                </div>
              )}
            </section>
            <section className="rounded-xl border border-line bg-surface p-4">
              <PanelTitle
                icon={<Power size={15} className="text-accent" />}
                eyebrow={categoryMode === "create" ? t("catalogAdmin.categories.createEyebrow") : t("catalogAdmin.categories.detailsEyebrow")}
                title={categoryMode === "create" ? t("catalogAdmin.categories.newTitle") : selectedCategory?.name || t("catalogAdmin.common.loading")}
                status={selectedCategory?.status}
              />
              {categoryMode === "edit" && categoryDetailsQuery.isLoading && <LoadingState label={t("catalogAdmin.categories.loadingDetails")} />}
              {categoryMode === "edit" && categoryDetailsQuery.isError && (
                <ErrorState title={t("catalogAdmin.categories.loadDetailsError")} message={getErrorMessage(categoryDetailsQuery.error, t)} />
              )}
              {(categoryMode === "create" || selectedCategory) && (
                <CategoryForm
                  mode={categoryMode}
                  form={categoryForm}
                  setForm={setCategoryForm}
                  categories={categories}
                  selectedCategory={selectedCategory}
                  canManage={canManage}
                  isPending={categoryPending}
                  onSubmit={submitCategory}
                  onStatusChange={(status) => changeStatus(categoryStatusMutation, status, "catalogAdmin.entity.category")}
                />
              )}
            </section>
          </div>
        ) : tab === "products" ? (
          <div className="grid gap-4 2xl:grid-cols-[380px_1fr]">
            <section className="rounded-xl border border-line bg-surface p-3">
              <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_130px]">
                <label className="relative block">
                  <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-subtle" />
                  <input
                    value={productSearch}
                    onChange={(event) => {
                      setProductSearch(event.target.value);
                      setProductPage(1);
                    }}
                    maxLength={100}
                    placeholder={t("catalogAdmin.products.searchPlaceholder")}
                    className="h-10 w-full rounded-xl border border-line bg-canvas pr-9 pl-3 text-sm text-ink outline-none"
                  />
                </label>
                <select
                  value={productStatus}
                  onChange={(event) => {
                    setProductStatus(event.target.value);
                    setProductPage(1);
                  }}
                  className="h-10 rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none"
                >
                  <option value="">{t("catalogAdmin.field.allStatus")}</option>
                  <option value="Active">{t("catalogAdmin.common.active")}</option>
                  <option value="Suspended">{t("catalogAdmin.common.suspended")}</option>
                </select>
                <select
                  value={productCategoryId}
                  onChange={(event) => {
                    setProductCategoryId(event.target.value);
                    setProductPage(1);
                  }}
                  className="h-10 rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none sm:col-span-2"
                >
                  <option value="">{t("catalogAdmin.field.allCategories")}</option>
                  {categories.map((category) => (
                    <option key={category.categoryId} value={category.categoryId}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              {productsQuery.isLoading && <LoadingState label={t("catalogAdmin.products.loading")} />}
              {productsQuery.isError && (
                <ErrorState title={t("catalogAdmin.products.loadError")} message={getErrorMessage(productsQuery.error, t)} />
              )}
              {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 && (
                <EmptyState title={t("catalogAdmin.products.empty.title")} message={t("catalogAdmin.products.empty.message")} />
              )}
              {!productsQuery.isLoading && !productsQuery.isError && products.length > 0 && (
                <div className="max-h-[calc(100vh-420px)] min-h-[320px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                  {products.map((product) => (
                    <EntityCard
                      key={product.productId}
                      icon={<Package size={15} className="shrink-0 text-accent" />}
                      title={product.name}
                      meta={product.categoryName || t("catalogAdmin.field.noCategory")}
                      status={product.status}
                      selected={selectedProductId === product.productId}
                      onSelect={() => selectProduct(product)}
                    >
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-raised p-2">
                          <div className="text-subtle">{t("catalogAdmin.common.variants")}</div>
                          <div className="mt-1 font-semibold text-ink">{product.variantCount}</div>
                        </div>
                        <div className="rounded-lg bg-raised p-2">
                          <div className="text-subtle">{t("catalogAdmin.common.sort")}</div>
                          <div className="mt-1 font-semibold text-ink">{product.sortOrder}</div>
                        </div>
                      </div>
                    </EntityCard>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between gap-2 text-sm text-muted">
                <span>
                  {t("catalogAdmin.common.pageOf", { current: productsQuery.data?.pageNumber || 1, total: productsQuery.data?.totalPages || 0 })}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={productPage <= 1}
                    onClick={() => setProductPage((page) => Math.max(1, page - 1))}
                    className="rounded-lg border border-line px-3 py-1 disabled:opacity-40"
                  >
                    {t("catalogAdmin.common.prev")}
                  </button>
                  <button
                    type="button"
                    disabled={!productsQuery.data || productPage >= productsQuery.data.totalPages}
                    onClick={() => setProductPage((page) => page + 1)}
                    className="rounded-lg border border-line px-3 py-1 disabled:opacity-40"
                  >
                    {t("catalogAdmin.common.next")}
                  </button>
                </div>
              </div>
            </section>
            <section className="space-y-4">
              <div className="rounded-xl border border-line bg-surface p-4">
                <PanelTitle
                  icon={<Power size={15} className="text-accent" />}
                  eyebrow={productMode === "create" ? t("catalogAdmin.products.createEyebrow") : t("catalogAdmin.products.detailsEyebrow")}
                  title={productMode === "create" ? t("catalogAdmin.products.newTitle") : selectedProduct?.name || t("catalogAdmin.common.loading")}
                  status={selectedProduct?.status}
                />
                {productMode === "edit" && productDetailsQuery.isLoading && <LoadingState label={t("catalogAdmin.products.loadingDetails")} />}
                {productMode === "edit" && productDetailsQuery.isError && (
                  <ErrorState title={t("catalogAdmin.products.loadDetailsError")} message={getErrorMessage(productDetailsQuery.error, t)} />
                )}
                {(productMode === "create" || selectedProduct) && (
                  <div className="space-y-4">
                    {selectedProduct && (
                      <div className="grid gap-2 md:grid-cols-4">
                        <InfoTile label={t("catalogAdmin.field.category")} value={selectedProduct.categoryName || t("catalogAdmin.common.none")} />
                        <InfoTile label={t("catalogAdmin.common.tax")} value={selectedProduct.salesTaxCategoryCode || t("catalogAdmin.common.none")} />
                        <InfoTile label={t("catalogAdmin.common.variants")} value={String(selectedProduct.variants.length)} />
                        <InfoTile label={t("catalogAdmin.common.created")} value={formatDateTime(selectedProduct.createdAtUtc)} />
                      </div>
                    )}
                    <ProductForm
                      mode={productMode}
                      form={productForm}
                      setForm={setProductForm}
                      categories={categories}
                      selectedProduct={selectedProduct}
                      canManage={canManage}
                      isPending={productPending}
                      onSubmit={submitProduct}
                      onStatusChange={(status) => changeStatus(productStatusMutation, status, "catalogAdmin.entity.product")}
                      onUploadImage={uploadProductImage}
                      onDeleteImage={deleteProductImage}
                      isImageUploading={uploadProductImageMutation.isPending}
                      isImageDeleting={deleteProductImageMutation.isPending}
                    />
                    <div className="rounded-xl border border-line bg-raised px-3 py-2 text-sm text-muted">
                      {t("catalogAdmin.products.scopeNote")}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-line bg-surface p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <Boxes size={15} className="text-accent" />
                      {t("catalogAdmin.products.variantsHeading")}
                    </div>
                    <h2 className="mt-1 text-lg font-black text-ink">
                      {selectedProduct?.name || t("catalogAdmin.products.selectProductFallback")}
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={variantStatus}
                      onChange={(event) => setVariantStatus(event.target.value)}
                      className="h-10 rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none"
                    >
                      <option value="">{t("catalogAdmin.field.allVariants")}</option>
                      <option value="Active">{t("catalogAdmin.common.active")}</option>
                      <option value="Suspended">{t("catalogAdmin.common.suspended")}</option>
                    </select>
                    <button
                      type="button"
                      onClick={startCreateVariant}
                      disabled={!selectedProduct}
                      className="flex h-10 items-center gap-2 rounded-xl bg-accent px-3 text-sm font-bold text-white disabled:opacity-50"
                    >
                      <Plus size={14} />
                      {t("catalogAdmin.products.newVariant")}
                    </button>
                  </div>
                </div>
                {!selectedProductId ? (
                  <EmptyState title={t("catalogAdmin.products.selectProduct.title")} message={t("catalogAdmin.products.selectProduct.message")} />
                ) : variantsQuery.isLoading ? (
                  <LoadingState label={t("catalogAdmin.products.loadingVariants")} />
                ) : variantsQuery.isError ? (
                  <ErrorState title={t("catalogAdmin.products.loadVariantsError")} message={getErrorMessage(variantsQuery.error, t)} />
                ) : (
                  <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
                    <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                      {currentBranchId && branchAvailabilityOverviewQuery.data && (
                        <div className="rounded-xl border border-line bg-raised p-3 text-sm text-muted">
                          <div className="flex items-center gap-2 font-bold text-ink">
                            <MapPin size={14} className="text-accent" />
                            {t("catalogAdmin.products.branchAvailabilityHeading")}
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                            <div className="rounded-lg bg-success-soft p-2 text-success">
                              {t("catalogAdmin.products.availCountAvailable", { n: branchAvailabilitySummary.available })}
                            </div>
                            <div className="rounded-lg bg-danger-soft p-2 text-danger">
                              {t("catalogAdmin.products.availCountUnavailable", { n: branchAvailabilitySummary.unavailable })}
                            </div>
                            <div className="rounded-lg bg-warning-soft p-2 text-warning">
                              {t("catalogAdmin.products.availCountMissing", { n: branchAvailabilitySummary.missing })}
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-subtle">
                            {t("catalogAdmin.products.showingOf", {
                              shown: branchAvailabilityOverviewQuery.data.items.length,
                              total: branchAvailabilitySummary.total,
                            })}
                          </div>
                        </div>
                      )}
                      {variants.length === 0 ? (
                        <EmptyState title={t("catalogAdmin.products.noVariants.title")} message={t("catalogAdmin.products.noVariants.message")} />
                      ) : (
                        variants.map((variant) => (
                          <EntityCard
                            key={variant.productVariantId}
                            icon={<Boxes size={15} className="shrink-0 text-accent" />}
                            title={variant.name}
                            meta={`${variant.sku || t("catalogAdmin.field.noSku")} · ${variant.salesUnitOfMeasureCode}`}
                            status={variant.status}
                            selected={selectedVariantId === variant.productVariantId}
                            onSelect={() => selectVariant(variant)}
                          />
                        ))
                      )}
                    </div>
                    <div>
                      {variantMode === "edit" && variantDetailsQuery.isLoading && <LoadingState label={t("catalogAdmin.products.loadingVariantDetails")} />}
                      {variantMode === "edit" && variantDetailsQuery.isError && (
                        <ErrorState title={t("catalogAdmin.products.loadVariantDetailsError")} message={getErrorMessage(variantDetailsQuery.error, t)} />
                      )}
                      {(variantMode === "create" || selectedVariant) && (
                        <div className="space-y-4">
                          <VariantForm
                            mode={variantMode}
                            form={variantForm}
                            setForm={setVariantForm}
                            units={unitsQuery.data || []}
                            selectedVariant={selectedVariant}
                            selectedProduct={selectedProduct}
                            canManage={canManage}
                            isPending={variantPending}
                            onSubmit={submitVariant}
                            onStatusChange={(status) => changeStatus(variantStatusMutation, status, "catalogAdmin.entity.variant")}
                          />
                          <BranchAvailabilityPanel
                            currentBranch={currentBranch}
                            selectedVariant={selectedVariant}
                            availabilityQuery={branchAvailabilityQuery}
                            canManage={canManage}
                            isPending={setBranchAvailabilityMutation.isPending}
                            onSetAvailability={setBranchAvailability}
                          />
                          <PrintLabelPanel
                            companyId={currentCompanyId}
                            branchId={currentBranchId}
                            selectedVariant={selectedVariant}
                            canManage={canManage}
                            showNotice={showNotice}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          <CatalogModifiersAdmin
            currentCompanyId={currentCompanyId}
            currentBranchId={currentBranchId}
            canRead={canRead}
            canManage={canManage}
            showNotice={showNotice}
          />
        )}
      </main>
    </AppLayout>
  );
}

function PanelTitle({ icon, eyebrow, title, status }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted">
          {icon}
          {eyebrow}
        </div>
        <h2 className="mt-1 text-xl font-black text-ink">{title}</h2>
      </div>
      {status && <StatusBadge tone={statusTone(status)}>{status}</StatusBadge>}
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-xl border border-line bg-raised p-3">
      <div className="text-xs text-subtle">{label}</div>
      <div className="mt-1 truncate text-sm font-black text-ink">{value}</div>
    </div>
  );
}
