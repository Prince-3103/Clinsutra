import { useNavigate } from "react-router-dom"
import {
  AudioButton,
  BrandLogo,
  Button,
  Card,
  LanguageSelector,
} from "@/components/common"
import { WELCOME_DEVANAGARI } from "@/data"
import { useTranslation } from "@/hooks"

export function WelcomePage() {
  const navigate = useNavigate()
  const { t, scriptClass } = useTranslation()

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 gap-7 sm:p-8 sm:gap-10"
      style={{
        background: "linear-gradient(160deg, #E8F4F8 0%, #F0F7FA 60%, #E0EEF5 100%)",
      }}
    >
      <div className="flex flex-col items-center gap-4 fade-in">
        <BrandLogo size="lg" />
        <div className="text-center">
          <div className="text-3xl font-bold text-[#0D1B2A] tracking-tight sm:text-5xl">
            Clinsutra
          </div>
          <div className="text-sm text-[#5A7184] mt-1 sm:text-lg">
            AI-Powered Patient Case Taking
          </div>
        </div>
      </div>

      <Card
        className="p-5 text-center max-w-lg w-full slide-up sm:p-8"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="text-3xl font-bold text-[#0D1B2A] mb-2 sm:text-5xl">
          Welcome
        </div>
        <div className="text-3xl font-bold text-[#0A6E8A] devanagari mb-5 sm:text-5xl sm:mb-6">
          {WELCOME_DEVANAGARI}
        </div>
        <div className={`text-sm text-[#5A7184] sm:text-lg ${scriptClass}`}>
          {t("welcome.subtitle")}
        </div>
      </Card>

      <LanguageSelector
        className="grid w-full max-w-lg grid-cols-1 gap-4 slide-up sm:grid-cols-2 sm:gap-6"
      />

      <div
        className="flex flex-col items-center gap-5 slide-up"
        style={{ animationDelay: "0.3s" }}
      >
        <div className="flex items-center gap-3 text-[#5A7184]">
          <AudioButton size="lg" text={t("welcome.subtitle")} />
          <div className={`text-sm sm:text-lg ${scriptClass}`}>
            {t("welcome.audioHint")}
          </div>
        </div>
        <Button
          size="xl"
          onClick={() => navigate("/kiosk/identify")}
          className={`w-full px-8 sm:w-auto sm:px-16 ${scriptClass}`}
        >
          {t("welcome.cta")}
        </Button>
      </div>

      <div className="text-center text-sm text-[#5A7184]">
        <div className="font-semibold">{t("welcome.hospital")}</div>
        <div>{t("welcome.poweredBy")}</div>
      </div>
    </div>
  )
}
