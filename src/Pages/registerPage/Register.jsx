import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail, MailCheck, User } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import LanguageSwitcher from "../../i18n/LanguageSwitcher";
import AuthLayout from "../../features/auth/components/AuthLayout";
import { registerApi, resendConfirmationApi } from "../../features/auth/api/authApi";
import { registerSchema } from "../../features/auth/schemas/register.schema";
import { ROUTES } from "../../utils/routes";

function messages(lang) {
  const ar = {
    "auth.displayNameRequired": "الاسم الكامل مطلوب.",
    "auth.displayNameTooLong": "الاسم الكامل طويل جدًا.",
    "auth.emailRequired": "البريد الإلكتروني مطلوب.",
    "auth.emailInvalid": "أدخل بريدًا إلكترونيًا صحيحًا.",
    "auth.passwordTooShort": "كلمة المرور يجب ألا تقل عن 8 أحرف.",
    "auth.passwordComplexity": "يجب أن تحتوي كلمة المرور على حرف كبير وحرف صغير ورقم ورمز خاص.",
    "auth.confirmPasswordRequired": "تأكيد كلمة المرور مطلوب.",
    "auth.passwordsMustMatch": "كلمتا المرور غير متطابقتين.",
    "auth.emailDuplicate": "هذا البريد الإلكتروني مسجّل بالفعل.",
    "auth.registerFailed": "تعذر إنشاء الحساب. يرجى المحاولة مرة أخرى.",
    "auth.resendSuccess": "في حال وجود حساب مؤهل، سيتم إرسال رسالة تأكيد.",
    "auth.resendFailed": "تعذر إرسال رسالة التأكيد. حاول مرة أخرى.",
  };
  const en = {
    "auth.displayNameRequired": "Full name is required.",
    "auth.displayNameTooLong": "Full name is too long.",
    "auth.emailRequired": "Email is required.",
    "auth.emailInvalid": "Enter a valid email address.",
    "auth.passwordTooShort": "Password must be at least 8 characters.",
    "auth.passwordComplexity": "Password must include an uppercase letter, a lowercase letter, a number and a symbol.",
    "auth.confirmPasswordRequired": "Please confirm your password.",
    "auth.passwordsMustMatch": "Passwords do not match.",
    "auth.emailDuplicate": "This email is already registered.",
    "auth.registerFailed": "Could not create your account. Please try again.",
    "auth.resendSuccess": "If an eligible account exists, a confirmation email will be sent.",
    "auth.resendFailed": "Could not send the confirmation email. Please try again.",
  };

  return (key) => (lang === "ar" ? ar : en)[key] || key;
}

