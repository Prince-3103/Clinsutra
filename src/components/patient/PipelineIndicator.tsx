import { useTranslation } from "@/hooks"
import { cn } from "@/utils"

export interface PipelineIndicatorProps {
  /** 0-based index into the pipeline stages. */
  step: number
}

/** Document → OCR → AI → Done, with the connectors filling as work progresses. */
export function PipelineIndicator({ step }: PipelineIndicatorProps) {
  const { t } = useTranslation()

  return (
    <div className="grid w-full grid-cols-4 items-start gap-2 text-[#5A7184] text-xs font-medium sm:flex sm:items-center sm:gap-3 sm:text-sm">
      <div className="flex flex-col items-center gap-1">
        <div className="w-12 h-16 bg-white border-2 border-[#D1E4ED] rounded-lg flex items-center justify-center text-2xl">
          📄
        </div>
        <span>{t("processing.node.document")}</span>
      </div>

      <div className="hidden flex-1 h-0.5 bg-[#D1E4ED] relative overflow-hidden sm:block">
        {step > 0 && (
          <div className="absolute inset-0 bg-[#0A6E8A] animate-[progress-fill_1s_ease_forwards]" />
        )}
      </div>

      <div
        className={cn(
          "flex flex-col items-center gap-1 transition-all",
          step >= 1 ? "opacity-100" : "opacity-30",
        )}
      >
        <div className="w-12 h-12 bg-[#E8F4F8] border-2 border-[#0A6E8A] rounded-xl flex items-center justify-center text-xl">
          🔍
        </div>
        <span>{t("processing.node.ocr")}</span>
      </div>

      <div className="hidden flex-1 h-0.5 bg-[#D1E4ED] relative overflow-hidden sm:block">
        {step > 2 && (
          <div className="absolute inset-0 bg-[#0A6E8A] animate-[progress-fill_1s_ease_forwards]" />
        )}
      </div>

      <div
        className={cn(
          "flex flex-col items-center gap-1 transition-all",
          step >= 3 ? "opacity-100" : "opacity-30",
        )}
      >
        <div className="w-12 h-12 bg-[#E8F4F8] border-2 border-[#0A6E8A] rounded-xl flex items-center justify-center text-xl">
          🧠
        </div>
        <span>{t("processing.node.ai")}</span>
      </div>

      <div className="hidden flex-1 h-0.5 bg-[#D1E4ED] relative overflow-hidden sm:block">
        {step >= 4 && (
          <div className="absolute inset-0 bg-[#10B981] animate-[progress-fill_0.5s_ease_forwards]" />
        )}
      </div>

      <div
        className={cn(
          "flex flex-col items-center gap-1 transition-all",
          step >= 4 ? "opacity-100" : "opacity-30",
        )}
      >
        <div
          className={cn(
            "w-12 h-12 border-2 rounded-xl flex items-center justify-center text-xl",
            step >= 4
              ? "bg-[#ECFDF5] border-[#10B981]"
              : "bg-[#E8F4F8] border-[#D1E4ED]",
          )}
        >
          📋
        </div>
        <span>{t("processing.node.done")}</span>
      </div>
    </div>
  )
}
