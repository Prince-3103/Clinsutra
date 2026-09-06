import { useId, useRef } from "react"
import { FILE_INPUT_ACCEPT } from "@/data"
import { useTranslation } from "@/hooks"
import type { DocumentTypeDefinition } from "@/types"
import { cn } from "@/utils"

export interface DocumentTypeCardProps {
  type: DocumentTypeDefinition
  /** How many files of this type the patient has already added. */
  count: number
  onFilesSelected: (files: FileList) => void
}

/** Opens the file picker for one document category. */
export function DocumentTypeCard({
  type,
  count,
  onFilesSelected,
}: DocumentTypeCardProps) {
  const { t, tx, scriptClass } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const added = count > 0

  return (
    <>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple
        accept={FILE_INPUT_ACCEPT}
        className="sr-only"
        onChange={(event) => {
          if (event.target.files?.length) onFilesSelected(event.target.files)
          // Reset so re-picking the same file fires `change` again.
          event.target.value = ""
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 font-semibold text-sm transition-all sm:p-6 sm:gap-3 sm:text-lg",
          added
            ? "bg-[#ECFDF5] border-[#10B981] text-[#065F46]"
            : "bg-white border-dashed border-[#0A6E8A] text-[#0A6E8A] hover:bg-[#E8F4F8]",
          scriptClass,
        )}
      >
        <span className="text-3xl sm:text-4xl" aria-hidden>
          {type.icon}
        </span>
        {tx(type.label)}
        {added ? (
          <span className="text-sm text-[#10B981] font-bold">
            ✓ {count} {t("documents.added")}
          </span>
        ) : (
          <span className="text-sm flex items-center gap-1">
            📷 {t("documents.scanUpload")}
          </span>
        )}
      </button>
    </>
  )
}
