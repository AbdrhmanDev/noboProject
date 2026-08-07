import {
  LayoutGrid, BookOpen, LifeBuoy, GraduationCap, FileBox, Share2, MessageSquare, Smartphone,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { useI18n } from "../../i18n/I18nContext";
import { ROUTES } from "../../utils/routes";

const modules = [
  { titleKey: "more.modules", descKey: "more.modulesDesc", icon: LayoutGrid, color: "#2b8cff" },
  { titleKey: "more.guide", descKey: "more.guideDesc", icon: BookOpen, color: "#f5b800" },
  { titleKey: "more.help", descKey: "more.helpDesc", icon: LifeBuoy, color: "#17d9c4" },
  { titleKey: "more.academy", descKey: "more.academyDesc", icon: GraduationCap, color: "#8b5cf6" },
  { titleKey: "more.fileLibrary", descKey: "more.fileLibraryDesc", icon: FileBox, color: "#ff3d6b" },
  { titleKey: "more.integrations", descKey: "more.integrationsDesc", icon: Share2, color: "#34d399" },
  { titleKey: "more.support", descKey: "more.supportDesc", icon: MessageSquare, color: "#60a5fa" },
  { titleKey: "more.apps", descKey: "more.appsDesc", icon: Smartphone, color: "#c084fc" },
];

export default function MorePage({ onLogout }) {
  const { t } = useI18n();
  return (
    <AppLayout onLogout={onLogout} activePath={ROUTES.MORE}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-black brand-text">{t("more.title")}</h1>
        <span className="text-xs text-gray-400">{t("more.subtitle")}</span>
      </div>

      {/* module cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {modules.map((m, i) => (
          <div key={i} className="panel rounded-2xl p-4 cursor-pointer hover:border-blue-500/50">
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-xl p-2" style={{ background: `${m.color}22` }}>
                <m.icon size={18} color={m.color} />
              </div>
              <span className="text-[10px] text-gray-500">{t("more.new")}</span>
            </div>
            <div className="font-bold text-white text-sm">{t(m.titleKey)}</div>
            <div className="text-[11px] text-gray-400 mt-1">{t(m.descKey)}</div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
