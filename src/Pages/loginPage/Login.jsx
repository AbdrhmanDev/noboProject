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

import { ROUTES } from "../../utils/routes";

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
      const from = location.state?.from?.pathname || ROUTES.DASHBOARD;
      navigate(from, { replace: true });
    } catch {
      setServerError(message("auth.signInFailed"));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7 }}
      className="
        relative
        w-full
        max-w-[340px]
        rounded-[24px]
        border
        border-white/10
        bg-[#0d1224]/70
        backdrop-blur-3xl
        shadow-[0_0_80px_rgba(124,92,255,.15)]
        p-6
      "
    >
      {/* Background Glow */}
      <div className="absolute inset-0 rounded-[30px] overflow-hidden">
        <div className="absolute -top-40 right-0 w-50 h-50 bg-violet-600/20 blur-[100px]" />
        <div className="absolute bottom-0 -left-20 w-64 h-64 bg-blue-500/20 blur-[100px]" />
      </div>

      <div className="relative z-10">
        {/* Language */}
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        {/* Header */}
        <div className="mt-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight">{t("login.welcome")}</h1>
          <p className="mt-2 text-gray-400 text-sm">{t("login.subtitle")}</p>
        </div>

        {/* Online Offline */}
        <div className="mt-8">
          <div className="flex rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <button
              onClick={() => setMode("online")}
              className={`
                flex-1
                py-3
                text-sm
                font-semibold
                transition
                ${
                  mode === "online"
                    ? "bg-gradient-to-r from-violet-600 to-blue-500 text-white"
                    : "text-gray-400"
                }
              `}
            >
              {t("login.online")}
            </button>
            <button
              onClick={() => setMode("offline")}
              className={`
                flex-1
                py-3
                text-sm
                font-semibold
                transition
                ${
                  mode === "offline"
                    ? "bg-gradient-to-r from-violet-600 to-blue-500 text-white"
                    : "text-gray-400"
                }
              `}
            >
              {t("login.offline")}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleSignIn)} noValidate>
          {/* Email */}
          <div className="mt-6">
            <label className="block text-xs mb-1.5 text-gray-300">
              {t("login.emailLabel")}
            </label>
            <div className="flex items-center gap-3 h-12 rounded-xl border border-white/10 bg-white/5 px-4 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/30">
              <Mail size={15} className="text-gray-400" />
              <input
                type="email"
                autoComplete="email"
                placeholder={t("login.emailPlaceholder")}
                disabled={isSubmitting}
                {...register("email")}
                className="flex-1 bg-transparent outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
            {errors.email?.message && (
              <p className="mt-1.5 text-xs text-rose-300">
                {message(errors.email.message)}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="mt-4">
            <label className="block text-xs mb-1.5 text-gray-300">
              {t("login.passwordLabel")}
            </label>
            <div className="flex items-center gap-3 h-12 rounded-xl border border-white/10 bg-white/5 px-4 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/30">
              <Lock size={15} className="text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder={t("login.passwordPlaceholder")}
                disabled={isSubmitting}
                {...register("password")}
                className="flex-1 bg-transparent outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password?.message && (
              <p className="mt-1.5 text-xs text-rose-300">
                {message(errors.password.message)}
              </p>
            )}
          </div>

          {/* Remember + Forgot */}
          <div className="mt-5 flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-violet-600"
                defaultChecked
                disabled={isSubmitting}
              />
              {t("login.remember")}
            </label>
            <button type="button" className="text-violet-400 hover:text-violet-300 transition">
              {t("login.forgot")}
            </button>
          </div>

          {serverError && (
            <div className="mt-4 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
              {serverError}
            </div>
          )}

          {/* Sign In */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={isSubmitting ? undefined : { scale: 1.02, boxShadow: "0 0 35px rgba(124,92,255,.35)" }}
            whileTap={isSubmitting ? undefined : { scale: 0.98 }}
            className="
              mt-6
              w-full
              h-12
              rounded-xl
              font-bold
              text-white
              text-base
              bg-gradient-to-r
              from-violet-600
              to-blue-500
              hover:from-violet-500
              hover:to-blue-400
              transition-all
              disabled:cursor-not-allowed
              disabled:opacity-65
            "
          >
            {isSubmitting ? "..." : t("login.signin")}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 h-px bg-white/10" />
          <span className="px-4 text-xs text-gray-500">{t("login.orContinue")}</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Social Login */}
        <div className="grid grid-cols-3 gap-3">
          <motion.button
            whileHover={{ y: -3, scale: 1.03 }}
            className="h-12 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition flex items-center justify-center"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              className="w-4"
              alt=""
            />
          </motion.button>
          <motion.button
            whileHover={{ y: -3, scale: 1.03 }}
            className="h-12 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition flex items-center justify-center"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
              className="w-4"
              alt=""
            />
          </motion.button>
          <motion.button
            whileHover={{ y: -3, scale: 1.03 }}
            className="h-12 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition flex items-center justify-center"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
              className="w-4 invert"
              alt=""
            />
          </motion.button>
        </div>

        {/* Register */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">{t("login.newTo")}</p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.REGISTER)}
            className="mt-2 font-semibold text-violet-400 hover:text-violet-300 transition"
          >
            {t("login.createAccount")}
          </button>
        </div>
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
