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

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

function statusTone(status) {
  return status === "Active" ? "success" : "warning";
}

function parseRatePercent(value, treatment) {
  const normalized = String(value).trim();
  if (!normalized) return { error: "Rate percent is required." };
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return { error: "Rate percent must be a valid number." };
  }

  const parsed = Number(normalized);
  if (parsed < 0 || parsed > 100) {
    return { error: "Rate percent must be between 0 and 100." };
  }
  if (treatment === "StandardRated" && parsed <= 0) {
    return { error: "StandardRated tax categories must have a positive rate percent." };
  }
  if ((treatment === "ZeroRated" || treatment === "Exempt") && parsed !== 0) {
    return { error: "ZeroRated and Exempt tax categories must have a zero rate percent." };
  }

  return { value: parsed };
}

function PanelTitle({ icon, eyebrow, title, status }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {icon}
          {eyebrow}
        </div>
        <h2 className="mt-1 text-xl font-black text-white">{title}</h2>
      </div>
      {status && <StatusBadge tone={statusTone(status)}>{status}</StatusBadge>}
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="mt-1 truncate text-sm font-black text-white">{value}</div>
    </div>
  );
}

function TaxCategoryCard({ category, selected, onSelect }) {
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
            <BadgePercent size={16} className="shrink-0 text-blue-300" />
            <div className="truncate text-sm font-black text-white">{category.name}</div>
          </div>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">{category.code}</span>
            <span>{category.treatment}</span>
            <span>{category.ratePercent}%</span>
          </div>
        </div>
        <StatusBadge tone={statusTone(category.status)}>{category.status}</StatusBadge>
      </div>
      <div className="mt-3 text-[11px] text-slate-500">
        Updated {formatDateTime(category.updatedAtUtc)}
      </div>
    </button>
  );
}

function ProductCard({ product, selected, onSelect }) {
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
            <Package size={16} className="shrink-0 text-blue-300" />
            <div className="truncate text-sm font-black text-white">{product.name}</div>
          </div>
          <div className="mt-1 truncate text-xs text-slate-400">
            {product.categoryName || "No category"} | {product.salesTaxCategoryCode || "No tax category"}
          </div>
        </div>
        <StatusBadge tone={statusTone(product.status)}>{product.status}</StatusBadge>
      </div>
    </button>
  );
}

