import { History, PackageSearch } from "lucide-react";

const TABS = [
  ["stock", "Stock", PackageSearch],
  ["ledger", "Ledger", History],
];

export function InventoryOperationsHeader({ tab, setTab }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-[#0c1424] p-2">
      {TABS.map(([value, label, Icon]) => (
        <button
          key={value}
          type="button"
          onClick={() => setTab(value)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            tab === value ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/5"
          }`}
        >
          <Icon size={15} />
          {label}
        </button>
      ))}
    </div>
  );
}
