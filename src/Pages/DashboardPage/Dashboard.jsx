import {
  ChevronDown, Receipt, ShoppingCart, Package, ArrowLeftRight, FileText,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import AppLayout from "../../components/AppLayout";
import { useI18n } from "../../i18n/I18nContext";
import { ROUTES } from "../../utils/routes";

/* ---------------------------------- data ---------------------------------- */

const salesTrend = [
  { day: "19 مايو", sales: 62000, profit: 30000, orders: 210 },
  { day: "20 مايو", sales: 71000, profit: 34000, orders: 235 },
  { day: "21 مايو", sales: 68000, profit: 33000, orders: 228 },
  { day: "22 مايو", sales: 89000, profit: 41000, orders: 262 },
  { day: "23 مايو", sales: 97000, profit: 46000, orders: 281 },
  { day: "24 مايو", sales: 112000, profit: 52000, orders: 299 },
  { day: "25 مايو", sales: 125430, profit: 58000, orders: 320 },
];

const channelData = [
  { nameKey: "dash.pos", value: 45, color: "#22c55e" },
  { nameKey: "dash.eshop", value: 35, color: "#3b82f6" },
  { nameKey: "dash.corporate", value: 20, color: "#f5b800" },
];

const recentActivity = [
  { time: "منذ 10 دقائق", tag: "#INV-2025-1054", text: "فاتورة بيع", icon: Receipt, color: "#2b8cff" },
  { time: "منذ 45 دقيقة", tag: "#PO-2025-1234", text: "شراء", icon: ShoppingCart, color: "#17d9c4" },
  { time: "تم اليوم", tag: "", text: "استلام منتجات إستلام 15 صنف", icon: Package, color: "#f5b800" },
  { time: "منذ 30 دقيقة", tag: "#ST-2025-0123", text: "تحويل مخزون", icon: ArrowLeftRight, color: "#8b5cf6" },
  { time: "09:15 ص", tag: "#PR-2025-0891", text: "فاتورة شراء", icon: FileText, color: "#ff3d6b" },
];

/* ------------------------------ dashboard page ------------------------------ */

function Sparkline({ dataKey, color }) {
  return (
    <ResponsiveContainer width="100%" height={48}>
      <LineChart data={salesTrend}>
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function StatCard({ label, value, delta, color, dataKey }) {
  return (
    <div className="stat-card rounded-2xl p-4 min-w-0">
      <div className="text-[12px] text-gray-400">{label}</div>
      <div className="mt-1 text-2xl font-black text-white">{value}</div>
      <div className="text-[11px] font-bold" style={{ color: "#34d399" }}>{delta}</div>
      <div className="mt-2">
        <Sparkline dataKey={dataKey} color={color} />
      </div>
    </div>
  );
}

export default function Dashboard({ onLogout }) {
  const { t } = useI18n();
  return (
    <AppLayout onLogout={onLogout} activePath={ROUTES.DASHBOARD}>
      {/* stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label={t("dash.totalSales")} value="125,430 ر.س" delta="+12.5%" color="#ff3d6b" dataKey="sales" />
        <StatCard label={t("dash.totalProfit")} value="28,540 ر.س" delta="+8.3%" color="#f5b800" dataKey="profit" />
        <StatCard label={t("dash.totalOrders")} value="320" delta="+15.7%" color="#2b8cff" dataKey="orders" />

        <div className="stat-card rounded-2xl p-4 min-w-0 flex items-center justify-between gap-2">
          <div>
            <div className="text-[12px] text-gray-400">{t("dash.growth")}</div>
            <div className="mt-1 text-2xl font-black text-white">+12.5%</div>
            <div className="mt-2 space-y-1">
              {channelData.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px] text-gray-300">
                  <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  {t(c.nameKey)} {c.value}%
                </div>
              ))}
            </div>
          </div>
          <div className="w-[96px] h-[96px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={channelData} dataKey="value" innerRadius={30} outerRadius={46} paddingAngle={2} stroke="none">
                  {channelData.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* overview + recent activity */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">
        <div className="panel rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm">{t("dash.salesOverview")}</h3>
            <span className="text-[11px] text-gray-400 flex items-center gap-1">{t("dash.last7Days")} <ChevronDown size={12} /></span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesTrend}>
              <defs>
                <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#6b7280" fontSize={10} />
              <YAxis stroke="#6b7280" fontSize={10} />
              <Tooltip contentStyle={{ background: "var(--nobo-surface)", border: "1px solid var(--nobo-line-strong)", color: "var(--nobo-text)", fontSize: 12 }} />
              <Area type="monotone" dataKey="sales" stroke="#22d3ee" fill="url(#sales)" strokeWidth={2} name={t("dash.sales")} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="panel rounded-2xl p-4">
          <h3 className="font-bold text-sm mb-4">{t("dash.recentActivity")}</h3>
          <div className="space-y-4">
            {recentActivity.map(({ icon: Icon, color, tag, text, time }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: `${color}26` }}>
                  <Icon size={18} color={color} />
                </div>
                <div className="min-w-0 flex-1 text-xs">
                  <div className="truncate font-semibold text-gray-100">
                    {tag && <span className="text-blue-400">{tag} </span>}
                    {text}
                  </div>
                </div>
                <div className="shrink-0 text-[10px] text-gray-500">{time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
