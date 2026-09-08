import { Badge, PriorityDot, StatusBadge } from "@/components/common"
import type { Patient } from "@/types"
import { cn, maskAbhaId } from "@/utils"

export interface PatientRowProps {
  patient: Patient
  onOpen: (patientId: string) => void
}

/** One row of the patient queue. The whole row opens the clinical summary. */
export function PatientRow({ patient, onOpen }: PatientRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(patient.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onOpen(patient.id)
        }
      }}
      aria-label={`Open history for ${patient.name}`}
      className={cn(
        "grid grid-cols-[auto_1fr] gap-3 items-start bg-white border rounded-2xl px-4 py-3 hover:border-[#0A6E8A] transition-all cursor-pointer lg:grid-cols-[48px_1fr_1fr_100px_80px_100px_120px] lg:items-center",
        patient.redFlag && !patient.redFlagResolved ? "border-[#FCA5A5] bg-[#FFF5F5]" : "border-[#D1E4ED]",
      )}
    >
      <PriorityDot level={patient.priority} />

      <div>
        <div className="font-semibold text-[#0D1B2A] text-sm">{patient.name}</div>
        <div className="text-xs text-[#5A7184]">
          {patient.age} yrs • {patient.gender} • {patient.token}
        </div>
        {patient.flags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {patient.flags.map((flag) => (
              <Badge key={flag} color="red">
                ⚑ {flag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="col-span-2 text-sm text-[#0D1B2A] lg:col-span-1">
        {patient.complaint}
      </div>

      <div className="font-mono text-xs text-[#5A7184]">
        ABHA: {maskAbhaId(patient.abha)}
      </div>

      <div className="text-sm font-semibold text-[#0D1B2A]">
        Wait: {patient.waitTime}
      </div>

      <div>
        <StatusBadge status={patient.status} />
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onOpen(patient.id)
        }}
        className="col-span-2 text-xs bg-[#0A6E8A] text-white px-3 py-2 rounded-xl font-semibold hover:bg-[#085F78] transition-colors lg:col-span-1"
      >
        View History
      </button>
    </div>
  )
}
