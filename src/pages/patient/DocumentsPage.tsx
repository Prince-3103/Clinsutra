import { useNavigate } from "react-router-dom"
import { Button } from "@/components/common"
import { DocumentCard, DocumentTypeCard } from "@/components/patient"
import { DOCUMENT_TYPES } from "@/data"
import { useDocumentUpload, useKioskSession, useTranslation } from "@/hooks"
import { cn } from "@/utils"

export function DocumentsPage() {
  const navigate = useNavigate()
  const { t, tx, scriptClass } = useTranslation()
  const { documents, documentsByType } = useKioskSession()
  const upload = useDocumentUpload()

  const hasDocuments = documents.length > 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6 sm:px-6 sm:py-8">
      <div>
        <div className={cn("text-2xl font-bold text-[#0D1B2A] sm:text-3xl", scriptClass)}>
          {t("documents.title")}
        </div>
        <div className={cn("text-[#5A7184] text-sm mt-1 sm:text-lg", scriptClass)}>
          {t("documents.subtitle")}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {DOCUMENT_TYPES.map((type) => (
          <DocumentTypeCard
            key={type.id}
            type={type}
            count={documentsByType(type.id).length}
            onFilesSelected={(files) => upload.addFiles(files, type.id)}
          />
        ))}
      </div>

      {upload.errors.length > 0 && (
        <div
          role="alert"
          className="bg-[#FEF9C3] border border-[#FDE047] rounded-2xl px-4 py-3 flex flex-col gap-2"
        >
          {upload.errors.map((error, index) => (
            <p key={index} className={cn("text-sm text-[#92400E]", scriptClass)}>
              {tx(error)}
            </p>
          ))}
          <button
            type="button"
            onClick={upload.clearErrors}
            className="self-start text-xs font-semibold text-[#92400E] underline"
          >
            {t("mic.clear")}
          </button>
        </div>
      )}

      {hasDocuments && (
        <div>
          <div className={cn("text-sm font-semibold text-[#5A7184] mb-3", scriptClass)}>
            {t("documents.listTitle")}
          </div>
          <div className="flex flex-col gap-2">
            {documents.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                onRemove={upload.removeDocument}
              />
            ))}
          </div>
        </div>
      )}

      <p className={cn("text-xs text-[#5A7184] text-center", scriptClass)}>
        {t("documents.privacy")}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Button
          variant="outline"
          size="lg"
          className={cn("flex-1", scriptClass)}
          onClick={() => navigate("/kiosk/review")}
        >
          {t("common.skip")}
        </Button>
        <Button
          size="lg"
          className={cn("flex-1", scriptClass)}
          onClick={() =>
            navigate(hasDocuments ? "/kiosk/processing" : "/kiosk/review")
          }
        >
          {t("common.continue")}
        </Button>
      </div>
    </div>
  )
}
