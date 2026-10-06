import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, FileText, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { formatDateTime, formatMoney } from "../../shared/utils/formatters";
import { useI18n } from "../../i18n/I18nContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import {
  useCancelPurchaseOrder,
  useClosePurchaseOrder,
  usePurchaseOrderDetails,
  useSubmitPurchaseOrder,
} from "../../features/procurement/hooks/usePurchaseOrders";
import { PurchaseOrderStatusBadge } from "../../features/procurement/components/PurchaseOrderStatusBadge";
import { GoodsReceiptDialog } from "../../features/procurement/components/GoodsReceiptDialog";
import { ConfirmActionDialog } from "../../features/procurement/components/ConfirmActionDialog";
import {
  PURCHASE_ORDER_STATUS_LABEL_KEYS,
  getProcurementErrorMessageKey,
  grnNumberDisplay,
  purchaseOrderNumberDisplay,
} from "../../features/procurement/utils/procurementFormatters";
import { StatusBar } from "../../shared/components/odoo/StatusBar";
import { ROUTES, purchaseOrderEditPath } from "../../utils/routes";

const PURCHASES_VIEW_PERMISSION = "Purchases.View";
const PURCHASES_MANAGE_PERMISSION = "Purchases.Manage";
const PURCHASES_RECEIVE_PERMISSION = "Purchases.Receive";

function Field({ label, value }) {
  return (
    <div className="rounded-xl border border-line bg-raised p-2.5">
      <div className="text-xs text-subtle">{label}</div>
      <div className="mt-0.5 text-sm font-bold text-ink">{value ?? "—"}</div>
    </div>
  );
}

function getErrorMessage(error, t) {
  const key = getProcurementErrorMessageKey(error);
  return key ? t(key) : error?.message || t("procurement.error.message");
}

