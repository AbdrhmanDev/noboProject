import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { useDevices } from "../hooks/useDevices";

/**
 * P9.1 -- surfaces the branch's actual receipt-printer routing outcome, computed with the exact
 * same query PrintTargetResolver itself uses server-side (active ReceiptPrinter devices in this
 * branch): zero means auto-print will be skipped (no PrintJob is created, payment still succeeds);
 * exactly one is the resolved target; several is ambiguous and PrintTargetResolver refuses to
 * guess, exactly like the manual-print endpoint already does. There is no backend "set the
 * branch's routing" endpoint -- routing is derived, not configured -- so this is a read-only status,
 * not a form: fixing it means activating/deactivating a ReceiptPrinter device below, using the
 * device actions this page already has.
 */
export function ReceiptPrinterRoutingStatus({
  companyId,
  branchId,
  onFilterToReceiptPrinters,
}: {
  companyId: string | null | undefined;
  branchId: string | null | undefined;
  onFilterToReceiptPrinters: () => void;
}) {
  const { t } = useI18n();
  const printersQuery = useDevices(companyId, branchId, { deviceType: "ReceiptPrinter", status: "Active" });
  const printers = printersQuery.data || [];

  if (printersQuery.isLoading || printersQuery.isError || !companyId || !branchId) return null;

  const state = printers.length === 1 ? "ready" : printers.length === 0 ? "unconfigured" : "ambiguous";

  const stateStyles: Record<string, string> = {
    ready: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100",
    unconfigured: "border-white/10 bg-white/[0.02] text-slate-300",
    ambiguous: "border-amber-400/25 bg-amber-500/10 text-amber-100",
  };

  return (
    <button
      type="button"
      onClick={onFilterToReceiptPrinters}
      className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-start transition hover:brightness-110 ${stateStyles[state]}`}
    >
      <div className="flex items-center gap-2">
        {state === "ready" && <CheckCircle2 size={16} />}
        {state === "unconfigured" && <XCircle size={16} className="text-slate-500" />}
        {state === "ambiguous" && <AlertTriangle size={16} />}
        <div>
          <div className="text-xs font-bold">{t("devices.routing.receiptPrinter.title")}</div>
          <div className="text-[11px] opacity-80">
            {state === "ready" && t("devices.routing.receiptPrinter.ready", { name: printers[0].name })}
            {state === "unconfigured" && t("devices.routing.receiptPrinter.unconfigured")}
            {state === "ambiguous" && t("devices.routing.receiptPrinter.ambiguous", { count: printers.length })}
          </div>
        </div>
      </div>
      <span className="text-[11px] font-bold underline">{t("devices.routing.viewReceiptPrinters")}</span>
    </button>
  );
}
