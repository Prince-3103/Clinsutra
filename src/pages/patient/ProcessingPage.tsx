import { useEffect, useRef, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { PipelineIndicator } from "@/components/patient"
import { PIPELINE_STAGES } from "@/services"
import { useDocumentUpload, useKioskSession, useTranslation } from "@/hooks"
import type { ProcessingStage } from "@/types"
import { cn } from "@/utils"

const STAGE_KEY = {
  uploading: "processing.stage.uploading",
  ocr: "processing.stage.ocr",
  extracting: "processing.stage.extracting",
  structuring: "processing.stage.structuring",
  complete: "processing.stage.complete",
} as const

function stageIndex(stage: ProcessingStage | null): number {
  if (!stage) return 0
  const index = PIPELINE_STAGES.indexOf(stage)
  return index === -1 ? 0 : index
}

/**
 * Runs uploaded documents through the mocked OCR pipeline and advances to the
 * review screen when everything has settled.
 */
export function ProcessingPage() {
  const navigate = useNavigate()
  const { t, scriptClass } = useTranslation()
  const { documents, currentStage, allDocumentsProcessed } = useKioskSession()
  const { processAll } = useDocumentUpload()
  const [started, setStarted] = useState(false)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current || documents.length === 0) return
    startedRef.current = true
    setStarted(true)
    void processAll()
  }, [documents.length, processAll])

  useEffect(() => {
    if (!started || !allDocumentsProcessed) return
    const timer = setTimeout(() => navigate("/kiosk/review"), 1000)
    return () => clearTimeout(timer)
  }, [started, allDocumentsProcessed, navigate])

  // Nothing to process — the documents screen already routed past this.
  if (documents.length === 0) return <Navigate to="/kiosk/review" replace />

  const index = allDocumentsProcessed
    ? PIPELINE_STAGES.length - 1
    : stageIndex(currentStage)
  const stageKey = STAGE_KEY[PIPELINE_STAGES[index] as keyof typeof STAGE_KEY]
  const finished = index >= PIPELINE_STAGES.length - 1

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-8 sm:px-6 sm:py-12">
      <PipelineIndicator step={index} />

      {!finished ? (
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-[#D1E4ED] rounded-full" />
          <div className="absolute inset-0 border-4 border-t-[#0A6E8A] rounded-full spin" />
          <div className="absolute inset-0 flex items-center justify-center text-3xl">
            🧠
          </div>
        </div>
      ) : (
        <div className="w-24 h-24 bg-[#ECFDF5] border-4 border-[#10B981] rounded-full flex items-center justify-center text-5xl">
          ✓
        </div>
      )}

      <div className="text-center" aria-live="polite">
        <div
          className={cn(
            "text-xl font-bold text-[#0D1B2A] mb-2 sm:text-2xl",
            scriptClass,
          )}
        >
          {t(stageKey)}
        </div>
        <div className={cn("text-[#5A7184]", scriptClass)}>{t("processing.wait")}</div>
      </div>

      <div className="flex gap-2">
        {PIPELINE_STAGES.map((stage, i) => (
          <div
            key={stage}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i <= index ? "bg-[#0A6E8A] w-6" : "bg-[#D1E4ED] w-2",
            )}
          />
        ))}
      </div>
    </div>
  )
}
