import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import LanguageSwitcher from "../../i18n/LanguageSwitcher";
import AuthLayout from "../../features/auth/components/AuthLayout";
import { forgotPasswordApi } from "../../features/auth/api/authApi";
import { forgotPasswordSchema } from "../../features/auth/schemas/forgotPassword.schema";
import { ROUTES } from "../../utils/routes";

const RESEND_COOLDOWN_SECONDS = 60;

// Same field look as the login card so both pages feel like one flow.
const inputRowClass =
  "flex h-14 items-center gap-3 rounded-control border border-line bg-inset px-4 transition-[border-color,box-shadow] duration-100 hover:border-line-strong focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent/20";
const inputClass =
  "min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-subtle disabled:cursor-not-allowed disabled:opacity-60";
const labelClass = "mb-2 block text-sm font-bold text-ink";
const primaryButtonClass =
  "h-14 w-full rounded-control bg-accent text-lg font-bold text-white shadow-[var(--shadow-surface)] transition-[background-color,transform] duration-100 hover:bg-accent-strong active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-65";
const errorBoxClass =
  "mt-4 rounded-control border border-danger/35 bg-danger-soft px-3.5 py-2.5 text-sm text-ink";

function getMessages(lang) {
  const ar = {
    title: "نسيت كلمة المرور؟",
    subtitle: "أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "name@company.com",
    send: "إرسال رابط إعادة التعيين",
    back: "العودة لتسجيل الدخول",
    sentTitle: "تحقق من بريدك",
    sentBody: "في حال وجود حساب مرتبط بـ {email}، ستصلك رسالة تحتوي على رابط إعادة تعيين كلمة المرور.",
    sentHint: "لم تصلك الرسالة؟ تفقد البريد المزعج أو أعد الإرسال.",
    resend: "إعادة الإرسال",
    resendIn: "إعادة الإرسال بعد {seconds} ثانية",
    changeEmail: "استخدام بريد آخر",
    "auth.emailRequired": "البريد الإلكتروني مطلوب.",
    "auth.emailInvalid": "أدخل بريدًا إلكترونيًا صحيحًا.",
    "auth.tooManyRequests": "محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.",
    "auth.forgotFailed": "تعذر إرسال الرابط. حاول مرة أخرى.",
  };
  const en = {
    title: "Forgot your password?",
    subtitle: "Enter your email and we will send you a link to reset your password.",
    emailLabel: "Email",
    emailPlaceholder: "name@company.com",
    send: "Send reset link",
    back: "Back to sign in",
    sentTitle: "Check your email",
    sentBody: "If an account exists for {email}, you will receive an email with a link to reset your password.",
    sentHint: "Did not get it? Check your spam folder or resend.",
    resend: "Resend",
    resendIn: "Resend in {seconds}s",
    changeEmail: "Use a different email",
    "auth.emailRequired": "Email is required.",
    "auth.emailInvalid": "Enter a valid email address.",
    "auth.tooManyRequests": "Too many attempts. Please wait a moment and try again.",
    "auth.forgotFailed": "Could not send the link. Please try again.",
  };

  return (key, vars = {}) =>
    Object.entries(vars).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, value),
      (lang === "ar" ? ar : en)[key] || key,
    );
}

function ForgotPasswordCard() {
  const navigate = useNavigate();
  const { lang, dir } = useI18n();
  const m = getMessages(lang);
  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  const [sentTo, setSentTo] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const send = async ({ email }) => {
    setServerError("");

    try {
      await forgotPasswordApi({ email });
      setSentTo(email);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      setServerError(error?.status === 429 ? m("auth.tooManyRequests") : m("auth.forgotFailed"));
    }
  };

  const resend = () => {
    if (cooldown > 0 || isSubmitting) return;
    return send({ email: sentTo });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-[460px] rounded-surface border border-line bg-surface p-7 text-ink shadow-[var(--shadow-float)] sm:p-10"
    >
      <div className="flex justify-end">
        <LanguageSwitcher />
      </div>

      {sentTo ? (
        <div className="mt-4 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent/15 text-accent">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-ink">{m("sentTitle")}</h1>
          <p className="mt-3 break-words text-base text-muted">{m("sentBody", { email: sentTo })}</p>
          <p className="mt-2 text-sm text-subtle">{m("sentHint")}</p>

          {serverError && (
            <div role="alert" className={errorBoxClass}>
              {serverError}
            </div>
          )}

          <button
            type="button"
            onClick={resend}
            disabled={cooldown > 0}
            className={`mt-6 ${primaryButtonClass}`}
          >
            {cooldown > 0 ? m("resendIn", { seconds: cooldown }) : m("resend")}
          </button>
          <button
            type="button"
            onClick={() => {
              setSentTo("");
              setServerError("");
              setCooldown(0);
            }}
            className="mt-4 text-sm font-semibold text-accent transition-colors hover:underline"
          >
            {m("changeEmail")}
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink">{m("title")}</h1>
            <p className="mt-2 text-base text-muted">{m("subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit(send)} noValidate>
            <div className="mt-6">
              <label htmlFor="forgot-email" className={labelClass}>
                {m("emailLabel")}
              </label>
              <div className={inputRowClass}>
                <Mail size={18} className="shrink-0 text-subtle" />
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder={m("emailPlaceholder")}
                  disabled={isSubmitting}
                  aria-invalid={errors.email ? "true" : undefined}
                  {...register("email")}
                  className={inputClass}
                />
              </div>
              {errors.email?.message && (
                <p role="alert" className="mt-1.5 text-xs font-semibold text-danger">
                  {m(errors.email.message)}
                </p>
              )}
            </div>

            {serverError && (
              <div role="alert" className={errorBoxClass}>
                {serverError}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className={`mt-7 ${primaryButtonClass}`}>
              {isSubmitting ? "..." : m("send")}
            </button>
          </form>
        </>
      )}

      <div className="mt-7 text-center text-sm">
        <button
          type="button"
          onClick={() => navigate(ROUTES.LOGIN)}
          className="inline-flex items-center gap-1.5 font-bold text-accent transition-colors hover:underline"
        >
          <BackArrow size={16} />
          {m("back")}
        </button>
      </div>
    </motion.div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordCard />
    </AuthLayout>
  );
}
