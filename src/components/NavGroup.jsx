import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { ShortcutHint } from "../features/shortcuts/components/ShortcutHint";

export function NavGroup({ icon: Icon, labelKey, activePath, navigate, items, shortcutAction, collapsed = false }) {
  const { t } = useI18n();
  const [manualExpanded, setManualExpanded] = useState(false);

  const visibleItems = items.filter((item) => item.visible);
  if (visibleItems.length === 0) {
    return null;
  }

  const isGroupActive = visibleItems.some((item) => item.to === activePath);
  const expanded = manualExpanded || isGroupActive;

  if (collapsed) {
    const target = visibleItems.find((item) => item.to === activePath) || visibleItems[0];
    return (
      <button
        type="button"
        onClick={() => navigate(target.to)}
        aria-label={t(labelKey)}
        aria-current={isGroupActive ? "page" : undefined}
        data-active={isGroupActive}
        className="nobo-sb-item"
      >
        <Icon size={20} className="nobo-sb-icon" />
        <span className="nobo-sb-tip">{t(labelKey)}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setManualExpanded((value) => !value)}
        aria-expanded={expanded}
        data-active={isGroupActive}
        data-expanded={expanded}
        className="nobo-sb-item"
      >
        <Icon size={20} className="nobo-sb-icon" />
        <span className="nobo-sb-label">{t(labelKey)}</span>
        {shortcutAction && <ShortcutHint action={shortcutAction} />}
        <ChevronDown size={16} className="nobo-sb-chevron" />
      </button>
      {expanded && (
        <div className="nobo-sb-sub">
          {visibleItems.map((item) => (
            <button
              key={item.to}
              type="button"
              onClick={() => navigate(item.to)}
              aria-current={activePath === item.to ? "page" : undefined}
              data-active={activePath === item.to}
              className="nobo-sb-item"
            >
              <item.icon size={16} className="nobo-sb-icon" />
              <span className="nobo-sb-label">{t(item.labelKey)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
