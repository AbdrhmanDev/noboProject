import { useMemo, useRef, useState } from "react";
import {
  BadgePercent,
  CircleCheck,
  CirclePause,
  Link2,
  Package,
  Pencil,
  Percent,
  Plus,
  Power,
  ReceiptText,
  RefreshCw,
  Search,
  Unlink,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { useI18n } from "../../i18n/I18nContext";
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
import { useProductDetails, useProducts } from "../../features/catalog/hooks/useCatalog";
import {
  useChangeTaxCategoryStatus,
  useCompanyTaxSettings,
  useCreateTaxCategory,
  useSetCompanyTaxSettings,
  useSetProductSalesTaxCategory,
  useTaxCategories,
  useTaxCategoryDetails,
  useUpdateTaxCategory,
} from "../../features/tax/hooks/useTax";

const TAX_VIEW_PERMISSION = "Tax.View";
const TAX_MANAGE_PERMISSION = "Tax.Manage";
const TAX_TREATMENTS = ["StandardRated", "ZeroRated", "Exempt"];
const EMPTY_CATEGORY_FORM = {
  code: "",
  name: "",
  treatment: "StandardRated",
  ratePercent: "",
};

function getErrorMessage(error, t) {
  return error?.message || t("taxAdmin.requestFailed");
}

function statusTone(status) {
  return status === "Active" ? "success" : "warning";
}

const TREATMENT_LABEL_KEYS = {
  StandardRated: "taxAdmin.treatment.standardRated",
  ZeroRated: "taxAdmin.treatment.zeroRated",
  Exempt: "taxAdmin.treatment.exempt",
};

function parseRatePercent(value, treatment, t) {
  const normalized = String(value).trim();
  if (!normalized) return { error: t("taxAdmin.notice.rateRequired") };
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return { error: t("taxAdmin.notice.rateInvalid") };
  }

  const parsed = Number(normalized);
  if (parsed < 0 || parsed > 100) {
    return { error: t("taxAdmin.notice.rateRange") };
  }
  if (treatment === "StandardRated" && parsed <= 0) {
    return { error: t("taxAdmin.notice.standardRatedPositive") };
  }
  if ((treatment === "ZeroRated" || treatment === "Exempt") && parsed !== 0) {
    return { error: t("taxAdmin.notice.zeroRatedExemptZero") };
  }

  return { value: parsed };
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

function TaxCategoryCard({ category, selected, onSelect }) {
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
            <BadgePercent size={16} className="shrink-0 text-accent" />
            <div className="truncate text-sm font-black text-ink">{category.name}</div>
          </div>
          <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted">
            <span className="font-semibold text-muted">{category.code}</span>
            <span>{t(TREATMENT_LABEL_KEYS[category.treatment] || category.treatment)}</span>
            <span>{category.ratePercent}%</span>
          </div>
        </div>
        <StatusBadge tone={statusTone(category.status)}>{category.status}</StatusBadge>
      </div>
      <div className="mt-3 text-xs text-subtle">
        {t("taxAdmin.common.updatedOn", { date: formatDateTime(category.updatedAtUtc) })}
      </div>
    </button>
  );
}

function ProductCard({ product, selected, onSelect }) {
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
            <Package size={16} className="shrink-0 text-accent" />
            <div className="truncate text-sm font-black text-ink">{product.name}</div>
          </div>
          <div className="mt-1 truncate text-sm text-muted">
            {product.categoryName || t("taxAdmin.field.noCategory")} | {product.salesTaxCategoryCode || t("taxAdmin.field.noTaxCategory")}
          </div>
        </div>
        <StatusBadge tone={statusTone(product.status)}>{product.status}</StatusBadge>
      </div>
    </button>
  );
}

