import { X } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";

// Generic feature-scoped dialog shell -- same visual language as RestaurantModal/InventoryModal
// (deliberately NOT the POS-owned PosModal, which is wired into POS's own shortcut-scope
// registry that this feature has no business touching). Theme-aware via the existing global
// `.panel`-family tokens so it matches whatever theme (light/dark) and direction (RTL/LTR) the
// rest of the app is already in -- nothing new to set up here.
export function CustomerComplianceProfileModal({ title, children, onClose }) {
  const { dir } = useI18n();

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="panel flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl p-5 shadow-2xl"
      >
        <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
          <h2 className="text-sm font-black">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-current"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto pe-1 scrollbar-none">{children}</div>
      </div>
    </div>
  );
}
