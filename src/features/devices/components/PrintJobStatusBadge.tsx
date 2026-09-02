import { useI18n } from "../../../i18n/I18nContext";
import type { PrintJobStatus } from "../types/devices.types";
import { PRINT_JOB_STATUS_BADGE_CLASSES, PRINT_JOB_STATUS_LABEL_KEYS } from "../utils/devicesFormatters";

export function PrintJobStatusBadge({ status }: { status: PrintJobStatus | null | undefined }) {
  const { t } = useI18n();
  if (!status) return null;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${PRINT_JOB_STATUS_BADGE_CLASSES[status]}`}
    >
      {t(PRINT_JOB_STATUS_LABEL_KEYS[status])}
    </span>
  );
}