export default function PurchaseOrderDetailsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { purchaseOrderId } = useParams();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const [confirmAction, setConfirmAction] = useState(null); // "submit" | "cancel" | "close"
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);

  const viewPermissionQuery = useHasPermission(currentCompanyId, PURCHASES_VIEW_PERMISSION);
  const managePermissionQuery = useHasPermission(currentCompanyId, PURCHASES_MANAGE_PERMISSION);
  const receivePermissionQuery = useHasPermission(currentCompanyId, PURCHASES_RECEIVE_PERMISSION);
  const canQuery =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !viewPermissionQuery.isLoading &&
    viewPermissionQuery.hasPermission;
  const canManage = !managePermissionQuery.isLoading && managePermissionQuery.hasPermission;
  const canReceive = !receivePermissionQuery.isLoading && receivePermissionQuery.hasPermission;

  // Real response root is { order, receipts } — the GET details endpoint
  // already returns the complete receipt history, so that's the one source
  // used here; the dedicated GET .../receipts endpoint stays available for
  // other workflows without being called a second time on this page.
  const poQuery = usePurchaseOrderDetails(currentCompanyId, currentBranchId, purchaseOrderId, canQuery);
  const po = poQuery.data?.order;
  const receipts = poQuery.data?.receipts || [];

  const submitMutation = useSubmitPurchaseOrder(currentCompanyId, currentBranchId, purchaseOrderId);
  const cancelMutation = useCancelPurchaseOrder(currentCompanyId, currentBranchId, purchaseOrderId);
  const closeMutation = useClosePurchaseOrder(currentCompanyId, currentBranchId, purchaseOrderId);

  const canSubmit = canManage && po?.status === "Draft";
  const canEdit = canManage && po?.status === "Draft";
  const canCancel =
    canManage && po && (po.status === "Draft" || (po.status === "Submitted" && receipts.length === 0));
  const canClose = canManage && po && (po.status === "Submitted" || po.status === "PartiallyReceived");
  const canReceiveGoods = canReceive && po && (po.status === "Submitted" || po.status === "PartiallyReceived");

  const runAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction === "submit") {
        await submitMutation.mutateAsync();
        toast.success(t("procurement.toast.poSubmitted"));
      } else if (confirmAction === "cancel") {
        await cancelMutation.mutateAsync();
        toast.success(t("procurement.toast.poCancelled"));
      } else if (confirmAction === "close") {
        await closeMutation.mutateAsync();
        toast.success(t("procurement.toast.poClosed"));
      }
      setConfirmAction(null);
    } catch (error) {
      toast.error(getErrorMessage(error, t));
    }
  };

  return (
    <AppLayout activePath={ROUTES.PURCHASES}>
      <main className="odoo-root space-y-3" dir="rtl">
        {/* Odoo-style breadcrumb bar: the parent levels go back to the purchase orders list. */}
        <header className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 shadow-[var(--shadow-surface)]">
          <nav aria-label="breadcrumb" className="flex min-w-0 items-center gap-1.5 text-base">
            <FileText size={16} className="shrink-0 text-accent" />
            <button type="button" onClick={() => navigate(ROUTES.PURCHASES)} className="odoo-link hover:underline">
              {t("nav.purchases")}
            </button>
            <span className="text-subtle">/</span>
            <button type="button" onClick={() => navigate(ROUTES.PURCHASES)} className="odoo-link hover:underline">
              {t("procurement.po.title")}
            </button>
            <span className="text-subtle">/</span>
            <h1 className="truncate font-bold text-ink">
              {po ? purchaseOrderNumberDisplay(po.purchaseOrderNumber, po.purchaseOrderNumberFormatted) : "—"}
            </h1>
            {po && <PurchaseOrderStatusBadge status={po.status} />}
          </nav>
          <button
            type="button"
            onClick={() => navigate(ROUTES.PURCHASES)}
            className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm font-bold text-ink hover:bg-hover"
          >
            <ArrowRight size={14} />
            {t("procurement.actions.back")}
          </button>
        </header>

        {!currentCompanyId || !currentBranchId ? (
          <EmptyState
            title={t("procurement.companyRequired.title")}
            message={t("procurement.companyRequired.message")}
          />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label={t("procurement.loading")} />
        ) : !viewPermissionQuery.hasPermission ? (
          <ErrorState
            title={t("procurement.permissionRequired.title")}
            message={t("procurement.permissionRequired.message")}
          />
        ) : poQuery.isLoading ? (
          <LoadingState label={t("procurement.loading")} />
        ) : poQuery.isError || !po ? (
          <ErrorState
            title={t("procurement.po.notFound.title")}
            message={poQuery.error?.message || t("procurement.po.notFound.message")}
          />
        ) : (
          <div className="space-y-4">
            {/* Odoo-style status bar. PartiallyReceived only appears as a step while it is the
                current state; Cancelled replaces the pipeline. */}
            <StatusBar
              stages={[
                "Draft",
                "Submitted",
                ...(po.status === "PartiallyReceived" ? ["PartiallyReceived"] : []),
                "Received",
                "Closed",
              ].map((stage) => ({ id: stage, label: t(PURCHASE_ORDER_STATUS_LABEL_KEYS[stage]) }))}
              current={po.status}
              exception={po.status === "Cancelled" ? t(PURCHASE_ORDER_STATUS_LABEL_KEYS.Cancelled) : null}
            />
            <section className="rounded-xl border border-line bg-surface p-4">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <Field label={t("procurement.po.form.supplier")} value={po.supplierName} />
                <Field
                  label={t("procurement.po.form.expectedDelivery")}
                  value={po.expectedDeliveryDateUtc ? formatDateTime(po.expectedDeliveryDateUtc) : "—"}
                />
                <Field label={t("procurement.po.created")} value={formatDateTime(po.createdAtUtc)} />
                <Field
                  label={t("procurement.po.submitted")}
                  value={po.submittedAtUtc ? formatDateTime(po.submittedAtUtc) : "—"}
                />
              </div>
              {po.note && (
                <div className="mt-2 rounded-xl border border-line bg-raised p-2.5 text-sm text-muted">
                  {po.note}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => navigate(purchaseOrderEditPath(purchaseOrderId))}
                    className="flex h-10 flex-1 items-center justify-center rounded-xl border border-line bg-raised text-sm font-bold text-ink hover:bg-hover"
                  >
                    {t("procurement.actions.edit")}
                  </button>
                )}
                {canSubmit && (
                  <button
                    type="button"
                    onClick={() => setConfirmAction("submit")}
                    className="flex h-10 flex-1 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white hover:brightness-110"
                  >
                    {t("procurement.actions.submit")}
                  </button>
                )}
                {canReceiveGoods && (
                  <button
                    type="button"
                    onClick={() => setShowReceiveDialog(true)}
                    className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-success text-sm font-bold text-white hover:brightness-110"
                  >
                    <PackageCheck size={14} />
                    {t("procurement.actions.receiveGoods")}
                  </button>
                )}
                {canClose && (
                  <button
                    type="button"
                    onClick={() => setConfirmAction("close")}
                    className="flex h-10 flex-1 items-center justify-center rounded-xl border border-line bg-raised text-sm font-bold text-ink hover:bg-hover"
                  >
                    {t("procurement.actions.close")}
                  </button>
                )}
                {canCancel && (
                  <button
                    type="button"
                    onClick={() => setConfirmAction("cancel")}
                    className="flex h-10 flex-1 items-center justify-center rounded-xl border border-danger bg-danger-soft text-sm font-bold text-danger hover:brightness-110"
                  >
                    {t("procurement.actions.cancel")}
                  </button>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-line bg-surface p-4">
              <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-subtle">
                {t("procurement.po.form.lines")}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-start text-subtle">
                      <th className="pb-2 text-start font-medium">{t("procurement.po.form.item")}</th>
                      <th className="pb-2 text-start font-medium">{t("procurement.receipt.ordered")}</th>
                      <th className="pb-2 text-start font-medium">{t("procurement.receipt.previouslyReceived")}</th>
                      <th className="pb-2 text-start font-medium">{t("procurement.receipt.remaining")}</th>
                      <th className="pb-2 text-start font-medium">{t("procurement.po.form.unitCost")}</th>
                      <th className="pb-2 text-start font-medium">{t("procurement.po.form.lineTotal")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {po.lines.map((line) => (
                      <tr key={line.purchaseOrderLineId} className="border-t border-line">
                        <td className="py-2.5 font-bold text-ink">
                          {line.inventoryItemName}
                          <span className="ms-1 text-xs text-subtle">({line.inventoryItemCode})</span>
                        </td>
                        <td className="py-2.5 text-muted">{line.orderedQuantity}</td>
                        <td className="py-2.5 text-muted">{line.receivedQuantity}</td>
                        <td className="py-2.5 font-bold text-warning">{line.remainingQuantity}</td>
                        <td className="py-2.5 text-muted">
                          {formatMoney(line.unitCost, po.currencyCode, po.currencyMinorUnitDigits ?? undefined)}
                        </td>
                        <td className="py-2.5 font-bold text-ink">
                          {formatMoney(line.lineTotal, po.currencyCode, po.currencyMinorUnitDigits ?? undefined)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <span className="text-sm font-bold uppercase tracking-wide text-subtle">
                  {t("procurement.po.total")}
                </span>
                <span className="text-base font-black text-ink">
                  {formatMoney(po.totalAmount, po.currencyCode, po.currencyMinorUnitDigits ?? undefined)}
                </span>
              </div>
            </section>

            <section className="rounded-xl border border-line bg-surface p-4">
              <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-subtle">
                {t("procurement.receipt.history")}
              </h2>
              {receipts.length === 0 ? (
                <EmptyState
                  title={t("procurement.receipt.empty.title")}
                  message={t("procurement.receipt.empty.message")}
                />
              ) : (
                <div className="space-y-2">
                  {receipts.map((receipt) => (
                    <div
                      key={receipt.purchaseGoodsReceiptId}
                      className="rounded-xl border border-line bg-raised p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-black text-ink">
                          {grnNumberDisplay(receipt.grnNumber, receipt.grnNumberFormatted)}
                        </span>
                        <span className="text-xs text-subtle">{formatDateTime(receipt.receivedAtUtc)}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        {receipt.inventoryLocationId
                          ? `${receipt.inventoryLocationCode} — ${receipt.inventoryLocationName}`
                          : t("procurement.receipt.notInventoryTracked")}
                      </div>
                      <div className="mt-2 space-y-1">
                        {receipt.lines.map((line) => (
                          <div
                            key={line.purchaseOrderLineId}
                            className="flex items-center justify-between text-xs text-muted"
                          >
                            <span>{line.inventoryItemName}</span>
                            <span className="font-bold text-success">+{line.receivedQuantity}</span>
                          </div>
                        ))}
                      </div>
                      {receipt.note && <p className="mt-2 text-xs text-subtle">{receipt.note}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

      {showReceiveDialog && po && (
        <GoodsReceiptDialog
          companyId={currentCompanyId}
          branchId={currentBranchId}
          purchaseOrder={po}
          onClose={() => setShowReceiveDialog(false)}
          onSuccess={() => setShowReceiveDialog(false)}
        />
      )}

      {confirmAction && (
        <ConfirmActionDialog
          title={t(`procurement.actions.${confirmAction}`)}
          message={t(`procurement.confirm.${confirmAction}Po`, {
            number: purchaseOrderNumberDisplay(po?.purchaseOrderNumber, po?.purchaseOrderNumberFormatted),
          })}
          confirmLabel={t(`procurement.actions.${confirmAction}`)}
          tone={confirmAction === "cancel" ? "danger" : "default"}
          isPending={submitMutation.isPending || cancelMutation.isPending || closeMutation.isPending}
          onConfirm={runAction}
          onClose={() => setConfirmAction(null)}
        />
      )}
      </main>
    </AppLayout>
  );
}
