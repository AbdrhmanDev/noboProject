import { Plus, Wallet, TrendingUp, TrendingDown, Landmark } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { useI18n } from "../../i18n/I18nContext";
import { ROUTES } from "../../utils/routes";

const financials = [
  { labelKey: "acc.totalRevenue", value: "125,430", color: "#2b8cff", icon: TrendingUp },
  { labelKey: "acc.totalExpenses", value: "96,890", color: "#ff3d6b", icon: TrendingDown },
  { labelKey: "acc.netProfit", value: "28,540", color: "#17d9c4", icon: Wallet },
  { labelKey: "acc.bankBalance", value: "486,200", color: "#f5b800", icon: Landmark },
];

const transactions = [
  { date: "25 مايو", desc: "فاتورة بيع #1054", amount: "4,850", type: "دخل" },
  { date: "25 مايو", desc: "فاتورة شراء #1234", amount: "12,400", type: "مصروف" },
  { date: "24 مايو", desc: "سداد مورد #1230", amount: "8,750", type: "مصروف" },
  { date: "24 مايو", desc: "فاتورة بيع #1053", amount: "2,300", type: "دخل" },
  { date: "23 مايو", desc: "مصروفات تشغيلية", amount: "3,200", type: "مصروف" },
];

export default function AccountingPage({ onLogout }) {
  const { t } = useI18n();
  return (
    <AppLayout onLogout={onLogout} activePath={ROUTES.ACCOUNTING}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-black brand-text">{t("acc.title")}</h1>
        <button className="primary-btn rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"><Plus size={13} /> {t("acc.newEntry")}</button>
      </div>

      {/* summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {financials.map((f, i) => (
          <div key={i} className="stat-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <f.icon size={18} color={f.color} />
            </div>
            <div className="text-lg font-black text-white">{f.value} <span className="text-[10px] text-gray-400">ر.س</span></div>
            <div className="text-[11px] text-gray-400 mt-1">{t(f.labelKey)}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">
        {/* transactions */}
        <div className="panel rounded-2xl p-4">
          <h3 className="font-bold text-sm mb-3">{t("acc.recentActivity")}</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 text-right">
                <th className="font-medium pb-2">{t("acc.date")}</th>
                <th className="font-medium pb-2">{t("acc.desc")}</th>
                <th className="font-medium pb-2">{t("acc.amount")}</th>
                <th className="font-medium pb-2">{t("acc.type")}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="py-2.5 text-gray-400">{tx.date}</td>
                  <td className="py-2.5 text-gray-200">{tx.desc}</td>
                  <td className={`py-2.5 font-bold ${tx.type === "دخل" ? "text-green-400" : "text-red-400"}`}>
                    {tx.type === "دخل" ? "+" : "-"}{tx.amount}
                  </td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      tx.type === "دخل" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                    }`}>{t(tx.type === "دخل" ? "acc.income" : "acc.expense")}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* summary widget */}
        <div className="panel rounded-2xl p-4">
          <h3 className="font-bold text-sm mb-3">{t("acc.accountsSummary")}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300">{t("acc.assets")}</span>
              <span className="font-bold text-blue-400">648,300 ر.س</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300">{t("acc.liabilities")}</span>
              <span className="font-bold text-red-400">112,460 ر.س</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300">{t("acc.equity")}</span>
              <span className="font-bold text-green-400">535,840 ر.س</span>
            </div>
            <div className="border-t border-white/10 pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">{t("acc.liquidity")}</span>
                <span className="font-bold text-yellow-400">2.4</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
