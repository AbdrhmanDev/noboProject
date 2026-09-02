import { useI18n } from "../../../i18n/I18nContext";
import type { EdgeAgentHealthStatus, EdgeAgentStatus } from "../types/devices.types";
import {
  EDGE_AGENT_HEALTH_BADGE_CLASSES,
  EDGE_AGENT_HEALTH_LABEL_KEYS,
  EDGE_AGENT_STATUS_BADGE_CLASSES,
  EDGE_AGENT_STATUS_LABEL_KEYS,
} from "../utils/devicesFormatters";

export function EdgeAgentStatusBadge({ status }: { status: EdgeAgentStatus | null | undefined }) {
  const { t } = useI18n();
  if (!status) return null;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${EDGE_AGENT_STATUS_BADGE_CLASSES[status]}`}
    >
      {t(EDGE_AGENT_STATUS_LABEL_KEYS[status])}
    </span>
  );
}

export function EdgeAgentHealthBadge({
  health,
}: {
  health: EdgeAgentHealthStatus | null | undefined;
}) {
  const { t } = useI18n();
  if (!health) return null;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${EDGE_AGENT_HEALTH_BADGE_CLASSES[health]}`}
    >
      {t(EDGE_AGENT_HEALTH_LABEL_KEYS[health])}
    </span>
  );
}
