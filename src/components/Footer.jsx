import { useI18n } from "../i18n/I18nContext";

export default function Footer({ compact = false, children }) {
  const { t } = useI18n();
  return (
    <div className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] text-gray-500 ${compact ? "mt-1" : "mt-6"}`}>
      <span>{t("footer.copyright")}</span>
      {/* On the POS route the clock/theme/logout/shortcuts row (Header, `bare` mode) is passed in
          here instead of getting its own row above -- one line of status info instead of two. */}
      {children}
    </div>
  );
}
