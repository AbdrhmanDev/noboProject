import { AlertTriangle } from "lucide-react";
import { useI18n } from "../../../../i18n/I18nContext";
import { PosModal } from "../PosModal";

// Scale Label Barcodes Phase 1: the same printed label scanned again on the same order. A label
// carries no unique id, so this cannot be prevented outright (two packs may genuinely share an
// identical label) -- the cashier is warned and must confirm before it is added a second time.
export function ScaleLabelDuplicateDialog({ barcode, onConfirm, onCancel }) {
  const { t } = useI18n();

  return (
    <PosModal title={t("pos.scaleLabel.duplicate.title")} onClose={onCancel}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-pos border border-pos-warning-text/40 bg-pos-warning-tint p-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-pos-warning-text" />
          <p className="text-sm leading-5 text-pos-warning-text">
            {t("pos.scaleLabel.duplicate.message", { barcode })}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            autoFocus
            className="flex h-11 flex-1 items-center justify-center rounded-pos border border-pos-border bg-pos-card text-sm font-bold text-pos-text"
          >
            {t("pos.scaleLabel.duplicate.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex h-11 flex-1 items-center justify-center rounded-pos bg-pos-primary-strong text-sm font-bold text-white"
          >
            {t("pos.scaleLabel.duplicate.confirm")}
          </button>
        </div>
      </div>
    </PosModal>
  );
}
