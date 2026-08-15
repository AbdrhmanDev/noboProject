import { useI18n } from "../../../i18n/I18nContext";
import noboLogo from "../../../assets/nobo-logo-transparent.png";
import earthBall from "../../../assets/earthBall.jpeg";
import LogoNobo from "../../../assets/LogoNobo.png";
import sheild from "../../../assets/icons/Sheild.png";
import Charge from "../../../assets/icons/Charge.png";
import Cloud from "../../../assets/icons/Cloud.png";
import analysis from "../../../assets/icons/analysis.png";
import Signal from "../../../assets/icons/Signal.png";
import Speaker from "../../../assets/icons/Speaker.png";
import Sheild from "../../../assets/icons/Sheild.png";
import brain2 from "../../../assets/icons/brain2.png";
import world2 from "../../../assets/icons/world2.png";
import tab2 from "../../../assets/icons/tab2.png";

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

function SideFeature({ img, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 p-0 flex items-center justify-center">
        <img src={img} alt="" className="w-16 h-16 object-contain" />
      </div>
      <div>
        <div className="font-bold text-sm text-white">{title}</div>
        <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }) {
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
            />
            <SideFeature
              img={brain2}
              title={t("login.noboIntelligence")}
              desc={t("login.noboIntelligenceDesc")}
            />
            <SideFeature
              img={world2}
              title={t("login.fromSaudi")}
              desc={t("login.fromSaudiDesc")}
            />
            <SideFeature
              img={Cloud}
              title={t("login.allDevices")}
              desc={t("login.allDevicesDesc")}
            />
            <SideFeature
              img={analysis}
              title={t("login.reports")}
              desc={t("login.reportsDesc")}
            />
            <SideFeature
              img={tab2}
              title={t("login.allLanguages")}
              desc={t("login.allLanguagesDesc")}
            />
            <SideFeature
              img={Speaker}
              title={t("login.support")}
              desc={t("login.supportDesc")}
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

        {/* right card slot */}
        <div className="order-3 flex items-center justify-center pb-2 xl:pb-0">
          {children}
        </div>
      </div>

      {/* stats & compliance row */}
      <div className="relative z-10 max-w-7xl mx-auto mt-10 px-4 flex flex-wrap items-center justify-center gap-6">
        {[
          { img: sheild, label: t("login.trusted") },
          { img: Charge, label: t("login.compliance") },
          { img: Cloud, label: t("login.availability") },
          { img: analysis, label: t("login.instaReports") },
          { img: Signal, label: t("login.multiLang") },
          { img: Speaker, label: t("login.supportAll") },
        ].map((s, i) => (
          <div key={i} className="flex flex-col items-center justify-center gap-1.5 text-center">
            <img src={s.img} alt="" className="w-16 h-16 object-contain" />
            <div className="text-[11px] text-gray-400 leading-snug max-w-[160px]">{s.label}</div>
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
