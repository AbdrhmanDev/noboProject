import { Plus, Filter, Download } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { useI18n } from "../../i18n/I18nContext";
import { ROUTES } from "../../utils/routes";

const stats = [
  { labelKey: "sales.invoicesCount", value: "320", color: "#2b8cff" },
  { labelKey: "sales.totalSales", value: "125,430 ر.س", color: "#f5b800" },
  { labelKey: "sales.returns", value: "12", color: "#ff3d6b" },
  { labelKey: "sales.avgInvoice", value: "392 ر.س", color: "#17d9c4" },
];

const invoices = [
  { no: "INV-2025-1054", date: "25 مايو 2025", customer: "مؤسسة السليم", amount: "4,850", status: "مدفوعة" },
  { no: "INV-2025-1053", date: "25 مايو 2025", customer: "شركة النور", amount: "2,300", status: "مدفوعة" },
  { no: "INV-2025-1052", date: "24 مايو 2025", customer: "محلات الشرق", amount: "1,540", status: "معلقة" },
  { no: "INV-2025-1051", date: "24 مايو 2025", customer: "مكتبة الفلاح", amount: "890", status: "مدفوعة" },
  { no: "INV-2025-1050", date: "23 مايو 2025", customer: "شركة الأمل", amount: "3,120", status: "ملغاة" },
];

export default function SalesPage({ onLogout }) {
  const { t } = useI18n();
  return (
    <AppLayout onLogout={onLogout} activePath={ROUTES.SALES}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-black brand-text">{t("sales.title")}</h1>
        <div className="flex gap-2">
          <button className="panel rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"><Filter size={13} /> {t("sales.filter")}</button>
          <button className="panel rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"><Download size={13} /> {t("sales.export")}</button>
          <button className="primary-btn rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"><Plus size={13} /> {t("sales.saleInvoice")}</button>
        </div>
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

      {/* invoices table */}
      <div className="panel rounded-2xl p-4">
        <h3 className="font-bold text-sm mb-3">{t("sales.saleInvoices")}</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 text-right">
              <th className="font-medium pb-2">{t("sales.number")}</th>
              <th className="font-medium pb-2">{t("sales.date")}</th>
              <th className="font-medium pb-2">{t("sales.customer")}</th>
              <th className="font-medium pb-2">{t("sales.amount")}</th>
              <th className="font-medium pb-2">{t("sales.status")}</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv, i) => (
              <tr key={i} className="border-t border-white/5">
                <td className="py-2.5 text-blue-400">{inv.no}</td>
                <td className="py-2.5 text-gray-300">{inv.date}</td>
                <td className="py-2.5 text-gray-200">{inv.customer}</td>
                <td className="py-2.5 text-gray-300">{inv.amount}</td>
                <td className="py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    inv.status === "مدفوعة" ? "bg-green-500/15 text-green-400" :
                    inv.status === "معلقة" ? "bg-yellow-500/15 text-yellow-400" :
                    "bg-red-500/15 text-red-400"
                  }`}>{inv.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
