import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, FileText } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { useI18n } from "../../i18n/I18nContext";
import { formatMoney } from "../../shared/utils/formatters";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useHasPermission, useMyCompanies } from "../../features/companies/hooks/useCompanies";
import { useActiveInventoryItems } from "../../features/inventory/hooks/useInventory";
import { useAllSuppliers } from "../../features/procurement/hooks/useSuppliers";
import {
  useCreatePurchaseOrder,
  usePurchaseOrderDetails,
  useUpdatePurchaseOrder,
} from "../../features/procurement/hooks/usePurchaseOrders";
import { PurchaseOrderLineEditor } from "../../features/procurement/components/PurchaseOrderLineEditor";
import { formatPurchaseAmount, purchaseOrderNumberDisplay } from "../../features/procurement/utils/procurementFormatters";
import { ROUTES, purchaseOrderDetailsPath } from "../../utils/routes";

const PURCHASES_VIEW_PERMISSION = "Purchases.View";
const PURCHASES_MANAGE_PERMISSION = "Purchases.Manage";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

function toDateInputValue(isoUtc) {
  if (!isoUtc) return "";
  return isoUtc.slice(0, 10);
}

export default function PurchaseOrderEditorPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { purchaseOrderId } = useParams();
  const isEdit = Boolean(purchaseOrderId);
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();

  const viewPermissionQuery = useHasPermission(currentCompanyId, PURCHASES_VIEW_PERMISSION);
  const managePermissionQuery = useHasPermission(currentCompanyId, PURCHASES_MANAGE_PERMISSION);
  const canQuery =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !viewPermissionQuery.isLoading &&
    viewPermissionQuery.hasPermission;
  const canManage = !managePermissionQuery.isLoading && managePermissionQuery.hasPermission;

  const poDetailsQuery = usePurchaseOrderDetails(
    currentCompanyId,
    currentBranchId,
    purchaseOrderId,
    canQuery && isEdit,
  );
  // New POs default to only Active suppliers (a suspended supplier can
  // still be seen historically on already-created orders, but shouldn't be
  // picked for a new one) — backend still validates Submit regardless.
  // useAllSuppliers drains every page at the backend's legal page size
  // instead of requesting one oversized page (pageSize=200 was rejected
  // with a 400 — this endpoint's real page-size ceiling is smaller).
  const suppliersQuery = useAllSuppliers(currentCompanyId, { status: "Active" }, canQuery && canManage);
  const activeItemsQuery = useActiveInventoryItems(currentCompanyId, canQuery && canManage);
  const myCompaniesQuery = useMyCompanies(canQuery);

  const createMutation = useCreatePurchaseOrder(currentCompanyId, currentBranchId);
  const updateMutation = useUpdatePurchaseOrder(currentCompanyId, currentBranchId, purchaseOrderId);

  const [supplierId, setSupplierId] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState([]);
  const [formError, setFormError] = useState("");
  const [hydrated, setHydrated] = useState(!isEdit);

  // Real GET details response root is { order, receipts } — not the order's
  // own fields directly.
  const po = poDetailsQuery.data?.order;

  // Pre-save currency preview: a Draft not yet created has no server-side
  // CurrencyCode yet, but the backend will snapshot Company.DefaultCurrency
  // onto it at creation — so until then, mirror that same value from the
  // Company context (same lookup pattern as AppLayout's company display
  // name) purely for the editor's own preview math. Once an edit-mode PO
  // has loaded, its own (immutable) currencyCode always wins.
  const companyDefaultCurrency = (myCompaniesQuery.data || []).find(
    (company) => company.companyId === currentCompanyId,
  )?.defaultCurrency;
  const previewCurrencyCode = po?.currencyCode || companyDefaultCurrency || null;
  const previewCurrencyMinorUnitDigits = po?.currencyCode ? po.currencyMinorUnitDigits : null;

  // Hydrate the editable fields from the server once, the moment PO details
  // finish loading — done as a render-time state adjustment (React's
  // documented pattern for this) rather than an effect, since setState
  // synchronously inside an effect body causes an extra cascading render.
  if (isEdit && po && !hydrated) {
    setSupplierId(po.supplierId);
    setExpectedDeliveryDate(toDateInputValue(po.expectedDeliveryDateUtc));
    setNote(po.note || "");
    setLines(
      po.lines.map((line) => ({
        key: line.purchaseOrderLineId,
        inventoryItemId: line.inventoryItemId,
        orderedQuantity: String(line.orderedQuantity),
        unitCost: String(line.unitCost),
      })),
    );
    setHydrated(true);
  }

  const items = activeItemsQuery.data || [];
  const suppliers = suppliersQuery.data || [];

  const isPending = createMutation.isPending || updateMutation.isPending;

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!supplierId) {
      setFormError(t("procurement.po.form.supplierRequired"));
      return;
    }

    const validLines = lines.filter((line) => line.inventoryItemId);
    if (validLines.length === 0) {
      setFormError(t("procurement.po.form.lineRequired"));
      return;
    }

    const parsedLines = [];
    for (const line of validLines) {
      const orderedQuantity = Number(line.orderedQuantity);
      const unitCost = Number(line.unitCost);
      if (!Number.isFinite(orderedQuantity) || orderedQuantity <= 0) {
        setFormError(t("procurement.po.form.quantityInvalid"));
        return;
      }
      if (!Number.isFinite(unitCost) || unitCost < 0) {
        setFormError(t("procurement.po.form.unitCostInvalid"));
        return;
      }
      parsedLines.push({ inventoryItemId: line.inventoryItemId, orderedQuantity, unitCost });
    }

    const payload = {
      supplierId,
      expectedDeliveryDateUtc: expectedDeliveryDate ? new Date(`${expectedDeliveryDate}T00:00:00`).toISOString() : null,
      note: note.trim() || null,
      lines: parsedLines,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync(payload);
        toast.success(t("procurement.toast.poUpdated"));
        navigate(purchaseOrderDetailsPath(purchaseOrderId));
      } else {
        const created = await createMutation.mutateAsync(payload);
        toast.success(
          t("procurement.toast.poCreated", {
            number: purchaseOrderNumberDisplay(created.purchaseOrderNumber, created.purchaseOrderNumberFormatted),
          }),
        );
        navigate(purchaseOrderDetailsPath(created.purchaseOrderId));
      }
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  // Editing only ever makes sense for a Draft — once it's left Draft the
  // backend won't accept these fields as editable at all, so this page
  // simply doesn't offer edit controls for anything else.
  const notEditableAnymore = isEdit && po && po.status !== "Draft";

  const previewTotal = lines.reduce((sum, line) => {
    const quantity = Number(line.orderedQuantity);
    const unitCost = Number(line.unitCost);
    return sum + (Number.isFinite(quantity) && Number.isFinite(unitCost) ? quantity * unitCost : 0);
  }, 0);

  return (
    <AppLayout activePath={ROUTES.PURCHASES}>
      <main className="space-y-4" dir="rtl">
        <header className="rounded-2xl border border-white/10 bg-[#0c1424]/85 p-4 shadow-xl shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <FileText size={16} className="text-blue-300" />
                {t("nav.purchases")}
              </div>
              <h1 className="mt-1 text-2xl font-black text-white">
                {isEdit ? t("procurement.po.edit") : t("procurement.po.new")}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => navigate(isEdit ? purchaseOrderDetailsPath(purchaseOrderId) : ROUTES.PURCHASES)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100 hover:bg-white/10"
            >
              <ArrowRight size={14} />
              {t("procurement.actions.back")}
            </button>
          </div>
        </header>

        {!currentCompanyId || !currentBranchId ? (
          <EmptyState
            title={t("procurement.companyRequired.title")}
            message={t("procurement.companyRequired.message")}
          />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label={t("procurement.loading")} />
        ) : !canManage ? (
          <ErrorState
            title={t("procurement.permissionRequired.title")}
            message={t("procurement.manageRequired.message")}
          />
        ) : isEdit && poDetailsQuery.isLoading ? (
          <LoadingState label={t("procurement.loading")} />
        ) : isEdit && poDetailsQuery.isError ? (
          <ErrorState title={t("procurement.error.title")} message={t("procurement.error.message")} />
        ) : notEditableAnymore ? (
          <ErrorState
            title={t("procurement.po.notEditable.title")}
            message={t("procurement.po.notEditable.message")}
          />
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {formError && (
              <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                {formError}
              </div>
            )}

            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
              <h2 className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
                {t("procurement.po.form.header")}
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block text-xs font-semibold text-slate-400">
                  {t("procurement.po.form.supplier")}
                  <select
                    value={supplierId}
                    onChange={(event) => setSupplierId(event.target.value)}
                    disabled={suppliersQuery.isLoading}
                    className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
                  >
                    <option value="">{t("procurement.po.form.supplierSelectPlaceholder")}</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.supplierId} value={supplier.supplierId}>
                        {supplier.code} — {supplier.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-slate-400">
                  {t("procurement.po.form.expectedDelivery")}
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(event) => setExpectedDeliveryDate(event.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-400 sm:col-span-1">
                  {t("procurement.po.form.note")}
                  <input
                    type="text"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={500}
                    className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
              <h2 className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
                {t("procurement.po.form.lines")}
              </h2>
              {activeItemsQuery.isLoading ? (
                <LoadingState label={t("procurement.loading")} />
              ) : (
                <PurchaseOrderLineEditor
                  lines={lines}
                  onChange={setLines}
                  items={items}
                  currencyCode={previewCurrencyCode}
                  currencyMinorUnitDigits={previewCurrencyMinorUnitDigits}
                />
              )}
            </section>

            <section className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0c1424] p-4">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {t("procurement.po.total")}
              </span>
              <span className="text-lg font-black text-white">
                {previewCurrencyCode
                  ? formatMoney(previewTotal, previewCurrencyCode, previewCurrencyMinorUnitDigits ?? undefined)
                  : formatPurchaseAmount(previewTotal)}
              </span>
            </section>

            <button
              type="submit"
              disabled={isPending}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-black text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? t("procurement.actions.saving") : t("procurement.po.form.saveDraft")}
            </button>
          </form>
        )}
      </main>
    </AppLayout>
  );
}
