import { useI18n } from "../../../i18n/I18nContext";
import { StatusBadge } from "../../../shared/components/ui";
import { statusTone } from "../utils/salesOrderFormatters";

const STATUS_LABEL_KEYS = {
  Draft: "salesOrders.status.draft",
  Confirmed: "salesOrders.status.confirmed",
  Closed: "salesOrders.status.closed",
  Cancelled: "salesOrders.status.cancelled",
};

export function SalesOrderStatusBadge({ status }) {
  const { t } = useI18n();
  if (!status) return null;

  return (
    <StatusBadge tone={statusTone(status)}>
      {t(STATUS_LABEL_KEYS[status] || status)}
    </StatusBadge>
  );
}
