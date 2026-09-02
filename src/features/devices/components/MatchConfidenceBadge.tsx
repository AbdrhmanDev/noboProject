import { useI18n } from "../../../i18n/I18nContext";
import type { MatchConfidence } from "../types/devices.types";
import { MATCH_CONFIDENCE_BADGE_CLASSES, MATCH_CONFIDENCE_LABEL_KEYS } from "../utils/devicesFormatters";

export function MatchConfidenceBadge({
  confidence,
}: {
  confidence: MatchConfidence | null | undefined;
}) {
  const { t } = useI18n();
  if (!confidence) return null;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${MATCH_CONFIDENCE_BADGE_CLASSES[confidence]}`}
    >
      {t(MATCH_CONFIDENCE_LABEL_KEYS[confidence])}
    </span>
  );
}
