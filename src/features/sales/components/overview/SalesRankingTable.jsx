import { useI18n } from "../../../../i18n/I18nContext";
import { formatMoney } from "../../../../shared/utils/formatters";

// Odoo-style "Top N" table: name / count / amount, with a faint bar behind each name sized to its
// share of the top row's amount, so the ranking reads at a glance. Scrolls inside its own card.
export function SalesRankingTable({ rows, currencyCode, nameHeader, countHeader, limit = 10 }) {
  const { t } = useI18n();
  const visible = rows.slice(0, limit);
  const top = Math.max(...visible.map((row) => row.amount), 0);

  if (!visible.length) {
    return <p className="py-6 text-center text-xs text-subtle">{t("salesOrders.overview.rankings.empty")}</p>;
  }

  return (
    <div className="max-h-80 overflow-y-auto pe-1 scrollbar-none">
      <table className="w-full table-fixed text-sm">
        <thead className="sticky top-0 bg-surface">
          <tr className="border-b border-line text-start text-xs font-bold text-muted">
            <th className="py-2 text-start font-bold">{nameHeader}</th>
            <th className="w-16 py-2 text-end font-bold">{countHeader}</th>
            <th className="w-32 py-2 text-end font-bold">{t("salesOrders.overview.rankings.amount")}</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => {
            const share = top > 0 ? Math.max(0, (row.amount / top) * 100) : 0;
            return (
              <tr key={row.key} className="border-b border-line last:border-0">
                <td className="py-1.5 pe-2">
                  <div className="relative min-w-0">
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 start-0 rounded bg-accent-soft"
                      style={{ width: `${share}%` }}
                    />
                    <span className="relative block truncate px-1.5 py-0.5 text-ink" title={row.label}>
                      {row.label}
                    </span>
                  </div>
                </td>
                <td className="pos-num py-1.5 text-end text-muted">{row.quantity.toLocaleString("en-US")}</td>
                <td className="pos-num py-1.5 text-end font-bold text-ink">
                  {currencyCode ? formatMoney(row.amount, currencyCode, 2) : row.amount.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
