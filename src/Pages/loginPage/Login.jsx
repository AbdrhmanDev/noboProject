import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import LanguageSwitcher from "../../i18n/LanguageSwitcher";
import noboLogo from "../../assets/nobo-logo-transparent.png";
import earthBall from "../../assets/earthBall.jpeg";
import LogoNobo from "../../assets/LogoNobo.png";
import sheild from "../../assets/icons/Sheild.png";
import Charge from "../../assets/icons/Charge.png";
import Cloud from "../../assets/icons/Cloud.png";
import analysis from "../../assets/icons/analysis.png";
import Signal from "../../assets/icons/Signal.png";
import Speaker from "../../assets/icons/Speaker.png";
import Sheild from "../../assets/icons/Sheild.png";
import brain2 from "../../assets/icons/brain2.png";
import world2 from "../../assets/icons/world2.png";
import tab2 from "../../assets/icons/tab2.png";

import { ROUTES } from "../../utils/routes";

const socialBrands = [
  {
    id: "apple-icon",
    label: "Apple",
    href: "https://www.apple.com",
    color: "#e2e8f0",
  },
  {
    id: "microsoft-icon",
    label: "Microsoft",
    href: "https://www.microsoft.com",
    color: "#e2e8f0",
  },
  {
    id: "google-icon",
    label: "Google",
    href: "https://www.google.com",
    color: "#e2e8f0",
  },
  {
    id: "bluesky-icon",
    label: "Bluesky",
    href: "https://bsky.app/profile/nobo.bsky.social",
    color: "#38bdf8",
  },
];

function BrandIcon({ id, size = 12, className = "", color }) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      fill="none"
      style={color ? { color } : undefined}
      aria-hidden="true"
    >
      <use href={`/icons.svg#${id}`} />
    </svg>
  );
}

