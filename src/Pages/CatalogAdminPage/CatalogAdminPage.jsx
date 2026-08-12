import { useMemo, useState } from "react";
import {
  Boxes,
  CircleCheck,
  CirclePause,
  Package,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Tags,
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
import {
  useActiveUnitsOfMeasure,
  useCategories,
  useCategoryDetails,
  useChangeCategoryStatus,
  useChangeProductStatus,
  useChangeProductVariantStatus,
  useCreateCategory,
  useCreateProduct,
  useCreateProductVariant,
  useProductDetails,
  useProductVariantDetails,
  useProductVariants,
  useProducts,
  useUpdateCategory,
  useUpdateProduct,
  useUpdateProductVariant,
} from "../../features/catalog/hooks/useCatalog";

const CATALOG_VIEW_PERMISSION = "Catalog.View";
const CATALOG_MANAGE_PERMISSION = "Catalog.Manage";
const EMPTY_CATEGORY_FORM = { name: "", parentCategoryId: "", sortOrder: "0" };
const EMPTY_PRODUCT_FORM = {
  name: "",
  description: "",
  categoryId: "",
  sortOrder: "0",
};
const EMPTY_VARIANT_FORM = {
  name: "",
  sku: "",
  salesUnitOfMeasureId: "",
  sortOrder: "0",
};

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

function statusTone(status) {
  return status === "Active" ? "success" : "warning";
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
      className={`w-full rounded-xl border p-3 text-start transition hover:border-blue-400/40 hover:bg-blue-500/10 ${
        selected ? "border-blue-400/60 bg-blue-500/15" : "border-white/10 bg-[#0d1728]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon}
            <div className="truncate text-sm font-black text-white">{title}</div>
          </div>
          {meta && <div className="mt-1 truncate text-xs text-slate-400">{meta}</div>}
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
        <label className="text-xs font-semibold text-slate-400">
          Name
          <input
            value={form.name}
            onChange={(event) => setForm((draft) => ({ ...draft, name: event.target.value }))}
            maxLength={200}
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
        <label className="text-xs font-semibold text-slate-400">
          Parent
          <select
            value={form.parentCategoryId}
            onChange={(event) =>
              setForm((draft) => ({ ...draft, parentCategoryId: event.target.value }))
            }
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          >
            <option value="">No parent</option>
            {parentOptions.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-400">
          Sort Order
          <input
            type="number"
            min="0"
            value={form.sortOrder}
            onChange={(event) =>
              setForm((draft) => ({ ...draft, sortOrder: event.target.value }))
            }
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
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
}) {
  const nextStatus = selectedProduct?.status === "Active" ? "Suspended" : "Active";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 md:grid-cols-[1fr_220px_140px]">
        <label className="text-xs font-semibold text-slate-400">
          Name
          <input
            value={form.name}
            onChange={(event) => setForm((draft) => ({ ...draft, name: event.target.value }))}
            maxLength={200}
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
        <label className="text-xs font-semibold text-slate-400">
          Category
          <select
            value={form.categoryId}
            onChange={(event) =>
              setForm((draft) => ({ ...draft, categoryId: event.target.value }))
            }
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-400">
          Sort Order
          <input
            type="number"
            min="0"
            value={form.sortOrder}
            onChange={(event) =>
              setForm((draft) => ({ ...draft, sortOrder: event.target.value }))
            }
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
      </div>
      <label className="block text-xs font-semibold text-slate-400">
        Description
        <textarea
          value={form.description}
          onChange={(event) =>
            setForm((draft) => ({ ...draft, description: event.target.value }))
          }
          maxLength={1000}
          rows={3}
          disabled={!canManage || isPending}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
        />
      </label>
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
  const nextStatus = selectedVariant?.status === "Active" ? "Suspended" : "Active";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 md:grid-cols-[1fr_180px_220px_140px]">
        <label className="text-xs font-semibold text-slate-400">
          Name
          <input
            value={form.name}
            onChange={(event) => setForm((draft) => ({ ...draft, name: event.target.value }))}
            maxLength={200}
            disabled={!canManage || isPending || !selectedProduct}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
        <label className="text-xs font-semibold text-slate-400">
          SKU
          <input
            value={form.sku}
            onChange={(event) => setForm((draft) => ({ ...draft, sku: event.target.value }))}
            maxLength={100}
            disabled={!canManage || isPending || !selectedProduct}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
        <label className="text-xs font-semibold text-slate-400">
          Sales UOM
          {mode === "create" ? (
            <select
              value={form.salesUnitOfMeasureId}
              onChange={(event) =>
                setForm((draft) => ({ ...draft, salesUnitOfMeasureId: event.target.value }))
              }
              disabled={!canManage || isPending || !selectedProduct}
              className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
            >
              <option value="">Select unit</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.code} - {unit.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="mt-1 flex h-11 items-center rounded-xl border border-white/10 bg-white/[0.025] px-3 text-sm text-slate-200">
              {selectedVariant
                ? `${selectedVariant.salesUnitOfMeasureCode} - ${selectedVariant.salesUnitOfMeasureName}`
                : "Loading"}
            </div>
          )}
        </label>
        <label className="text-xs font-semibold text-slate-400">
          Sort Order
          <input
            type="number"
            min="0"
            value={form.sortOrder}
            onChange={(event) =>
              setForm((draft) => ({ ...draft, sortOrder: event.target.value }))
            }
            disabled={!canManage || isPending || !selectedProduct}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-slate-400">
        Sales unit of measure is selected when creating the variant and is read-only after creation.
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

function ActionRow({ mode, entity, selected, canManage, isPending, nextStatus, onStatusChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="submit"
        disabled={!canManage || isPending}
        className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {mode === "edit" ? <Pencil size={15} /> : <Plus size={15} />}
        {isPending ? "Saving..." : mode === "edit" ? `Save ${entity}` : `Create ${entity}`}
      </button>
      {mode === "edit" && selected && (
        <button
          type="button"
          disabled={!canManage || isPending}
          onClick={() => onStatusChange(nextStatus)}
          className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-xs font-bold text-slate-100 transition hover:border-blue-400/40 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {nextStatus === "Active" ? <CircleCheck size={15} /> : <CirclePause size={15} />}
          {nextStatus === "Active" ? "Activate" : "Suspend"}
        </button>
      )}
    </div>
  );
}

export default function CatalogAdminPage() {
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const [tab, setTab] = useState("categories");
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

  const selectedCategory = categoryDetailsQuery.data || null;
  const selectedProduct = productDetailsQuery.data || null;
  const selectedVariant = variantDetailsQuery.data || null;
  const categories = allCategoriesQuery.data || [];
  const products = productsQuery.data?.items || [];
  const variants = variantsQuery.data || [];
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
    });
  };

  const submitCategory = async () => {
    const sortOrder = parseSortOrder(categoryForm.sortOrder);
    if (sortOrder === null) return showNotice("Sort order must be zero or greater.");

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
      showNotice(`Category ${categoryMode === "create" ? "created" : "updated"}.`);
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const submitProduct = async () => {
    const sortOrder = parseSortOrder(productForm.sortOrder);
    if (sortOrder === null) return showNotice("Sort order must be zero or greater.");

    try {
      const payload = {
        name: productForm.name,
        description: productForm.description.trim() || null,
        categoryId: productForm.categoryId || null,
        sortOrder,
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
      });
      showNotice(`Product ${productMode === "create" ? "created" : "updated"}.`);
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const submitVariant = async () => {
    const sortOrder = parseSortOrder(variantForm.sortOrder);
    if (sortOrder === null) return showNotice("Sort order must be zero or greater.");
    if (variantMode === "create" && !variantForm.salesUnitOfMeasureId) {
      return showNotice("Sales unit of measure is required.");
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
            })
          : await updateVariantMutation.mutateAsync(payload);
      setVariantMode("edit");
      setSelectedVariantId(result.productVariantId);
      setVariantForm({
        name: result.name,
        sku: result.sku || "",
        salesUnitOfMeasureId: result.salesUnitOfMeasureId,
        sortOrder: String(result.sortOrder),
      });
      showNotice(`Variant ${variantMode === "create" ? "created" : "updated"}.`);
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const changeStatus = async (mutation, status, label) => {
    try {
      await mutation.mutateAsync({ status });
      showNotice(`${label} ${status.toLowerCase()}.`);
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  return (
    <AppLayout>
      <main className="space-y-4" dir="rtl">
        <PageHeader
          title="Catalog"
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  categoriesQuery.refetch();
                  productsQuery.refetch();
                  if (selectedProductId) variantsQuery.refetch();
                }}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
              <button
                type="button"
                onClick={tab === "categories" ? startCreateCategory : startCreateProduct}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white"
              >
                <Plus size={14} />
                {tab === "categories" ? "New category" : "New product"}
              </button>
            </div>
          }
        />

        {notice && (
          <div className="rounded-xl border border-blue-400/25 bg-blue-500/10 px-3 py-2 text-xs text-blue-100">
            {notice}
          </div>
        )}

        <div className="flex gap-2 rounded-2xl border border-white/10 bg-[#0c1424] p-2">
          <button
            type="button"
            onClick={() => setTab("categories")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              tab === "categories" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/5"
            }`}
          >
            <Tags size={15} />
            Categories
          </button>
          <button
            type="button"
            onClick={() => setTab("products")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              tab === "products" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/5"
            }`}
          >
            <Package size={15} />
            Products
          </button>
        </div>

        {!currentCompanyId ? (
          <EmptyState title="Company required" message="Select a company to manage catalog core." />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label="Checking Catalog permissions..." />
        ) : !viewPermissionQuery.hasPermission ? (
          <ErrorState title="Permission required" message="Catalog.View permission is required." />
        ) : tab === "categories" ? (
          <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
              <select
                value={categoryStatus}
                onChange={(event) => setCategoryStatus(event.target.value)}
                className="mb-3 h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
              >
                <option value="">All categories</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>
              {categoriesQuery.isLoading && <LoadingState label="Loading categories..." />}
              {categoriesQuery.isError && (
                <ErrorState title="Unable to load categories" message={getErrorMessage(categoriesQuery.error)} />
              )}
              {!categoriesQuery.isLoading && !categoriesQuery.isError && categoriesQuery.data?.length === 0 && (
                <EmptyState title="No categories found" message="No categories match the current filter." />
              )}
              {!categoriesQuery.isLoading && !categoriesQuery.isError && Boolean(categoriesQuery.data?.length) && (
                <div className="max-h-[calc(100vh-350px)] min-h-[360px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                  {categoriesQuery.data.map((category) => (
                    <EntityCard
                      key={category.categoryId}
                      icon={<Tags size={15} className="shrink-0 text-blue-300" />}
                      title={category.name}
                      meta={category.parentCategoryName ? `Parent: ${category.parentCategoryName}` : "Root category"}
                      status={category.status}
                      selected={selectedCategoryId === category.categoryId}
                      onSelect={() => selectCategory(category)}
                    >
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                        <div className="rounded-lg bg-white/[0.03] p-2">
                          <div className="text-slate-500">Sort</div>
                          <div className="mt-1 font-semibold text-slate-200">{category.sortOrder}</div>
                        </div>
                        <div className="rounded-lg bg-white/[0.03] p-2">
                          <div className="text-slate-500">Created</div>
                          <div className="mt-1 font-semibold text-slate-200">
                            {formatDateTime(category.createdAtUtc)}
                          </div>
                        </div>
                      </div>
                    </EntityCard>
                  ))}
                </div>
              )}
            </section>
            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
              <PanelTitle
                icon={<Power size={15} className="text-blue-300" />}
                eyebrow={categoryMode === "create" ? "Create category" : "Category details"}
                title={categoryMode === "create" ? "New category" : selectedCategory?.name || "Loading category"}
                status={selectedCategory?.status}
              />
              {categoryMode === "edit" && categoryDetailsQuery.isLoading && <LoadingState label="Loading category..." />}
              {categoryMode === "edit" && categoryDetailsQuery.isError && (
                <ErrorState title="Unable to load category" message={getErrorMessage(categoryDetailsQuery.error)} />
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
                  onStatusChange={(status) => changeStatus(categoryStatusMutation, status, "Category")}
                />
              )}
            </section>
          </div>
        ) : (
          <div className="grid gap-4 2xl:grid-cols-[380px_1fr]">
            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
              <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_130px]">
                <label className="relative block">
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
                <select
                  value={productStatus}
                  onChange={(event) => {
                    setProductStatus(event.target.value);
                    setProductPage(1);
                  }}
                  className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                >
                  <option value="">All status</option>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
                <select
                  value={productCategoryId}
                  onChange={(event) => {
                    setProductCategoryId(event.target.value);
                    setProductPage(1);
                  }}
                  className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none sm:col-span-2"
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.categoryId} value={category.categoryId}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              {productsQuery.isLoading && <LoadingState label="Loading products..." />}
              {productsQuery.isError && (
                <ErrorState title="Unable to load products" message={getErrorMessage(productsQuery.error)} />
              )}
              {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 && (
                <EmptyState title="No products found" message="No products match the current filters." />
              )}
              {!productsQuery.isLoading && !productsQuery.isError && products.length > 0 && (
                <div className="max-h-[calc(100vh-420px)] min-h-[320px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                  {products.map((product) => (
                    <EntityCard
                      key={product.productId}
                      icon={<Package size={15} className="shrink-0 text-blue-300" />}
                      title={product.name}
                      meta={product.categoryName || "No category"}
                      status={product.status}
                      selected={selectedProductId === product.productId}
                      onSelect={() => selectProduct(product)}
                    >
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                        <div className="rounded-lg bg-white/[0.03] p-2">
                          <div className="text-slate-500">Variants</div>
                          <div className="mt-1 font-semibold text-slate-200">{product.variantCount}</div>
                        </div>
                        <div className="rounded-lg bg-white/[0.03] p-2">
                          <div className="text-slate-500">Sort</div>
                          <div className="mt-1 font-semibold text-slate-200">{product.sortOrder}</div>
                        </div>
                      </div>
                    </EntityCard>
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
            <section className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
                <PanelTitle
                  icon={<Power size={15} className="text-blue-300" />}
                  eyebrow={productMode === "create" ? "Create product" : "Product details"}
                  title={productMode === "create" ? "New product" : selectedProduct?.name || "Loading product"}
                  status={selectedProduct?.status}
                />
                {productMode === "edit" && productDetailsQuery.isLoading && <LoadingState label="Loading product..." />}
                {productMode === "edit" && productDetailsQuery.isError && (
                  <ErrorState title="Unable to load product" message={getErrorMessage(productDetailsQuery.error)} />
                )}
                {(productMode === "create" || selectedProduct) && (
                  <div className="space-y-4">
                    {selectedProduct && (
                      <div className="grid gap-2 md:grid-cols-4">
                        <InfoTile label="Category" value={selectedProduct.categoryName || "None"} />
                        <InfoTile label="Tax" value={selectedProduct.salesTaxCategoryCode || "None"} />
                        <InfoTile label="Variants" value={String(selectedProduct.variants.length)} />
                        <InfoTile label="Created" value={formatDateTime(selectedProduct.createdAtUtc)} />
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
                      onStatusChange={(status) => changeStatus(productStatusMutation, status, "Product")}
                    />
                    <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-slate-400">
                      Pricing, tax assignment, inventory consumption, and modifiers are managed outside this Catalog Core slice.
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Boxes size={15} className="text-blue-300" />
                      Product variants
                    </div>
                    <h2 className="mt-1 text-lg font-black text-white">
                      {selectedProduct?.name || "Select a product"}
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={variantStatus}
                      onChange={(event) => setVariantStatus(event.target.value)}
                      className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                    >
                      <option value="">All variants</option>
                      <option value="Active">Active</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                    <button
                      type="button"
                      onClick={startCreateVariant}
                      disabled={!selectedProduct}
                      className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white disabled:opacity-50"
                    >
                      <Plus size={14} />
                      New variant
                    </button>
                  </div>
                </div>
                {!selectedProductId ? (
                  <EmptyState title="Select a product" message="Choose a product to manage its variants." />
                ) : variantsQuery.isLoading ? (
                  <LoadingState label="Loading variants..." />
                ) : variantsQuery.isError ? (
                  <ErrorState title="Unable to load variants" message={getErrorMessage(variantsQuery.error)} />
                ) : (
                  <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
                    <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                      {variants.length === 0 ? (
                        <EmptyState title="No variants found" message="No variants match the current filter." />
                      ) : (
                        variants.map((variant) => (
                          <EntityCard
                            key={variant.productVariantId}
                            icon={<Boxes size={15} className="shrink-0 text-blue-300" />}
                            title={variant.name}
                            meta={`${variant.sku || "No SKU"} · ${variant.salesUnitOfMeasureCode}`}
                            status={variant.status}
                            selected={selectedVariantId === variant.productVariantId}
                            onSelect={() => selectVariant(variant)}
                          />
                        ))
                      )}
                    </div>
                    <div>
                      {variantMode === "edit" && variantDetailsQuery.isLoading && <LoadingState label="Loading variant..." />}
                      {variantMode === "edit" && variantDetailsQuery.isError && (
                        <ErrorState title="Unable to load variant" message={getErrorMessage(variantDetailsQuery.error)} />
                      )}
                      {(variantMode === "create" || selectedVariant) && (
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
                          onStatusChange={(status) => changeStatus(variantStatusMutation, status, "Variant")}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </AppLayout>
  );
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
