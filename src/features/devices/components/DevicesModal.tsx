import type { ReactNode } from "react";
import { X } from "lucide-react";

type DevicesModalProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
  size?: "md" | "lg" | "xl";
};

// Feature-owned dialog shell — mirrors ProcurementModal (each feature owns
// its own modal shell rather than sharing another feature's).
export function DevicesModal({ title, children, onClose, size = "md" }: DevicesModalProps) {
  const sizes = { md: "max-w-md", lg: "max-w-2xl", xl: "max-w-4xl" };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#030713]/75 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#10182a] p-5 shadow-2xl ${sizes[size]}`}
      >
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h2 className="font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto pr-1 scrollbar-none">{children}</div>
      </div>
    </div>
  );
}