function SideFeature({ img, title, desc, color }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="mt-1 rounded-2xl p-3"
        style={{
          background: `${color}18`,
          border: `1px solid ${color}55`,
          boxShadow: `0 0 20px ${color}22`,
        }}
      >
        <img src={img} alt="" className="w-3 h-3 object-contain" />
      </div>
      <div>
        <div className="font-bold text-sm text-white">{title}</div>
        <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

function LoginCard() {
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState("online");
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleSignIn = () => {
    navigate(ROUTES.DASHBOARD);
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

        {/* Email */}
        <div className="mt-6">
          <label className="block text-xs mb-1.5 text-gray-300">
            {t("login.emailLabel")}
          </label>
          <div className="flex items-center gap-3 h-12 rounded-xl border border-white/10 bg-white/5 px-4 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/30">
            <Mail size={15} className="text-gray-400" />
            <input
              type="text"
              placeholder={t("login.emailPlaceholder")}
              className="flex-1 bg-transparent outline-none placeholder:text-gray-500"
            />
          </div>
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
              placeholder={t("login.passwordPlaceholder")}
              className="flex-1 bg-transparent outline-none placeholder:text-gray-500"
            />
            <button onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Remember + Forgot */}
        <div className="mt-5 flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-violet-600"
              defaultChecked
            />
            {t("login.remember")}
          </label>
          <button className="text-violet-400 hover:text-violet-300 transition">
            {t("login.forgot")}
          </button>
        </div>

        {/* Sign In */}
        <motion.button
          onClick={handleSignIn}
          whileHover={{ scale: 1.02, boxShadow: "0 0 35px rgba(124,92,255,.35)" }}
          whileTap={{ scale: 0.98 }}
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
          "
        >
          {t("login.signin")}
        </motion.button>

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
            onClick={() => navigate(ROUTES.SIGNUP)}
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
  const [isDark, setIsDark] = useState(true);
  const { t, dir } = useI18n();

  return (
    <div
      dir={dir}
      className="bg-space min-h-screen w-full relative overflow-hidden text-white"
    >
      <div className="bg-stars absolute inset-0 pointer-events-none" />
      {/* top badges */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 md:px-10 pt-4 md:pt-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black">
            <span className="brand-text">nobo</span>
          </span>
          <span className="font-tajawal text-lg text-gray-400 tracking-widest font-bold">
            ERP III
          </span>
        </div>
<div className="relative z-10 w-full max-w-full overflow-x-auto pt-3 scrollbar-none">
          <div className="flex w-max items-center gap-2 pb-1">

            {/* AI */}
            <div className="glow-badge h-[58px] w-[123px] rounded-xl px-2.5 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#00bfff"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 18V5" />
                <path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" />
                <path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5" />
                <path d="M17.997 5.125a4 4 0 0 1 2.526 5.77" />
                <path d="M18 18a4 4 0 0 0 2-7.464" />
                <path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" />
                <path d="M6 18a4 4 0 0 1-2-7.464" />
                <path d="M6.003 5.125a4 4 0 0 0-2.526 5.77" />
              </svg>

<div className="leading-tight" dir={dir}>
                <div className="text-[12px] font-bold text-white">
                  {t("login.badgeAiTitle")}
                </div>
                <div className="text-[10px] text-gray-300">
                  {t("login.badgeAiSub")}
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="glow-badge h-[58px] w-[123px] rounded-xl px-2.5 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#00c8ff"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                <path d="m9 12 2 2 4-4" />
              </svg>

<div className="leading-tight" dir={dir}>
                <div className="text-[12px] font-bold text-white">
                  {t("login.badgeSecurityTitle")}
                </div>
                <div className="text-[10px] text-gray-300">
                  {t("login.badgeSecuritySub")}
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="glow-badge h-[58px] w-[123px] rounded-xl px-2.5 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#00cfff"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="M20 12h2" />
                <path d="m19.07 4.93-1.41 1.41" />
                <path d="M15.947 12.65a4 4 0 0 0-5.925-4.128" />
                <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />
              </svg>

<div className="leading-tight" dir={dir}>
                <div className="text-[12px] font-bold text-white">
                  {t("login.badgeAvailTitle")}
                </div>
                <div className="text-[10px] text-gray-300">
                  {t("login.badgeAvailSub")}
                </div>
              </div>
            </div>

            {/* Performance */}
            <div className="glow-badge h-[58px] w-[123px] rounded-xl px-2.5 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f5b800"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 14 4-4" />
                <path d="M3.34 19a10 10 0 1 1 17.32 0" />
              </svg>

<div className="leading-tight" dir={dir}>
                <div className="text-[12px] font-bold text-white">
                  {t("login.badgePerfTitle")}
                </div>
                <div className="text-[10px] text-gray-300">
                  {t("login.badgePerfSub")}
                </div>
              </div>
            </div>

            {/* Dark Mode */}
            <button
              type="button"
onClick={() => setIsDark((d) => !d)}
              className="glow-badge h-[58px] w-[132px] rounded-xl px-2.5 flex items-center gap-2"
            >
              {/* Moon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="31"
                height="31"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401Z" />
              </svg>

<div className="flex-1 leading-tight" dir={dir}>
                <div className="text-[12px] font-bold text-white">
                  {t("login.badgeNightTitle")}
                </div>
                <div className="text-[10px] text-gray-300">
                  {t("login.badgeNightSub")}
                </div>
              </div>

              {/* Toggle */}
              <span
                className={`relative inline-flex h-4 w-8 shrink-0 rounded-full transition-colors ${
                  isDark
                    ? "bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.8)]"
                    : "bg-gray-500 shadow-[0_0_8px_rgba(148,163,184,0.6)]"
                }`}
              >
                <span
                  className={`absolute top-[2px] left-[2px] h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${
                    isDark ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </span>
            </button>

          </div>
        </div>
      </div>

      {/* main */}
      <div className="relative z-10 grid xl:grid-cols-[360px_minmax(0,1fr)_340px] gap-6 xl:gap-10 items-center max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 pt-4">
        {/* left */}
        <div className="hidden space-y-8 order-2 xl:order-1 max-w-[360px] xl:block">
          <div>
            <img
              src={noboLogo}
              alt="nobo ERP III"
              className="w-full max-w-[260px] object-contain"
            />
            <p className="text-gray-400 mt-2 text-sm">{t("login.smartPlatform")}</p>
          </div>
          <div className="space-y-4">
            <SideFeature
              img={Sheild}
              title={t("login.businessPower")}
              desc={t("login.businessPowerDesc")}
              color="#2b8cff"
            />
            <SideFeature
              img={brain2}
              title={t("login.noboIntelligence")}
              desc={t("login.noboIntelligenceDesc")}
              color="#ff3d6b"
            />
            <SideFeature
              img={world2}
              title={t("login.fromSaudi")}
              desc={t("login.fromSaudiDesc")}
              color="#f5b800"
            />
            <SideFeature
              img={Cloud}
              title={t("login.allDevices")}
              desc={t("login.allDevicesDesc")}
              color="#17d9c4"
            />
            <SideFeature
              img={analysis}
              title={t("login.reports")}
              desc={t("login.reportsDesc")}
              color="#ff3d6b"
            />
            <SideFeature
              img={tab2}
              title={t("login.allLanguages")}
              desc={t("login.allLanguagesDesc")}
              color="#f5b800"
            />
            <SideFeature
              img={Speaker}
              title={t("login.support")}
              desc={t("login.supportDesc")}
              color="#ff3d6b"
            />
          </div>
        </div>

        {/* center image */}
        <div className="order-1 xl:order-2 flex items-center justify-center relative mx-auto w-full max-w-md xl:max-w-none">
          <img
            src={earthBall}
            alt=""
            className="relative z-20 w-full max-w-[640px] h-auto object-contain rounded-3xl float"
            style={{ filter: "brightness(1.05) contrast(1.02) saturate(1.05)" }}
          />
          <div className="absolute left-1/2 bottom-0 z-30 -translate-x-1/2 translate-y-8 md:translate-y-10 lg:translate-y-12 w-[640px] max-w-full pointer-events-none">
            <img
              src={LogoNobo}
              alt="NOBO Logo"
              className="w-[130%] h-auto drop-shadow-none"
              style={{ filter: "drop-shadow(0 0 0 transparent)" }}
            />
          </div>
        </div>

        {/* right login card */}
        <div className="order-3 flex items-center justify-center pb-2 xl:pb-0">
          <LoginCard />
        </div>
      </div>

      {/* stats & compliance row — 6 photos only (no rectangles) */}
      <div className="relative z-10 max-w-7xl mx-auto mt-10 px-4 flex flex-wrap items-center justify-center gap-6">
        {[
          { img: sheild, label: t("login.trusted") },
          { img: Charge, label: t("login.compliance") },
          { img: Cloud, label: t("login.availability") },
          { img: analysis, label: t("login.instaReports"), scale: true },
          { img: Signal, label: t("login.multiLang") },
          { img: Speaker, label: t("login.supportAll"), scale: true },
        ].map((s, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center gap-1.5 text-center"
          >
            <img
              src={s.img}
              alt=""
              className={`w-24 h-24 object-contain ${s.scale ? "scale-150" : ""}`}
            />
            <div className="text-[11px] text-gray-400 leading-snug max-w-[160px]">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* social follow row */}
      <div className="relative z-10 mt-6 flex items-center justify-center gap-2 px-6">
        <span className="text-xs text-gray-400 mr-2">{t("login.followUs")}</span>
        {socialBrands.map((s) => (
          <a
            key={s.id}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            title={s.label}
            className="glow-badge rounded-xl p-2.5 flex items-center justify-center text-gray-300 transition-all duration-200 hover:scale-105 hover:text-white hover:border-blue-500/60"
            style={{ color: s.color }}
          >
            <BrandIcon id={s.id} size={12} />
          </a>
        ))}
      </div>

      <div className="relative z-10 text-center text-[11px] text-gray-500 pb-6 mt-6 tracking-widest">
        {t("login.copyright")}
      </div>
    </div>
  );
}
