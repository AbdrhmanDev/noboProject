import { useMemo, useState } from "react";
import {
  BadgeDollarSign,
  Banknote,
  CircleCheck,
  CirclePause,
  Coins,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Trash2,
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
import { useCategories, useProducts } from "../../features/catalog/hooks/useCatalog";
import {
  useChangePriceListStatus,
  useCreatePriceList,
  useModifierPriceDetails,
  useModifierPrices,
  usePriceListDetails,
  usePriceLists,
  useProductVariantPriceDetails,
  useProductVariantPrices,
  useRemoveModifierOptionPrice,
  useRemoveProductVariantPrice,
  useSetModifierOptionPrice,
  useSetPriceListTaxMode,
  useSetProductVariantPrice,
  useUpdatePriceList,
} from "../../features/pricing/hooks/usePricing";

const PRICING_VIEW_PERMISSION = "Pricing.View";
const PRICING_MANAGE_PERMISSION = "Pricing.Manage";
const TAX_MODES = ["Inclusive", "Exclusive"];
const EMPTY_PRICE_LIST_FORM = { name: "", isDefault: false, taxMode: "Inclusive" };
const EMPTY_VARIANT_PRICE_FORM = { amount: "" };
const EMPTY_MODIFIER_PRICE_FORM = { amountAdjustment: "" };

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

function statusTone(status) {
  return status === "Active" ? "success" : "warning";
}

function getDecimalScale(value) {
  const normalized = String(value).trim();
  if (!normalized.includes(".")) return 0;
  return normalized.split(".")[1]?.length || 0;
}

function parseMoneyInput(value, { allowNegative = false } = {}) {
  const normalized = String(value).trim();
  if (!normalized) return { error: "Amount is required." };
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    return { error: "Amount must be a valid decimal number." };
  }
  if (!allowNegative && normalized.startsWith("-")) {
    return { error: "Amount cannot be negative." };
  }
  if (getDecimalScale(normalized) > 4) {
    return { error: "Amount supports at most 4 decimal places before backend currency validation." };
  }

  return { value: Number(normalized) };
}

function formatConfiguredAmount(value, currencyCode) {
  return `${value} ${currencyCode}`;
}

function PriceBadge({ item, currencyCode }) {
  if (!item?.isConfigured) {
    return (
      <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-2 py-1 text-[11px] font-bold text-amber-100">
        No price
      </span>
    );
  }

  return (
    <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-100">
      {formatConfiguredAmount(item.amount ?? item.amountAdjustment ?? 0, currencyCode)}
    </span>
  );
}

