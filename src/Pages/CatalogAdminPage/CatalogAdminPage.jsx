import { useMemo, useState } from "react";
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
  Search,
  SlidersHorizontal,
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
  useModifierGroupDetails,
  useModifierGroups,
  useModifierOptionDetails,
  useModifierOptions,
  useProductDetails,
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
const EMPTY_MODIFIER_GROUP_FORM = { name: "" };
const EMPTY_MODIFIER_OPTION_FORM = { name: "", sortOrder: "0" };
const EMPTY_ASSIGNMENT_FORM = {
  modifierGroupId: "",
  minSelections: "0",
  maxSelections: "1",
  sortOrder: "0",
  isEnabled: true,
};

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

function statusTone(status) {
  return status === "Active" ? "success" : "warning";
}

function getAvailabilityState(availability) {
  if (!availability?.isConfigured) {
    return {
      label: "Not configured",
      description: "No branch availability row exists.",
      className: "border-amber-400/25 bg-amber-500/10 text-amber-100",
    };
  }

  if (availability.isAvailable) {
    return {
      label: "Available",
      description: "Explicitly available for this branch.",
      className: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100",
    };
  }

  return {
    label: "Not available",
    description: "Explicitly unavailable for this branch.",
    className: "border-red-400/25 bg-red-500/10 text-red-100",
  };
}