function RegisterForm({ onRegistered }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const message = messages(lang);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleRegister = async (values) => {
    setServerError("");

    try {
      const response = await registerApi({
        displayName: values.displayName.trim(),
        email: values.email,
        password: values.password,
      });
      onRegistered(response.email);
    } catch (error) {
      const code = error?.code;

      if (code === "Email.Duplicate") {
        setError("email", { message: message("auth.emailDuplicate") });
      } else if (typeof code === "string" && code.startsWith("Identity.Password")) {
        setError("password", { message: message("auth.passwordComplexity") });
      } else if (code === "DisplayName.Required" || code === "DisplayName.TooLong") {
        setError("displayName", { message: message("auth.displayNameRequired") });
      } else {
        setServerError(message("auth.registerFailed"));
      }
    }
  };

  return (
    <>
      <div className="mt-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t("register.title")}</h1>
        <p className="mt-2 text-gray-400 text-sm">{t("register.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit(handleRegister)} noValidate className="mt-8">
        {/* Display name */}
        <div>
          <label className="block text-xs mb-1.5 text-gray-300">
            {t("register.displayNameLabel")}
          </label>
          <div className="flex items-center gap-3 h-12 rounded-xl border border-white/10 bg-white/5 px-4 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/30">
            <User size={15} className="text-gray-400" />
            <input
              type="text"
              autoComplete="name"
              placeholder={t("register.displayNamePlaceholder")}
              disabled={isSubmitting}
              {...register("displayName")}
              className="flex-1 bg-transparent outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
          {errors.displayName?.message && (
            <p className="mt-1.5 text-xs text-rose-300">{message(errors.displayName.message)}</p>
          )}
        </div>

        {/* Email */}
        <div className="mt-4">
          <label className="block text-xs mb-1.5 text-gray-300">
            {t("register.emailLabel")}
          </label>
          <div className="flex items-center gap-3 h-12 rounded-xl border border-white/10 bg-white/5 px-4 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/30">
            <Mail size={15} className="text-gray-400" />
            <input
              type="email"
              autoComplete="email"
              placeholder={t("register.emailPlaceholder")}
              disabled={isSubmitting}
              {...register("email")}
              className="flex-1 bg-transparent outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
          {errors.email?.message && (
            <p className="mt-1.5 text-xs text-rose-300">{message(errors.email.message)}</p>
          )}
        </div>

        {/* Password */}
        <div className="mt-4">
          <label className="block text-xs mb-1.5 text-gray-300">
            {t("register.passwordLabel")}
          </label>
          <div className="flex items-center gap-3 h-12 rounded-xl border border-white/10 bg-white/5 px-4 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/30">
            <Lock size={15} className="text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder={t("register.passwordPlaceholder")}
              disabled={isSubmitting}
              {...register("password")}
              className="flex-1 bg-transparent outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={isSubmitting}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password?.message ? (
            <p className="mt-1.5 text-xs text-rose-300">{message(errors.password.message)}</p>
          ) : (
            <p className="mt-1.5 text-xs text-gray-500">{t("register.passwordHint")}</p>
          )}
        </div>

        {/* Confirm password */}
        <div className="mt-4">
          <label className="block text-xs mb-1.5 text-gray-300">
            {t("register.confirmPasswordLabel")}
          </label>
          <div className="flex items-center gap-3 h-12 rounded-xl border border-white/10 bg-white/5 px-4 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/30">
            <Lock size={15} className="text-gray-400" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder={t("register.confirmPasswordPlaceholder")}
              disabled={isSubmitting}
              {...register("confirmPassword")}
              className="flex-1 bg-transparent outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              disabled={isSubmitting}
            >
              {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.confirmPassword?.message && (
            <p className="mt-1.5 text-xs text-rose-300">
              {message(errors.confirmPassword.message)}
            </p>
          )}
        </div>

        {serverError && (
          <div className="mt-4 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {serverError}
          </div>
        )}

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={isSubmitting ? undefined : { scale: 1.02, boxShadow: "0 0 35px rgba(124,92,255,.35)" }}
          whileTap={isSubmitting ? undefined : { scale: 0.98 }}
          className="mt-6 w-full h-12 rounded-xl font-bold text-white text-base bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 transition-all disabled:cursor-not-allowed disabled:opacity-65"
        >
          {isSubmitting ? "..." : t("register.submit")}
        </motion.button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">{t("register.alreadyHaveAccount")}</p>
        <button
          type="button"
          onClick={() => navigate(ROUTES.LOGIN)}
          className="mt-2 font-semibold text-violet-400 hover:text-violet-300 transition"
        >
          {t("register.signIn")}
        </button>
      </div>
    </>
  );
}

function RegisterSuccess({ email }) {
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const message = messages(lang);

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    setResendMessage("");

    try {
      await resendConfirmationApi({ email });
      setResendMessage(message("auth.resendSuccess"));
    } catch {
      setResendMessage(message("auth.resendFailed"));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="mt-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-600/15 border border-violet-500/30">
        <MailCheck size={26} className="text-violet-300" />
      </div>
      <h1 className="mt-5 text-2xl font-bold tracking-tight">{t("registerSuccess.title")}</h1>
      <p className="mt-3 text-sm text-gray-400">
        {t("registerSuccess.message", { email })}
      </p>
      <p className="mt-1 text-sm font-semibold text-white break-all">{email}</p>
      <p className="mt-3 text-xs text-gray-500">{t("registerSuccess.instructions")}</p>

      {resendMessage && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300">
          {resendMessage}
        </div>
      )}

      <button
        type="button"
        onClick={handleResend}
        disabled={resending}
        className="mt-5 w-full h-12 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition font-semibold text-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        {resending ? t("registerSuccess.resendSending") : t("registerSuccess.resend")}
      </button>

      <motion.button
        type="button"
        onClick={() => navigate(ROUTES.LOGIN)}
        whileHover={{ scale: 1.02, boxShadow: "0 0 35px rgba(124,92,255,.35)" }}
        whileTap={{ scale: 0.98 }}
        className="mt-3 w-full h-12 rounded-xl font-bold text-white text-base bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 transition-all"
      >
        {t("registerSuccess.goToLogin")}
      </motion.button>
    </div>
  );
}

function RegisterCard() {
  const [registeredEmail, setRegisteredEmail] = useState(null);

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7 }}
      className="relative w-full max-w-[360px] rounded-[24px] border border-white/10 bg-[#0d1224]/70 backdrop-blur-3xl shadow-[0_0_80px_rgba(124,92,255,.15)] p-6"
    >
      <div className="absolute inset-0 rounded-[30px] overflow-hidden">
        <div className="absolute -top-40 right-0 w-50 h-50 bg-violet-600/20 blur-[100px]" />
        <div className="absolute bottom-0 -left-20 w-64 h-64 bg-blue-500/20 blur-[100px]" />
      </div>

      <div className="relative z-10">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        {registeredEmail ? (
          <RegisterSuccess email={registeredEmail} />
        ) : (
          <RegisterForm onRegistered={setRegisteredEmail} />
        )}
      </div>
    </motion.div>
  );
}

export default function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterCard />
    </AuthLayout>
  );
}
