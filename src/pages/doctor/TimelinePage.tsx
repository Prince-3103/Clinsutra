import { useEffect, useMemo, useState } from "react"
import { TimelineItem } from "@/components/doctor"
import { useDoctorLayout } from "@/layouts"
import { clinicalService } from "@/services"
import type { TimelineEvent, TimelineFilter } from "@/types"
import { cn } from "@/utils"

const FILTERS: TimelineFilter[] = [
  "All",
  "Lab",
  "Prescription",
  "Hospital",
  "Surgery",
]

/** Maps a filter chip onto the event types it should keep. */
const FILTER_TYPES: Record<TimelineFilter, TimelineEvent["type"][] | null> = {
  All: null,
  Lab: ["Lab Report"],
  Prescription: ["Prescription"],
  Hospital: ["Hospital Visit", "Diagnosis"],
  Surgery: ["Surgery"],
}

export function TimelinePage() {
  const { patients, selectedPatientId } = useDoctorLayout()
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TimelineFilter>("All")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const patient = patients.find((entry) => entry.id === selectedPatientId)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setExpandedId(null)

    clinicalService
      .getTimeline(selectedPatientId)
      .then((result) => {
        if (!cancelled) setEvents(result)
      })
      .catch(() => {
        if (!cancelled) setEvents([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedPatientId])

  const filtered = useMemo(() => {
    const types = FILTER_TYPES[filter]
    if (!types) return events
    return events.filter((event) => types.includes(event.type))
  }, [events, filter])

  return (
    <div className="p-4 flex flex-col gap-5 h-full overflow-y-auto sm:p-6">
      <div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-xl font-bold text-[#0D1B2A] sm:text-2xl">
            Medical Timeline
          </h2>
          <p className="text-sm text-[#5A7184]">
            {patient ? `${patient.name} — ${patient.token} — ` : ""}Chronological
            history
          </p>
        </div>

        <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
          {FILTERS.map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => setFilter(entry)}
              aria-pressed={filter === entry}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold border rounded-lg transition-colors",
                filter === entry
                  ? "bg-[#0A6E8A] text-white border-[#0A6E8A]"
                  : "border-[#D1E4ED] text-[#5A7184] hover:bg-[#F0F7FA] hover:text-[#0D1B2A]",
              )}
            >
              {entry}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-24 rounded-2xl shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#D1E4ED] rounded-2xl px-5 py-10 text-center text-sm text-[#5A7184]">
          No {filter === "All" ? "" : `${filter.toLowerCase()} `}records on file for
          this patient.
        </div>
      ) : (
        <div className="relative flex flex-col gap-0">
          <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-[#D1E4ED]" />
          {filtered.map((event) => (
            <TimelineItem
              key={event.id}
              event={event}
              expanded={expandedId === event.id}
              onToggle={(id) => setExpandedId((current) => (current === id ? null : id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
