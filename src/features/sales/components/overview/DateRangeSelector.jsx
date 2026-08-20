import { useState } from "react";
import { useI18n } from "../../../../i18n/I18nContext";
import { customDateRange, presetDateRange } from "../../utils/dateRangePresets";

const PRESETS = [
  { id: "today", labelKey: "salesOrders.overview.dateRange.today" },
  { id: "yesterday", labelKey: "salesOrders.overview.dateRange.yesterday" },
  { id: "last7", labelKey: "salesOrders.overview.dateRange.last7" },
  { id: "last30", labelKey: "salesOrders.overview.dateRange.last30" },
  { id: "custom", labelKey: "salesOrders.overview.dateRange.custom" },
];

// Emits a { fromUtc, toUtc } half-open range on every change — the caller
// never sees or reconstructs date-picker state, only the resolved UTC bounds.
export function DateRangeSelector({ preset, onPresetChange, onRangeChange }) {
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
            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
              preset === option.id
                ? "border-blue-400/70 bg-blue-500/15 text-blue-100"
                : "border-white/10 bg-black/10 text-slate-400 hover:bg-white/10"
            }`}
          >
            {t(option.labelKey)}
          </button>
        ))}
      </div>
      {preset === "custom" && (
        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-1 text-[11px] text-slate-400">
            {t("salesOrders.overview.dateRange.from")}
            <input
              type="date"
              value={customFrom}
              onChange={(event) => applyCustom(event.target.value, customTo)}
              className="h-8 rounded-lg border border-white/10 bg-black/20 px-2 text-[11px] text-white outline-none"
            />
          </label>
          <label className="flex items-center gap-1 text-[11px] text-slate-400">
            {t("salesOrders.overview.dateRange.to")}
            <input
              type="date"
              value={customTo}
              onChange={(event) => applyCustom(customFrom, event.target.value)}
              className="h-8 rounded-lg border border-white/10 bg-black/20 px-2 text-[11px] text-white outline-none"
            />
          </label>
        </div>
      )}
    </div>
  );
}
