import { useMemo } from "react";
import { Cell, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, CircleDollarSign, FileClock, PackageX } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { EmptyState, LoadingState } from "../../../shared/components/ui";
import { formatMoney } from "../../../shared/utils/formatters";
import { percentChange } from "../../sales/utils/salesRankings";
import { orderNumberDisplay } from "../../sales/utils/salesOrderFormatters";
import "../dashboard.css";

// Chart colours: the theme's own accent / success / warning / danger hues (mid tones that read on
// both the light and dark canvas) plus a slate for "the rest". Recharts needs literal colours.
const CHART_COLORS = ["#3b82f6", "#34d399", "#fbbf24", "#fb7185", "#94a3b8"];
const PREVIOUS_COLOR = "#94a3b8";
const GRID = "#94a3b833";
const AXIS = "#64748b";

const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

// Icon tile tones (existing semantic tokens).
const TILE_TONE = {
  info: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function DashboardCard({ title, action, children, className = "" }) {
  return (
    <section className={`min-w-0 rounded-2xl bg-blue p-4 shadow-[var(--shadow-surface)] ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="dash-display truncate text-xl font-extrabold text-ink">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

// KPI tile: icon chip, label, big value, and the change vs the previous period of the same length.
// Up is shown green and down red (flipped with `upIsGood={false}`, e.g. outstanding amounts); with
// no previous figure only "—" shows.
export function KpiTile({ icon: Icon, tone = "info", label, value, current, previous, upIsGood = true }) {
  const { t } = useI18n();
  const change = percentChange(current, previous);
  const up = change !== null && change >= 0;
  const DeltaIcon = up ? ArrowUp : ArrowDown;

  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl bg-blue p-4 shadow-[var(--shadow-surface)]">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${TILE_TONE[tone]}`}>
        <Icon size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-lg font-semibold text-muted">{label}</div>
        <div className="dash-display pos-num truncate text-2xl font-black text-ink">{value}</div>
        <div className="mt-0.5 flex items-center gap-1 text-[11px]">
          {change === null ? (
            <span className="text-subtle">—</span>
          ) : (
            <span className={`flex items-center gap-0.5 font-bold ${up === upIsGood ? "text-success" : "text-danger"}`}>
              <DeltaIcon size={12} />
              <span className="pos-num">{Math.abs(change).toFixed(1)}%</span>
            </span>
          )}
          <span className="truncate text-subtle">{t("salesOrders.overview.kpi.sincePrevious")}</span>
        </div>
      </div>
    </div>
  );
}

function tick(value) {
  try {
    return format(parseISO(value), "MMM d");
  } catch {
    return value;
  }
}

// Sales per day for the period (solid) against the previous period of the same length (dashed),
// matched day-by-day by position. Points are the backend's own daily trend, never re-bucketed.
export function TrendCompareChart({ trend, previousTrend, currencyCode }) {
  const { t } = useI18n();
  const data = useMemo(
    () =>
      trend.map((point, index) => ({
        date: point.date,
        current: Number(point.salesAmount) || 0,
        previous: previousTrend?.[index] ? Number(previousTrend[index].salesAmount) || 0 : null,
      })),
    [trend, previousTrend],
  );

  if (!trend.length) return <EmptyState title={t("salesOrders.overview.trend.empty")} />;

  const money = (value) => (currencyCode ? formatMoney(value, currencyCode, 2) : value);

  return (
    <div>
      <div className="mb-2 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[0] }} />
          {t("dash.currentPeriod")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: PREVIOUS_COLOR }} />
          {t("dash.previousPeriod")}
        </span>
      </div>
      <div className="h-64 w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis dataKey="date" tickFormatter={tick} stroke={AXIS} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(value) => compactNumber.format(value)}
              stroke={AXIS}
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="rounded-lg bg-surface px-3 py-2 text-[11px] shadow-xl">
                    <div className="font-bold text-ink">{tick(label)}</div>
                    <div className="mt-1" style={{ color: CHART_COLORS[0] }}>
                      {t("dash.currentPeriod")}: {money(payload[0].payload.current)}
                    </div>
                    {payload[0].payload.previous !== null && (
                      <div className="text-subtle">
                        {t("dash.previousPeriod")}: {money(payload[0].payload.previous)}
                      </div>
                    )}
                  </div>
                ) : null
              }
            />
            <Line type="monotone" dataKey="previous" stroke={PREVIOUS_COLOR} strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls />
            <Line type="monotone" dataKey="current" stroke={CHART_COLORS[0]} strokeWidth={2.5} dot={{ r: 3, fill: CHART_COLORS[0] }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Donut of sales by category: the top four, the rest folded into one "other" slice, the period
// total in the middle, and a legend with each slice's share.
export function CategoryDonut({ rows, currencyCode }) {
  const { t } = useI18n();
  const slices = useMemo(() => {
    const sorted = [...(rows ?? [])].filter((row) => row.amount > 0).sort((a, b) => b.amount - a.amount);
    const top = sorted.slice(0, 4).map((row) => ({ name: row.label, value: row.amount }));
    const rest = sorted.slice(4).reduce((sum, row) => sum + row.amount, 0);
    if (rest > 0) top.push({ name: t("dash.otherCategories"), value: rest });
    return top;
  }, [rows, t]);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  if (!slices.length) return <p className="py-10 text-center text-sm text-subtle">{t("salesOrders.overview.rankings.empty")}</p>;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col xl:flex-row">
      <div className="relative h-44 w-44 shrink-0" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="100%" paddingAngle={2} stroke="none">
              {slices.map((slice, index) => (
                <Cell key={slice.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="dash-display pos-num text-xl font-black text-ink">{compactNumber.format(total)}</div>
            <div className="text-[10px] text-subtle">{currencyCode || t("dash.total")}</div>
          </div>
        </div>
      </div>
      <ul className="w-full min-w-0 space-y-2">
        {slices.map((slice, index) => (
          <li key={slice.name} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
              <span className="truncate text-sm text-ink">{slice.name}</span>
            </span>
            <span className="pos-num shrink-0 text-sm font-semibold text-muted">{total ? Math.round((slice.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function relativeTime(iso, lang) {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  const steps = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [30, "day"],
    [12, "month"],
  ];
  let value = seconds;
  for (const [size, unit] of steps) {
    if (Math.abs(value) < size) return rtf.format(Math.round(value), unit);
    value /= size;
  }
  return rtf.format(Math.round(value), "year");
}

const STATUS_DOT = { Draft: "bg-subtle", Confirmed: "bg-accent", Closed: "bg-success", Cancelled: "bg-danger" };

// Latest orders: number, status dot, amount and how long ago (relative, in the UI language).
export function RecentOrders({ query, onOpenOrder }) {
  const { t, lang } = useI18n();
  const orders = query.data?.items ?? [];

  if (query.isLoading) return <LoadingState label={t("salesOrders.loading")} />;
  if (!orders.length) return <p className="py-8 text-center text-sm text-subtle">{t("salesOrders.empty.title")}</p>;

  return (
    <ul className="space-y-0.5">
      {orders.map((order) => (
        <li key={order.salesOrderId}>
          <button
            type="button"
            onClick={() => onOpenOrder(order.salesOrderId)}
            className="flex w-full items-center gap-3 rounded-lg px-1.5 py-2.5 text-start transition hover:bg-hover"
          >
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[order.status] ?? "bg-subtle"}`} title={order.status} />
            <span className="pos-num min-w-0 flex-1 truncate text-sm font-bold text-ink">
              {orderNumberDisplay(order.orderNumber, order.orderNumberFormatted)}
            </span>
            <span className="pos-num shrink-0 text-sm font-bold text-ink">
              {formatMoney(order.payableAmount, order.currencyCode, order.currencyMinorUnitDigits)}
            </span>
            <span className="w-24 shrink-0 truncate text-end text-xs text-subtle">
              {relativeTime(order.closedAtUtc || order.confirmedAtUtc || order.createdAtUtc, lang)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

const ALERT_TONE = {
  danger: { chip: "bg-danger-soft text-danger", Icon: PackageX },
  warning: { chip: "bg-warning-soft text-warning", Icon: CircleDollarSign },
  info: { chip: "bg-accent-soft text-accent", Icon: FileClock },
};

// Things that need a look, each a row linking to where it's handled. `alerts` =
// [{ key, tone, text, onOpen }]; an empty list shows an all-clear line.
export function AlertsPanel({ alerts }) {
  const { t } = useI18n();
  if (!alerts.length) {
    return (
      <p className="flex items-center justify-center gap-2 py-8 text-sm text-subtle">
        <CheckCircle2 size={15} className="text-success" />
        {t("dash.alert.none")}
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {alerts.map((alert) => {
        const tone = ALERT_TONE[alert.tone] ?? ALERT_TONE.info;
        return (
          <li key={alert.key}>
            <button
              type="button"
              onClick={alert.onOpen}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition hover:bg-hover"
            >
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tone.chip}`}>
                <tone.Icon size={16} />
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium text-ink">{alert.text}</span>
              <ArrowLeft size={14} className="shrink-0 text-subtle ltr:-scale-x-100" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