function AvailabilityBadge({ availability }) {
  const state = getAvailabilityState(availability);

  return (
    <span className={`rounded-full border px-2 py-1 text-[11px] font-bold ${state.className}`}>
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

function BranchAvailabilityPanel({
  currentBranch,
  selectedVariant,
  availabilityQuery,
  canManage,
  isPending,
  onSetAvailability,
}) {
  if (!selectedVariant) {
    return (
      <EmptyState
        title="Select a variant"
        message="Choose a ProductVariant to configure current branch availability."
      />
    );
  }

  if (!currentBranch) {
    return (
      <EmptyState
        title="Branch required"
        message="Select a current branch before configuring ProductVariant availability."
      />
    );
  }

  if (availabilityQuery.isLoading) {
    return <LoadingState label="Loading branch availability..." />;
  }

  if (availabilityQuery.isError) {
    return (
      <ErrorState
        title="Unable to load branch availability"
        message={getErrorMessage(availabilityQuery.error)}
      />
    );
  }

  const availability = availabilityQuery.data;
  const state = getAvailabilityState(availability);

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.025] p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <MapPin size={14} className="text-blue-300" />
            Branch Availability
          </div>
          <div className="mt-1 text-sm font-black text-white">
            Current Branch: {currentBranch.name}
          </div>
          <div className="mt-1 text-xs text-slate-400">{state.description}</div>
        </div>
        <AvailabilityBadge availability={availability} />
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <InfoTile label="Variant" value={availability?.variantName || selectedVariant.name} />
        <InfoTile label="Product" value={availability?.productName || selectedVariant.productName} />
        <InfoTile
          label="Updated"
          value={availability?.updatedAtUtc ? formatDateTime(availability.updatedAtUtc) : "None"}
        />
      </div>

      {!availability?.isConfigured && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          Configure branch availability before expecting this variant to appear in POS.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!canManage || isPending}
          onClick={() => onSetAvailability(true)}
          className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white disabled:opacity-50"
        >
          <PackageCheck size={15} />
          Make available
        </button>
        <button
          type="button"
          disabled={!canManage || isPending}
          onClick={() => onSetAvailability(false)}
          className="flex h-10 items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 text-xs font-bold text-red-100 disabled:opacity-50"
        >
          <PackageX size={15} />
          Make unavailable
        </button>
      </div>
    </div>
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

function CatalogModifiersAdmin({ currentCompanyId, currentBranchId, canRead, canManage, showNotice }) {
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
      showNotice(`Modifier group ${groupMode === "create" ? "created" : "updated"}.`);
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const submitOption = async () => {
    const sortOrder = parseSortOrder(optionForm.sortOrder);
    if (sortOrder === null) return showNotice("Sort order must be zero or greater.");

    try {
      const result =
        optionMode === "create"
          ? await createOptionMutation.mutateAsync({ name: optionForm.name, sortOrder })
          : await updateOptionMutation.mutateAsync({ name: optionForm.name, sortOrder });
      setOptionMode("edit");
      setSelectedOptionId(result.modifierOptionId);
      setOptionForm({ name: result.name, sortOrder: String(result.sortOrder) });
      showNotice(`Modifier option ${optionMode === "create" ? "created" : "updated"}.`);
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const submitAssignment = async () => {
    const minSelections = parseSortOrder(assignmentForm.minSelections);
    const maxSelections = parseSortOrder(assignmentForm.maxSelections);
    const sortOrder = parseSortOrder(assignmentForm.sortOrder);
    if (minSelections === null || maxSelections === null || sortOrder === null) {
      return showNotice("Min, max, and sort must be zero or greater.");
    }
    if (maxSelections < 1) return showNotice("Max selections must be at least 1.");
    if (minSelections > maxSelections) {
      return showNotice("Min selections cannot exceed max selections.");
    }
    if (!assignmentVariantId || !assignmentForm.modifierGroupId) {
      return showNotice("Select a variant and modifier group first.");
    }

    try {
      await assignmentMutation.mutateAsync({
        minSelections,
        maxSelections,
        sortOrder,
        isEnabled: assignmentForm.isEnabled,
      });
      showNotice("Variant modifier group configuration saved.");
    } catch (error) {
      showNotice(getErrorMessage(error));
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

  const changeModifierStatus = async (mutation, status, label) => {
    try {
      await mutation.mutateAsync({ status });
      showNotice(`${label} ${status.toLowerCase()}.`);
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  return (
    <div className="grid gap-4 2xl:grid-cols-[380px_1fr]">
      <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
        <div className="mb-3 flex flex-wrap gap-2">
          <label className="relative block min-w-[180px] flex-1">
            <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={groupSearch}
              onChange={(event) => {
                setGroupSearch(event.target.value);
                setGroupPage(1);
              }}
              maxLength={100}
              placeholder="Search groups"
              className="h-10 w-full rounded-xl border border-white/10 bg-black/20 pr-9 pl-3 text-xs text-white outline-none"
            />
          </label>
          <select
            value={groupStatus}
            onChange={(event) => {
              setGroupStatus(event.target.value);
              setGroupPage(1);
            }}
            className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
          >
            <option value="">All status</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
          <button
            type="button"
            onClick={startCreateGroup}
            className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white"
          >
            <Plus size={14} />
            New group
          </button>
        </div>
        {groupsQuery.isLoading && <LoadingState label="Loading modifier groups..." />}
        {groupsQuery.isError && (
          <ErrorState title="Unable to load groups" message={getErrorMessage(groupsQuery.error)} />
        )}
        {!groupsQuery.isLoading && !groupsQuery.isError && groups.length === 0 && (
          <EmptyState title="No modifier groups found" message="No groups match the current filters." />
        )}
        {!groupsQuery.isLoading && !groupsQuery.isError && groups.length > 0 && (
          <div className="max-h-[calc(100vh-420px)] min-h-[320px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
            {groups.map((group) => (
              <EntityCard
                key={group.modifierGroupId}
                icon={<SlidersHorizontal size={15} className="shrink-0 text-blue-300" />}
                title={group.name}
                meta={`${group.optionCount} options`}
                status={group.status}
                selected={selectedGroupId === group.modifierGroupId}
                onSelect={() => selectGroup(group)}
              >
                <div className="mt-3 text-[11px] text-slate-500">
                  Created {formatDateTime(group.createdAtUtc)}
                </div>
              </EntityCard>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            Page {groupsQuery.data?.pageNumber || 1} / {groupsQuery.data?.totalPages || 0}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={groupPage <= 1}
              onClick={() => setGroupPage((page) => Math.max(1, page - 1))}
              className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={!groupsQuery.data || groupPage >= groupsQuery.data.totalPages}
              onClick={() => setGroupPage((page) => page + 1)}
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
            icon={<SlidersHorizontal size={15} className="text-blue-300" />}
            eyebrow={groupMode === "create" ? "Create modifier group" : "Modifier group details"}
            title={groupMode === "create" ? "New modifier group" : selectedGroup?.name || "Loading group"}
            status={selectedGroup?.status}
          />
          {groupMode === "edit" && groupDetailsQuery.isLoading && <LoadingState label="Loading group..." />}
          {groupMode === "edit" && groupDetailsQuery.isError && (
            <ErrorState title="Unable to load group" message={getErrorMessage(groupDetailsQuery.error)} />
          )}
          {(groupMode === "create" || selectedGroup) && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitGroup();
              }}
              className="space-y-3"
            >
              <label className="block text-xs font-semibold text-slate-400">
                Name
                <input
                  value={groupForm.name}
                  onChange={(event) => setGroupForm({ name: event.target.value })}
                  maxLength={200}
                  disabled={!canManage || isGroupPending}
                  className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none disabled:opacity-50"
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
                  changeModifierStatus(groupStatusMutation, status, "Modifier group")
                }
              />
            </form>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ListChecks size={15} className="text-blue-300" />
                Modifier options
              </div>
              <h2 className="mt-1 text-lg font-black text-white">
                {selectedGroup?.name || "Select a modifier group"}
              </h2>
            </div>
            <div className="flex gap-2">
              <select
                value={optionStatus}
                onChange={(event) => setOptionStatus(event.target.value)}
                className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
              >
                <option value="">All options</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setOptionMode("create");
                  setSelectedOptionId(null);
                  setOptionForm(EMPTY_MODIFIER_OPTION_FORM);
                }}
                disabled={!selectedGroup}
                className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white disabled:opacity-50"
              >
                <Plus size={14} />
                New option
              </button>
            </div>
          </div>
          {!selectedGroupId ? (
            <EmptyState title="Select a group" message="Choose a modifier group to manage its options." />
          ) : optionsQuery.isLoading ? (
            <LoadingState label="Loading options..." />
          ) : optionsQuery.isError ? (
            <ErrorState title="Unable to load options" message={getErrorMessage(optionsQuery.error)} />
          ) : (
            <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
              <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                {options.length === 0 ? (
                  <EmptyState title="No options found" message="This modifier group has no options." />
                ) : (
                  options.map((option) => (
                    <EntityCard
                      key={option.modifierOptionId}
                      icon={<ListChecks size={15} className="shrink-0 text-blue-300" />}
                      title={option.name}
                      meta={`Sort ${option.sortOrder}`}
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
                    <label className="text-xs font-semibold text-slate-400">
                      Name
                      <input
                        value={optionForm.name}
                        onChange={(event) =>
                          setOptionForm((draft) => ({ ...draft, name: event.target.value }))
                        }
                        maxLength={200}
                        disabled={!canManage || isOptionPending}
                        className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none disabled:opacity-50"
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-400">
                      Sort Order
                      <input
                        type="number"
                        min="0"
                        value={optionForm.sortOrder}
                        onChange={(event) =>
                          setOptionForm((draft) => ({ ...draft, sortOrder: event.target.value }))
                        }
                        disabled={!canManage || isOptionPending}
                        className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none disabled:opacity-50"
                      />
                    </label>
                  </div>
                  {optionMode === "edit" && optionDetailsQuery.isLoading && <LoadingState label="Loading option..." />}
                  {optionMode === "edit" && optionDetailsQuery.isError && (
                    <ErrorState title="Unable to load option" message={getErrorMessage(optionDetailsQuery.error)} />
                  )}
                  <ActionRow
                    mode={optionMode}
                    entity="modifier option"
                    selected={selectedOption}
                    canManage={canManage}
                    isPending={isOptionPending}
                    nextStatus={selectedOption?.status === "Active" ? "Suspended" : "Active"}
                    onStatusChange={(status) =>
                      changeModifierStatus(optionStatusMutation, status, "Modifier option")
                    }
                  />
                </form>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
          <PanelTitle
            icon={<Link2 size={15} className="text-blue-300" />}
            eyebrow="Variant assignments"
            title="ProductVariant modifier groups"
          />
          <div className="grid gap-3 lg:grid-cols-2">
            <label className="text-xs font-semibold text-slate-400">
              Product
              <select
                value={assignmentProductId}
                onChange={(event) => {
                  setAssignmentProductId(event.target.value);
                  setAssignmentVariantId("");
                }}
                className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none"
              >
                <option value="">Select product</option>
                {(productsQuery.data?.items || []).map((product) => (
                  <option key={product.productId} value={product.productId}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-400">
              Variant
              <select
                value={assignmentVariantId}
                onChange={(event) => setAssignmentVariantId(event.target.value)}
                disabled={!assignmentProduct}
                className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none disabled:opacity-50"
              >
                <option value="">Select variant</option>
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
              <EmptyState title="Select a variant" message="Choose a ProductVariant to configure modifier group assignments." />
            </div>
          ) : assignmentsQuery.isLoading ? (
            <LoadingState label="Loading assignments..." />
          ) : assignmentsQuery.isError ? (
            <ErrorState title="Unable to load assignments" message={getErrorMessage(assignmentsQuery.error)} />
          ) : (
            <div className="mt-4 grid gap-4 xl:grid-cols-[320px_1fr]">
              <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                {assignments.length === 0 ? (
                  <EmptyState title="No assignments" message="This variant has no modifier groups yet." />
                ) : (
                  assignments.map((assignment) => (
                    <button
                      key={assignment.modifierGroupId}
                      type="button"
                      onClick={() => loadAssignment(assignment)}
                      className="w-full rounded-xl border border-white/10 bg-[#0d1728] p-3 text-start transition hover:border-blue-400/40 hover:bg-blue-500/10"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-white">
                            {assignment.modifierGroupName}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            Min {assignment.minSelections} · Max {assignment.maxSelections} · Sort {assignment.sortOrder}
                          </div>
                        </div>
                        <StatusBadge tone={assignment.isEnabled ? "success" : "warning"}>
                          {assignment.isEnabled ? "Enabled" : "Disabled"}
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
                  <label className="text-xs font-semibold text-slate-400">
                    Modifier Group
                    <select
                      value={assignmentForm.modifierGroupId}
                      onChange={(event) =>
                        setAssignmentForm((draft) => ({
                          ...draft,
                          modifierGroupId: event.target.value,
                        }))
                      }
                      className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none"
                    >
                      <option value="">Select group</option>
                      {groups.map((group) => (
                        <option key={group.modifierGroupId} value={group.modifierGroupId}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <NumberField label="Min" value={assignmentForm.minSelections} onChange={(value) => setAssignmentForm((draft) => ({ ...draft, minSelections: value }))} />
                  <NumberField label="Max" value={assignmentForm.maxSelections} onChange={(value) => setAssignmentForm((draft) => ({ ...draft, maxSelections: value }))} min="1" />
                  <NumberField label="Sort" value={assignmentForm.sortOrder} onChange={(value) => setAssignmentForm((draft) => ({ ...draft, sortOrder: value }))} />
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={assignmentForm.isEnabled}
                    onChange={(event) =>
                      setAssignmentForm((draft) => ({
                        ...draft,
                        isEnabled: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-white/20 bg-black/20"
                  />
                  Enabled for future sellable catalog reads
                </label>
                <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-slate-400">
                  Required behavior is derived from Min selections greater than zero. Disabled assignments remain configured with isEnabled=false; no delete endpoint exists.
                </div>
                <button
                  type="submit"
                  disabled={!canManage || assignmentMutation.isPending}
                  className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white disabled:opacity-50"
                >
                  <Link2 size={15} />
                  {assignmentMutation.isPending ? "Saving..." : "Save assignment"}
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
    <label className="text-xs font-semibold text-slate-400">
      {label}
      <input
        type="number"
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none"
      />
    </label>
  );
}

const CATALOG_ADMIN_TABS = ["categories", "products", "modifiers"];

export default function CatalogAdminPage() {
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
      showNotice(
        variantMode === "create"
          ? "Variant created. Configure branch availability before POS sale."
          : "Variant updated.",
      );
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

  const setBranchAvailability = async (isAvailable) => {
    try {
      await setBranchAvailabilityMutation.mutateAsync({ isAvailable });
      showNotice(`Variant marked ${isAvailable ? "available" : "unavailable"} for current branch.`);
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
              {tab !== "modifiers" && (
                <button
                  type="button"
                  onClick={tab === "categories" ? startCreateCategory : startCreateProduct}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white"
                >
                  <Plus size={14} />
                  {tab === "categories" ? "New category" : "New product"}
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
          <button
            type="button"
            onClick={() => setTab("modifiers")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              tab === "modifiers" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/5"
            }`}
          >
            <SlidersHorizontal size={15} />
            Modifiers
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
        ) : tab === "products" ? (
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
                      {currentBranchId && branchAvailabilityOverviewQuery.data && (
                        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3 text-xs text-slate-300">
                          <div className="flex items-center gap-2 font-bold text-white">
                            <MapPin size={14} className="text-blue-300" />
                            Current branch availability
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-100">
                              Available {branchAvailabilitySummary.available}
                            </div>
                            <div className="rounded-lg bg-red-500/10 p-2 text-red-100">
                              Unavailable {branchAvailabilitySummary.unavailable}
                            </div>
                            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-100">
                              Missing {branchAvailabilitySummary.missing}
                            </div>
                          </div>
                          <div className="mt-2 text-[11px] text-slate-500">
                            Showing {branchAvailabilityOverviewQuery.data.items.length} of {branchAvailabilitySummary.total}
                          </div>
                        </div>
                      )}
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
                            onStatusChange={(status) => changeStatus(variantStatusMutation, status, "Variant")}
                          />
                          <BranchAvailabilityPanel
                            currentBranch={currentBranch}
                            selectedVariant={selectedVariant}
                            availabilityQuery={branchAvailabilityQuery}
                            canManage={canManage}
                            isPending={setBranchAvailabilityMutation.isPending}
                            onSetAvailability={setBranchAvailability}
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
