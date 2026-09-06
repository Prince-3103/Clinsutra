import type { VitalObservation } from "@/types"
import { cn } from "@/utils"

/** Self-reported kiosk observations. Not clinical measurements. */
export function VitalsGrid({ vitals }: { vitals: VitalObservation[] }) {
  if (vitals.length === 0) {
    return (
      <p className="text-sm text-[#5A7184]">
        No self-reported observations were captured at the kiosk.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {vitals.map((vital) => (
        <div
          key={vital.id}
          className={cn(
            "rounded-xl p-3 text-center",
            vital.normal ? "bg-[#ECFDF5]" : "bg-[#FEF2F2]",
          )}
        >
          <div
            className={cn(
              "text-xl font-bold sm:text-2xl",
              vital.normal ? "text-[#059669]" : "text-[#DC2626]",
            )}
          >
            {vital.value}
            <span className="text-sm font-normal">{vital.unit}</span>
          </div>
          <div className="text-xs text-[#5A7184] mt-1">{vital.label}</div>
        </div>
      ))}
    </div>
  )
}
