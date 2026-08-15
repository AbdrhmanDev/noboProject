import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Loader2, Mail, ServerCrash } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import LanguageSwitcher from "../../i18n/LanguageSwitcher";
import { confirmEmailApi, resendConfirmationApi } from "../../features/auth/api/authApi";
import { ROUTES } from "../../utils/routes";

function messages(lang) {
  const ar = {
    "auth.resendSuccess": "في حال وجود حساب مؤهل، سيتم إرسال رسالة تأكيد.",
    "auth.resendFailed": "تعذر إرسال رسالة التأكيد. حاول مرة أخرى.",
    "auth.emailRequired": "البريد الإلكتروني مطلوب.",
  };
  const en = {
    "auth.resendSuccess": "If an eligible account exists, a confirmation email will be sent.",
    "auth.resendFailed": "Could not send the confirmation email. Please try again.",
    "auth.emailRequired": "Email is required.",
  };

  return (key) => (lang === "ar" ? ar : en)[key] || key;
}

function ResendForm() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const { t, lang } = useI18n();
  const message = messages(lang);

  const handleResend = async (event) => {
    event.preventDefault();
    if (sending) return;

    if (!email.trim()) {
      setFeedback(message("auth.emailRequired"));
      return;
    }

    setSending(true);
    setFeedback("");

    try {
      await resendConfirmationApi({ email: email.trim() });
      setFeedback(message("auth.resendSuccess"));
    } catch {
      setFeedback(message("auth.resendFailed"));
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleResend} className="mt-5 text-start">
      <label className="block text-xs mb-1.5 text-gray-300">
        {t("confirmEmail.resendLabel")}
      </label>
      <div className="flex items-center gap-3 h-12 rounded-xl border border-white/10 bg-white/5 px-4 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/30">
        <Mail size={15} className="text-gray-400" />
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={sending}
          className="flex-1 bg-transparent outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {feedback && (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300">
          {feedback}
        </div>
      )}

      <button
        type="submit"
        disabled={sending}
        className="mt-3 w-full h-12 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition font-semibold text-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending ? "..." : t("confirmEmail.resendButton")}
      </button>
    </form>
  );
}

export default function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, dir } = useI18n();

  const userId = searchParams.get("userId");
  const encodedToken = searchParams.get("encodedToken");
  const hasParams = Boolean(userId && encodedToken);

  const [status, setStatus] = useState(() => (hasParams ? "confirming" : "invalid"));
  const [attempt, setAttempt] = useState(0);
  const requestedForAttemptRef = useRef(-1);

  useEffect(() => {
    if (!hasParams) return;
    if (requestedForAttemptRef.current === attempt) return;
    requestedForAttemptRef.current = attempt;

    confirmEmailApi({ userId, encodedToken })
      .then(() => {
        setStatus("success");
      })
      .catch((error) => {
        setStatus(error?.status === 400 ? "invalid" : "server-error");
      });
  }, [hasParams, userId, encodedToken, attempt]);

  const handleRetry = () => {
    setStatus("confirming");
    setAttempt((current) => current + 1);
  };

  return (
    <div
      dir={dir}
      className="bg-space min-h-screen w-full relative flex items-center justify-center overflow-x-hidden px-4 py-10 text-white"
    >
      <div className="bg-stars absolute inset-0 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[380px] rounded-[24px] border border-white/10 bg-[#0d1224]/70 backdrop-blur-3xl shadow-[0_0_80px_rgba(124,92,255,.15)] p-6"
      >
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        <div className="mt-4 text-center">
          {status === "confirming" && (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-600/15 border border-violet-500/30">
                <Loader2 size={26} className="text-violet-300 animate-spin" />
              </div>
              <p className="mt-5 text-sm text-gray-300">{t("confirmEmail.confirming")}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
                <CheckCircle2 size={26} className="text-emerald-300" />
              </div>
              <h1 className="mt-5 text-2xl font-bold tracking-tight">
                {t("confirmEmail.successTitle")}
              </h1>
              <p className="mt-2 text-sm text-gray-400">{t("confirmEmail.successMessage")}</p>
              <motion.button
                type="button"
                onClick={() => navigate(ROUTES.LOGIN)}
                whileHover={{ scale: 1.02, boxShadow: "0 0 35px rgba(124,92,255,.35)" }}
                whileTap={{ scale: 0.98 }}
                className="mt-6 w-full h-12 rounded-xl font-bold text-white text-base bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 transition-all"
              >
                {t("confirmEmail.goToLogin")}
              </motion.button>
            </>
          )}

          {status === "invalid" && (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/15 border border-rose-500/30">
                <AlertTriangle size={26} className="text-rose-300" />
              </div>
              <h1 className="mt-5 text-2xl font-bold tracking-tight">
                {t("confirmEmail.errorTitle")}
              </h1>
              <p className="mt-2 text-sm text-gray-400">
                {hasParams ? t("confirmEmail.errorMessage") : t("confirmEmail.missingParams")}
              </p>
              <ResendForm />
            </>
          )}

          {status === "server-error" && (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 border border-amber-500/30">
                <ServerCrash size={26} className="text-amber-300" />
              </div>
              <h1 className="mt-5 text-2xl font-bold tracking-tight">
                {t("confirmEmail.serverErrorTitle")}
              </h1>
              <p className="mt-2 text-sm text-gray-400">{t("confirmEmail.serverErrorMessage")}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="mt-5 w-full h-12 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition font-semibold text-sm"
              >
                {t("confirmEmail.retry")}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
