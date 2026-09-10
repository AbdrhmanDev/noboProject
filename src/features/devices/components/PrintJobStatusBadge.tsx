import { useI18n } from "../../../i18n/I18nContext";
import type { PrintJobStatus } from "../types/devices.types";
import { PRINT_JOB_STATUS_BADGE_CLASSES, getPrintJobStatusLabelKey } from "../utils/devicesFormatters";

export function PrintJobStatusBadge({
  status,
  transport,
}: {
  status: PrintJobStatus | null | undefined;
  // Optional so every existing call site keeps compiling; omitting it only affects the wording
  // of a Succeeded badge (falls back to the generic "submitted" phrasing), never breaks rendering.
  transport?: string | null;
}) {
  const { t } = useI18n();
  if (!status) return null;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${PRINT_JOB_STATUS_BADGE_CLASSES[status]}`}
    >
      {t(getPrintJobStatusLabelKey(status, transport))}
    </span>
  );
}
