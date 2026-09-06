import { DOCUMENT_TYPE_BY_ID } from "@/data"
import { useTranslation } from "@/hooks"
import type { ProcessingStage, UploadedDocument } from "@/types"
import { cn, formatFileSize } from "@/utils"

const STAGE_KEY = {
  uploading: "processing.stage.uploading",
  ocr: "processing.stage.ocr",
  extracting: "processing.stage.extracting",
  structuring: "processing.stage.structuring",
  complete: "processing.stage.complete",
} as const

export interface DocumentCardProps {
  document: UploadedDocument
  onRemove?: (documentId: string) => void
  /** Hides the remove control once processing has started. */
  removable?: boolean
}

function stageLabelKey(stage: ProcessingStage) {
  if (stage === "queued" || stage === "failed") return null
  return STAGE_KEY[stage]
}

/** One selected file, with its size and pipeline state. */
export function DocumentCard({
  document,
  onRemove,
  removable = true,
}: DocumentCardProps) {
  const { t, scriptClass } = useTranslation()
  const type = DOCUMENT_TYPE_BY_ID[document.docType]
  const labelKey = stageLabelKey(document.stage)
  const failed = document.stage === "failed"
  const done = document.stage === "complete"

  return (
    <div
      className={cn(
        "bg-white border rounded-2xl px-5 py-3 flex items-center gap-4",
        failed ? "border-[#FCA5A5]" : "border-[#D1E4ED]",
      )}
    >
      <span className="text-2xl shrink-0" aria-hidden>
        {type.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[#0D1B2A] truncate">{document.name}</div>
        <div className={cn("text-xs text-[#5A7184]", scriptClass)}>
          {formatFileSize(document.size)}
          {labelKey && !done && <> • {t(labelKey)}</>}
          {failed && <> • {t("mic.error")}</>}
        </div>
        {document.stage !== "queued" && !done && !failed && (
          <div className="h-1.5 bg-[#D1E4ED] rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-[#0A6E8A] rounded-full transition-all duration-300"
              style={{ width: `${document.progress}%` }}
            />
          </div>
        )}
      </div>
      {done && <span className="text-[#10B981] font-bold">✓</span>}
      {failed && <span className="text-[#DC2626] font-bold">!</span>}
      {removable && onRemove && (
        <button
          type="button"
          onClick={() => onRemove(document.id)}
          aria-label={`${t("documents.remove")}: ${document.name}`}
          className="w-8 h-8 rounded-full text-[#5A7184] hover:bg-[#FEF2F2] hover:text-[#DC2626] transition-colors shrink-0"
        >
          ✕
        </button>
      )}
    </div>
  )
}
