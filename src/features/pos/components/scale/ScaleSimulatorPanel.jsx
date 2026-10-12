import { isFreshScaleReading, isUsableScaleReading, convertScaleReadingValue } from "../../types/scaleReading.types";
import { formatQuantity } from "../../utils/posFormatters";

// Variable-Weight Products Phase F.2: development-only panel rendered inside the weight-entry
// keypad modal when env.features.scaleSimulatorEnabled is on. Lets a developer script a
// ScaleReading (see useScaleReadingSimulator) and explicitly copy it into the keypad -- it never
// adds a sale line itself, never auto-applies a reading, and never touches the DOM/keyboard in
// any way (pure React state + button clicks), so it cannot interact with the real keyboard-wedge
// barcode-scanner listener. "Simulated source labels and behaviors only" -- this does not
// exercise any real device protocol.
const STALE_THRESHOLD_MS = 3000;

export function ScaleSimulatorPanel({ simulator, targetUnit, onApply }) {
  const { sourceType, setSourceType, sampleValue, setSampleValue, sampleUnit, setSampleUnit, reading } = simulator;

  const usable = isUsableScaleReading(reading);
  const fresh = reading ? isFreshScaleReading(reading, STALE_THRESHOLD_MS) : false;
  const convertedValue = usable && targetUnit ? convertScaleReadingValue(reading, targetUnit) : null;
  const canApply = usable && fresh && convertedValue !== null;

  let statusLabel = "لا توجد قراءة";
  if (reading) {
    if (reading.status === "Disconnected") statusLabel = "غير متصل (محاكاة)";
    else if (reading.status === "Malformed") statusLabel = "قراءة غير صالحة (محاكاة)";
    else if (!fresh) statusLabel = "قراءة قديمة (محاكاة)";
    else if (reading.status === "Unstable") statusLabel = "غير مستقر (محاكاة)";
    else if (reading.status === "Stable" && convertedValue === null)
      statusLabel = `وحدة غير مطابقة (${reading.unit} -> ${targetUnit}) (محاكاة)`;
    else if (reading.status === "Stable")
      statusLabel = `مستقر: ${formatQuantity(convertedValue ?? reading.value)} ${targetUnit} (محاكاة)`;
  }

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-dashed border-pos-warning bg-pos-warning-tint p-3">
      <div className="pos-fs-label font-bold text-pos-warning-text">محاكي الميزان (للتطوير فقط)</div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={sourceType}
          onChange={(event) => setSourceType(event.target.value)}
          className="h-9 rounded-pos border border-pos-border bg-pos-card px-2 text-xs text-pos-text"
        >
          <option value="KeyboardEmulation">محاكاة لوحة مفاتيح (USB HID)</option>
          <option value="SerialCom">محاكاة منفذ تسلسلي (COM)</option>
        </select>
        <input
          type="text"
          inputMode="decimal"
          value={sampleValue}
          onChange={(event) => setSampleValue(event.target.value)}
          placeholder="القيمة"
          className="h-9 w-20 rounded-pos border border-pos-border bg-pos-card px-2 text-xs text-pos-text"
        />
        <select
          value={sampleUnit}
          onChange={(event) => setSampleUnit(event.target.value)}
          className="h-9 rounded-pos border border-pos-border bg-pos-card px-2 text-xs text-pos-text"
        >
          <option value="KG">KG</option>
          <option value="G">G</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={simulator.simulateStable} className="pos-fs-label h-8 rounded-full border border-pos-border bg-pos-card px-2.5 text-pos-text hover:border-pos-primary">
          مستقر
        </button>
        <button type="button" onClick={simulator.simulateUnstable} className="pos-fs-label h-8 rounded-full border border-pos-border bg-pos-card px-2.5 text-pos-text hover:border-pos-primary">
          غير مستقر
        </button>
        <button type="button" onClick={simulator.simulateStale} className="pos-fs-label h-8 rounded-full border border-pos-border bg-pos-card px-2.5 text-pos-text hover:border-pos-primary">
          قديم
        </button>
        <button type="button" onClick={simulator.simulateMalformed} className="pos-fs-label h-8 rounded-full border border-pos-border bg-pos-card px-2.5 text-pos-text hover:border-pos-primary">
          غير صالح
        </button>
        <button type="button" onClick={simulator.simulateDisconnected} className="pos-fs-label h-8 rounded-full border border-pos-border bg-pos-card px-2.5 text-pos-text hover:border-pos-primary">
          غير متصل
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="pos-fs-label text-pos-text">{statusLabel}</span>
        <button
          type="button"
          disabled={!canApply}
          onClick={() => onApply(convertedValue)}
          className="pos-fs-label h-9 shrink-0 rounded-pos bg-pos-primary-strong px-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          استخدام هذه القراءة
        </button>
      </div>
    </div>
  );
}