function PriceListCard({ priceList, selected, onSelect }) {
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
            <BadgeDollarSign size={16} className="shrink-0 text-blue-300" />
            <div className="truncate text-sm font-black text-white">{priceList.name}</div>
          </div>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
            <span>{priceList.currencyCode}</span>
            <span>{priceList.taxMode || "No tax mode"}</span>
            {priceList.isDefault && <span className="text-blue-200">Default</span>}
          </div>
        </div>
        <StatusBadge tone={statusTone(priceList.status)}>{priceList.status}</StatusBadge>
      </div>
      <div className="mt-3 text-[11px] text-slate-500">
        Created {formatDateTime(priceList.createdAtUtc)}
      </div>
    </button>
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

export default function PricingAdminPage() {
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const [priceListStatus, setPriceListStatus] = useState("");
  const [priceListSearch, setPriceListSearch] = useState("");
  const [selectedPriceListId, setSelectedPriceListId] = useState(null);
  const [priceListMode, setPriceListMode] = useState("create");
  const [priceListForm, setPriceListForm] = useState(EMPTY_PRICE_LIST_FORM);
  const [variantSearch, setVariantSearch] = useState("");
  const [variantCategoryId, setVariantCategoryId] = useState("");
  const [variantProductId, setVariantProductId] = useState("");
  const [variantConfiguration, setVariantConfiguration] = useState("");
  const [variantPage, setVariantPage] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [variantPriceForm, setVariantPriceForm] = useState(EMPTY_VARIANT_PRICE_FORM);
  const [selectedModifier, setSelectedModifier] = useState(null);
  const [modifierPriceForm, setModifierPriceForm] = useState(EMPTY_MODIFIER_PRICE_FORM);
  const [notice, setNotice] = useState("");

  const viewPermissionQuery = useHasPermission(currentCompanyId, PRICING_VIEW_PERMISSION);
  const managePermissionQuery = useHasPermission(currentCompanyId, PRICING_MANAGE_PERMISSION);
  const canRead =
    Boolean(currentCompanyId) &&
    !viewPermissionQuery.isLoading &&
    viewPermissionQuery.hasPermission;
  const canManage =
    Boolean(currentCompanyId) &&
    !managePermissionQuery.isLoading &&
    managePermissionQuery.hasPermission;

  const priceListFilters = useMemo(
    () => ({ status: priceListStatus, search: priceListSearch.trim() }),
    [priceListSearch, priceListStatus],
  );
  const variantFilters = useMemo(
    () => ({
      categoryId: variantCategoryId,
      productId: variantProductId,
      search: variantSearch.trim(),
      configuration: variantConfiguration,
      pageNumber: variantPage,
      pageSize: 25,
    }),
    [variantCategoryId, variantConfiguration, variantPage, variantProductId, variantSearch],
  );
  const productFilters = useMemo(
    () => ({ pageNumber: 1, pageSize: 100, categoryId: variantCategoryId }),
    [variantCategoryId],
  );

  const priceListsQuery = usePriceLists(currentCompanyId, priceListFilters, canRead);
  const priceListDetailsQuery = usePriceListDetails(
    currentCompanyId,
    selectedPriceListId,
    canRead && Boolean(selectedPriceListId),
  );
  const categoriesQuery = useCategories(currentCompanyId, {}, canRead);
  const productsQuery = useProducts(currentCompanyId, productFilters, canRead);
  const variantPricesQuery = useProductVariantPrices(
    currentCompanyId,
    selectedPriceListId,
    variantFilters,
    canRead && Boolean(selectedPriceListId),
  );
  const variantPriceDetailsQuery = useProductVariantPriceDetails(
    currentCompanyId,
    selectedPriceListId,
    selectedVariantId,
    canRead && Boolean(selectedPriceListId) && Boolean(selectedVariantId),
  );
  const modifierPricesQuery = useModifierPrices(
    currentCompanyId,
    selectedPriceListId,
    selectedVariantId,
    canRead && Boolean(selectedPriceListId) && Boolean(selectedVariantId),
  );
  const modifierPriceDetailsQuery = useModifierPriceDetails(
    currentCompanyId,
    selectedPriceListId,
    selectedVariantId,
    selectedModifier?.modifierGroupId,
    selectedModifier?.modifierOptionId,
    canRead && Boolean(selectedModifier),
  );

  const createPriceListMutation = useCreatePriceList(currentCompanyId);
  const updatePriceListMutation = useUpdatePriceList(currentCompanyId, selectedPriceListId);
  const statusMutation = useChangePriceListStatus(currentCompanyId, selectedPriceListId);
  const taxModeMutation = useSetPriceListTaxMode(currentCompanyId, selectedPriceListId);
  const setVariantPriceMutation = useSetProductVariantPrice(
    currentCompanyId,
    currentBranchId,
    selectedPriceListId,
    selectedVariantId,
  );
  const removeVariantPriceMutation = useRemoveProductVariantPrice(
    currentCompanyId,
    currentBranchId,
    selectedPriceListId,
    selectedVariantId,
  );
  const setModifierPriceMutation = useSetModifierOptionPrice(
    currentCompanyId,
    currentBranchId,
    selectedPriceListId,
    selectedVariantId,
    selectedModifier?.modifierGroupId,
    selectedModifier?.modifierOptionId,
  );
  const removeModifierPriceMutation = useRemoveModifierOptionPrice(
    currentCompanyId,
    currentBranchId,
    selectedPriceListId,
    selectedVariantId,
    selectedModifier?.modifierGroupId,
    selectedModifier?.modifierOptionId,
  );

  const priceLists = priceListsQuery.data?.items || [];
  const selectedPriceList = priceListDetailsQuery.data || null;
  const selectedVariantPrice = variantPriceDetailsQuery.data || null;
  const modifierPrices = modifierPricesQuery.data?.items || [];
  const selectedModifierPrice = modifierPriceDetailsQuery.data || selectedModifier;
  const canEditPrices = canManage && selectedPriceList?.status === "Active";
  const priceListPending =
    createPriceListMutation.isPending ||
    updatePriceListMutation.isPending ||
    statusMutation.isPending ||
    taxModeMutation.isPending;

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  };

  const startCreatePriceList = () => {
    setPriceListMode("create");
    setSelectedPriceListId(null);
    setSelectedVariantId(null);
    setSelectedModifier(null);
    setPriceListForm(EMPTY_PRICE_LIST_FORM);
  };

  const selectPriceList = (priceList) => {
    setPriceListMode("edit");
    setSelectedPriceListId(priceList.priceListId);
    setSelectedVariantId(null);
    setSelectedModifier(null);
    setPriceListForm({
      name: priceList.name,
      isDefault: priceList.isDefault,
      taxMode: priceList.taxMode || "Inclusive",
    });
  };

  const selectVariantPrice = (item) => {
    setSelectedVariantId(item.productVariantId);
    setSelectedModifier(null);
    setVariantPriceForm({ amount: item.isConfigured ? String(item.amount ?? "") : "" });
  };

  const selectModifierPrice = (item) => {
    setSelectedModifier(item);
    setModifierPriceForm({
      amountAdjustment: item.isConfigured ? String(item.amountAdjustment ?? "") : "",
    });
  };

  const submitPriceList = async () => {
    try {
      if (priceListMode === "create") {
        const created = await createPriceListMutation.mutateAsync({
          name: priceListForm.name,
          isDefault: priceListForm.isDefault,
          taxMode: priceListForm.taxMode,
        });
        setPriceListMode("edit");
        setSelectedPriceListId(created.priceListId);
        setPriceListForm({
          name: created.name,
          isDefault: created.isDefault,
          taxMode: created.taxMode || "Inclusive",
        });
        showNotice("Price list created.");
        return;
      }

      // Name and TaxMode are two separate backend endpoints/domain mutators
      // (UpdatePriceList only ever touches Name; TaxMode requires the
      // dedicated tax-mode endpoint). Saving from this single form must
      // never silently drop a Tax Mode change just because the cashier used
      // the primary Save button instead of the separate "Save tax mode"
      // action, so both are persisted here whenever they changed.
      const result = await updatePriceListMutation.mutateAsync({ name: priceListForm.name });

      let taxMode = result.taxMode;
      const currentTaxMode = selectedPriceList?.taxMode || "Inclusive";
      if (priceListForm.taxMode && priceListForm.taxMode !== currentTaxMode) {
        const taxModeResult = await taxModeMutation.mutateAsync({ taxMode: priceListForm.taxMode });
        taxMode = taxModeResult.taxMode;
      }

      setPriceListForm({
        name: result.name,
        isDefault: result.isDefault,
        taxMode: taxMode || "Inclusive",
      });
      showNotice("Price list updated.");
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const changeStatus = async () => {
    if (!selectedPriceList) return;
    const status = selectedPriceList.status === "Active" ? "Suspended" : "Active";
    try {
      await statusMutation.mutateAsync({ status });
      showNotice(`Price list ${status.toLowerCase()}.`);
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const submitTaxMode = async () => {
    try {
      await taxModeMutation.mutateAsync({ taxMode: priceListForm.taxMode });
      showNotice("Tax mode updated.");
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const submitVariantPrice = async () => {
    const parsed = parseMoneyInput(variantPriceForm.amount);
    if (parsed.error) return showNotice(parsed.error);
    try {
      await setVariantPriceMutation.mutateAsync({ amount: parsed.value });
      showNotice("Variant price saved.");
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const removeVariantPrice = async () => {
    if (!window.confirm("Delete configured variant price? This is not the same as setting price to 0.")) {
      return;
    }
    try {
      await removeVariantPriceMutation.mutateAsync();
      setVariantPriceForm(EMPTY_VARIANT_PRICE_FORM);
      showNotice("Variant price deleted.");
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const submitModifierPrice = async () => {
    const parsed = parseMoneyInput(modifierPriceForm.amountAdjustment, { allowNegative: true });
    if (parsed.error) return showNotice(parsed.error);
    try {
      await setModifierPriceMutation.mutateAsync({ amountAdjustment: parsed.value });
      showNotice("Modifier price saved.");
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const removeModifierPrice = async () => {
    if (!window.confirm("Delete configured modifier price? This is not the same as setting adjustment to 0.")) {
      return;
    }
    try {
      await removeModifierPriceMutation.mutateAsync();
      setModifierPriceForm(EMPTY_MODIFIER_PRICE_FORM);
      showNotice("Modifier price deleted.");
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  return (
    <AppLayout>
      <main className="space-y-4" dir="rtl">
        <PageHeader
          title="Pricing"
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  priceListsQuery.refetch();
                  variantPricesQuery.refetch();
                  modifierPricesQuery.refetch();
                }}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
              <button
                type="button"
                onClick={startCreatePriceList}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white"
              >
                <Plus size={14} />
                New price list
              </button>
            </div>
          }
        />

        {notice && (
          <div className="rounded-xl border border-blue-400/25 bg-blue-500/10 px-3 py-2 text-xs text-blue-100">
            {notice}
          </div>
        )}

        {!currentCompanyId ? (
          <EmptyState title="Company required" message="Select a company to manage pricing." />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label="Checking Pricing permissions..." />
        ) : !viewPermissionQuery.hasPermission ? (
          <ErrorState title="Permission required" message="Pricing.View permission is required." />
        ) : (
          <div className="grid gap-4 2xl:grid-cols-[380px_1fr]">
            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
              <div className="mb-3 flex flex-wrap gap-2">
                <label className="relative block min-w-[180px] flex-1">
                  <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={priceListSearch}
                    onChange={(event) => setPriceListSearch(event.target.value)}
                    maxLength={100}
                    placeholder="Search price lists"
                    className="h-10 w-full rounded-xl border border-white/10 bg-black/20 pr-9 pl-3 text-xs text-white outline-none"
                  />
                </label>
                <select
                  value={priceListStatus}
                  onChange={(event) => setPriceListStatus(event.target.value)}
                  className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                >
                  <option value="">All status</option>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
              {priceListsQuery.isLoading && <LoadingState label="Loading price lists..." />}
              {priceListsQuery.isError && (
                <ErrorState title="Unable to load price lists" message={getErrorMessage(priceListsQuery.error)} />
              )}
              {!priceListsQuery.isLoading && !priceListsQuery.isError && priceLists.length === 0 && (
                <EmptyState title="No price lists found" message="No price lists match the current filters." />
              )}
              {!priceListsQuery.isLoading && !priceListsQuery.isError && priceLists.length > 0 && (
                <div className="max-h-[calc(100vh-320px)] min-h-[360px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                  {priceLists.map((priceList) => (
                    <PriceListCard
                      key={priceList.priceListId}
                      priceList={priceList}
                      selected={selectedPriceListId === priceList.priceListId}
                      onSelect={() => selectPriceList(priceList)}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
                <PanelTitle
                  icon={<Power size={15} className="text-blue-300" />}
                  eyebrow={priceListMode === "create" ? "Create price list" : "Price list configuration"}
                  title={priceListMode === "create" ? "New price list" : selectedPriceList?.name || "Loading price list"}
                  status={selectedPriceList?.status}
                />
                {priceListMode === "edit" && priceListDetailsQuery.isLoading && <LoadingState label="Loading price list..." />}
                {priceListMode === "edit" && priceListDetailsQuery.isError && (
                  <ErrorState title="Unable to load price list" message={getErrorMessage(priceListDetailsQuery.error)} />
                )}
                {(priceListMode === "create" || selectedPriceList) && (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      submitPriceList();
                    }}
                    className="space-y-3"
                  >
                    {selectedPriceList && (
                      <div className="grid gap-2 md:grid-cols-4">
                        <InfoTile label="Currency" value={selectedPriceList.currencyCode} />
                        <InfoTile label="Default" value={selectedPriceList.isDefault ? "Yes" : "No"} />
                        <InfoTile label="Tax mode" value={selectedPriceList.taxMode || "None"} />
                        <InfoTile label="Created" value={formatDateTime(selectedPriceList.createdAtUtc)} />
                      </div>
                    )}
                    <div className="grid gap-3 md:grid-cols-[1fr_170px_170px]">
                      <label className="text-xs font-semibold text-slate-400">
                        Name
                        <input
                          value={priceListForm.name}
                          onChange={(event) => setPriceListForm((draft) => ({ ...draft, name: event.target.value }))}
                          maxLength={200}
                          disabled={!canManage || priceListPending}
                          className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none disabled:opacity-50"
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-400">
                        Tax Mode
                        <select
                          value={priceListForm.taxMode}
                          onChange={(event) => setPriceListForm((draft) => ({ ...draft, taxMode: event.target.value }))}
                          disabled={!canManage || priceListPending}
                          className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none disabled:opacity-50"
                        >
                          {TAX_MODES.map((mode) => (
                            <option key={mode} value={mode}>
                              {mode}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex items-end gap-2 pb-3 text-xs font-semibold text-slate-300">
                        <input
                          type="checkbox"
                          checked={priceListForm.isDefault}
                          onChange={(event) => setPriceListForm((draft) => ({ ...draft, isDefault: event.target.checked }))}
                          disabled={priceListMode === "edit" || !canManage || priceListPending}
                          className="h-4 w-4 rounded border-white/20 bg-black/20"
                        />
                        Default on create
                      </label>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-slate-400">
                      Currency and default selection are fixed at creation and cannot be changed
                      afterward — create another price list if you need different values. Tax mode
                      can be changed here; it is saved automatically together with the name
                      (backend applies it through a separate tax-mode update, so the "Save tax
                      mode" button below is only needed if you want to change tax mode without
                      touching the name).
                    </div>
                    {!canManage && (
                      <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                        Pricing.Manage permission is required for pricing changes.
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={!canManage || priceListPending}
                        className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white disabled:opacity-50"
                      >
                        {priceListMode === "edit" ? <Pencil size={15} /> : <Plus size={15} />}
                        {priceListPending ? "Saving..." : priceListMode === "edit" ? "Save price list" : "Create price list"}
                      </button>
                      {priceListMode === "edit" && selectedPriceList && (
                        <>
                          <button
                            type="button"
                            disabled={!canManage || priceListPending}
                            onClick={submitTaxMode}
                            className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-xs font-bold text-slate-100 disabled:opacity-50"
                          >
                            <Banknote size={15} />
                            Save tax mode
                          </button>
                          <button
                            type="button"
                            disabled={!canManage || priceListPending}
                            onClick={changeStatus}
                            className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-xs font-bold text-slate-100 disabled:opacity-50"
                          >
                            {selectedPriceList.status === "Active" ? <CirclePause size={15} /> : <CircleCheck size={15} />}
                            {selectedPriceList.status === "Active" ? "Suspend" : "Activate"}
                          </button>
                        </>
                      )}
                    </div>
                  </form>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
                <PanelTitle
                  icon={<Coins size={15} className="text-blue-300" />}
                  eyebrow="Variant prices"
                  title={selectedPriceList?.name || "Select a price list"}
                />
                {!selectedPriceListId ? (
                  <EmptyState title="Select a price list" message="Choose a price list to configure ProductVariant prices." />
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-2 lg:grid-cols-[1fr_150px_180px_160px]">
                      <label className="relative block">
                        <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          value={variantSearch}
                          onChange={(event) => {
                            setVariantSearch(event.target.value);
                            setVariantPage(1);
                          }}
                          maxLength={100}
                          placeholder="Search variants"
                          className="h-10 w-full rounded-xl border border-white/10 bg-black/20 pr-9 pl-3 text-xs text-white outline-none"
                        />
                      </label>
                      <select
                        value={variantConfiguration}
                        onChange={(event) => {
                          setVariantConfiguration(event.target.value);
                          setVariantPage(1);
                        }}
                        className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                      >
                        <option value="">All</option>
                        <option value="configured">Configured</option>
                        <option value="missing">Missing</option>
                      </select>
                      <select
                        value={variantCategoryId}
                        onChange={(event) => {
                          setVariantCategoryId(event.target.value);
                          setVariantProductId("");
                          setVariantPage(1);
                        }}
                        className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                      >
                        <option value="">All categories</option>
                        {(categoriesQuery.data || []).map((category) => (
                          <option key={category.categoryId} value={category.categoryId}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={variantProductId}
                        onChange={(event) => {
                          setVariantProductId(event.target.value);
                          setVariantPage(1);
                        }}
                        className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                      >
                        <option value="">All products</option>
                        {(productsQuery.data?.items || []).map((product) => (
                          <option key={product.productId} value={product.productId}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {variantPricesQuery.isLoading ? (
                      <LoadingState label="Loading variant prices..." />
                    ) : variantPricesQuery.isError ? (
                      <ErrorState title="Unable to load variant prices" message={getErrorMessage(variantPricesQuery.error)} />
                    ) : (
                      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
                        <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                          {(variantPricesQuery.data?.items || []).length === 0 ? (
                            <EmptyState title="No variants found" message="No variants match the current pricing filters." />
                          ) : (
                            variantPricesQuery.data.items.map((item) => (
                              <button
                                key={item.productVariantId}
                                type="button"
                                onClick={() => selectVariantPrice(item)}
                                className={`w-full rounded-xl border p-3 text-start transition hover:border-blue-400/40 hover:bg-blue-500/10 ${
                                  selectedVariantId === item.productVariantId
                                    ? "border-blue-400/60 bg-blue-500/15"
                                    : "border-white/10 bg-[#0d1728]"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-black text-white">{item.variantName}</div>
                                    <div className="mt-1 truncate text-xs text-slate-400">
                                      {item.productName} {item.sku ? `| ${item.sku}` : ""}
                                    </div>
                                  </div>
                                  <PriceBadge item={item} currencyCode={item.currencyCode} />
                                </div>
                              </button>
                            ))
                          )}
                          <div className="flex items-center justify-between gap-2 pt-2 text-xs text-slate-400">
                            <span>
                              Page {variantPricesQuery.data?.pageNumber || 1} / {variantPricesQuery.data?.totalPages || 0}
                            </span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={variantPage <= 1}
                                onClick={() => setVariantPage((page) => Math.max(1, page - 1))}
                                className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-40"
                              >
                                Prev
                              </button>
                              <button
                                type="button"
                                disabled={!variantPricesQuery.data || variantPage >= variantPricesQuery.data.totalPages}
                                onClick={() => setVariantPage((page) => page + 1)}
                                className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-40"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {!selectedVariantId ? (
                            <EmptyState title="Select a variant" message="Choose a ProductVariant to set, update, or delete its configured price." />
                          ) : variantPriceDetailsQuery.isLoading ? (
                            <LoadingState label="Loading variant price details..." />
                          ) : variantPriceDetailsQuery.isError ? (
                            <ErrorState title="Unable to load variant price" message={getErrorMessage(variantPriceDetailsQuery.error)} />
                          ) : (
                            <form
                              onSubmit={(event) => {
                                event.preventDefault();
                                submitVariantPrice();
                              }}
                              className="space-y-3"
                            >
                              <div className="grid gap-2 md:grid-cols-3">
                                <InfoTile label="Variant" value={selectedVariantPrice?.variantName || ""} />
                                <InfoTile label="Current" value={selectedVariantPrice?.isConfigured ? formatConfiguredAmount(selectedVariantPrice.amount ?? 0, selectedVariantPrice.currencyCode) : "No price"} />
                                <InfoTile label="Status" value={selectedVariantPrice?.variantStatus || ""} />
                              </div>
                              <label className="block text-xs font-semibold text-slate-400">
                                Amount
                                <input
                                  value={variantPriceForm.amount}
                                  onChange={(event) => setVariantPriceForm({ amount: event.target.value })}
                                  placeholder="0.00"
                                  disabled={!canEditPrices || setVariantPriceMutation.isPending}
                                  className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none disabled:opacity-50"
                                />
                              </label>
                              <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-slate-400">
                                Missing price is different from an explicit 0 price. No rounding is applied; backend currency precision remains authoritative.
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="submit"
                                  disabled={!canEditPrices || setVariantPriceMutation.isPending}
                                  className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white disabled:opacity-50"
                                >
                                  <Pencil size={15} />
                                  Save variant price
                                </button>
                                <button
                                  type="button"
                                  disabled={!canEditPrices || !selectedVariantPrice?.isConfigured || removeVariantPriceMutation.isPending}
                                  onClick={removeVariantPrice}
                                  className="flex h-10 items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 text-xs font-bold text-red-100 disabled:opacity-50"
                                >
                                  <Trash2 size={15} />
                                  Delete configured price
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
                <PanelTitle
                  icon={<BadgeDollarSign size={15} className="text-blue-300" />}
                  eyebrow="Modifier prices"
                  title={selectedVariantPrice?.variantName || "Select a variant"}
                />
                {!selectedVariantId ? (
                  <EmptyState title="Select a variant" message="Modifier prices are configured for a selected PriceList and ProductVariant." />
                ) : modifierPricesQuery.isLoading ? (
                  <LoadingState label="Loading modifier prices..." />
                ) : modifierPricesQuery.isError ? (
                  <ErrorState title="Unable to load modifier prices" message={getErrorMessage(modifierPricesQuery.error)} />
                ) : (
                  <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
                    <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                      {modifierPrices.length === 0 ? (
                        <EmptyState title="No modifier assignments" message="This variant has no modifier options available for pricing." />
                      ) : (
                        modifierPrices.map((item) => (
                          <button
                            key={`${item.modifierGroupId}-${item.modifierOptionId}`}
                            type="button"
                            onClick={() => selectModifierPrice(item)}
                            className={`w-full rounded-xl border p-3 text-start transition hover:border-blue-400/40 hover:bg-blue-500/10 ${
                              selectedModifier?.modifierGroupId === item.modifierGroupId &&
                              selectedModifier?.modifierOptionId === item.modifierOptionId
                                ? "border-blue-400/60 bg-blue-500/15"
                                : "border-white/10 bg-[#0d1728]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-black text-white">{item.modifierOptionName}</div>
                                <div className="mt-1 truncate text-xs text-slate-400">{item.modifierGroupName}</div>
                              </div>
                              <PriceBadge item={item} currencyCode={item.currencyCode} />
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    {!selectedModifier ? (
                      <EmptyState title="Select a modifier option" message="Choose an option to set, update, or delete its adjustment." />
                    ) : modifierPriceDetailsQuery.isLoading ? (
                      <LoadingState label="Loading modifier price details..." />
                    ) : modifierPriceDetailsQuery.isError ? (
                      <ErrorState title="Unable to load modifier price" message={getErrorMessage(modifierPriceDetailsQuery.error)} />
                    ) : (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          submitModifierPrice();
                        }}
                        className="space-y-3"
                      >
                        <div className="grid gap-2 md:grid-cols-3">
                          <InfoTile label="Group" value={selectedModifierPrice?.modifierGroupName || ""} />
                          <InfoTile label="Option" value={selectedModifierPrice?.modifierOptionName || ""} />
                          <InfoTile label="Current" value={selectedModifierPrice?.isConfigured ? formatConfiguredAmount(selectedModifierPrice.amountAdjustment ?? 0, selectedModifierPrice.currencyCode) : "No price"} />
                        </div>
                        <label className="block text-xs font-semibold text-slate-400">
                          Amount Adjustment
                          <input
                            value={modifierPriceForm.amountAdjustment}
                            onChange={(event) => setModifierPriceForm({ amountAdjustment: event.target.value })}
                            placeholder="0.00"
                            disabled={!canEditPrices || setModifierPriceMutation.isPending}
                            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none disabled:opacity-50"
                          />
                        </label>
                        <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-slate-400">
                          Missing modifier price is different from an explicit 0 adjustment. Deleting may remove the option from future sellable catalog responses.
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="submit"
                            disabled={!canEditPrices || setModifierPriceMutation.isPending}
                            className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white disabled:opacity-50"
                          >
                            <Pencil size={15} />
                            Save modifier price
                          </button>
                          <button
                            type="button"
                            disabled={!canEditPrices || !selectedModifierPrice?.isConfigured || removeModifierPriceMutation.isPending}
                            onClick={removeModifierPrice}
                            className="flex h-10 items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 text-xs font-bold text-red-100 disabled:opacity-50"
                          >
                            <Trash2 size={15} />
                            Delete modifier price
                          </button>
                        </div>
                      </form>
                    )}
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
