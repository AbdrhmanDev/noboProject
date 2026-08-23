import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, FileText, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { formatDateTime } from "../../shared/utils/formatters";
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
  formatPurchaseAmount,
  getProcurementErrorMessageKey,
  grnNumberDisplay,
  purchaseOrderNumberDisplay,
} from "../../features/procurement/utils/procurementFormatters";
import { ROUTES, purchaseOrderEditPath } from "../../utils/routes";

const PURCHASES_VIEW_PERMISSION = "Purchases.View";
const PURCHASES_MANAGE_PERMISSION = "Purchases.Manage";
const PURCHASES_RECEIVE_PERMISSION = "Purchases.Receive";

function Field({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-2.5">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="mt-0.5 text-xs font-bold text-slate-100">{value ?? "—"}</div>
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
      <main className="space-y-4" dir="rtl">
        <header className="rounded-2xl border border-white/10 bg-[#0c1424]/85 p-4 shadow-xl shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <FileText size={16} className="text-blue-300" />
                {t("nav.purchases")}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black text-white">
                  {po ? purchaseOrderNumberDisplay(po.purchaseOrderNumber, po.purchaseOrderNumberFormatted) : "—"}
                </h1>
                {po && <PurchaseOrderStatusBadge status={po.status} />}
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.PURCHASES)}
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
            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
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
                <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.025] p-2.5 text-xs text-slate-300">
                  {po.note}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => navigate(purchaseOrderEditPath(purchaseOrderId))}
                    className="flex h-10 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-xs font-bold text-slate-100 hover:bg-white/10"
                  >
                    {t("procurement.actions.edit")}
                  </button>
                )}
                {canSubmit && (
                  <button
                    type="button"
                    onClick={() => setConfirmAction("submit")}
                    className="flex h-10 flex-1 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white hover:brightness-110"
                  >
                    {t("procurement.actions.submit")}
                  </button>
                )}
                {canReceiveGoods && (
                  <button
                    type="button"
                    onClick={() => setShowReceiveDialog(true)}
                    className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:brightness-110"
                  >
                    <PackageCheck size={14} />
                    {t("procurement.actions.receiveGoods")}
                  </button>
                )}
                {canClose && (
                  <button
                    type="button"
                    onClick={() => setConfirmAction("close")}
                    className="flex h-10 flex-1 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/10 text-xs font-bold text-violet-200 hover:bg-violet-500/20"
                  >
                    {t("procurement.actions.close")}
                  </button>
                )}
                {canCancel && (
                  <button
                    type="button"
                    onClick={() => setConfirmAction("cancel")}
                    className="flex h-10 flex-1 items-center justify-center rounded-xl border border-rose-400/30 bg-rose-500/10 text-xs font-bold text-rose-200 hover:bg-rose-500/20"
                  >
                    {t("procurement.actions.cancel")}
                  </button>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
              <h2 className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
                {t("procurement.po.form.lines")}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-start text-slate-500">
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
                      <tr key={line.purchaseOrderLineId} className="border-t border-white/5">
                        <td className="py-2.5 font-bold text-slate-100">
                          {line.inventoryItemName}
                          <span className="ms-1 text-[10px] text-slate-500">({line.inventoryItemCode})</span>
                        </td>
                        <td className="py-2.5 text-slate-300">{line.orderedQuantity}</td>
                        <td className="py-2.5 text-slate-300">{line.receivedQuantity}</td>
                        <td className="py-2.5 font-bold text-amber-300">{line.remainingQuantity}</td>
                        <td className="py-2.5 text-slate-300">{formatPurchaseAmount(line.unitCost)}</td>
                        <td className="py-2.5 font-bold text-white">{formatPurchaseAmount(line.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {t("procurement.po.total")}
                </span>
                <span className="text-base font-black text-white">{formatPurchaseAmount(po.totalAmount)}</span>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
              <h2 className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
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
                      className="rounded-xl border border-white/10 bg-[#0d1728] p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-black text-white">
                          {grnNumberDisplay(receipt.grnNumber, receipt.grnNumberFormatted)}
                        </span>
                        <span className="text-[11px] text-slate-500">{formatDateTime(receipt.receivedAtUtc)}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        {receipt.inventoryLocationCode} — {receipt.inventoryLocationName}
                      </div>
                      <div className="mt-2 space-y-1">
                        {receipt.lines.map((line) => (
                          <div
                            key={line.purchaseOrderLineId}
                            className="flex items-center justify-between text-[11px] text-slate-300"
                          >
                            <span>{line.inventoryItemName}</span>
                            <span className="font-bold text-emerald-300">+{line.receivedQuantity}</span>
                          </div>
                        ))}
                      </div>
                      {receipt.note && <p className="mt-2 text-[11px] text-slate-500">{receipt.note}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

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
    </AppLayout>
  );
}