export default function TaxAdminPage() {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const [tab, setTab] = useState("settings");
  const [notice, setNotice] = useState("");
  const [categoryStatus, setCategoryStatus] = useState("");
  const [categoryTreatment, setCategoryTreatment] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [categoryMode, setCategoryMode] = useState("create");
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM);
  const [productSearch, setProductSearch] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [assignmentTaxCategoryId, setAssignmentTaxCategoryId] = useState("");
  const categoryFormRef = useRef(null);

  const viewPermissionQuery = useHasPermission(currentCompanyId, TAX_VIEW_PERMISSION);
  const managePermissionQuery = useHasPermission(currentCompanyId, TAX_MANAGE_PERMISSION);
  const canRead =
    Boolean(currentCompanyId) &&
    !viewPermissionQuery.isLoading &&
    viewPermissionQuery.hasPermission;
  const canManage =
    Boolean(currentCompanyId) &&
    !managePermissionQuery.isLoading &&
    managePermissionQuery.hasPermission;

  const categoryFilters = useMemo(
    () => ({
      status: categoryStatus,
      treatment: categoryTreatment,
      search: categorySearch.trim(),
    }),
    [categorySearch, categoryStatus, categoryTreatment],
  );
  const activeCategoryFilters = useMemo(() => ({ status: "Active" }), []);
  const productFilters = useMemo(
    () => ({ pageNumber: productPage, pageSize: 25, search: productSearch.trim() }),
    [productPage, productSearch],
  );

  const settingsQuery = useCompanyTaxSettings(currentCompanyId, canRead);
  const categoriesQuery = useTaxCategories(currentCompanyId, categoryFilters, canRead);
  const activeCategoriesQuery = useTaxCategories(
    currentCompanyId,
    activeCategoryFilters,
    canRead,
  );
  const categoryDetailsQuery = useTaxCategoryDetails(
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

  const settingsMutation = useSetCompanyTaxSettings(currentCompanyId, currentBranchId);
  const createCategoryMutation = useCreateTaxCategory(currentCompanyId, currentBranchId);
  const updateCategoryMutation = useUpdateTaxCategory(
    currentCompanyId,
    currentBranchId,
    selectedCategoryId,
  );
  const categoryStatusMutation = useChangeTaxCategoryStatus(
    currentCompanyId,
    currentBranchId,
    selectedCategoryId,
  );
  const assignmentMutation = useSetProductSalesTaxCategory(
    currentCompanyId,
    currentBranchId,
    selectedProductId,
  );

  const selectedCategory = categoryDetailsQuery.data || null;
  const selectedProduct = productDetailsQuery.data || null;
  const isCategoryPending =
    createCategoryMutation.isPending ||
    updateCategoryMutation.isPending ||
    categoryStatusMutation.isPending;

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  };

  const startCreateCategory = () => {
    setTab("categories");
    setCategoryMode("create");
    setSelectedCategoryId(null);
    setCategoryForm({ ...EMPTY_CATEGORY_FORM });
    window.setTimeout(() => {
      categoryFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      showNotice(t("taxAdmin.notice.readyToCreate"));
    }, 0);
  };

  const selectCategory = (category) => {
    setCategoryMode("edit");
    setSelectedCategoryId(category.taxCategoryId);
    setCategoryForm({
      code: category.code,
      name: category.name,
      treatment: category.treatment,
      ratePercent: String(category.ratePercent),
    });
  };

  const selectProduct = (product) => {
    setSelectedProductId(product.productId);
    setAssignmentTaxCategoryId(product.salesTaxCategoryId || "");
  };

  const toggleTaxSettings = async () => {
    try {
      await settingsMutation.mutateAsync({
        isTaxEnabled: !settingsQuery.data?.isTaxEnabled,
      });
      showNotice(t("taxAdmin.notice.settingsUpdated"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  const submitCategory = async () => {
    const rate = parseRatePercent(categoryForm.ratePercent, categoryForm.treatment, t);
    if (rate.error) return showNotice(rate.error);

    try {
      const payload = {
        code: categoryForm.code,
        name: categoryForm.name,
        ratePercent: rate.value,
      };
      const result =
        categoryMode === "create"
          ? await createCategoryMutation.mutateAsync({
              ...payload,
              treatment: categoryForm.treatment,
            })
          : await updateCategoryMutation.mutateAsync(payload);

      setCategoryMode("edit");
      setSelectedCategoryId(result.taxCategoryId);
      setCategoryForm({
        code: result.code,
        name: result.name,
        treatment: result.treatment,
        ratePercent: String(result.ratePercent),
      });
      showNotice(categoryMode === "create" ? t("taxAdmin.notice.categoryCreated") : t("taxAdmin.notice.categoryUpdated"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  const changeCategoryStatus = async () => {
    if (!selectedCategory) return;
    const status = selectedCategory.status === "Active" ? "Suspended" : "Active";
    try {
      await categoryStatusMutation.mutateAsync({ status });
      showNotice(status === "Active" ? t("taxAdmin.notice.categoryActivated") : t("taxAdmin.notice.categorySuspended"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  const submitAssignment = async () => {
    if (!selectedProductId) return showNotice(t("taxAdmin.notice.selectProductFirst"));

    try {
      await assignmentMutation.mutateAsync({
        taxCategoryId: assignmentTaxCategoryId || null,
      });
      showNotice(
        assignmentTaxCategoryId
          ? t("taxAdmin.notice.assignmentSet")
          : t("taxAdmin.notice.assignmentCleared"),
      );
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  const clearAssignment = async () => {
    setAssignmentTaxCategoryId("");
    try {
      await assignmentMutation.mutateAsync({ taxCategoryId: null });
      showNotice(t("taxAdmin.notice.assignmentCleared"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  return (
    <AppLayout>
      <main className="odoo-root space-y-3" dir="rtl">
        <PageHeader
          title={t("taxAdmin.pageTitle")}
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  settingsQuery.refetch();
                  categoriesQuery.refetch();
                  productsQuery.refetch();
                  productDetailsQuery.refetch();
                }}
                className="flex items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-sm font-bold text-ink"
              >
                <RefreshCw size={14} />
                {t("taxAdmin.refresh")}
              </button>
              {tab === "categories" && (
                <button
                  type="button"
                  onClick={startCreateCategory}
                  className="flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-bold text-white"
                >
                  <Plus size={14} />
                  {t("taxAdmin.newCategory")}
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

        <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1.5 shadow-[var(--shadow-surface)]">
          {[
            ["settings", t("taxAdmin.tab.settings"), ReceiptText],
            ["categories", t("taxAdmin.tab.categories"), BadgePercent],
            ["assignments", t("taxAdmin.tab.assignments"), Link2],
          ].map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-bold transition ${
                tab === value ? "bg-accent-soft text-accent" : "text-muted hover:bg-hover hover:text-ink"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {!currentCompanyId ? (
          <EmptyState title={t("taxAdmin.gate.companyRequired.title")} message={t("taxAdmin.gate.companyRequired.message")} />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label={t("taxAdmin.gate.checkingPermissions")} />
        ) : !viewPermissionQuery.hasPermission ? (
          <ErrorState title={t("taxAdmin.gate.permissionRequired.title")} message={t("taxAdmin.gate.permissionRequired.message")} />
        ) : tab === "settings" ? (
          <section className="rounded-xl border border-line bg-surface p-4">
            <PanelTitle
              icon={<ReceiptText size={15} className="text-accent" />}
              eyebrow={t("taxAdmin.settingsEyebrow")}
              title={t("taxAdmin.settingsTitle")}
            />
            {settingsQuery.isLoading ? (
              <LoadingState label={t("taxAdmin.loadingSettings")} />
            ) : settingsQuery.isError ? (
              <ErrorState title={t("taxAdmin.loadSettingsError")} message={getErrorMessage(settingsQuery.error, t)} />
            ) : (
              <div className="space-y-4">
                <div className="grid gap-2 md:grid-cols-4">
                  <InfoTile label={t("taxAdmin.field.taxEnabled")} value={settingsQuery.data?.isTaxEnabled ? t("taxAdmin.common.yes") : t("taxAdmin.common.no")} />
                  <InfoTile label={t("taxAdmin.field.configured")} value={settingsQuery.data?.isConfigured ? t("taxAdmin.common.yes") : t("taxAdmin.common.no")} />
                  <InfoTile label={t("taxAdmin.common.created")} value={settingsQuery.data?.createdAtUtc ? formatDateTime(settingsQuery.data.createdAtUtc) : t("taxAdmin.common.notConfigured")} />
                  <InfoTile label={t("taxAdmin.common.updated")} value={settingsQuery.data?.updatedAtUtc ? formatDateTime(settingsQuery.data.updatedAtUtc) : t("taxAdmin.common.notConfigured")} />
                </div>
                <div className="rounded-xl border border-line bg-raised px-3 py-2 text-sm text-muted">
                  {t("taxAdmin.settingsNote")}
                </div>
                <button
                  type="button"
                  onClick={toggleTaxSettings}
                  disabled={!canManage || settingsMutation.isPending}
                  className="flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-white disabled:opacity-50"
                >
                  <Power size={15} />
                  {settingsQuery.data?.isTaxEnabled ? t("taxAdmin.disableTax") : t("taxAdmin.enableTax")}
                </button>
              </div>
            )}
          </section>
        ) : tab === "categories" ? (
          <div className="grid gap-4 2xl:grid-cols-[380px_1fr]">
            <section className="rounded-xl border border-line bg-surface p-3">
              <div className="mb-3 grid gap-2">
                <label className="relative block">
                  <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-subtle" />
                  <input
                    value={categorySearch}
                    onChange={(event) => setCategorySearch(event.target.value)}
                    maxLength={100}
                    placeholder={t("taxAdmin.searchCategories")}
                    className="h-10 w-full rounded-xl border border-line bg-canvas pr-9 pl-3 text-sm text-ink outline-none"
                  />
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    value={categoryStatus}
                    onChange={(event) => setCategoryStatus(event.target.value)}
                    className="h-10 rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none"
                  >
                    <option value="">{t("taxAdmin.field.allStatus")}</option>
                    <option value="Active">{t("taxAdmin.common.active")}</option>
                    <option value="Suspended">{t("taxAdmin.common.suspended")}</option>
                  </select>
                  <select
                    value={categoryTreatment}
                    onChange={(event) => setCategoryTreatment(event.target.value)}
                    className="h-10 rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none"
                  >
                    <option value="">{t("taxAdmin.field.allTreatments")}</option>
                    {TAX_TREATMENTS.map((treatment) => (
                      <option key={treatment} value={treatment}>
                        {t(TREATMENT_LABEL_KEYS[treatment])}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {categoriesQuery.isLoading && <LoadingState label={t("taxAdmin.loadingCategories")} />}
              {categoriesQuery.isError && (
                <ErrorState title={t("taxAdmin.loadCategoriesError")} message={getErrorMessage(categoriesQuery.error, t)} />
              )}
              {!categoriesQuery.isLoading && !categoriesQuery.isError && categoriesQuery.data?.length === 0 && (
                <EmptyState title={t("taxAdmin.noCategories.title")} message={t("taxAdmin.noCategories.message")} />
              )}
              {!categoriesQuery.isLoading && !categoriesQuery.isError && Boolean(categoriesQuery.data?.length) && (
                <div className="max-h-[calc(100vh-360px)] min-h-[340px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                  {categoriesQuery.data.map((category) => (
                    <TaxCategoryCard
                      key={category.taxCategoryId}
                      category={category}
                      selected={selectedCategoryId === category.taxCategoryId}
                      onSelect={() => selectCategory(category)}
                    />
                  ))}
                </div>
              )}
            </section>
            <section ref={categoryFormRef} className="rounded-xl border border-line bg-surface p-4">
              <PanelTitle
                icon={<Percent size={15} className="text-accent" />}
                eyebrow={categoryMode === "create" ? t("taxAdmin.createEyebrow") : t("taxAdmin.detailsEyebrow")}
                title={categoryMode === "create" ? t("taxAdmin.newCategory") : selectedCategory?.name || t("taxAdmin.common.loading")}
                status={selectedCategory?.status}
              />
              {categoryMode === "edit" && categoryDetailsQuery.isLoading && <LoadingState label={t("taxAdmin.loadingCategory")} />}
              {categoryMode === "edit" && categoryDetailsQuery.isError && (
                <ErrorState title={t("taxAdmin.loadCategoryError")} message={getErrorMessage(categoryDetailsQuery.error, t)} />
              )}
              {(categoryMode === "create" || selectedCategory) && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitCategory();
                  }}
                  className="space-y-3"
                >
                  <div className="grid gap-3 lg:grid-cols-[170px_1fr_180px_150px]">
                    <label className="text-sm font-semibold text-muted">
                      {t("taxAdmin.field.code")}
                      <input
                        value={categoryForm.code}
                        onChange={(event) => setCategoryForm((draft) => ({ ...draft, code: event.target.value }))}
                        maxLength={50}
                        disabled={!canManage || isCategoryPending}
                        className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none disabled:opacity-50"
                      />
                    </label>
                    <label className="text-sm font-semibold text-muted">
                      {t("taxAdmin.field.name")}
                      <input
                        value={categoryForm.name}
                        onChange={(event) => setCategoryForm((draft) => ({ ...draft, name: event.target.value }))}
                        maxLength={200}
                        disabled={!canManage || isCategoryPending}
                        className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none disabled:opacity-50"
                      />
                    </label>
                    <label className="text-sm font-semibold text-muted">
                      {t("taxAdmin.field.treatment")}
                      {categoryMode === "create" ? (
                        <select
                          value={categoryForm.treatment}
                          onChange={(event) => setCategoryForm((draft) => ({ ...draft, treatment: event.target.value }))}
                          disabled={!canManage || isCategoryPending}
                          className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none disabled:opacity-50"
                        >
                          {TAX_TREATMENTS.map((treatment) => (
                            <option key={treatment} value={treatment}>
                              {t(TREATMENT_LABEL_KEYS[treatment])}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="mt-1 flex h-11 items-center rounded-xl border border-line bg-raised px-3 text-sm text-ink">
                          {t(TREATMENT_LABEL_KEYS[selectedCategory?.treatment] || TREATMENT_LABEL_KEYS[categoryForm.treatment])}
                        </div>
                      )}
                    </label>
                    <label className="text-sm font-semibold text-muted">
                      {t("taxAdmin.field.ratePercent")}
                      <input
                        value={categoryForm.ratePercent}
                        onChange={(event) => setCategoryForm((draft) => ({ ...draft, ratePercent: event.target.value }))}
                        disabled={!canManage || isCategoryPending}
                        className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none disabled:opacity-50"
                      />
                    </label>
                  </div>
                  <div className="rounded-xl border border-line bg-raised px-3 py-2 text-sm text-muted">
                    {t("taxAdmin.categoryFormNote")}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={!canManage || isCategoryPending}
                      className="flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {categoryMode === "edit" ? <Pencil size={15} /> : <Plus size={15} />}
                      {isCategoryPending ? t("taxAdmin.common.saving") : categoryMode === "edit" ? t("taxAdmin.saveCategory") : t("taxAdmin.createCategory")}
                    </button>
                    {categoryMode === "edit" && selectedCategory && (
                      <button
                        type="button"
                        disabled={!canManage || isCategoryPending}
                        onClick={changeCategoryStatus}
                        className="flex h-10 items-center gap-2 rounded-xl border border-line bg-raised px-4 text-sm font-bold text-ink disabled:opacity-50"
                      >
                        {selectedCategory.status === "Active" ? <CirclePause size={15} /> : <CircleCheck size={15} />}
                        {selectedCategory.status === "Active" ? t("taxAdmin.common.suspendAction") : t("taxAdmin.common.activateAction")}
                      </button>
                    )}
                  </div>
                </form>
              )}
            </section>
          </div>
        ) : (
          <div className="grid gap-4 2xl:grid-cols-[380px_1fr]">
            <section className="rounded-xl border border-line bg-surface p-3">
              <label className="relative mb-3 block">
                <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-subtle" />
                <input
                  value={productSearch}
                  onChange={(event) => {
                    setProductSearch(event.target.value);
                    setProductPage(1);
                  }}
                  maxLength={100}
                  placeholder={t("taxAdmin.searchProducts")}
                  className="h-10 w-full rounded-xl border border-line bg-canvas pr-9 pl-3 text-sm text-ink outline-none"
                />
              </label>
              {productsQuery.isLoading && <LoadingState label={t("taxAdmin.loadingProducts")} />}
              {productsQuery.isError && (
                <ErrorState title={t("taxAdmin.loadProductsError")} message={getErrorMessage(productsQuery.error, t)} />
              )}
              {!productsQuery.isLoading && !productsQuery.isError && productsQuery.data?.items.length === 0 && (
                <EmptyState title={t("taxAdmin.noProducts.title")} message={t("taxAdmin.noProducts.message")} />
              )}
              {!productsQuery.isLoading && !productsQuery.isError && Boolean(productsQuery.data?.items.length) && (
                <div className="max-h-[calc(100vh-390px)] min-h-[340px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                  {productsQuery.data.items.map((product) => (
                    <ProductCard
                      key={product.productId}
                      product={product}
                      selected={selectedProductId === product.productId}
                      onSelect={() => selectProduct(product)}
                    />
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between gap-2 text-sm text-muted">
                <span>
                  {t("taxAdmin.common.pageOf", { current: productsQuery.data?.pageNumber || 1, total: productsQuery.data?.totalPages || 0 })}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={productPage <= 1}
                    onClick={() => setProductPage((page) => Math.max(1, page - 1))}
                    className="rounded-lg border border-line px-3 py-1 disabled:opacity-40"
                  >
                    {t("taxAdmin.common.prev")}
                  </button>
                  <button
                    type="button"
                    disabled={!productsQuery.data || productPage >= productsQuery.data.totalPages}
                    onClick={() => setProductPage((page) => page + 1)}
                    className="rounded-lg border border-line px-3 py-1 disabled:opacity-40"
                  >
                    {t("taxAdmin.common.next")}
                  </button>
                </div>
              </div>
            </section>
            <section className="rounded-xl border border-line bg-surface p-4">
              <PanelTitle
                icon={<Link2 size={15} className="text-accent" />}
                eyebrow={t("taxAdmin.assignmentEyebrow")}
                title={selectedProduct?.name || t("taxAdmin.selectProductFallback")}
              />
              {!selectedProductId ? (
                <EmptyState title={t("taxAdmin.selectProduct.title")} message={t("taxAdmin.selectProduct.message")} />
              ) : productDetailsQuery.isLoading ? (
                <LoadingState label={t("taxAdmin.loadingProduct")} />
              ) : productDetailsQuery.isError ? (
                <ErrorState title={t("taxAdmin.loadProductError")} message={getErrorMessage(productDetailsQuery.error, t)} />
              ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitAssignment();
                  }}
                  className="space-y-4"
                >
                  <div className="grid gap-2 md:grid-cols-3">
                    <InfoTile label={t("taxAdmin.field.product")} value={selectedProduct?.name || ""} />
                    <InfoTile label={t("taxAdmin.field.currentTaxCategory")} value={selectedProduct?.salesTaxCategoryCode || t("taxAdmin.common.none")} />
                    <InfoTile label={t("taxAdmin.field.productStatus")} value={selectedProduct?.status || ""} />
                  </div>
                  <label className="block text-sm font-semibold text-muted">
                    {t("taxAdmin.field.taxCategory")}
                    <select
                      value={assignmentTaxCategoryId}
                      onChange={(event) => setAssignmentTaxCategoryId(event.target.value)}
                      disabled={!canManage || assignmentMutation.isPending}
                      className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none disabled:opacity-50"
                    >
                      <option value="">{t("taxAdmin.field.noTaxCategory")}</option>
                      {(activeCategoriesQuery.data || []).map((category) => (
                        <option key={category.taxCategoryId} value={category.taxCategoryId}>
                          {category.code} | {category.name} | {t(TREATMENT_LABEL_KEYS[category.treatment] || category.treatment)} | {category.ratePercent}%
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="rounded-xl border border-line bg-raised px-3 py-2 text-sm text-muted">
                    {t("taxAdmin.clearAssignmentNote")}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={!canManage || assignmentMutation.isPending}
                      className="flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-white disabled:opacity-50"
                    >
                      <Link2 size={15} />
                      {t("taxAdmin.saveAssignment")}
                    </button>
                    <button
                      type="button"
                      disabled={!canManage || assignmentMutation.isPending}
                      onClick={clearAssignment}
                      className="flex h-10 items-center gap-2 rounded-xl border border-line bg-raised px-4 text-sm font-bold text-ink disabled:opacity-50"
                    >
                      <Unlink size={15} />
                      {t("taxAdmin.clearAssignment")}
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
