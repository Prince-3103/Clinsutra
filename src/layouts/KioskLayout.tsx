import { Outlet } from "react-router-dom"
import {
  AudioButton,
  BrandLogo,
  LanguageToggle,
  ProgressBar,
} from "@/components/common"
import { useKioskFlow, useTranslation } from "@/hooks"

/**
 * Kiosk chrome: header, progress and footer.
 *
 * The welcome and completion screens are full-bleed by design, so the chrome is
 * bound to the same flag that hides the progress bar — one source of truth.
 */
export function KioskLayout() {
  const { t } = useTranslation()
  const flow = useKioskFlow()

  if (!flow.showProgress) {
    return <Outlet />
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F0F7FA" }}>
      <header className="bg-white border-b border-[#D1E4ED] px-4 py-3 flex items-center justify-between gap-3 shrink-0 shadow-sm sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo size="sm" />
          <div>
            <div className="font-bold text-[#0D1B2A] text-base leading-tight sm:text-lg">
              {t("brand.name")}
            </div>
            <div className="text-xs text-[#5A7184]">{t("brand.tagline.short")}</div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageToggle />
          <AudioButton size="sm" text={t("brand.tagline.full")} />
        </div>
      </header>

      <div className="px-4 pt-5 pb-0 shrink-0 sm:px-8">
        <ProgressBar current={flow.step} total={flow.total} />
      </div>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-[#D1E4ED] px-4 py-2 flex flex-col items-start justify-between gap-1 shrink-0 sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center gap-2 text-xs text-[#5A7184]">
          <span className="w-2 h-2 bg-[#10B981] rounded-full" />
          {t("shell.systemOnline")}
        </div>
        <div className="text-xs text-[#5A7184]">
          {t("shell.assistance")} — {t("shell.extension")}
        </div>
      </footer>
    </div>
  )
}
