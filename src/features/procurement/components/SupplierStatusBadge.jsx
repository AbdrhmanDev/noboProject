import { useI18n } from "../../../i18n/I18nContext";
import { SUPPLIER_STATUS_BADGE_CLASSES, SUPPLIER_STATUS_LABEL_KEYS } from "../utils/procurementFormatters";

export function SupplierStatusBadge({ status }) {
  const { t } = useI18n();
  if (!status) return null;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${SUPPLIER_STATUS_BADGE_CLASSES[status]}`}
    >
      {t(SUPPLIER_STATUS_LABEL_KEYS[status])}
    </span>
  );
}
