import { Navigate, useNavigate } from "react-router-dom"
import { Button, Card, Disclaimer } from "@/components/common"
import { useKioskSession, useTranslation } from "@/hooks"
import { cn } from "@/utils"

/**
 * Shown only when the demo triage rules fire.
 *
 * It tells the patient that staff have been alerted and that a clinician will
 * assess them. It deliberately names no condition and suggests no treatment.
 */
export function RedFlagPage() {
  const navigate = useNavigate()
  const { t, tx, scriptClass } = useTranslation()
  const { assessment } = useKioskSession()

  if (!assessment?.triggered) return <Navigate to="/kiosk/documents" replace />

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6 sm:px-6 sm:py-8">
      <div
        role="alert"
        className="bg-[#FEF2F2] border-2 border-[#DC2626] rounded-3xl p-5 flex flex-col items-center gap-5 text-center shadow-lg shadow-red-100 sm:p-8"
      >
        <div className="w-20 h-20 bg-[#DC2626] rounded-full flex items-center justify-center text-4xl text-white shadow-lg animate-pulse">
          ⚠
        </div>
        <div className={cn("text-xl font-bold text-[#7F1D1D] sm:text-3xl", scriptClass)}>
          {t("redflag.title")}
        </div>
        <div
          className={cn(
            "text-sm text-[#991B1B] leading-relaxed sm:text-lg",
            scriptClass,
          )}
        >
          {t("redflag.body")}
        </div>

        <div className="bg-white border border-[#FCA5A5] rounded-2xl px-4 py-4 w-full flex items-center gap-3 sm:px-6">
          <span className="text-2xl" aria-hidden>
            📢
          </span>
          <div className="text-left">
            <div className={cn("font-bold text-[#0D1B2A]", scriptClass)}>
              {t("redflag.staffNotified")}
            </div>
            <div className={cn("text-sm text-[#5A7184]", scriptClass)}>
              {t("redflag.staffDetail")}
            </div>
          </div>
          <span className="ml-auto text-[#10B981] font-bold">✓</span>
        </div>
      </div>

      <Card className="p-5 flex flex-col items-start gap-4 border-l-4 border-l-[#DC2626] sm:flex-row sm:items-center">
        <div className="bg-[#DC2626] text-white font-black text-xl px-4 py-2 rounded-xl">
          {assessment.priority}
        </div>
        <div>
          <div className={cn("font-bold text-[#0D1B2A]", scriptClass)}>
            {t("redflag.priorityTitle", { priority: assessment.priority.slice(1) })}
          </div>
          <div className={cn("text-sm text-[#5A7184]", scriptClass)}>
            {assessment.reasons.map((reason) => tx(reason)).join(" • ")} —{" "}
            {t("redflag.forReview")}
          </div>
        </div>
      </Card>

      <Disclaimer className={scriptClass}>{t("redflag.disclaimer")}</Disclaimer>

      <Button
        size="xl"
        onClick={() => navigate("/kiosk/documents")}
        className={cn("w-full", scriptClass)}
      >
        {t("redflag.continue")}
      </Button>
    </div>
  )
}
