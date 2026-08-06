import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Brain, ShieldCheck, CloudSun, Gauge, Moon,
  ChevronDown, Eye, EyeOff, Lock, Mail,
} from "lucide-react";
import noboLogo from "../../assets/noboIIISvgREQuired.webp";
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
  { id: "apple-icon", label: "Apple", href: "https://www.apple.com", color: "#e2e8f0" },
  { id: "microsoft-icon", label: "Microsoft", href: "https://www.microsoft.com", color: "#e2e8f0" },
  { id: "google-icon", label: "Google", href: "https://www.google.com", color: "#e2e8f0" },
  { id: "bluesky-icon", label: "Bluesky", href: "https://bsky.app/profile/nobo.bsky.social", color: "#38bdf8" },
];

function BrandIcon({ id, size = 18, className = "", color }) {
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

function FeatureBadge({ icon: Icon, label, color, extra }) {
  return (
    <div className="glow-badge rounded-2xl px-4 py-2 flex items-center gap-2 text-xs text-gray-200">
      <Icon size={16} color={color} />
      <span>{label}</span>
      {extra}
    </div>
  );
}

function SideFeature({ img, title, desc, color }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 rounded-2xl p-3"
        style={{
          background: `${color}18`,
          border: `1px solid ${color}55`,
          boxShadow: `0 0 20px ${color}22`,
        }}
      >
        <img src={img} alt="" className="w-5 h-5 object-contain" />
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
        max-w-[430px]
        rounded-[30px]
        border
        border-white/10
        bg-[#0d1224]/70
        backdrop-blur-3xl
        shadow-[0_0_80px_rgba(124,92,255,.15)]
        p-8
      "
    >
      {/* Background Glow */}
      <div className="absolute inset-0 rounded-[30px] overflow-hidden">
        <div className="absolute -top-40 right-0 w-72 h-72 bg-violet-600/20 blur-[130px]" />
        <div className="absolute bottom-0 -left-20 w-64 h-64 bg-blue-500/20 blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* Language */}
        <div className="flex justify-end">
          <button className="
            flex
            items-center
            gap-2
            rounded-xl
            border
            border-white/10
            bg-white/5
            px-4
            py-2
            text-sm
            hover:bg-white/10
            transition
          ">
            العربية
            <ChevronDown size={16} />
          </button>
        </div>

        {/* Header */}
        <div className="mt-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome Back
          </h1>
          <p className="mt-3 text-gray-400 text-sm">
            Sign in to your NOBO ERP account
          </p>
        </div>

        {/* Online Offline */}
        <div className="mt-8">
          <div className="
            flex
            rounded-2xl
            border
            border-white/10
            bg-white/5
            overflow-hidden
          ">
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
              Online
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
              Offline
            </button>
          </div>
        </div>

        {/* Email */}
        <div className="mt-8">
          <label className="block text-sm mb-2 text-gray-300">
            Email or Username
          </label>
          <div className="
            flex
            items-center
            gap-3
            h-14
            rounded-2xl
            border
            border-white/10
            bg-white/5
            px-4
            transition
            focus-within:border-violet-500
            focus-within:ring-2
            focus-within:ring-violet-500/30
          ">
            <Mail size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Enter your email"
              className="
                flex-1
                bg-transparent
                outline-none
                placeholder:text-gray-500
              "
            />
          </div>
        </div>

        {/* Password */}
        <div className="mt-5">
          <label className="block text-sm mb-2 text-gray-300">
            Password
          </label>
          <div className="
            flex
            items-center
            gap-3
            h-14
            rounded-2xl
            border
            border-white/10
            bg-white/5
            px-4
            transition
            focus-within:border-violet-500
            focus-within:ring-2
            focus-within:ring-violet-500/30
          ">
            <Lock size={18} className="text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="
                flex-1
                bg-transparent
                outline-none
                placeholder:text-gray-500
              "
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
            Remember Me
          </label>
          <button className="text-violet-400 hover:text-violet-300 transition">
            Forgot Password?
          </button>
        </div>

{/* Sign In */}
        <motion.button
          onClick={handleSignIn}
          whileHover={{
            scale: 1.02,
            boxShadow: "0 0 35px rgba(124,92,255,.35)",
          }}
          whileTap={{
            scale: .98,
          }}
          className="
            mt-7
            w-full
            h-14
            rounded-2xl
            font-semibold
            text-white
            bg-gradient-to-r
            from-violet-600
            to-blue-500
            hover:from-violet-500
            hover:to-blue-400
            transition-all
          "
        >
          Sign In
        </motion.button>

        {/* Divider */}
        <div className="my-8 flex items-center">
          <div className="flex-1 h-px bg-white/10" />
          <span className="px-4 text-xs text-gray-500">
            Or continue with
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Social Login */}
        <div className="grid grid-cols-3 gap-3">
          <motion.button
            whileHover={{ y: -3, scale: 1.03 }}
            className="
              h-14
              rounded-2xl
              border
              border-white/10
              bg-white/5
              hover:bg-white/10
              transition
              flex
              items-center
              justify-center
            "
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              className="w-6"
              alt=""
            />
          </motion.button>
          <motion.button
            whileHover={{ y: -3, scale: 1.03 }}
            className="
              h-14
              rounded-2xl
              border
              border-white/10
              bg-white/5
              hover:bg-white/10
              transition
              flex
              items-center
              justify-center
            "
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
              className="w-6"
              alt=""
            />
          </motion.button>
          <motion.button
            whileHover={{ y: -3, scale: 1.03 }}
            className="
              h-14
              rounded-2xl
              border
              border-white/10
              bg-white/5
              hover:bg-white/10
              transition
              flex
              items-center
              justify-center
            "
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
              className="w-5 invert"
              alt=""
            />
          </motion.button>
        </div>

        {/* Register */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            New to NOBO ERP?
          </p>
          <button className="mt-2 font-semibold text-violet-400 hover:text-violet-300 transition">
            Create your account
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  const [dark, setDark] = useState(true);

  return (
    <div dir="ltr" className="bg-space min-h-screen w-full relative overflow-hidden text-white">
      <div className="bg-stars absolute inset-0 pointer-events-none" />
      {/* top badges */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-6 md:px-10 pt-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black">
            <span className="brand-text">nobo</span>
          </span>
          <span className="font-tajawal text-lg text-gray-400 tracking-widest font-bold">ERP III</span>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <FeatureBadge icon={Brain} label="ذكاء اصطناعي مساعد ذكي" color="#c084fc" />
          <FeatureBadge icon={ShieldCheck} label="أمان متقدم حماية بياناتك" color="#2b8cff" />
          <FeatureBadge icon={CloudSun} label="متاح دائماً جاهزية 99.9%" color="#38bdf8" />
          <FeatureBadge icon={Gauge} label="أداء فائق سرعة وثبات" color="#f5b800" />
          <button
            onClick={() => setDark((d) => !d)}
            className="glow-badge rounded-2xl px-4 py-2 flex items-center gap-2 text-xs text-gray-200"
          >
            <Moon size={16} color="#a5b4fc" />
            <span>الوضع الليلي راحة لعينيك</span>
            <span className="w-8 h-4 rounded-full toggle-track relative inline-block">
              <span
                className="toggle-thumb absolute top-0.5 w-3 h-3 bg-white rounded-full"
                style={{ left: dark ? "2px" : "18px" }}
              />
            </span>
          </button>
        </div>
      </div>

      {/* main */}
      <div className="relative z-10 grid lg:grid-cols-[380px_1fr_430px] gap-12 items-center max-w-[1650px] mx-auto px-10 pt-4">
        {/* left */}
        <div className="space-y-8 order-2 lg:order-1 max-w-[360px]">
          <div>
            <img src={noboLogo} alt="nobo ERP III" className="w-full max-w-[260px] object-contain" />
            <p className="text-gray-400 mt-2 text-sm">منصة ERP ذكية لإدارة أعمالك بلا حدود</p>
          </div>
<div className="space-y-4">
            <SideFeature img={Sheild} title="قوة أعمالك" desc="نظام متكامل لإدارة جميع عملياتك" color="#2b8cff" />
            <SideFeature img={brain2} title="ذكاء نوبو" desc="تحليلات ذكية وتوقعات دقيقة لدعم نمو أعمالك" color="#ff3d6b" />
            <SideFeature img={world2} title="من السعودية للعالم" desc="إدارة محلية برؤية عالمية" color="#f5b800" />
          </div>
          <div className="panel rounded-3xl p-2 flex flex-col pt-2 w-fit">
            <div className="p-3 text-xs text-gray-300 flex items-start gap-2">
              <img src={Cloud} alt="" className="w-4 h-4 mt-0.5 shrink-0 object-contain" />
              يعمل أونلاين وأوفلاين، استمر في عملك بدون إنترنت
            </div>
            <div className="p-3 text-xs text-gray-300 flex items-start gap-2">
              <img src={analysis} alt="" className="w-4 h-4 mt-0.5 shrink-0 object-contain" />
              تقارير لحظية ذكية، تقارير فورية أدق لقرارات أوسع
            </div>
            <div className="p-3 text-xs text-gray-300 flex items-start gap-2">
              <img src={tab2} alt="" className="w-4 h-4 mt-0.5 shrink-0 object-contain" />
              يعمل على جميع الأجهزة، كمبيوتر، تابلت، جوال
            </div>
            <div className="p-3 text-xs text-gray-300 flex items-start gap-2">
              <img src={Speaker} alt="" className="w-4 h-4 mt-0.5 shrink-0 object-contain" />
              دعم فني عالمي 24/7/365، طوال العام
            </div>
          </div>
        </div>

{/* center image */}
        <div className="order-1 lg:order-2 flex items-center justify-center relative">
          <img
            src={earthBall}
            alt=""
            className="relative z-20 w-[640px] max-w-full h-auto object-contain rounded-3xl float"
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
        <div className="order-3 flex items-center justify-center">
          <LoginCard />
        </div>
      </div>

{/* stats & compliance row — 6 photos only (no rectangles) */}
      <div className="relative z-10 max-w-7xl mx-auto mt-10 px-4 flex flex-wrap items-center justify-center gap-6">
        {[
          { img: sheild, label: "عميل حول العالم يثقون بنا" },
          { img: Charge, label: "أداء فائق سرعة وثبات" },
          { img: Cloud, label: "متاح دائماً جاهزية 99.9%" },
{ img: analysis, label: "تقارير لحظية ذكية", scale: true },
{ img: Signal, label: "يدعم جميع اللغات بلا حدود" },
          { img: Speaker, label: "دعم فني عالمي 24/7/365", scale: true },
        ].map((s, i) => (
          <div key={i} className="flex flex-col items-center justify-center gap-1.5 text-center">
            <img src={s.img} alt="" className={`w-24 h-24 object-contain ${s.scale ? "scale-150" : ""}`} />
            <div className="text-[11px] text-gray-400 leading-snug max-w-[160px]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* social follow row */}
      <div className="relative z-10 mt-6 flex items-center justify-center gap-2 px-6">
        <span className="text-xs text-gray-400 mr-2">تابعنا:</span>
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
            <BrandIcon id={s.id} size={16} />
          </a>
        ))}
      </div>

      <div className="relative z-10 text-center text-[11px] text-gray-500 pb-6 mt-6 tracking-widest">
        © 2024 NOBO ERP. جميع الحقوق محفوظة | نوبو ERP إدارة ذكية بلا حدود ... مستقبل بلا حدود
      </div>
    </div>
  );
}
