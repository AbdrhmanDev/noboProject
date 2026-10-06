import { useState } from "react";
import { Layers, SlidersHorizontal } from "lucide-react";
import { VariantConsumptionPanel } from "./VariantConsumptionPanel";
import { ModifierAdjustmentPanel } from "./ModifierAdjustmentPanel";

const SUB_TABS = [
  ["variants", "Variant Consumption", Layers],
  ["modifiers", "Modifier Adjustments", SlidersHorizontal],
];

export function ConsumptionRulesPanel({ companyId, canView, canConfigure }) {
  const [subTab, setSubTab] = useState("variants");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 rounded-xl border border-line bg-surface p-2">
        {SUB_TABS.map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            onClick={() => setSubTab(value)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
              subTab === value ? "bg-accent-soft text-accent" : "text-muted hover:bg-hover hover:text-ink"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {subTab === "variants" ? (
        <VariantConsumptionPanel companyId={companyId} canView={canView} canConfigure={canConfigure} />
      ) : (
        <ModifierAdjustmentPanel companyId={companyId} canView={canView} canConfigure={canConfigure} />
      )}
    </div>
  );
}
