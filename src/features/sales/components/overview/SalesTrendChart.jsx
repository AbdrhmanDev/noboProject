import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { useI18n } from "../../../../i18n/I18nContext";
import { EmptyState } from "../../../../shared/components/ui";
import { formatMoney } from "../../../../shared/utils/formatters";

function formatTick(value) {
  try {
    return format(parseISO(value), "MMM d");
  } catch {
    return value;
  }
}

function TrendTooltip({ active, payload, label, t, currencyCode }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-white/10 bg-[#0c1424] px-3 py-2 text-[11px] shadow-xl">
      <div className="font-bold text-slate-200">{formatTick(label)}</div>
      <div className="mt-1 text-slate-300">
        {currencyCode ? formatMoney(point.salesAmount, currencyCode, 2) : point.salesAmount}
      </div>
      <div className="text-slate-500">
        {t("salesOrders.overview.trend.orderCount")}: {point.orderCount}
      </div>
    </div>
  );
}

// X = date, Y = salesAmount, orderCount surfaces via tooltip only — no
// interpolation or client-side regrouping, the backend's own point order is
// rendered verbatim (never reversed for RTL).
export function SalesTrendChart({ trend, currencyCode }) {
  const { t } = useI18n();

  if (!trend.length) {
    return <EmptyState title={t("salesOrders.overview.trend.empty")} />;
  }

  return (
    <div className="h-64 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="salesTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatTick}
            stroke="#64748b"
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip content={<TrendTooltip t={t} currencyCode={currencyCode} />} />
          <Area
            type="monotone"
            dataKey="salesAmount"
            stroke="#60a5fa"
            strokeWidth={2}
            fill="url(#salesTrendFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
