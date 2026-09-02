import { useI18n } from "../../../i18n/I18nContext";
import type { DeviceCertificationStatus, DeviceHealthStatus, DeviceStatus } from "../types/devices.types";
import {
  CERTIFICATION_BADGE_CLASSES,
  CERTIFICATION_LABEL_KEYS,
  DEVICE_HEALTH_BADGE_CLASSES,
  DEVICE_HEALTH_LABEL_KEYS,
  DEVICE_STATUS_BADGE_CLASSES,
  DEVICE_STATUS_LABEL_KEYS,
} from "../utils/devicesFormatters";

export function DeviceStatusBadge({ status }: { status: DeviceStatus | null | undefined }) {
  const { t } = useI18n();
  if (!status) return null;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${DEVICE_STATUS_BADGE_CLASSES[status]}`}
    >
      {t(DEVICE_STATUS_LABEL_KEYS[status])}
    </span>
  );
}

export function DeviceHealthBadge({ health }: { health: DeviceHealthStatus | null | undefined }) {
  const { t } = useI18n();
  if (!health) return null;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${DEVICE_HEALTH_BADGE_CLASSES[health]}`}
    >
      {t(DEVICE_HEALTH_LABEL_KEYS[health])}
    </span>
  );
}

export function CertificationBadge({
  certification,
}: {
  certification: DeviceCertificationStatus | null | undefined;
}) {
  const { t } = useI18n();
  if (!certification) return null;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${CERTIFICATION_BADGE_CLASSES[certification]}`}
    >
      {t(CERTIFICATION_LABEL_KEYS[certification])}
    </span>
  );
}
