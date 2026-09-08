import { useCallback, useEffect, useMemo, useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { BrandLogo } from "@/components/common"
import { DoctorSidebar, type DoctorNavItem } from "@/components/doctor"
import { CURRENT_DOCTOR, DEFAULT_PATIENT_ID } from "@/data"
import { patientService } from "@/services"
import type { Doctor, Patient } from "@/types"
import type { DoctorLayoutContext } from "./doctorLayoutContext"

const BREADCRUMB: Record<string, string> = {
  "/doctor/queue": "Patient Queue",
  "/doctor/summary": "Clinical Summary",
  "/doctor/timeline": "Medical Timeline",
  "/doctor/alerts": "Alerts & Flags",
}

/**
 * Which patient's chart the summary/timeline/alerts screens show is kept
 * here rather than in the URL. That's fine for navigating between doctor
 * screens, but a hard page refresh remounts `DoctorLayout` and would
 * otherwise silently fall back to `DEFAULT_PATIENT_ID` (a seeded demo id) —
 * which doesn't exist once the app is talking to a real, non-empty backend.
 * That reset is what made edits look like they "didn't persist": the save
 * worked, but the refreshed page was quietly showing a different patient.
 * Session storage survives the remount without changing the URL scheme.
 */
const SELECTED_PATIENT_KEY = "clinsutra:selectedPatientId"

function readStoredPatientId(): string {
  try {
    return sessionStorage.getItem(SELECTED_PATIENT_KEY) || DEFAULT_PATIENT_ID
  } catch {
    return DEFAULT_PATIENT_ID
  }
}

function storePatientId(patientId: string): void {
  try {
    sessionStorage.setItem(SELECTED_PATIENT_KEY, patientId)
  } catch {
    // Private browsing / storage disabled — selection just won't survive a
    // refresh, which is no worse than before this fix.
  }
}

export function DoctorLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [doctor, setDoctor] = useState<Doctor>(CURRENT_DOCTOR)
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedPatientId, setSelectedPatientId] = useState<string>(readStoredPatientId)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([patientService.getQueue(), patientService.getCurrentDoctor()])
      .then(([queue, currentDoctor]) => {
        if (cancelled) return
        setPatients(queue)
        setDoctor(currentDoctor)
      })
      .catch(() => {
        // Queue stays empty; the screens render their own empty states.
        if (!cancelled) setPatients([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const refresh = useCallback(() => setReloadToken((token) => token + 1), [])

  const selectPatient = useCallback(
    (patientId: string) => {
      setSelectedPatientId(patientId)
      storePatientId(patientId)
      navigate("/doctor/summary")
    },
    [navigate],
  )

  const stats = useMemo(
    () => ({
      waiting: patients.filter((p) => p.status === "Waiting").length,
      seen: patients.filter((p) => p.status === "Completed").length,
      flags: patients.filter((p) => p.redFlag && !p.redFlagResolved).length,
    }),
    [patients],
  )

  const navItems: DoctorNavItem[] = [
    { to: "/doctor/queue", icon: "🗂", label: "Patient Queue", badge: stats.waiting },
    { to: "/doctor/summary", icon: "📋", label: "Clinical Summary" },
    { to: "/doctor/timeline", icon: "📅", label: "Medical Timeline" },
    { to: "/doctor/alerts", icon: "⚠️", label: "Alerts & Flags" },
  ]

  const context: DoctorLayoutContext = {
    search,
    setSearch,
    selectedPatientId,
    selectPatient,
    patients,
    loading,
    refresh,
  }

  return (
    <div className="flex h-screen flex-col bg-[#F0F7FA] overflow-hidden md:flex-row">
      <DoctorSidebar
        doctor={doctor}
        navItems={navItems}
        search={search}
        onSearchChange={setSearch}
        stats={stats}
      />

      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="bg-white border-b border-[#D1E4ED] px-4 py-3 flex items-center justify-between gap-3 shrink-0 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-[#5A7184]">
            <BrandLogo size="xs" />
            <span>Clinsutra</span>
            <span>/</span>
            <span className="text-[#0D1B2A] font-medium">
              {BREADCRUMB[pathname] ?? "Dashboard"}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden items-center gap-2 text-xs text-[#5A7184] sm:flex">
              <span className="w-2 h-2 bg-[#10B981] rounded-full" />
              Live — {stats.waiting} patient{stats.waiting === 1 ? "" : "s"} waiting
            </div>
            <div className="w-8 h-8 bg-[#0A6E8A] rounded-full flex items-center justify-center text-white text-sm font-bold">
              {doctor.initials}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <Outlet context={context} />
        </div>
      </main>
    </div>
  )
}
