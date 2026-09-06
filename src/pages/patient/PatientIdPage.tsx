import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AudioButton, Button, Card } from "@/components/common"
import { useKioskSession, useTranslation } from "@/hooks"
import type { IdentificationMode } from "@/types"
import { cn } from "@/utils"

const MODES: Array<{ id: IdentificationMode; icon: string; labelKey: string }> = [
  { id: "abha", icon: "🪪", labelKey: "patientId.mode.abha" },
  { id: "scan", icon: "📷", labelKey: "patientId.mode.scan" },
  { id: "new", icon: "➕", labelKey: "patientId.mode.new" },
]

export function PatientIdPage() {
  const navigate = useNavigate()
  const { t, scriptClass } = useTranslation()
  const { identification, updateIdentification } = useKioskSession()
  const [error, setError] = useState<string | null>(null)

  const mode = identification.mode
  const setMode = (next: IdentificationMode) => {
    setError(null)
    updateIdentification({ mode: next })
  }

  const inputClass =
    "w-full border-2 border-[#D1E4ED] rounded-2xl px-4 py-3 text-base font-mono text-[#0D1B2A] focus:outline-none focus:border-[#0A6E8A] placeholder:text-[#C0D4DF] sm:px-5 sm:py-4 sm:text-xl"

  const handleContinue = () => {
    const identified =
      identification.abhaId.trim() !== "" ||
      identification.hospitalRegNumber.trim() !== "" ||
      identification.fullName.trim() !== ""

    if (!identified) {
      setError(t("patientId.validation"))
      return
    }
    navigate("/kiosk/interview")
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6 sm:px-6 sm:py-8">
      <div>
        <div className={cn("text-2xl font-bold text-[#0D1B2A] sm:text-3xl", scriptClass)}>
          {t("patientId.title")}
        </div>
        <div className={cn("text-[#5A7184] text-sm mt-1 sm:text-lg", scriptClass)}>
          {t("patientId.subtitle")}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="tablist">
        {MODES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={mode === entry.id}
            onClick={() => setMode(entry.id)}
            className={cn(
              "py-3 rounded-2xl border-2 font-semibold text-sm flex flex-col items-center gap-2 transition-all sm:py-4 sm:text-lg",
              mode === entry.id
                ? "bg-[#0A6E8A] text-white border-[#0A6E8A] shadow-lg"
                : "bg-white text-[#0D1B2A] border-[#D1E4ED] hover:border-[#0A6E8A]",
              scriptClass,
            )}
          >
            <span className="text-2xl" aria-hidden>
              {entry.icon}
            </span>
            {t(entry.labelKey as "patientId.mode.abha")}
          </button>
        ))}
      </div>

      {mode === "abha" && (
        <Card className="p-6 flex flex-col gap-5">
          <div>
            <label
              htmlFor="abha-id"
              className={cn(
                "block text-sm font-semibold text-[#0D1B2A] mb-2 sm:text-lg",
                scriptClass,
              )}
            >
              {t("patientId.abhaLabel")}
            </label>
            <input
              id="abha-id"
              type="text"
              inputMode="numeric"
              value={identification.abhaId}
              onChange={(event) => {
                setError(null)
                updateIdentification({ abhaId: event.target.value })
              }}
              placeholder={t("patientId.abhaPlaceholder")}
              className={inputClass}
            />
          </div>

          <div className="text-center text-[#5A7184]">— {t("patientId.or")} —</div>

          <div>
            <label
              htmlFor="hospital-reg"
              className={cn(
                "block text-sm font-semibold text-[#0D1B2A] mb-2 sm:text-lg",
                scriptClass,
              )}
            >
              {t("patientId.regLabel")}
            </label>
            <input
              id="hospital-reg"
              type="text"
              value={identification.hospitalRegNumber}
              onChange={(event) => {
                setError(null)
                updateIdentification({ hospitalRegNumber: event.target.value })
              }}
              placeholder={t("patientId.regPlaceholder")}
              className={inputClass}
            />
          </div>
        </Card>
      )}

      {mode === "scan" && (
        <Card className="p-8 flex flex-col items-center gap-5">
          <div className="w-48 h-48 border-4 border-dashed border-[#0A6E8A] rounded-3xl flex flex-col items-center justify-center gap-3 bg-[#E8F4F8]">
            <span className="text-6xl" aria-hidden>
              📷
            </span>
            <span
              className={cn(
                "text-[#0A6E8A] font-semibold text-center text-sm sm:text-lg",
                scriptClass,
              )}
            >
              {t("patientId.scanPrompt")}
            </span>
          </div>
          <Button
            variant="secondary"
            size="lg"
            icon={<span aria-hidden>📸</span>}
            onClick={() => setError(t("patientId.cameraUnavailable"))}
          >
            {t("patientId.activateCamera")}
          </Button>
          <div className={cn("text-[#5A7184] text-center", scriptClass)}>
            {t("patientId.scanHelp")}
          </div>
        </Card>
      )}

      {mode === "new" && (
        <Card className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="full-name"
                className={cn(
                  "block text-base font-semibold text-[#0D1B2A] mb-1",
                  scriptClass,
                )}
              >
                {t("patientId.field.name")}
              </label>
              <input
                id="full-name"
                value={identification.fullName}
                onChange={(event) => {
                  setError(null)
                  updateIdentification({ fullName: event.target.value })
                }}
                placeholder="Ramesh Kumar"
                className="w-full border-2 border-[#D1E4ED] rounded-xl px-4 py-3 text-base text-[#0D1B2A] focus:outline-none focus:border-[#0A6E8A] placeholder:text-[#C0D4DF] sm:text-lg"
              />
            </div>

            <div>
              <label
                htmlFor="age"
                className={cn(
                  "block text-base font-semibold text-[#0D1B2A] mb-1",
                  scriptClass,
                )}
              >
                {t("patientId.field.age")}
              </label>
              <input
                id="age"
                inputMode="numeric"
                value={identification.age}
                onChange={(event) => updateIdentification({ age: event.target.value })}
                placeholder="42"
                className="w-full border-2 border-[#D1E4ED] rounded-xl px-4 py-3 text-base text-[#0D1B2A] focus:outline-none focus:border-[#0A6E8A] placeholder:text-[#C0D4DF] sm:text-lg"
              />
            </div>

            <div>
              <label
                htmlFor="gender"
                className={cn(
                  "block text-base font-semibold text-[#0D1B2A] mb-1",
                  scriptClass,
                )}
              >
                {t("patientId.field.gender")}
              </label>
              <select
                id="gender"
                value={identification.gender}
                onChange={(event) =>
                  updateIdentification({ gender: event.target.value })
                }
                className="w-full border-2 border-[#D1E4ED] rounded-xl px-4 py-3 text-base text-[#0D1B2A] focus:outline-none focus:border-[#0A6E8A] sm:text-lg"
              >
                <option value="">{t("patientId.field.select")}</option>
                <option value="Male">{t("patientId.gender.male")}</option>
                <option value="Female">{t("patientId.gender.female")}</option>
                <option value="Other">{t("patientId.gender.other")}</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="phone"
                className={cn(
                  "block text-base font-semibold text-[#0D1B2A] mb-1",
                  scriptClass,
                )}
              >
                {t("patientId.field.phone")}
              </label>
              <input
                id="phone"
                inputMode="tel"
                value={identification.phone}
                onChange={(event) => updateIdentification({ phone: event.target.value })}
                placeholder="9XXXXXXXXX"
                className="w-full border-2 border-[#D1E4ED] rounded-xl px-4 py-3 text-base text-[#0D1B2A] focus:outline-none focus:border-[#0A6E8A] placeholder:text-[#C0D4DF] sm:text-lg"
              />
            </div>
          </div>
        </Card>
      )}

      <div className="flex items-center gap-3 text-[#5A7184]">
        <AudioButton size="sm" text={t("patientId.subtitle")} />
        <span className={scriptClass}>{t("patientId.helpAudio")}</span>
      </div>

      {error && (
        <p
          role="alert"
          className={cn(
            "text-sm text-[#92400E] bg-[#FEF9C3] border border-[#FDE047] rounded-xl px-4 py-3",
            scriptClass,
          )}
        >
          {error}
        </p>
      )}

      <Button size="xl" onClick={handleContinue} className={cn("w-full", scriptClass)}>
        {t("common.continue")}
      </Button>
    </div>
  )
}
