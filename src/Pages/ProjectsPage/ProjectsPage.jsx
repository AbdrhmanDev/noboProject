import { Plus, FolderPlus, Clock, Users } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { useI18n } from "../../i18n/I18nContext";
import { ROUTES } from "../../utils/routes";

const projects = [
  { name: "تطوير نظام نقاط البيع", client: "مجموعة الخليج", progress: 75, status: "قيد التنفيذ", team: 6, color: "#2b8cff" },
  { name: "منصة التجارة الإلكترونية", client: "شركة النور", progress: 40, status: "قيد التنفيذ", team: 4, color: "#f5b800" },
  { name: "ترقية البنية التحتية", client: "مؤسسة الريادة", progress: 100, status: "مكتمل", team: 3, color: "#17d9c4" },
  { name: "تطبيق الجوال", client: "شركة الأمل", progress: 15, status: "مبدئي", team: 5, color: "#8b5cf6" },
  { name: "نظام الموارد البشرية", client: "مصنع البلاد", progress: 60, status: "قيد التنفيذ", team: 7, color: "#ff3d6b" },
];

export default function ProjectsPage({ onLogout }) {
  const { t } = useI18n();
  return (
    <AppLayout onLogout={onLogout} activePath={ROUTES.PROJECTS}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-black brand-text">{t("proj.title")}</h1>
        <div className="flex gap-2">
          <button className="panel rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"><FolderPlus size={13} /> {t("proj.newProject")}</button>
          <button className="primary-btn rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"><Plus size={13} /> {t("proj.task")}</button>
        </div>
      </div>

      {/* project cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((p, i) => (
          <div key={i} className="panel rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                p.status === "مكتمل" ? "bg-green-500/15 text-green-400" :
                p.status === "قيد التنفيذ" ? "bg-blue-500/15 text-blue-400" :
                "bg-yellow-500/15 text-yellow-400"
              }`}>{t(p.status === "مكتمل" ? "proj.completed" : p.status === "قيد التنفيذ" ? "proj.inProgress" : "proj.initial")}</span>
              <span className="text-lg font-black" style={{ color: p.color }}>{p.progress}%</span>
            </div>
            <div className="font-bold text-white text-sm">{p.name}</div>
            <div className="text-[11px] text-gray-400 mt-1">{t("proj.client", { name: p.client })}</div>
            <div className="mt-3">
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${p.progress}%`, background: p.color }} />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-400">
              <span className="flex items-center gap-1"><Users size={12} /> {t("proj.members", { n: p.team })}</span>
              <span className="flex items-center gap-1"><Clock size={12} /> {p.status === "مكتمل" ? t("proj.delivered") : t("proj.last7Days")}</span>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
