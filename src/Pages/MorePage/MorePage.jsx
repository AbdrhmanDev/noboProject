import {
  LayoutGrid, BookOpen, LifeBuoy, GraduationCap, FileBox, Share2, MessageSquare, Smartphone,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { ROUTES } from "../../utils/routes";

const modules = [
  { title: "الوحدات الإضافية", desc: "إدارة الوحدات والملحقات الإضافية", icon: LayoutGrid, color: "#2b8cff" },
  { title: "الدليل الإرشادي", desc: "تعلم استخدام نظام NOBO خطوة بخطوة", icon: BookOpen, color: "#f5b800" },
  { title: "مركز المساعدة", desc: "مقالات ودروس لمساعدتك", icon: LifeBuoy, color: "#17d9c4" },
  { title: "الأكاديمية", desc: "دورات تدريبية معتمدة", icon: GraduationCap, color: "#8b5cf6" },
  { title: "مكتبة الملفات", desc: "مستندات ونماذج جاهزة للاستخدام", icon: FileBox, color: "#ff3d6b" },
  { title: "التكاملات", desc: "ربط NOBO مع تطبيقاتك الأخرى", icon: Share2, color: "#34d399" },
  { title: "التواصل والدعم", desc: "تواصل مع فريق الدعم الفني", icon: MessageSquare, color: "#60a5fa" },
  { title: "التطبيقات", desc: "اكتشف تطبيقات NOBO للجوال", icon: Smartphone, color: "#c084fc" },
];

export default function MorePage({ onLogout }) {
  return (
    <AppLayout onLogout={onLogout} activePath={ROUTES.MORE}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-black brand-text">المزيد</h1>
        <span className="text-xs text-gray-400">استكشف المزيد من مزايا نظام NOBO</span>
      </div>

      {/* module cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {modules.map((m, i) => (
          <div key={i} className="panel rounded-2xl p-4 cursor-pointer hover:border-blue-500/50">
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-xl p-2" style={{ background: `${m.color}22` }}>
                <m.icon size={18} color={m.color} />
              </div>
              <span className="text-[10px] text-gray-500">جديد</span>
            </div>
            <div className="font-bold text-white text-sm">{m.title}</div>
            <div className="text-[11px] text-gray-400 mt-1">{m.desc}</div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