export default function TaxAdminPage() {
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
      showNotice("Ready to create a new tax category.");
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
      showNotice("Tax settings updated.");
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const submitCategory = async () => {
    const rate = parseRatePercent(categoryForm.ratePercent, categoryForm.treatment);
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
      showNotice(`Tax category ${categoryMode === "create" ? "created" : "updated"}.`);
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const changeCategoryStatus = async () => {
    if (!selectedCategory) return;
    const status = selectedCategory.status === "Active" ? "Suspended" : "Active";
    try {
      await categoryStatusMutation.mutateAsync({ status });
      showNotice(`Tax category ${status.toLowerCase()}.`);
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const submitAssignment = async () => {
    if (!selectedProductId) return showNotice("Select a product first.");

    try {
      await assignmentMutation.mutateAsync({
        taxCategoryId: assignmentTaxCategoryId || null,
      });
      showNotice(
        assignmentTaxCategoryId
          ? "Product tax category assigned."
          : "Product tax category cleared.",
      );
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const clearAssignment = async () => {
    setAssignmentTaxCategoryId("");
    try {
      await assignmentMutation.mutateAsync({ taxCategoryId: null });
      showNotice("Product tax category cleared.");
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  return (
    <AppLayout>
      <main className="space-y-4" dir="rtl">
        <PageHeader
          title="Tax Configuration"
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
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
              {tab === "categories" && (
                <button
                  type="button"
                  onClick={startCreateCategory}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white"
                >
                  <Plus size={14} />
                  New tax category
                </button>
              )}
            </div>
          }
        />

        {notice && (
          <div className="rounded-xl border border-blue-400/25 bg-blue-500/10 px-3 py-2 text-xs text-blue-100">
            {notice}
          </div>
        )}

        <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-[#0c1424] p-2">
          {[
            ["settings", "Settings", ReceiptText],
            ["categories", "Tax Categories", BadgePercent],
            ["assignments", "Product Assignments", Link2],
          ].map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                tab === value ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {!currentCompanyId ? (
          <EmptyState title="Company required" message="Select a company to manage tax." />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label="Checking Tax permissions..." />
        ) : !viewPermissionQuery.hasPermission ? (
          <ErrorState title="Permission required" message="Tax.View permission is required." />
        ) : tab === "settings" ? (
          <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
            <PanelTitle
              icon={<ReceiptText size={15} className="text-blue-300" />}
              eyebrow="Company tax settings"
              title="Tax Settings"
            />
            {settingsQuery.isLoading ? (
              <LoadingState label="Loading tax settings..." />
            ) : settingsQuery.isError ? (
              <ErrorState title="Unable to load tax settings" message={getErrorMessage(settingsQuery.error)} />
            ) : (
              <div className="space-y-4">
                <div className="grid gap-2 md:grid-cols-4">
                  <InfoTile label="Tax enabled" value={settingsQuery.data?.isTaxEnabled ? "Yes" : "No"} />
                  <InfoTile label="Configured" value={settingsQuery.data?.isConfigured ? "Yes" : "No"} />
                  <InfoTile label="Created" value={settingsQuery.data?.createdAtUtc ? formatDateTime(settingsQuery.data.createdAtUtc) : "Not configured"} />
                  <InfoTile label="Updated" value={settingsQuery.data?.updatedAtUtc ? formatDateTime(settingsQuery.data.updatedAtUtc) : "Not configured"} />
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-slate-400">
                  This switch controls company tax calculation availability. PriceList tax mode remains managed in Pricing.
                </div>
                <button
                  type="button"
                  onClick={toggleTaxSettings}
                  disabled={!canManage || settingsMutation.isPending}
                  className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white disabled:opacity-50"
                >
                  <Power size={15} />
                  {settingsQuery.data?.isTaxEnabled ? "Disable tax" : "Enable tax"}
                </button>
              </div>
            )}
          </section>
        ) : tab === "categories" ? (
          <div className="grid gap-4 2xl:grid-cols-[380px_1fr]">
            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
              <div className="mb-3 grid gap-2">
                <label className="relative block">
                  <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={categorySearch}
                    onChange={(event) => setCategorySearch(event.target.value)}
                    maxLength={100}
                    placeholder="Search tax categories"
                    className="h-10 w-full rounded-xl border border-white/10 bg-black/20 pr-9 pl-3 text-xs text-white outline-none"
                  />
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    value={categoryStatus}
                    onChange={(event) => setCategoryStatus(event.target.value)}
                    className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                  >
                    <option value="">All status</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                  <select
                    value={categoryTreatment}
                    onChange={(event) => setCategoryTreatment(event.target.value)}
                    className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                  >
                    <option value="">All treatments</option>
                    {TAX_TREATMENTS.map((treatment) => (
                      <option key={treatment} value={treatment}>
                        {treatment}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {categoriesQuery.isLoading && <LoadingState label="Loading tax categories..." />}
              {categoriesQuery.isError && (
                <ErrorState title="Unable to load tax categories" message={getErrorMessage(categoriesQuery.error)} />
              )}
              {!categoriesQuery.isLoading && !categoriesQuery.isError && categoriesQuery.data?.length === 0 && (
                <EmptyState title="No tax categories found" message="No categories match the current filters." />
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
            <section ref={categoryFormRef} className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
              <PanelTitle
                icon={<Percent size={15} className="text-blue-300" />}
                eyebrow={categoryMode === "create" ? "Create tax category" : "Tax category details"}
                title={categoryMode === "create" ? "New tax category" : selectedCategory?.name || "Loading category"}
                status={selectedCategory?.status}
              />
              {categoryMode === "edit" && categoryDetailsQuery.isLoading && <LoadingState label="Loading tax category..." />}
              {categoryMode === "edit" && categoryDetailsQuery.isError && (
                <ErrorState title="Unable to load tax category" message={getErrorMessage(categoryDetailsQuery.error)} />
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
                    <label className="text-xs font-semibold text-slate-400">
                      Code
                      <input
                        value={categoryForm.code}
                        onChange={(event) => setCategoryForm((draft) => ({ ...draft, code: event.target.value }))}
                        maxLength={50}
                        disabled={!canManage || isCategoryPending}
                        className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none disabled:opacity-50"
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-400">
                      Name
                      <input
                        value={categoryForm.name}
                        onChange={(event) => setCategoryForm((draft) => ({ ...draft, name: event.target.value }))}
                        maxLength={200}
                        disabled={!canManage || isCategoryPending}
                        className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none disabled:opacity-50"
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-400">
                      Treatment
                      {categoryMode === "create" ? (
                        <select
                          value={categoryForm.treatment}
                          onChange={(event) => setCategoryForm((draft) => ({ ...draft, treatment: event.target.value }))}
                          disabled={!canManage || isCategoryPending}
                          className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none disabled:opacity-50"
                        >
                          {TAX_TREATMENTS.map((treatment) => (
                            <option key={treatment} value={treatment}>
                              {treatment}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="mt-1 flex h-11 items-center rounded-xl border border-white/10 bg-white/[0.025] px-3 text-sm text-slate-200">
                          {selectedCategory?.treatment || categoryForm.treatment}
                        </div>
                      )}
                    </label>
                    <label className="text-xs font-semibold text-slate-400">
                      Rate Percent
                      <input
                        value={categoryForm.ratePercent}
                        onChange={(event) => setCategoryForm((draft) => ({ ...draft, ratePercent: event.target.value }))}
                        disabled={!canManage || isCategoryPending}
                        className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none disabled:opacity-50"
                      />
                    </label>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-slate-400">
                    TaxTreatment is selected on create and read-only after creation. RatePercent is stored as an actual percent from 0 to 100.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={!canManage || isCategoryPending}
                      className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {categoryMode === "edit" ? <Pencil size={15} /> : <Plus size={15} />}
                      {isCategoryPending ? "Saving..." : categoryMode === "edit" ? "Save category" : "Create category"}
                    </button>
                    {categoryMode === "edit" && selectedCategory && (
                      <button
                        type="button"
                        disabled={!canManage || isCategoryPending}
                        onClick={changeCategoryStatus}
                        className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-xs font-bold text-slate-100 disabled:opacity-50"
                      >
                        {selectedCategory.status === "Active" ? <CirclePause size={15} /> : <CircleCheck size={15} />}
                        {selectedCategory.status === "Active" ? "Suspend" : "Activate"}
                      </button>
                    )}
                  </div>
                </form>
              )}
            </section>
          </div>
        ) : (
          <div className="grid gap-4 2xl:grid-cols-[380px_1fr]">
            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
              <label className="relative mb-3 block">
                <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={productSearch}
                  onChange={(event) => {
                    setProductSearch(event.target.value);
                    setProductPage(1);
                  }}
                  maxLength={100}
                  placeholder="Search products"
                  className="h-10 w-full rounded-xl border border-white/10 bg-black/20 pr-9 pl-3 text-xs text-white outline-none"
                />
              </label>
              {productsQuery.isLoading && <LoadingState label="Loading products..." />}
              {productsQuery.isError && (
                <ErrorState title="Unable to load products" message={getErrorMessage(productsQuery.error)} />
              )}
              {!productsQuery.isLoading && !productsQuery.isError && productsQuery.data?.items.length === 0 && (
                <EmptyState title="No products found" message="No products match the current filters." />
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
              <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-400">
                <span>
                  Page {productsQuery.data?.pageNumber || 1} / {productsQuery.data?.totalPages || 0}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={productPage <= 1}
                    onClick={() => setProductPage((page) => Math.max(1, page - 1))}
                    className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    disabled={!productsQuery.data || productPage >= productsQuery.data.totalPages}
                    onClick={() => setProductPage((page) => page + 1)}
                    className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>
            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
              <PanelTitle
                icon={<Link2 size={15} className="text-blue-300" />}
                eyebrow="Product tax assignment"
                title={selectedProduct?.name || "Select a product"}
              />
              {!selectedProductId ? (
                <EmptyState title="Select a product" message="Choose a Catalog product to assign or clear its sales tax category." />
              ) : productDetailsQuery.isLoading ? (
                <LoadingState label="Loading product..." />
              ) : productDetailsQuery.isError ? (
                <ErrorState title="Unable to load product" message={getErrorMessage(productDetailsQuery.error)} />
              ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitAssignment();
                  }}
                  className="space-y-4"
                >
                  <div className="grid gap-2 md:grid-cols-3">
                    <InfoTile label="Product" value={selectedProduct?.name || ""} />
                    <InfoTile label="Current Tax Category" value={selectedProduct?.salesTaxCategoryCode || "None"} />
                    <InfoTile label="Product Status" value={selectedProduct?.status || ""} />
                  </div>
                  <label className="block text-xs font-semibold text-slate-400">
                    Tax Category
                    <select
                      value={assignmentTaxCategoryId}
                      onChange={(event) => setAssignmentTaxCategoryId(event.target.value)}
                      disabled={!canManage || assignmentMutation.isPending}
                      className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none disabled:opacity-50"
                    >
                      <option value="">No tax category</option>
                      {(activeCategoriesQuery.data || []).map((category) => (
                        <option key={category.taxCategoryId} value={category.taxCategoryId}>
                          {category.code} | {category.name} | {category.treatment} | {category.ratePercent}%
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-slate-400">
                    Clearing sends taxCategoryId: null. This does not edit any other Product fields and does not create a fake No Tax category.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={!canManage || assignmentMutation.isPending}
                      className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white disabled:opacity-50"
                    >
                      <Link2 size={15} />
                      Save assignment
                    </button>
                    <button
                      type="button"
                      disabled={!canManage || assignmentMutation.isPending}
                      onClick={clearAssignment}
                      className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-xs font-bold text-slate-100 disabled:opacity-50"
                    >
                      <Unlink size={15} />
                      Clear assignment
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
