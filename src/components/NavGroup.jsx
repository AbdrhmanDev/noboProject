import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";

export function NavGroup({ icon: Icon, labelKey, activePath, navigate, items }) {
  const { t } = useI18n();
  const [manualExpanded, setManualExpanded] = useState(false);

  const visibleItems = items.filter((item) => item.visible);
  if (visibleItems.length === 0) {
    return null;
  }

  const isGroupActive = visibleItems.some((item) => item.to === activePath);
  const expanded = manualExpanded || isGroupActive;

  return (
    <div>
      <div
        onClick={() => setManualExpanded((value) => !value)}
        className={`group flex cursor-pointer items-center gap-4 rounded-2xl px-4 py-3.5 transition-all duration-300 hover:border hover:border-blue-500/30 hover:bg-blue-500/10 ${
          isGroupActive ? "border border-blue-500/40 bg-blue-500/15" : ""
        }`}
      >
        <Icon
          size={20}
          color={isGroupActive ? "#2b8cff" : "#60a5fa"}
          className="shrink-0 transition group-hover:scale-110"
        />
        <span className={`flex-1 font-semibold tracking-wide ${isGroupActive ? "text-white" : ""}`}>
          {t(labelKey)}
        </span>
        {expanded ? (
          <ChevronUp size={16} className="shrink-0 text-gray-500" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-gray-500" />
        )}
      </div>
      {expanded && (
        <div className="mt-1 space-y-1 pr-3">
          {visibleItems.map((item) => (
            <div
              key={item.to}
              onClick={() => navigate(item.to)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all duration-300 hover:bg-blue-500/10 ${
                activePath === item.to ? "bg-blue-500/15 text-white" : "text-gray-400"
              }`}
            >
              <item.icon size={16} className="shrink-0" />
              <span>{t(item.labelKey)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
