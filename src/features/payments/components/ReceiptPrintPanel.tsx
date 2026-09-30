import { useState } from "react";
import { toast } from "sonner";
import { Printer, RotateCcw } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { useHasPermission } from "../../companies/hooks/useCompanies";
import { useDevices } from "../../devices/hooks/useDevices";
import { PrintJobErrorMessage } from "../../devices/components/PrintJobErrorMessage";
import { PrintJobStatusBadge } from "../../devices/components/PrintJobStatusBadge";
import {
  useCustomerReceiptForSalesOrder,
  useCustomerReceiptPrintJobs,
  usePrintCustomerReceipt,
} from "../hooks/usePayments";

const POS_PRINT_RECEIPT_PERMISSION = "Pos.PrintReceipt";

/**
 * P9.1 -- surfaces the backend's own printing state for the receipt of a just-completed sale.
 * Never calls the print endpoint automatically: the backend already creates the auto-print
 * PrintJob itself on full settlement (ReceiveSalesOrderPaymentHandler). This panel only shows
 * what already happened and offers an explicit Print/Reprint action for when it didn't (no
 * printer configured, ambiguous branch routing, or the first attempt failed).
 *
 * Routing is branch-scoped, exactly like the backend's PrintTargetResolver: the branch's active
 * ReceiptPrinter devices are read via the existing Devices list endpoint (same filters the
 * resolver itself uses server-side) -- zero/one/several is surfaced as-is, never guessed at.
 */
export function ReceiptPrintPanel({
  companyId,
  branchId,
  salesOrderId,
}: {
  companyId: string | null | undefined;
  branchId: string | null | undefined;
  salesOrderId: string | null | undefined;
}) {
  const { t } = useI18n();
  const [error, setError] = useState("");

  const printPermissionQuery = useHasPermission(companyId, POS_PRINT_RECEIPT_PERMISSION);

  // The receipt only exists once the sale is fully settled; a 400/404-shaped "not available" is
  // an expected state here (e.g. an instalment that hasn't finished yet), not an error to surface.
  const receiptQuery = useCustomerReceiptForSalesOrder(companyId, branchId, salesOrderId);
  const receipt = receiptQuery.data;

  const printersQuery = useDevices(
    companyId,
    branchId,
    { deviceType: "ReceiptPrinter", status: "Active" },
    Boolean(receipt) && printPermissionQuery.hasPermission,
  );
  const printers = printersQuery.data || [];
  const routing = printers.length === 1 ? "ready" : printers.length === 0 ? "unconfigured" : "ambiguous";
  const resolvedDeviceId = routing === "ready" ? printers[0].deviceId : null;

  const jobsQuery = useCustomerReceiptPrintJobs(
    companyId,
    branchId,
    receipt?.customerReceiptId,
    Boolean(receipt) && printPermissionQuery.hasPermission,
  );
  const latestJob = jobsQuery.data?.[0] || null;

  const printMutation = usePrintCustomerReceipt(companyId, branchId);

  const print = async () => {
    if (!receipt || !resolvedDeviceId) return;
    setError("");
    try {
      await printMutation.mutateAsync({
        customerReceiptId: receipt.customerReceiptId,
        payload: { deviceId: resolvedDeviceId },
      });
      toast.success(t(latestJob ? "pos.receipt.reprint.success" : "pos.receipt.print.success"));
      jobsQuery.refetch();
    } catch (printError) {
      setError((printError as { message?: string })?.message || t("pos.receipt.print.error.generic"));
    }
  };

  // Not fully paid yet, no permission to know, or the caller has no permission at all -- show
  // nothing rather than a fake/placeholder printing state.
  if (!printPermissionQuery.hasPermission || receiptQuery.isPending || !receipt) return null;

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-start">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-300">{t("pos.receipt.print.title")}</span>
        {latestJob && <PrintJobStatusBadge status={latestJob.status} transport={latestJob.transport} />}
      </div>

      {latestJob?.status === "Failed" && (
        <div className="mt-2">
          <PrintJobErrorMessage printJob={latestJob} />
        </div>
      )}

      {!latestJob && routing === "unconfigured" && (
        <p className="mt-1.5 text-[11px] text-slate-500">{t("pos.receipt.print.status.noPrinter")}</p>
      )}
      {routing === "ambiguous" && (
        <p className="mt-1.5 text-[11px] text-amber-300">{t("pos.receipt.print.status.ambiguousPrinter")}</p>
      )}
      {error && <p className="mt-1.5 text-[11px] text-red-300">{error}</p>}

      <button
        type="button"
        disabled={!resolvedDeviceId || printMutation.isPending}
        onClick={print}
        className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] text-xs font-bold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {latestJob ? <RotateCcw size={14} /> : <Printer size={14} />}
        {printMutation.isPending
          ? t("pos.receipt.print.pending")
          : latestJob
            ? t("pos.receipt.reprint.button")
            : t("pos.receipt.print.button")}
      </button>
    </div>
  );
}
