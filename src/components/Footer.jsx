import { Database } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";

export default function Footer() {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mt-6 text-[11px] text-gray-500">
      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /> {t("footer.allSystems")}</span>
      <span>{t("footer.version")}</span>
      <span className="flex items-center gap-1.5 text-green-400"><Database size={12} /> {t("footer.database")}</span>
      <span>{t("footer.backup")}</span>
      <span>{t("footer.copyright")}</span>
    </div>
  );
}
