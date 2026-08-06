import { UserPlus, Mail, Phone, Search } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { ROUTES } from "../../utils/routes";

const stats = [
  { label: "إجمالي العملاء", value: "8,920", color: "#2b8cff" },
  { label: "عملاء جدد (الشهر)", value: "124", color: "#f5b800" },
  { label: "عملاء نشطين", value: "3,210", color: "#17d9c4" },
  { label: "عملاء VIP", value: "86", color: "#8b5cf6" },
];

const customers = [
  { name: "مؤسسة السليم", email: "info@alsaleem.com", phone: "0501234567", total: "45,800", type: "VIP", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=1" },
  { name: "شركة النور", email: "sales@alnoor.com", phone: "0559876543", total: "32,100", type: "شركة", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=2" },
  { name: "محلات الشرق", email: "east@shop.com", phone: "0543219876", total: "18,450", type: "فردي", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=3" },
  { name: "مكتبة الفلاح", email: "alfalah@lib.com", phone: "0534567890", total: "9,230", type: "فردي", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=4" },
  { name: "شركة الأمل", email: "info@alamal.com", phone: "0567890123", total: "27,560", type: "شركة", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=5" },
];

export default function CustomersPage({ onLogout }) {
  return (
    <AppLayout onLogout={onLogout} activePath={ROUTES.CUSTOMERS}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-black brand-text">العملاء (CRM)</h1>
        <div className="flex gap-2">
          <button className="panel rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"><Mail size={13} /> حملة بريدية</button>
          <button className="primary-btn rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"><UserPlus size={13} /> عميل جديد</button>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="stat-card rounded-2xl p-4">
            <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[11px] text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* customers table */}
      <div className="panel rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-bold text-sm">قائمة العملاء</h3>
          <div className="flex-1" />
          <div className="flex items-center gap-2 input-dark rounded-xl px-3 py-2">
            <Search size={14} color="#60a5fa" />
            <input placeholder="بحث..." className="bg-transparent outline-none text-xs text-white placeholder-gray-500" />
          </div>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 text-right">
              <th className="font-medium pb-2">العميل</th>
              <th className="font-medium pb-2">البريد</th>
              <th className="font-medium pb-2">الهاتف</th>
              <th className="font-medium pb-2">إجمالي المشتريات</th>
              <th className="font-medium pb-2">النوع</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c, i) => (
              <tr key={i} className="border-t border-white/5">
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <img src={c.avatar} alt="" className="w-7 h-7 rounded-full bg-gray-700" />
                    <span className="text-gray-200 font-bold">{c.name}</span>
                  </div>
                </td>
                <td className="py-2.5 text-gray-400">{c.email}</td>
                <td className="py-2.5 text-gray-300 flex items-center gap-1"><Phone size={11} /> {c.phone}</td>
                <td className="py-2.5 text-gray-300">{c.total}</td>
                <td className="py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    c.type === "VIP" ? "bg-purple-500/15 text-purple-400" :
                    c.type === "شركة" ? "bg-blue-500/15 text-blue-400" :
                    "bg-green-500/15 text-green-400"
                  }`}>{c.type}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
