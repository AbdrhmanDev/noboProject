import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import LanguageSwitcher from "../../i18n/LanguageSwitcher";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { loginSchema } from "../../features/auth/schemas/login.schema";
import AuthLayout from "../../features/auth/components/AuthLayout";
import {
  buildInviteAcceptPath,
  getPendingInvitationToken,
} from "../../features/users-access/utils/pendingInvitation";

import { ROUTES } from "../../utils/routes";

// Shared look for the input row (icon + input) so both fields match.
const inputRowClass =
  "flex h-14 items-center gap-3 rounded-control border border-line bg-inset px-4 transition-[border-color,box-shadow] duration-100 hover:border-line-strong focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent/20";
const inputClass =
  "min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-subtle disabled:cursor-not-allowed disabled:opacity-60";
const labelClass = "mb-2 block text-sm font-bold text-ink";
const socialButtonClass =
  "flex h-14 items-center justify-center rounded-control border border-line bg-raised transition-colors hover:border-line-strong hover:bg-hover";

function LoginCard() {
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState("online");
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useI18n();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const message = (key) => {
    const ar = {
      "auth.emailRequired": "البريد الإلكتروني مطلوب.",
      "auth.emailInvalid": "أدخل بريدًا إلكترونيًا صحيحًا.",
      "auth.passwordRequired": "كلمة المرور مطلوبة.",
      "auth.signInFailed": "تعذر تسجيل الدخول. تحقق من بياناتك وحاول مرة أخرى.",
    };
    const en = {
      "auth.emailRequired": "Email is required.",
      "auth.emailInvalid": "Enter a valid email address.",
      "auth.passwordRequired": "Password is required.",
      "auth.signInFailed": "Sign-in failed. Check your credentials and try again.",
    };

    return (lang === "ar" ? ar : en)[key] || key;
  };

  const handleSignIn = async (values) => {
    setServerError("");

    try {
      await login(values);

      // Resume a pending invitation ahead of any other redirect (Section 1.4/B): an invited
      // user's accept-invitation intent takes priority over wherever ProtectedRoute happened to
      // bounce them from, since that's always just the generic Login page itself in this flow.
      const pendingInvitationToken = getPendingInvitationToken();
      if (pendingInvitationToken) {
        navigate(buildInviteAcceptPath(pendingInvitationToken), { replace: true });
        return;
      }

      const from = location.state?.from?.pathname || ROUTES.DASHBOARD;
      navigate(from, { replace: true });
    } catch {
      setServerError(message("auth.signInFailed"));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-[460px] rounded-surface border border-line bg-surface p-7 text-ink shadow-[var(--shadow-float)] sm:p-10"
    >
      {/* Language */}
      <div className="flex justify-end">
        <LanguageSwitcher />
      </div>

      {/* Header */}
      <div className="mt-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">{t("login.welcome")}</h1>
        <p className="mt-2 text-base text-muted">{t("login.subtitle")}</p>
      </div>

      {/* Online Offline */}
      <div role="group" className="mt-6 grid grid-cols-2 gap-1 rounded-control bg-inset p-1">
        {["online", "offline"].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-pressed={mode === value}
            className={`h-11 rounded-[0.5rem] text-base font-bold transition-colors ${
              mode === value
                ? "bg-accent text-white shadow-[var(--shadow-surface)]"
                : "text-muted hover:bg-hover hover:text-ink"
            }`}
          >
            {t(`login.${value}`)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(handleSignIn)} noValidate>
        {/* Email */}
        <div className="mt-6">
          <label htmlFor="login-email" className={labelClass}>
            {t("login.emailLabel")}
          </label>
          <div className={inputRowClass}>
            <Mail size={18} className="shrink-0 text-subtle" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder={t("login.emailPlaceholder")}
              disabled={isSubmitting}
              aria-invalid={errors.email ? "true" : undefined}
              {...register("email")}
              className={inputClass}
            />
          </div>
          {errors.email?.message && (
            <p role="alert" className="mt-1.5 text-xs font-semibold text-danger">
              {message(errors.email.message)}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="mt-4">
          <label htmlFor="login-password" className={labelClass}>
            {t("login.passwordLabel")}
          </label>
          <div className={inputRowClass}>
            <Lock size={18} className="shrink-0 text-subtle" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder={t("login.passwordPlaceholder")}
              disabled={isSubmitting}
              aria-invalid={errors.password ? "true" : undefined}
              {...register("password")}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isSubmitting}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-control text-subtle transition-colors hover:bg-hover hover:text-ink disabled:opacity-50"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password?.message && (
            <p role="alert" className="mt-1.5 text-xs font-semibold text-danger">
              {message(errors.password.message)}
            </p>
          )}
        </div>

        {/* Remember + Forgot */}
        <div className="mt-5 flex items-center justify-between gap-3 text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-muted">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--nobo-accent)]"
              defaultChecked
              disabled={isSubmitting}
            />
            {t("login.remember")}
          </label>
          <button
            type="button"
            onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
            className="font-semibold text-accent transition-colors hover:underline"
          >
            {t("login.forgot")}
          </button>
        </div>

        {serverError && (
          <div
            role="alert"
            className="mt-4 rounded-control border border-danger/35 bg-danger-soft px-3.5 py-2.5 text-sm text-ink"
          >
            {serverError}
          </div>
        )}

        {/* Sign In */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-7 h-14 w-full rounded-control bg-accent text-lg font-bold text-white shadow-[var(--shadow-surface)] transition-[background-color,transform] duration-100 hover:bg-accent-strong active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-65"
        >
          {isSubmitting ? "..." : t("login.signin")}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center">
        <div className="h-px flex-1 bg-line" />
        <span className="px-4 text-xs text-subtle">{t("login.orContinue")}</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      {/* Social Login */}
      <div className="grid grid-cols-3 gap-3">
        <button type="button" aria-label="Google" className={socialButtonClass}>
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6" alt="" />
        </button>
        <button type="button" aria-label="Microsoft" className={socialButtonClass}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" className="w-6" alt="" />
        </button>
        <button type="button" aria-label="Apple" className={socialButtonClass}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
            className="w-6"
            style={{ filter: "var(--nobo-logo-filter)" }}
            alt=""
          />
        </button>
      </div>

      {/* Register */}
      <div className="mt-7 text-center text-sm">
        <span className="text-muted">{t("login.newTo")}</span>{" "}
        <button
          type="button"
          onClick={() => navigate(ROUTES.REGISTER)}
          className="font-bold text-accent transition-colors hover:underline"
        >
          {t("login.createAccount")}
        </button>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginCard />
    </AuthLayout>
  );
}
