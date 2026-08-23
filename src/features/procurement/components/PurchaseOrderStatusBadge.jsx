import { useI18n } from "../../../i18n/I18nContext";
import {
  PURCHASE_ORDER_STATUS_BADGE_CLASSES,
  PURCHASE_ORDER_STATUS_LABEL_KEYS,
} from "../utils/procurementFormatters";

export function PurchaseOrderStatusBadge({ status }) {
  const { t } = useI18n();
  if (!status) return null;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${PURCHASE_ORDER_STATUS_BADGE_CLASSES[status]}`}
    >
      {t(PURCHASE_ORDER_STATUS_LABEL_KEYS[status])}
    </span>
  );
}
