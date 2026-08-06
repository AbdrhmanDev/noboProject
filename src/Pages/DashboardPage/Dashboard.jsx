import {
  ChevronDown, Package, UserPlus, ArrowLeftRight,
  Receipt, FileText, ShoppingCart, ShoppingBag, Boxes, Contact,
  BarChart3, Briefcase,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";
import AppLayout from "../../components/AppLayout";
import { ROUTES } from "../../utils/routes";

/* ---------------------------------- data ---------------------------------- */

const salesTrend = [
  { day: "19 مايو", sales: 62000, profit: 30000 },
  { day: "20 مايو", sales: 71000, profit: 34000 },
  { day: "21 مايو", sales: 68000, profit: 33000 },
  { day: "22 مايو", sales: 89000, profit: 41000 },
  { day: "23 مايو", sales: 97000, profit: 46000 },
  { day: "24 مايو", sales: 112000, profit: 52000 },
  { day: "25 مايو", sales: 125430, profit: 58000 },
];

const channelData = [
  { name: "نقطة البيع", value: 45, color: "#ff3d6b" },
  { name: "المتجر الإلكتروني", value: 35, color: "#2b8cff" },
  { name: "طلبات الشركات", value: 20, color: "#f5b800" },
];

const branches = [
  { name: "الرياض", value: "45,430", dot: "#2b8cff" },
  { name: "جدة", value: "32,250", dot: "#ff3d6b" },
  { name: "الدمام", value: "18,760", dot: "#f5b800" },
  { name: "مكة", value: "12,340", dot: "#17d9c4" },
  { name: "المدينة", value: "8,650", dot: "#8b5cf6" },
];

const topProducts = [
  { name: "جهاز POS متكامل", qty: 25, sales: 1250 },
  { name: "طابعة إيصالات حرارية", qty: 42, sales: 980 },
  { name: "قارئ باركود لاسلكي", qty: 37, sales: 750 },
  { name: "شاشة لمس 15 بوصة", qty: 18, sales: 640 },
  { name: "درج كاشير", qty: 30, sales: 520 },
];

const dailyTasks = [
  { time: "10:30 ص", color: "#ff3d6b", text: "مراجعة طلبية #1258 مؤسسة السليم" },
  { time: "12:00 م", color: "#f5b800", text: "تسليم طلبية الموردين عدد الفواتير: 12" },
  { time: "02:00 م", color: "#2b8cff", text: "إجتماع فريق المبيعات قاعة الإجتماعات" },
];

const upcomingTasks = [
  { time: "09:00 ص", text: "مراجعة تقرير المبيعات" },
  { time: "11:00 ص", text: "إجتماع مع الموردين" },
  { time: "02:00 م", text: "متابعة طلبية العملاء" },
  { time: "10:30 ص", text: "متابعة شحنة #1259" },
  { time: "01:00 م", text: "تجديد عقد إيجار المكتب" },
];

const recentActivity = [
  { time: "منذ 10 دقائق", tag: "#INV-2025-1054", text: "فاتورة بيع" },
  { time: "منذ 45 دقيقة", tag: "#PO-2025-1234", text: "شراء" },
  { time: "تم اليوم", tag: "", text: "استلام منتجات إستلام 15 صنف" },
  { time: "منذ 30 دقيقة", tag: "#ST-2025-0123", text: "تحويل مخزون" },
  { time: "09:15 ص", tag: "#PR-2025-0891", text: "فاتورة شراء" },
];

const financials = [
  { label: "إجمالي الإيرادات", value: "125,430", color: "#2b8cff" },
  { label: "إجمالي المصروفات", value: "96,890", color: "#ff3d6b" },
  { label: "صافي الربح", value: "28,540", color: "#17d9c4" },
  { label: "الدين المستحق", value: "18,760", color: "#f5b800" },
];

/* ------------------------------ dashboard page ------------------------------ */

function StatCard({ label, value, delta, color, icon: Icon }) {
  return (
    <div className="stat-card rounded-2xl p-4 flex-1 min-w-[160px]">
      <div className="flex items-center justify-between mb-2">
        <div className="rounded-xl p-2" style={{ background: `${color}22` }}>
          <Icon size={18} color={color} />
        </div>
        <span className="text-[11px] font-bold" style={{ color: "#34d399" }}>{delta}</span>
      </div>
      <div className="text-lg font-black text-white">{value}</div>
      <div className="text-[11px] text-gray-400 mt-1">{label}</div>
    </div>
  );
}

function QuickAction({ icon: Icon, label }) {
  return (
    <button className="panel rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-gray-200 whitespace-nowrap hover:border-blue-500/50">
      <Icon size={14} color="#60a5fa" />
      {label}
    </button>
  );
}

export default function Dashboard({ onLogout }) {
  return (
    <AppLayout onLogout={onLogout} activePath={ROUTES.DASHBOARD}>
      {/* quick actions */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 mb-6">
        <QuickAction icon={Receipt} label="فاتورة بيع +" />
        <QuickAction icon={FileText} label="فاتورة شراء +" />
        <QuickAction icon={Package} label="إضافة منتج" />
        <QuickAction icon={UserPlus} label="عميل جديد" />
        <QuickAction icon={BarChart3} label="تقرير المبيعات" />
        <QuickAction icon={ArrowLeftRight} label="تحويل مخزون" />
        <QuickAction icon={Receipt} label="مصروف جديد" />
        <QuickAction icon={UserPlus} label="إضافة مستخدم" />
      </div>

      {/* stat cards */}
      <div className="flex flex-wrap gap-3 mb-6">
        <StatCard label="إجمالي الأرباح" value="28,540 ر.س" delta="+8.3%" color="#f5b800" icon={Briefcase} />
        <StatCard label="إجمالي المبيعات" value="125,430 ر.س" delta="+12.5%" color="#2b8cff" icon={ShoppingBag} />
        <StatCard label="إجمالي الطلبات" value="320 طلب" delta="+15.7%" color="#ff3d6b" icon={ShoppingCart} />
        <StatCard label="إجمالي المخزون" value="2,540 صنف" delta="+6.2%" color="#8b5cf6" icon={Boxes} />
        <StatCard label="إجمالي العملاء" value="8,920 عميل" delta="+7.1%" color="#34d399" icon={Contact} />
      </div>

      {/* charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr_1fr] gap-4 mb-6">
        <div className="panel rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm">نظرة عامة على المبيعات</h3>
            <span className="text-[11px] text-gray-400 flex items-center gap-1">آخر 7 أيام <ChevronDown size={12} /></span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salesTrend}>
              <defs>
                <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2b8cff" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#2b8cff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f5b800" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#f5b800" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#6b7280" fontSize={10} />
              <YAxis stroke="#6b7280" fontSize={10} />
              <Tooltip contentStyle={{ background: "#0b1020", border: "1px solid #2b3a5c", fontSize: 12 }} />
              <Area type="monotone" dataKey="sales" stroke="#2b8cff" fill="url(#sales)" strokeWidth={2} name="المبيعات" />
              <Area type="monotone" dataKey="profit" stroke="#f5b800" fill="url(#profit)" strokeWidth={2} name="الأرباح" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="panel rounded-2xl p-4">
          <h3 className="font-bold text-sm mb-2">توزيع المبيعات حسب القنوات</h3>
          <div className="relative">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={channelData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2}>
                  {channelData.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-black">125,430</span>
              <span className="text-[10px] text-gray-400">ريال سعودي</span>
            </div>
          </div>
          <div className="space-y-1.5 mt-2">
            {channelData.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-[11px] text-gray-300">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: c.color }} />{c.name}</span>
                <span>{c.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel rounded-2xl p-4">
          <h3 className="font-bold text-sm mb-3">أداء الفروع</h3>
          <div className="space-y-3">
            {branches.map((b, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-gray-300">
                  <span className="w-2 h-2 rounded-full" style={{ background: b.dot }} />
                  {b.name}
                </span>
                <span className="font-bold text-gray-100">{b.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* products table */}
      <div className="panel rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">أفضل المنتجات مبيعاً</h3>
          <span className="text-[11px] text-blue-400">عرض الكل</span>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 text-right">
              <th className="font-medium pb-2">المنتج</th>
              <th className="font-medium pb-2">الكمية</th>
              <th className="font-medium pb-2">المبيعات</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((p, i) => (
              <tr key={i} className="border-t border-white/5">
                <td className="py-2 text-gray-200">{p.name}</td>
                <td className="py-2 text-gray-300">{p.qty}</td>
                <td className="py-2 text-gray-300">{p.sales}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* bottom widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="panel rounded-2xl p-4">
          <h3 className="font-bold text-sm mb-3">المهام اليومية</h3>
          <div className="space-y-3">
            {dailyTasks.map((t, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="font-bold shrink-0" style={{ color: t.color }}>{t.time}</span>
                <span className="text-gray-300">{t.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel rounded-2xl p-4">
          <h3 className="font-bold text-sm mb-3">المهام القادمة</h3>
          <div className="space-y-3">
            {upcomingTasks.map((t, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="font-bold text-blue-400 shrink-0">{t.time}</span>
                <span className="text-gray-300">{t.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel rounded-2xl p-4">
          <h3 className="font-bold text-sm mb-3">النشاط الأخير</h3>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="text-xs">
                <div className="text-gray-300">{a.tag && <span className="text-blue-400">{a.tag} </span>}{a.text}</div>
                <div className="text-[10px] text-gray-500">{a.time}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel rounded-2xl p-4">
          <h3 className="font-bold text-sm mb-3">الملخص المالي</h3>
          <div className="space-y-3">
            {financials.map((f, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-gray-300">{f.label}</span>
                <span className="font-bold" style={{ color: f.color }}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

