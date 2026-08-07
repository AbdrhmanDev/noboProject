import { Plus, Download, BarChart3, PieChartIcon, TrendingUp, FileText } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { useI18n } from "../../i18n/I18nContext";
import { ROUTES } from "../../utils/routes";

const reports = [
  { titleKey: "rep.dailySales", descKey: "rep.dailySalesDesc", icon: BarChart3, color: "#2b8cff" },
  { titleKey: "rep.profitLoss", descKey: "rep.profitLossDesc", icon: TrendingUp, color: "#f5b800" },
  { titleKey: "rep.inventory", descKey: "rep.inventoryDesc", icon: PieChartIcon, color: "#8b5cf6" },
  { titleKey: "rep.customers", descKey: "rep.customersDesc", icon: FileText, color: "#17d9c4" },
  { titleKey: "rep.channels", descKey: "rep.channelsDesc", icon: BarChart3, color: "#ff3d6b" },
  { titleKey: "rep.opExpenses", descKey: "rep.opExpensesDesc", icon: PieChartIcon, color: "#f5b800" },
];

export default function ReportsPage({ onLogout }) {
  const { t } = useI18n();
  return (
    <AppLayout onLogout={onLogout} activePath={ROUTES.REPORTS}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-black brand-text">{t("rep.title")}</h1>
        <div className="flex gap-2">
          <button className="panel rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"><Download size={13} /> {t("rep.export")}</button>
          <button className="primary-btn rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"><Plus size={13} /> {t("rep.customReport")}</button>
        </div>
      </div>

      {/* report cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reports.map((r, i) => (
          <div key={i} className="panel rounded-2xl p-4 cursor-pointer hover:border-blue-500/50">
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-xl p-2" style={{ background: `${r.color}22` }}>
                <r.icon size={18} color={r.color} />
              </div>
              <span className="text-[10px] text-gray-500">{t("rep.updatedToday")}</span>
            </div>
            <div className="font-bold text-white text-sm">{t(r.titleKey)}</div>
            <div className="text-[11px] text-gray-400 mt-1">{t(r.descKey)}</div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
