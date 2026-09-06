import { Badge } from "@/components/common"
import type { AlertSeverity, ClinicalAlert } from "@/types"
import { cn } from "@/utils"

const SEVERITY_STYLE: Record<AlertSeverity, string> = {
  high: "bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]",
  moderate: "bg-[#FEF9C3] border-[#FDE047] text-[#92400E]",
  low: "bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]",
}

const SEVERITY_BADGE: Record<AlertSeverity, { color: "red" | "yellow" | "blue"; label: string }> =
  {
    high: { color: "red", label: "🔴 High" },
    moderate: { color: "yellow", label: "🟡 Moderate" },
    low: { color: "blue", label: "🔵 Low" },
  }

/**
 * A decision-support flag for the clinician.
 *
 * Renders a lab value against its reference range, or a medication/allergy
 * caution. Never a diagnosis and never a dosing instruction — the surrounding
 * panel carries the standing disclaimer.
 */
export function AlertCard({ alert }: { alert: ClinicalAlert }) {
  const badge = SEVERITY_BADGE[alert.severity]
  const isLab = alert.category === "lab"

  return (
    <div className={cn("border rounded-2xl p-4", SEVERITY_STYLE[alert.severity])}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-bold text-sm sm:text-base">{alert.title}</span>
            <Badge color={badge.color}>{badge.label}</Badge>
            {isLab && alert.status && (
              <Badge color={alert.status === "HIGH" ? "red" : "blue"}>
                {alert.status === "HIGH" ? "↑" : "↓"} {alert.status}
              </Badge>
            )}
            {!isLab && <Badge color="gray">{alert.category}</Badge>}
          </div>

          {isLab && alert.value && (
            <>
              <div className="font-mono text-base font-bold sm:text-lg">
                {alert.value}
              </div>
              <div className="text-xs mt-0.5">
                Reference: {alert.referenceRange} • Date: {alert.date}
              </div>
            </>
          )}

          {!isLab && <p className="text-sm leading-relaxed">{alert.note}</p>}
        </div>
      </div>

      {isLab && (
        <div className="mt-3 pt-3 border-t border-current/20 text-sm leading-relaxed">
          {alert.note}
        </div>
      )}
    </div>
  )
}
