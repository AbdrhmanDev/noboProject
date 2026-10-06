import { useState } from "react";
import { useI18n } from "../../../i18n/I18nContext";
import { customDateRange, presetDateRange } from "../utils/dateRangePresets";

const PRESETS = [
  { id: "last7", labelKey: "platform.dateRange.last7" },
  { id: "last30", labelKey: "platform.dateRange.last30" },
  { id: "custom", labelKey: "platform.dateRange.custom" },
];

// Emits a { fromUtc, toUtc } half-open range on every change -- the caller never sees or
// reconstructs date-picker state, only the resolved UTC bounds (mirrors Sales Overview's
// DateRangeSelector, trimmed to the 3 presets the Platform Customer Control Center needs).
export function PlatformDateRangeSelector({ preset, onPresetChange, onRangeChange }) {
  const { t } = useI18n();
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const selectPreset = (id) => {
    onPresetChange(id);
    if (id !== "custom") {
      onRangeChange(presetDateRange(id));
    } else {
      onRangeChange(customDateRange(customFrom, customTo));
    }
  };

  const applyCustom = (from, to) => {
    setCustomFrom(from);
    setCustomTo(to);
    if (preset === "custom") {
      onRangeChange(customDateRange(from, to));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => selectPreset(option.id)}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
              preset === option.id
                ? "border-accent-line bg-accent-soft text-accent"
                : "border-line bg-canvas text-muted hover:bg-hover"
            }`}
          >
            {t(option.labelKey)}
          </button>
        ))}
      </div>
      {preset === "custom" && (
        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-1 text-xs text-muted">
            {t("platform.dateRange.from")}
            <input
              type="date"
              value={customFrom}
              onChange={(event) => applyCustom(event.target.value, customTo)}
              className="h-8 rounded-lg border border-line bg-canvas px-2 text-xs text-ink outline-none"
            />
          </label>
          <label className="flex items-center gap-1 text-xs text-muted">
            {t("platform.dateRange.to")}
            <input
              type="date"
              value={customTo}
              onChange={(event) => applyCustom(customFrom, event.target.value)}
              className="h-8 rounded-lg border border-line bg-canvas px-2 text-xs text-ink outline-none"
            />
          </label>
        </div>
      )}
    </div>
  );
}
