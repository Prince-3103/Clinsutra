import { useNavigate } from "react-router-dom"
import { BrandLogo, LanguageToggle } from "@/components/common"
import { useTranslation } from "@/hooks"
import { cn } from "@/utils"

/**
 * Public landing page (the `/kiosk` index).
 *
 * A full-viewport healthcare hero: patients tap "Start Consultation" to enter
 * the existing kiosk flow (`/kiosk/identify`); clinicians reach the existing
 * auth via "Doctor Login" (`/doctor/login`). No demo toggle is shown here.
 */

const NAV = [
  { key: "landing.nav.opd", href: "#opd" },
  { key: "landing.nav.how", href: "#how" },
  { key: "landing.nav.patients", href: "#patients" },
  { key: "landing.nav.vision", href: "#vision" },
] as const

function FeatureItem({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden
        className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#E8F4F8] text-lg text-[#0A6E8A]"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-semibold leading-tight text-[#0D1B2A]">{title}</div>
        <div className="text-xs text-[#5A7184]">{sub}</div>
      </div>
    </div>
  )
}

/** A calm, brand-styled illustration of a hospital kiosk (no stock photo). */
function HeroVisual() {
  const { t } = useTranslation()
  return (
    <div className="relative w-full max-w-md">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-[#E8F4F8] via-white to-[#DDEEF6] blur-2xl"
      />
      <div className="relative rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-2xl shadow-[#0A6E8A]/10 backdrop-blur-sm sm:p-8">
        <div className="rounded-3xl bg-gradient-to-b from-[#F7FBFD] to-[#E8F4F8] p-6 shadow-inner">
          <div className="flex flex-col items-center gap-3 text-center">
            <BrandLogo size="md" />
            <div className="text-xl font-bold text-[#0D1B2A]">Clinsutra</div>
            <div className="text-sm text-[#5A7184]">{t("landing.heroCardTagline")}</div>
            <svg viewBox="0 0 220 48" className="mt-2 h-10 w-full" aria-hidden>
              <path
                d="M0 30 H60 l10 -18 l12 30 l10 -24 l10 12 H220"
                fill="none"
                stroke="#0A6E8A"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-1 flex w-full gap-2">
              <div className="h-2 flex-1 rounded-full bg-[#CFE6F0]" />
              <div className="h-2 flex-1 rounded-full bg-[#CFE6F0]" />
              <div className="h-2 w-6 rounded-full bg-[#0A6E8A]" />
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-center gap-3">
          <span aria-hidden className="text-2xl">👩‍⚕️</span>
          <span className="text-sm font-medium text-[#5A7184]">
            {t("landing.eyebrow").split(" • ").join("  ·  ")}
          </span>
        </div>
      </div>
    </div>
  )
}

export function WelcomePage() {
  const navigate = useNavigate()
  const { t, scriptClass } = useTranslation()

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5FAFC] via-white to-[#EAF3F8] text-[#0D1B2A]">
      {/* Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" />
          <div className="leading-tight">
            <div className="text-lg font-bold">Clinsutra</div>
            <div className="text-xs text-[#5A7184]">{t("landing.brandTagline")}</div>
          </div>
        </div>

        <nav className="hidden items-center gap-7 text-sm font-medium text-[#3A5568] lg:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-[#0A6E8A]">
              {t(item.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle />
          <button
            type="button"
            onClick={() => navigate("/doctor/login")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full bg-[#0D1B2A] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#0A6E8A]",
              scriptClass,
            )}
          >
            <span aria-hidden>👤</span>
            {t("landing.doctorLogin")} →
          </button>
        </div>
      </header>

      {/* Hero */}
      <main
        id="opd"
        className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-10 pt-6 sm:px-8 lg:min-h-[calc(100vh-88px)] lg:grid-cols-2 lg:gap-8 lg:pb-16 lg:pt-0"
      >
        <div className="flex flex-col gap-6">
          <div className="text-xs font-bold tracking-[0.25em] text-[#5A9AB8]">
            {t("landing.eyebrow")}
          </div>

          <h1 className={cn("text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl", scriptClass)}>
            {t("landing.headline1")}
            <br />
            <span className="font-serif italic text-[#4C9AC0]">{t("landing.headline2")}</span>
          </h1>

          <p className={cn("max-w-xl text-base text-[#3A5568] sm:text-lg", scriptClass)}>
            {t("landing.subtitle")}
          </p>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => navigate("/kiosk/identify")}
              className={cn(
                "group inline-flex w-full items-center justify-between gap-4 rounded-full bg-[#0A6E8A] px-6 py-4 text-lg font-bold text-white shadow-xl shadow-[#0A6E8A]/25 transition-all hover:bg-[#085F78] active:scale-[0.99] sm:w-auto sm:pr-3",
                scriptClass,
              )}
            >
              <span className="flex items-center gap-3">
                <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-xl">🎙</span>
                {t("landing.cta")}
              </span>
              <span aria-hidden className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-xl transition-transform group-hover:translate-x-0.5">›</span>
            </button>
            <p className={cn("text-sm text-[#5A7184]", scriptClass)}>{t("landing.ctaHint")}</p>
          </div>

          {/* Feature strip */}
          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FeatureItem icon="💬" title={t("landing.feature.voice.title")} sub={t("landing.feature.voice.sub")} />
            <FeatureItem icon="📄" title={t("landing.feature.docs.title")} sub={t("landing.feature.docs.sub")} />
            <FeatureItem icon="🛡" title={t("landing.feature.secure.title")} sub={t("landing.feature.secure.sub")} />
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <HeroVisual />
        </div>
      </main>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
        <h2 className={cn("text-2xl font-bold sm:text-3xl", scriptClass)}>{t("landing.how.title")}</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["landing.how.step1", "landing.how.step2", "landing.how.step3", "landing.how.step4"].map(
            (key, i) => (
              <div key={key} className="rounded-2xl border border-[#D1E4ED] bg-white p-5 shadow-sm">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#0A6E8A] font-bold text-white">
                  {i + 1}
                </div>
                <p className={cn("mt-3 text-sm text-[#3A5568]", scriptClass)}>{t(key as "landing.how.step1")}</p>
              </div>
            ),
          )}
        </div>
      </section>

      {/* For patients / Our vision */}
      <section id="patients" className="mx-auto max-w-7xl px-4 pb-12 sm:px-8">
        <div id="vision" className="rounded-3xl bg-gradient-to-br from-[#0A6E8A] to-[#0D5570] p-8 text-white sm:p-10">
          <h2 className={cn("text-2xl font-bold sm:text-3xl", scriptClass)}>{t("landing.vision.title")}</h2>
          <p className={cn("mt-3 max-w-3xl text-base text-white/90 sm:text-lg", scriptClass)}>
            {t("landing.vision.body")}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#D1E4ED] bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-10 sm:px-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <BrandLogo size="xs" />
              <span className="text-lg font-bold">Clinsutra</span>
            </div>
            <div className="mt-1 text-sm text-[#5A7184]">{t("brand.tagline.full")}</div>
            <div className="mt-1 text-sm text-[#5A7184]">{t("welcome.hospital")}</div>
          </div>
          <div className="flex items-start md:justify-center">
            <p className={cn("text-sm font-medium italic text-[#0A6E8A]", scriptClass)}>
              {t("landing.footer.motto")}
            </p>
          </div>
          <div className="flex items-start gap-6 text-sm font-medium text-[#3A5568] md:justify-end">
            <a href="#opd" className="hover:text-[#0A6E8A]">{t("landing.footer.privacy")}</a>
            <a href="#opd" className="hover:text-[#0A6E8A]">{t("landing.footer.terms")}</a>
            <a href="#opd" className="hover:text-[#0A6E8A]">{t("landing.footer.contact")}</a>
          </div>
        </div>
        <div className="border-t border-[#EEF3F6] py-4 text-center text-xs text-[#5A7184]">
          {t("landing.footer.rights")}
        </div>
      </footer>
    </div>
  )
}
