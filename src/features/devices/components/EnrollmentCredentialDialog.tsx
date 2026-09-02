import { useEffect, useState } from "react";
import { Check, Copy, ShieldAlert } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { formatDateTime } from "../../../shared/utils/formatters";
import type { EdgeAgentEnrollmentResponse } from "../types/devices.types";
import { DevicesModal } from "./DevicesModal";

type EnrollmentCredentialDialogProps = {
  enrollment: EdgeAgentEnrollmentResponse;
  onClose: () => void;
};

function formatRemaining(ms: number) {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// One-time secret display — the credential lives only in this component's
// (and its caller's) React state, never in localStorage/sessionStorage.
// Closing this dialog is the last chance to see or copy it.
export function EnrollmentCredentialDialog({ enrollment, onClose }: EnrollmentCredentialDialogProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, new Date(enrollment.expiresAtUtc).getTime() - Date.now()),
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemainingMs(Math.max(0, new Date(enrollment.expiresAtUtc).getTime() - Date.now()));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [enrollment.expiresAtUtc]);

  const copyCredential = async () => {
    try {
      await navigator.clipboard.writeText(enrollment.enrollmentCredential);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — the credential remains selectable text.
    }
  };

  const expired = remainingMs <= 0;

  return (
    <DevicesModal title={t("devices.enrollment.title")} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3">
          <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-300" />
          <p className="text-xs leading-5 text-amber-100">{t("devices.enrollment.onceWarning")}</p>
        </div>

        <div>
          <div className="mb-1 text-[11px] font-semibold text-slate-400">
            {t("devices.enrollment.credential")}
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-3">
            <code className="min-w-0 flex-1 select-all break-all font-mono text-xs text-emerald-300">
              {enrollment.enrollmentCredential}
            </code>
            <button
              type="button"
              onClick={copyCredential}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[11px] font-bold text-slate-100 hover:bg-white/10"
            >
              {copied ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />}
              {copied ? t("devices.enrollment.copied") : t("devices.enrollment.copy")}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
            <div className="text-slate-500">{t("devices.enrollment.expiresAt")}</div>
            <div className="mt-1 font-semibold text-slate-200">
              {formatDateTime(enrollment.expiresAtUtc)}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
            <div className="text-slate-500">{t("devices.enrollment.expiresIn")}</div>
            <div className={`mt-1 font-black ${expired ? "text-rose-400" : "text-slate-200"}`}>
              {expired ? t("devices.enrollment.expired") : formatRemaining(remainingMs)}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:brightness-110"
        >
          {t("devices.enrollment.done")}
        </button>
      </div>
    </DevicesModal>
  );
}
