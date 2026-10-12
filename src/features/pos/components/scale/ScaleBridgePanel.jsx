import { convertScaleReadingValue, isFreshScaleReading, isUsableScaleReading } from "../../types/scaleReading.types";
import { formatQuantity } from "../../utils/posFormatters";

// Variable-Weight Products Phase F.4: displays the real Edge Agent scale bridge's current state
// (useScaleBridgeReading) inside the weight-entry dialog, and lets the cashier explicitly copy a
// valid reading into the keypad. It NEVER adds a cart line or confirms a sale itself -- the
// existing confirmWeightEntry button remains the only thing that actually submits a line. Reuses
// the exact same validation functions the Phase F.2 simulator panel uses, so there is only ever
// one definition of "usable"/"fresh"/"convertible", regardless of whether the reading came from
// the simulator or this real bridge client.
const STALE_THRESHOLD_MS = 3000;

export function ScaleBridgePanel({ bridgeState, targetUnit, onApply }) {
  const reading = bridgeState.kind === "reading" ? bridgeState.reading : null;
  const usable = isUsableScaleReading(reading);
  const fresh = reading ? isFreshScaleReading(reading, STALE_THRESHOLD_MS) : false;
  const convertedValue = usable && targetUnit ? convertScaleReadingValue(reading, targetUnit) : null;
  const canApply = usable && fresh && convertedValue !== null;

  let statusLabel;
  if (bridgeState.kind === "connecting") statusLabel = "جارٍ الاتصال بالميزان...";
  else if (bridgeState.kind === "unavailable") statusLabel = "الميزان غير متاح حالياً";
  else if (bridgeState.kind === "noReader") statusLabel = "لا يوجد ميزان مهيّأ";
  else if (reading?.status === "Disconnected") statusLabel = "الميزان غير متصل";
  else if (reading?.status === "Malformed") statusLabel = "قراءة غير صالحة من الميزان";
  else if (reading && !fresh) statusLabel = "قراءة قديمة";
  else if (reading?.status === "Unstable") statusLabel = "الوزن غير مستقر";
  else if (reading?.status === "Stable" && convertedValue === null)
    statusLabel = `وحدة الميزان (${reading.unit}) غير متوافقة مع (${targetUnit})`;
  else if (reading?.status === "Stable")
    statusLabel = `مستقر: ${formatQuantity(convertedValue ?? reading.value)} ${targetUnit}`;
  else statusLabel = "لا توجد قراءة بعد";

  return (
    <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-pos-border bg-pos-card p-3">
      <span className="pos-fs-label text-pos-text">{statusLabel}</span>
      <button
        type="button"
        disabled={!canApply}
        onClick={() => onApply(convertedValue)}
        className="pos-fs-label h-9 shrink-0 rounded-pos bg-pos-primary-strong px-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        استخدام قراءة الميزان
      </button>
    </div>
  );
}
