import { Check } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";

// Each step takes one of the logo's colours: Order blue, Payment yellow, Done green.
const STEPS = [
  { id: "order", labelKey: "pos.phase.order", accent: "var(--brand-blue)", on: "#fff" },
  { id: "payment", labelKey: "pos.phase.payment", accent: "var(--brand-yellow)", on: "var(--brand-dark)" },
  { id: "complete", labelKey: "pos.phase.complete", accent: "var(--brand-green)", on: "var(--brand-dark)" },
];

/**
 * Small persistent step indicator for the 3-phase cashier workspace. Purely
 * a status readout — phase transitions themselves stay driven by the order
 * primary action / F8 / F9 / Back, not by clicking a step here.
 */
export function PosPhaseIndicator({ phase }) {
  const { t } = useI18n();
  const currentIndex = STEPS.findIndex((step) => step.id === phase);

  return (
    <div className="flex items-center gap-2 px-1 text-[11px] font-bold text-pos-muted">
      {STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.id} className="flex items-center gap-2">
            {index > 0 && (
              <div
                className="h-0.5 w-6 rounded-full"
                style={{ background: isDone || isCurrent ? STEPS[index - 1].accent : "var(--pos-border)" }}
              />
            )}
            <div
              className={`pos-step flex items-center gap-1.5 rounded-full px-2.5 py-1 ${isDone ? "text-pos-text" : isCurrent ? "" : "text-pos-muted"}`}
              style={isCurrent ? { background: step.accent, color: step.on } : undefined}
            >
              <span
                className="grid h-4 w-4 place-items-center rounded-full text-[9px]"
                style={
                  isCurrent
                    ? { background: step.on, color: step.accent === "var(--brand-yellow)" ? "var(--brand-dark)" : step.accent }
                    : isDone
                      ? { background: step.accent, color: step.on }
                      : { background: "var(--pos-border)" }
                }
              >
                {isDone ? <Check size={10} /> : index + 1}
              </span>
              {t(step.labelKey)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
