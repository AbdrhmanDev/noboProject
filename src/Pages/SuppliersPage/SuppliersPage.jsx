import { UserPlus, Search } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { useI18n } from "../../i18n/I18nContext";
import { ROUTES } from "../../utils/routes";

const stats = [
  { labelKey: "sup.totalSuppliers", value: "24", color: "#2b8cff" },
  { labelKey: "sup.activeSuppliers", value: "18", color: "#f5b800" },
  { labelKey: "sup.supplierDues", value: "12,400 ر.س", color: "#ff3d6b" },
  { labelKey: "sup.itemsReceived", value: "1,240", color: "#17d9c4" },
];

const suppliers = [
  { name: "شركة التقنية المتكاملة", contact: "أحمد الحربي", phone: "0501112233", balance: "4,500", rating: "ممتاز", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=10" },
  { name: "مجموعة الخليج", contact: "محمد الغامدي", phone: "0552223344", balance: "2,300", rating: "جيد", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=11" },
  { name: "مؤسسة الريادة", contact: "خالد العتيبي", phone: "0543334455", balance: "0", rating: "ممتاز", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=12" },
  { name: "شركة النور التجارية", contact: "سعد القحطاني", phone: "0534445566", balance: "5,600", rating: "متوسط", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=13" },
  { name: "مصنع البلاد", contact: "فهد المطيري", phone: "0565556677", balance: "1,200", rating: "جيد", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=14" },
];

export default function SuppliersPage({ onLogout }) {
  const { t } = useI18n();
  return (
    <AppLayout onLogout={onLogout} activePath={ROUTES.SUPPLIERS}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-black brand-text">{t("sup.title")}</h1>
        <button className="primary-btn rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"><UserPlus size={13} /> {t("sup.addSupplier")}</button>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="stat-card rounded-2xl p-4">
            <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[11px] text-gray-400 mt-1">{t(s.labelKey)}</div>
          </div>
        ))}
      </div>

      {/* suppliers table */}
      <div className="panel rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-bold text-sm">{t("sup.supplierList")}</h3>
          <div className="flex-1" />
          <div className="flex items-center gap-2 input-dark rounded-xl px-3 py-2">
            <Search size={14} color="#60a5fa" />
            <input placeholder={t("sup.search")} className="bg-transparent outline-none text-xs text-white placeholder-gray-500" />
          </div>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 text-right">
              <th className="font-medium pb-2">{t("sup.supplier")}</th>
              <th className="font-medium pb-2">{t("sup.contact")}</th>
              <th className="font-medium pb-2">{t("sup.phone")}</th>
              <th className="font-medium pb-2">{t("sup.balance")}</th>
              <th className="font-medium pb-2">{t("sup.rating")}</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s, i) => (
              <tr key={i} className="border-t border-white/5">
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <img src={s.avatar} alt="" className="w-7 h-7 rounded-full bg-gray-700" />
                    <span className="text-gray-200 font-bold">{s.name}</span>
                  </div>
                </td>
                <td className="py-2.5 text-gray-300">{s.contact}</td>
                <td className="py-2.5 text-gray-300">{s.phone}</td>
                <td className={`py-2.5 font-bold ${parseInt(s.balance) > 0 ? "text-red-400" : "text-green-400"}`}>{s.balance} ر.س</td>
                <td className="py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    s.rating === "ممتاز" ? "bg-green-500/15 text-green-400" :
                    s.rating === "جيد" ? "bg-blue-500/15 text-blue-400" :
                    "bg-yellow-500/15 text-yellow-400"
                  }`}>{t(s.rating === "ممتاز" ? "sup.excellent" : s.rating === "جيد" ? "sup.good" : "sup.average")}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
