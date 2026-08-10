import { CheckCircle2, Clock3, Monitor, WalletCards } from "lucide-react";
import { formatDateTime, formatMoney } from "../../../shared/utils/formatters";
import type { OpenPosShift } from "../types/pos.types";

type OpenShiftSummaryProps = {
  shift: OpenPosShift;
};

export function OpenShiftSummary({ shift }: OpenShiftSummaryProps) {
  return (
    <section className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300">
            <CheckCircle2 size={19} />
          </div>
          <div>
            <div className="text-sm font-black text-white">Open Shift</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Monitor size={13} />
                {shift.terminalName} · {shift.terminalCode}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock3 size={13} />
                {formatDateTime(shift.openedAtUtc)}
              </span>
            </div>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
            <div className="text-[10px] text-slate-500">Opening Float</div>
            <div className="text-xs font-black text-white">
              {formatMoney(
                shift.openingFloatAmount,
                shift.currencyCode,
                shift.currencyMinorUnitDigits,
              )}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
            <div className="text-[10px] text-slate-500">Expected Cash</div>
            <div className="flex items-center gap-1 text-xs font-black text-emerald-300">
              <WalletCards size={13} />
              {formatMoney(
                shift.expectedCashAmount,
                shift.currencyCode,
                shift.currencyMinorUnitDigits,
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
