import { useEffect } from "react";
import "./auth.css";
import { Lightbulb, PieChart, Cloud as CloudIcon, TrendingUp } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import noboLogo from "../../../assets/nobo-logo-dark.png";
import earthBall from "../../../assets/earthBall.jpeg";
import LogoNobo from "../../../assets/LogoNobo.png";

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

const pillars = [
  {
    letter: "N",
    name: "INNOVATION",
    color: "#f43f5e",
    Icon: Lightbulb,
    keywords: "AI · Automation · Creativity · Customer Experience",
    titleKey: "login.pillar.innovationTitle",
  },
  {
    letter: "O",
    name: "VALUE",
    color: "#facc15",
    Icon: PieChart,
    keywords: "Finance · Accounting · Profit · Intelligence",
    titleKey: "login.pillar.valueTitle",
  },
  {
    letter: "B",
    name: "TECHNOLOGY",
    color: "#3b82f6",
    Icon: CloudIcon,
    keywords: "Cloud · Data · Security · Integration",
    titleKey: "login.pillar.technologyTitle",
  },
  {
    letter: "O",
    name: "GROWTH",
    color: "#22c55e",
    Icon: TrendingUp,
    keywords: "Operations · Sales · Inventory · Expansion",
    titleKey: "login.pillar.growthTitle",
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

export default function AuthLayout({ children }) {
  const { t, dir } = useI18n();

  // The auth pages are a fixed dark "space" design (stars, globe); keep them dark whatever the
  // saved app theme is, and hand the theme back when leaving.
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset.theme;
    root.dataset.theme = "dark";
    return () => {
      if (previous) root.dataset.theme = previous;
    };
  }, []);

  return (
    <div
      dir={dir}
      className="bg-space min-h-screen w-full relative overflow-hidden text-white"
    >
      <div className="auth-stars absolute inset-0 pointer-events-none" aria-hidden="true" />
      {/* main */}
      <div className="relative z-10 grid xl:grid-cols-[360px_minmax(0,1fr)_460px] gap-6 xl:gap-10 items-center max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 md:pt-12">
        {/* left */}
        <div className="hidden space-y-8 order-2 xl:order-1 xl:self-start max-w-[360px] xl:block">
          <div>
            <img
              src={noboLogo}
              alt="nobo ERP III"
              className="w-full max-w-[260px] object-contain"
            />
            <p className="text-gray-400 mt-2 text-sm">{t("login.smartPlatform")}</p>
          </div>

          <div className="flex flex-col gap-3 translate-x-6">
            {pillars.map(({ letter, name, color, Icon, keywords, titleKey }) => (
              <div key={name} className="flex h-[92px] items-center gap-4 px-2">
                <div className="flex w-16 shrink-0 flex-col items-center gap-1" style={{ color }}>
                  <Icon size={34} strokeWidth={2} />
                  <span className="text-3xl font-black leading-none">{letter}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-extrabold tracking-wide" style={{ color }}>{name}</div>
                  <div className="mt-0.5 text-xs text-gray-300" dir="ltr">{keywords}</div>
                  <div className="mt-1 text-sm font-bold leading-snug text-white">{t(titleKey)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* logo for screens where the left column is hidden */}
        <div className="order-first flex justify-center xl:hidden">
          <img src={noboLogo} alt="nobo ERP III" className="w-[200px] object-contain sm:w-[240px]" />
        </div>

        {/* center image */}
        <div className="order-1 xl:order-2 flex items-center justify-center relative mx-auto w-full max-w-md xl:max-w-none">
          <img
            src={earthBall}
            alt=""
            className="auth-float relative z-20 w-full max-w-[640px] h-auto object-contain rounded-3xl"
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

        {/* right card slot */}
        <div className="order-3 flex items-center justify-center pb-2 xl:pb-0">
          {children}
        </div>
      </div>

      {/* social follow row */}
      <div className="relative z-10 mt-6 flex items-center justify-center gap-2 px-6">
        {socialBrands.map((s) => (
          <a
            key={s.id}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            title={s.label}
            className="glow-badge p-3 flex items-center justify-center text-gray-300 transition-all duration-200 hover:scale-105 hover:text-white hover:border-blue-500/60"
            style={{ color: s.color }}
          >
            <BrandIcon id={s.id} size={16} />
          </a>
        ))}
      </div>

      <div className="relative z-10 text-center text-[11px] text-gray-500 pb-6 mt-6 tracking-widest">
        {t("login.copyright")}
      </div>
    </div>
  );
}
