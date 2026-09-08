import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Settings2 } from "lucide-react";

type AdvancedSettingsDisclosureProps = {
  label: string;
  children: ReactNode;
};

// Shared collapsed-by-default technical-details wrapper for the printer profile
// panels (Receipt/Label). Purely structural — no domain wording baked in, so
// each panel keeps its own terminology per device type.
export function AdvancedSettingsDisclosure({ label, children }: AdvancedSettingsDisclosureProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-[11px] font-bold text-slate-300 transition hover:text-white"
      >
        <span className="flex items-center gap-1.5">
          <Settings2 size={13} className="text-slate-500" />
          {label}
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="space-y-3 border-t border-white/10 p-3">{children}</div>}
    </div>
  );
}
