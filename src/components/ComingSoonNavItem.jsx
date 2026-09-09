import { useI18n } from "../i18n/I18nContext";
import { StatusBadge } from "../shared/components/ui";

export function ComingSoonNavItem({ icon: Icon, labelKey, collapsed = false }) {
  const { t } = useI18n();

  if (collapsed) {
    return (
      <div
        role="button"
        aria-disabled="true"
        tabIndex={-1}
        title={`${t(labelKey)} — ${t("nav.comingSoon")}`}
        aria-label={`${t(labelKey)} — ${t("nav.comingSoon")}`}
        className="mx-auto flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-2xl opacity-50"
      >
        <Icon size={20} className="text-gray-600" />
      </div>
    );
  }

  return (
    <div
      role="button"
      aria-disabled="true"
      tabIndex={-1}
      className="flex cursor-not-allowed items-center gap-4 rounded-2xl px-4 py-3.5 opacity-50"
    >
      <Icon size={20} className="shrink-0 text-gray-600" />
      <span className="flex-1 truncate font-semibold tracking-wide text-gray-500">{t(labelKey)}</span>
      <StatusBadge tone="neutral">{t("nav.comingSoon")}</StatusBadge>
    </div>
  );
}
