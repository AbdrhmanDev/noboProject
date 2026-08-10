import { useState } from "react";
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
  const [showExport, setShowExport] = useState(false);
  const [showCustomReport, setShowCustomReport] = useState(false);
  const [customReport, setCustomReport] = useState({ type: "dailySales", from: "", to: "", branch: "" });
  const [alert, setAlert] = useState("");

  const handleExport = () => {
    setAlert(t("rep.exportSuccess"));
    setTimeout(() => setAlert(""), 3000);
  };

  const handleCustomReport = () => {
    setAlert(t("rep.customReportCreated"));
    setShowCustomReport(false);
    setTimeout(() => setAlert(""), 3000);
  };

  return (
    <AppLayout onLogout={onLogout} activePath={ROUTES.REPORTS}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-black brand-text">{t("rep.title")}</h1>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowExport(true)} className="panel rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"><Download size={13} /> {t("rep.export")}</button>
          <button type="button" onClick={() => setShowCustomReport(true)} className="primary-btn rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"><Plus size={13} /> {t("rep.customReport")}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reports.map((r, i) => (
          <button key={i} type="button" onClick={() => setShowExport(true)} className="panel rounded-2xl p-4 text-left transition hover:border-blue-500/50">
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-xl p-2" style={{ background: `${r.color}22` }}>
                <r.icon size={18} color={r.color} />
              </div>
              <span className="text-[10px] text-gray-500">{t("rep.updatedToday")}</span>
            </div>
            <div className="font-bold text-white text-sm">{t(r.titleKey)}</div>
            <div className="text-[11px] text-gray-400 mt-1">{t(r.descKey)}</div>
          </button>
        ))}
      </div>

      {alert && <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{alert}</div>}

      {showExport && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1728] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{t("rep.exportReport")}</h2>
                <p className="text-xs text-slate-400">{t("rep.exportReportDesc")}</p>
              </div>
              <button type="button" onClick={() => setShowExport(false)} className="text-slate-400 hover:text-white">إغلاق</button>
            </div>
            <div className="grid gap-3">
              <button type="button" onClick={() => { handleExport(); setShowExport(false); }} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">{t("rep.downloadExcel")}</button>
              <button type="button" onClick={() => { handleExport(); setShowExport(false); }} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white">{t("rep.downloadPdf")}</button>
            </div>
          </div>
        </div>
      )}

      {showCustomReport && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1728] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{t("rep.customReport")}</h2>
                <p className="text-xs text-slate-400">{t("rep.customReportDesc")}</p>
              </div>
              <button type="button" onClick={() => setShowCustomReport(false)} className="text-slate-400 hover:text-white">إغلاق</button>
            </div>
            <div className="grid gap-3">
              <label className="text-xs text-slate-400">{t("rep.reportType")}</label>
              <select value={customReport.type} onChange={(e) => setCustomReport((prev) => ({ ...prev, type: e.target.value }))} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm outline-none">
                <option value="dailySales">{t("rep.dailySales")}</option>
                <option value="profitLoss">{t("rep.profitLoss")}</option>
                <option value="inventory">{t("rep.inventory")}</option>
                <option value="customers">{t("rep.customers")}</option>
              </select>
              <div className="grid gap-3 md:grid-cols-2">
                <input type="date" value={customReport.from} onChange={(e) => setCustomReport((prev) => ({ ...prev, from: e.target.value }))} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm outline-none" />
                <input type="date" value={customReport.to} onChange={(e) => setCustomReport((prev) => ({ ...prev, to: e.target.value }))} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm outline-none" />
              </div>
              <input type="text" value={customReport.branch} onChange={(e) => setCustomReport((prev) => ({ ...prev, branch: e.target.value }))} placeholder={t("rep.branchPlaceholder")} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm outline-none" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCustomReport(false)} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white">{t("common.cancel")}</button>
                <button type="button" onClick={handleCustomReport} className="rounded-xl bg-pink-600 px-4 py-3 text-sm font-bold text-white">{t("rep.createReport")}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
