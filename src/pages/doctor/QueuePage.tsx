import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { PatientRow } from "@/components/doctor"
import { useDoctorLayout } from "@/layouts"
import type { QueueFilter } from "@/types"
import { cn, formatDate } from "@/utils"

const FILTERS: QueueFilter[] = ["all", "waiting", "completed"]

export function QueuePage() {
  const { patients, loading, search, setSearch, selectPatient } = useDoctorLayout()
  const [filter, setFilter] = useState<QueueFilter>("all")

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return patients.filter((patient) => {
      if (filter === "waiting" && patient.status !== "Waiting") return false
      if (filter === "completed" && patient.status !== "Completed") return false
      if (!term) return true
      return (
        patient.name.toLowerCase().includes(term) ||
        patient.token.toLowerCase().includes(term) ||
        patient.complaint.toLowerCase().includes(term) ||
        patient.abha.toLowerCase().includes(term)
      )
    })
  }, [patients, filter, search])

  const flagged = patients.filter((patient) => patient.redFlag)

  return (
    <div className="p-4 flex flex-col gap-5 h-full overflow-y-auto sm:p-6">
      <div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-xl font-bold text-[#0D1B2A] sm:text-2xl">
            Patient Queue
          </h1>
          <p className="text-[#5A7184] text-sm">
            {formatDate(new Date())} — OPD 3
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
          <div className="flex rounded-xl overflow-hidden border border-[#D1E4ED]">
            {FILTERS.map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => setFilter(entry)}
                aria-pressed={filter === entry}
                className={cn(
                  "flex-1 px-4 py-2 text-sm font-medium capitalize transition-colors sm:flex-none",
                  filter === entry
                    ? "bg-[#0A6E8A] text-white"
                    : "bg-white text-[#5A7184] hover:bg-[#F0F7FA]",
                )}
              >
                {entry}
              </button>
            ))}
          </div>

          {/* The sidebar search is hidden below `md`, so the queue carries its
              own box on narrow screens. Desktop keeps the original header. */}
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, token or complaint…"
            aria-label="Search patients"
            className="w-full rounded-xl border border-[#D1E4ED] bg-white px-4 py-2 text-sm text-[#0D1B2A] outline-none focus:border-[#0A6E8A] placeholder:text-[#9DB8C8] sm:w-64 md:hidden"
          />

          {/* A patient joins the queue by completing the kiosk flow. */}
          <Link
            to="/kiosk"
            className="px-4 py-2 bg-[#0A6E8A] text-white rounded-xl text-sm font-semibold text-center hover:bg-[#085F78] transition-colors"
          >
            + Add Patient
          </Link>
        </div>
      </div>

      {flagged.map((patient) => (
        <div
          key={patient.id}
          className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-2xl px-4 py-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:px-5"
        >
          <span className="text-lg sm:text-xl" aria-hidden>
            ⚠️
          </span>
          <div className="flex-1">
            <span className="font-bold text-[#991B1B]">Priority Alert: </span>
            <span className="text-[#991B1B]">
              Patient {patient.token} ({patient.name}) is flagged for urgent review
              {patient.flags.length > 0 && <> — {patient.flags.join(", ").toLowerCase()}</>}
              .
            </span>
          </div>
          <button
            type="button"
            onClick={() => selectPatient(patient.id)}
            className="text-sm font-bold text-[#DC2626] underline shrink-0 hover:text-[#B91C1C]"
          >
            Review Now →
          </button>
        </div>
      ))}

      <div className="hidden grid-cols-[48px_1fr_1fr_100px_80px_100px_120px] gap-3 text-xs font-bold text-[#5A7184] uppercase tracking-wider px-4 lg:grid">
        <div>Pri.</div>
        <div>Patient</div>
        <div>Chief Complaint</div>
        <div>ABHA ID</div>
        <div>Wait</div>
        <div>Status</div>
        <div>Action</div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-20 rounded-2xl shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#D1E4ED] rounded-2xl px-5 py-10 text-center text-sm text-[#5A7184]">
          No patients match this filter.
          {search && (
            <>
              {" "}
              <button
                type="button"
                onClick={() => setSearch("")}
                className="font-semibold text-[#0A6E8A] underline"
              >
                Clear search
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((patient) => (
            <PatientRow key={patient.id} patient={patient} onOpen={selectPatient} />
          ))}
        </div>
      )}
    </div>
  )
}
