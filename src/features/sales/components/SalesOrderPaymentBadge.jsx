import { useI18n } from "../../../i18n/I18nContext";
import { StatusBadge } from "../../../shared/components/ui";
import { formatMoney } from "../../../shared/utils/formatters";
import { derivePaymentStatus, PAYMENT_STATUS_TONE } from "../utils/salesOrderFormatters";

const PAYMENT_STATUS_LABEL_KEYS = {
  paid: "salesOrders.payment.paid",
  partiallyPaid: "salesOrders.payment.partiallyPaid",
  unpaid: "salesOrders.payment.unpaid",
};

// Only renders when the authoritative payment fields are actually present —
// never inferred from SalesOrder status.
export function SalesOrderPaymentBadge({
  isFullyPaid,
  netPaidAmount,
  remainingAmount,
  currencyCode,
  currencyMinorUnitDigits,
}) {
  const { t } = useI18n();
  const paymentStatus = derivePaymentStatus(isFullyPaid, netPaidAmount);
  if (!paymentStatus) return null;

  const showRemaining =
    paymentStatus === "partiallyPaid" &&
    remainingAmount !== undefined &&
    currencyCode !== undefined;

  return (
    <StatusBadge tone={PAYMENT_STATUS_TONE[paymentStatus]}>
      {t(PAYMENT_STATUS_LABEL_KEYS[paymentStatus])}
      {showRemaining
        ? ` · ${formatMoney(remainingAmount, currencyCode, currencyMinorUnitDigits ?? 2)}`
        : ""}
    </StatusBadge>
  );
}
