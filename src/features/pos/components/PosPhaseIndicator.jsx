import { Check } from "lucide-react";

const STEPS = [
  { id: "order", label: "الطلب" },
  { id: "payment", label: "الدفع" },
  { id: "complete", label: "الإتمام" },
];

/**
 * Small persistent step indicator for the 3-phase cashier workspace. Purely
 * a status readout — phase transitions themselves stay driven by the order
 * primary action / F8 / F9 / Back, not by clicking a step here.
 */
export function PosPhaseIndicator({ phase }) {
  const currentIndex = STEPS.findIndex((step) => step.id === phase);

  return (
    <div className="flex items-center gap-2 px-1 text-[11px] font-bold text-slate-500">
      {STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.id} className="flex items-center gap-2">
            {index > 0 && <div className={`h-px w-6 ${isDone || isCurrent ? "bg-blue-400/40" : "bg-white/10"}`} />}
            <div
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 transition ${
                isCurrent
                  ? "bg-blue-500/15 text-blue-200"
                  : isDone
                    ? "text-emerald-300"
                    : "text-slate-500"
              }`}
            >
              <span
                className={`grid h-4 w-4 place-items-center rounded-full text-[9px] ${
                  isCurrent
                    ? "bg-blue-400 text-[#0d1728]"
                    : isDone
                      ? "bg-emerald-400 text-[#0d1728]"
                      : "border border-white/20 text-slate-500"
                }`}
              >
                {isDone ? <Check size={10} /> : index + 1}
              </span>
              {step.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
