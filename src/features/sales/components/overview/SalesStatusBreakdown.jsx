import { useI18n } from "../../../../i18n/I18nContext";
import { SalesOrderStatusBadge } from "../SalesOrderStatusBadge";

// Operational counts across every status. Deliberately does not imply
// Draft/Cancelled contribute to the Sales Amount KPI — see the caption.
export function SalesStatusBreakdown({ breakdown }) {
  const { t } = useI18n();

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {breakdown.map((item) => (
          <div
            key={item.status}
            className="flex items-center gap-2 rounded-xl bg-raised px-3 py-2"
          >
            <SalesOrderStatusBadge status={item.status} />
            <span className="text-sm font-black text-ink">{item.orderCount}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-subtle">{t("salesOrders.overview.status.note")}</p>
    </div>
  );
}
