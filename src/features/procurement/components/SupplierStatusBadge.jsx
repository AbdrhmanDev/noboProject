import { useI18n } from "../../../i18n/I18nContext";
import { SUPPLIER_STATUS_BADGE_CLASSES, SUPPLIER_STATUS_LABEL_KEYS } from "../utils/procurementFormatters";

export function SupplierStatusBadge({ status }) {
  const { t } = useI18n();
  if (!status) return null;

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-bold ${SUPPLIER_STATUS_BADGE_CLASSES[status]}`}
    >
      {t(SUPPLIER_STATUS_LABEL_KEYS[status])}
    </span>
  );
}
