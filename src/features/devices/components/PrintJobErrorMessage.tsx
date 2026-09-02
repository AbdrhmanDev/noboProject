import { useI18n } from "../../../i18n/I18nContext";
import { DEVICE_ERROR_MESSAGE_KEYS } from "../utils/devicesFormatters";
import type { PrintJobResponse } from "../types/devices.types";

type PrintJobErrorMessageProps = {
  printJob: Pick<PrintJobResponse, "lastErrorCode" | "lastErrorMessage">;
};

// Error-code -> plain-language map for a failed PrintJob. Falls back to the
// raw backend message for any code not in the known list; never shows the
// raw code itself to the user.
export function PrintJobErrorMessage({ printJob }: PrintJobErrorMessageProps) {
  const { t } = useI18n();

  if (!printJob.lastErrorCode && !printJob.lastErrorMessage) return null;

  const messageKey = printJob.lastErrorCode ? DEVICE_ERROR_MESSAGE_KEYS[printJob.lastErrorCode] : null;
  const message = messageKey ? t(messageKey) : printJob.lastErrorMessage || t("printing.error.unknown");

  return (
    <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
      {message}
    </div>
  );
}
