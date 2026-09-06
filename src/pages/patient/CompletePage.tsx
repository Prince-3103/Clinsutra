import { Navigate, useNavigate } from "react-router-dom"
import { Button, Card } from "@/components/common"
import { useKioskSession, useTranslation } from "@/hooks"
import { cn, formatDate } from "@/utils"

export function CompletePage() {
  const navigate = useNavigate()
  const { t, language, scriptClass } = useTranslation()
  const { token, reset } = useKioskSession()

  // Landing here without a submission means the flow was skipped — start over.
  if (!token) return <Navigate to="/kiosk" replace />

  const startNewSession = () => {
    reset()
    navigate("/kiosk")
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 gap-8 sm:p-8"
      style={{ background: "linear-gradient(160deg, #ECFDF5 0%, #F0F7FA 60%)" }}
    >
      <div className="w-32 h-32 bg-[#059669] rounded-full flex items-center justify-center text-6xl text-white shadow-2xl shadow-green-200 slide-up">
        ✓
      </div>

      <div className="text-center slide-up" style={{ animationDelay: "0.1s" }}>
        <div
          className={cn(
            "text-2xl font-bold text-[#0D1B2A] mb-3 sm:text-4xl",
            scriptClass,
          )}
        >
          {t("complete.title")}
        </div>
        <div
          className={cn("text-base text-[#5A7184] max-w-md sm:text-xl", scriptClass)}
        >
          {t("complete.body")}
        </div>
      </div>

      <Card
        className="px-6 py-6 text-center slide-up sm:px-10"
        style={{ animationDelay: "0.2s" }}
      >
        <div
          className={cn(
            "text-sm text-[#5A7184] mb-2 uppercase tracking-wider font-semibold",
            scriptClass,
          )}
        >
          {t("complete.tokenLabel")}
        </div>
        <div className="text-3xl font-black text-[#0A6E8A] mono mb-2 sm:text-5xl">
          {token}
        </div>
        <div className={cn("text-sm text-[#5A7184]", scriptClass)}>
          {t("complete.date")} {formatDate(new Date(), language)}
        </div>
      </Card>

      <div
        className="grid grid-cols-1 gap-4 w-full max-w-lg slide-up sm:grid-cols-2"
        style={{ animationDelay: "0.3s" }}
      >
        <Card className="p-4 text-center">
          <div className="text-2xl mb-1" aria-hidden>
            👨‍⚕️
          </div>
          <div className={cn("text-sm font-semibold text-[#0D1B2A]", scriptClass)}>
            {t("complete.doctorWillReview")}
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl mb-1" aria-hidden>
            📢
          </div>
          <div className={cn("text-sm font-semibold text-[#0D1B2A]", scriptClass)}>
            {t("complete.listenToken")}
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-lg">
        <Button
          size="xl"
          variant="success"
          className={cn("w-full", scriptClass)}
          onClick={() => window.print()}
        >
          {t("complete.printToken")} 🖨️
        </Button>
        <Button
          size="lg"
          variant="ghost"
          className={cn("w-full", scriptClass)}
          onClick={startNewSession}
        >
          {t("complete.startOver")}
        </Button>
      </div>
    </div>
  )
}
