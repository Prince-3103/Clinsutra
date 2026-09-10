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

  // Keep only digits, capped, so bad characters can never reach the field.
  const onlyDigits = (value: string, max: number) => value.replace(/\D/g, "").slice(0, max)

  // A sensible human age is 1–120; 0, negatives and non-numbers are invalid.
  const ageValue = identification.age.trim()
  const ageNum = Number(ageValue)
  const ageInvalid = ageValue !== "" && (!Number.isInteger(ageNum) || ageNum < 1 || ageNum > 120)

  // Indian mobile numbers are exactly 10 digits.
  const phoneValue = identification.phone.trim()
  const phoneInvalid = phoneValue !== "" && phoneValue.length !== 10

  // In the "new patient" path, block Continue while any entered field is invalid.
  const newModeBlocked = mode === "new" && (ageInvalid || phoneInvalid)

  const inputClass =
    "w-full border-2 border-[#D1E4ED] rounded-2xl px-4 py-3 text-base font-mono text-[#0D1B2A] focus:outline-none focus:border-[#0A6E8A] placeholder:text-[#C0D4DF] sm:px-5 sm:py-4 sm:text-xl"

  const handleContinue = () => {
    const hasAbhaOrReg =
      identification.abhaId.trim() !== "" || identification.hospitalRegNumber.trim() !== ""
    const hasName = identification.fullName.trim() !== ""
    // A name alone isn't an identification — require at least one demographic
    // detail (age, gender or phone) alongside it so a "New Patient" kiosk
    // record is never just a bare name with nothing to contact or triage by.
    const hasDemographic =
      identification.age.trim() !== "" ||
      identification.gender.trim() !== "" ||
      identification.phone.trim() !== ""

    if (hasAbhaOrReg) {
      navigate("/kiosk/interview")
      return
    }

    if (!hasName) {
      setError(t("patientId.validation"))
      return
    }

    if (ageInvalid) {
      setError(t("patientId.validationAge"))
      return
    }

    if (phoneInvalid) {
      setError(t("patientId.validationPhone"))
      return
    }

    if (!hasDemographic) {
      setError(t("patientId.validationDemographic"))
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
                onChange={(event) => {
                  setError(null)
                  updateIdentification({ age: onlyDigits(event.target.value, 3) })
                }}
                aria-invalid={ageInvalid}
                placeholder="42"
                className={cn(
                  "w-full border-2 rounded-xl px-4 py-3 text-base text-[#0D1B2A] focus:outline-none placeholder:text-[#C0D4DF] sm:text-lg",
                  ageInvalid
                    ? "border-[#DC2626] focus:border-[#DC2626]"
                    : "border-[#D1E4ED] focus:border-[#0A6E8A]",
                )}
              />
              {ageInvalid && (
                <p className={cn("mt-1 text-sm text-[#B91C1C]", scriptClass)}>
                  {t("patientId.validationAge")}
                </p>
              )}
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
                inputMode="numeric"
                value={identification.phone}
                onChange={(event) => {
                  setError(null)
                  updateIdentification({ phone: onlyDigits(event.target.value, 10) })
                }}
                aria-invalid={phoneInvalid}
                placeholder="9XXXXXXXXX"
                className={cn(
                  "w-full border-2 rounded-xl px-4 py-3 text-base text-[#0D1B2A] focus:outline-none placeholder:text-[#C0D4DF] sm:text-lg",
                  phoneInvalid
                    ? "border-[#DC2626] focus:border-[#DC2626]"
                    : "border-[#D1E4ED] focus:border-[#0A6E8A]",
                )}
              />
              {phoneInvalid && (
                <p className={cn("mt-1 text-sm text-[#B91C1C]", scriptClass)}>
                  {t("patientId.validationPhone")}
                </p>
              )}
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

      <Button
        size="xl"
        onClick={handleContinue}
        disabled={newModeBlocked}
        className={cn("w-full", scriptClass)}
      >
        {t("common.continue")}
      </Button>
    </div>
  )
}
