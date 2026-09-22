import { useI18n } from "../i18n/I18nContext";

export function ComingSoonNavItem({ icon: Icon, labelKey, collapsed = false }) {
  const { t } = useI18n();

  if (collapsed) {
    return (
      <div
        role="button"
        aria-disabled="true"
        tabIndex={-1}
        aria-label={`${t(labelKey)} — ${t("nav.comingSoon")}`}
        className="nobo-sb-item"
      >
        <Icon size={20} className="nobo-sb-icon" />
        <span className="nobo-sb-tip">{`${t(labelKey)} — ${t("nav.comingSoon")}`}</span>
      </div>
    );
  }

  return (
    <div role="button" aria-disabled="true" tabIndex={-1} className="nobo-sb-item">
      <Icon size={20} className="nobo-sb-icon" />
      <span className="nobo-sb-label">{t(labelKey)}</span>
      <span className="nobo-sb-badge">{t("nav.comingSoon")}</span>
    </div>
  );
}
