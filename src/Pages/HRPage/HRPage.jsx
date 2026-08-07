import { Plus, UserPlus, Calendar } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { useI18n } from "../../i18n/I18nContext";
import { ROUTES } from "../../utils/routes";

const stats = [
  { labelKey: "hr.totalEmployees", value: "48", color: "#2b8cff" },
  { labelKey: "hr.presentToday", value: "42", color: "#17d9c4" },
  { labelKey: "hr.onLeave", value: "4", color: "#f5b800" },
  { labelKey: "hr.openPositions", value: "6", color: "#ff3d6b" },
];

const employees = [
  { name: "شريف رضا", role: "مدير النظام", dept: "الإدارة", salary: "18,000", status: "حاضر", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sherif" },
  { name: "أحمد الحربي", role: "محاسب", dept: "المالية", salary: "9,500", status: "حاضر", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=20" },
  { name: "سارة العلي", role: "مندوبة مبيعات", dept: "المبيعات", salary: "8,200", status: "إجازة", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=21" },
  { name: "محمد الغامدي", role: "مطور برمجيات", dept: "تقنية المعلومات", salary: "12,000", status: "حاضر", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=22" },
  { name: "نورة القحطاني", role: "مديرة موارد بشرية", dept: "الموارد البشرية", salary: "11,300", status: "حاضر", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=23" },
];

export default function HRPage({ onLogout }) {
  const { t } = useI18n();
  return (
    <AppLayout onLogout={onLogout} activePath={ROUTES.HR}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-black brand-text">{t("hr.title")}</h1>
        <div className="flex gap-2">
          <button className="panel rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"><Calendar size={13} /> {t("hr.leaveRequest")}</button>
          <button className="primary-btn rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"><UserPlus size={13} /> {t("hr.hire")}</button>
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

      {/* employees table */}
      <div className="panel rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">{t("hr.employeeList")}</h3>
          <button className="primary-btn rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"><Plus size={13} /> {t("hr.addEmployee")}</button>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 text-right">
              <th className="font-medium pb-2">{t("hr.employee")}</th>
              <th className="font-medium pb-2">{t("hr.job")}</th>
              <th className="font-medium pb-2">{t("hr.department")}</th>
              <th className="font-medium pb-2">{t("hr.salary")}</th>
              <th className="font-medium pb-2">{t("hr.status")}</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e, i) => (
              <tr key={i} className="border-t border-white/5">
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <img src={e.avatar} alt="" className="w-7 h-7 rounded-full bg-gray-700" />
                    <span className="text-gray-200 font-bold">{e.name}</span>
                  </div>
                </td>
                <td className="py-2.5 text-gray-300">{e.role}</td>
                <td className="py-2.5 text-gray-400">{e.dept}</td>
                <td className="py-2.5 text-gray-300">{e.salary} ر.س</td>
                <td className="py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    e.status === "حاضر" ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"
                  }`}>{t(e.status === "حاضر" ? "hr.present" : "hr.leave")}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
