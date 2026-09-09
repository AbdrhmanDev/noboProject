import { CheckCircle2, Clock3, Monitor, WalletCards } from "lucide-react";
import { formatDateTime, formatMoney } from "../../../shared/utils/formatters";
import type { OpenPosShift } from "../types/pos.types";

type OpenShiftSummaryProps = {
  shift: OpenPosShift;
};

export function OpenShiftSummary({ shift }: OpenShiftSummaryProps) {
  // Single compact row instead of a tall two-tier card — same information
  // (terminal, opened time, opening float, expected cash), laid out inline
  // so this permanent banner doesn't eat vertical space the workspace below
  // it (the basket especially) needs at shorter viewport heights.
  return (
    <section className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] px-3 py-2 text-xs">
      <div className="flex items-center gap-1.5 font-black text-white">
        <CheckCircle2 size={15} className="shrink-0 text-emerald-300" />
        Open Shift
      </div>
      <span className="inline-flex items-center gap-1 text-slate-400">
        <Monitor size={12} />
        {shift.terminalName} · {shift.terminalCode}
      </span>
      <span className="inline-flex items-center gap-1 text-slate-400">
        <Clock3 size={12} />
        {formatDateTime(shift.openedAtUtc)}
      </span>
      <span className="text-slate-500">
        Opening Float{" "}
        <span className="font-bold text-white">
          {formatMoney(shift.openingFloatAmount, shift.currencyCode, shift.currencyMinorUnitDigits)}
        </span>
      </span>
      <span className="inline-flex items-center gap-1 text-slate-500">
        Expected Cash
        <span className="inline-flex items-center gap-1 font-bold text-emerald-300">
          <WalletCards size={12} />
          {formatMoney(shift.expectedCashAmount, shift.currencyCode, shift.currencyMinorUnitDigits)}
        </span>
      </span>
    </section>
  );
}
