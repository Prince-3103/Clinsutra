import { useCallback, useEffect, useMemo, useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { BrandLogo } from "@/components/common"
import { DoctorSidebar, type DoctorNavItem } from "@/components/doctor"
import { CURRENT_DOCTOR, DEFAULT_PATIENT_ID } from "@/data"
import { useAuth } from "@/hooks"
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
  const { user, logout, notice, clearNotice } = useAuth()

  // The clinician identity now comes from the authenticated session, not a
  // hardcoded constant. (CURRENT_DOCTOR is only a shape fallback.)
  const doctor: Doctor = user
    ? {
        id: user.id,
        name: user.name,
        specialty: user.specialty,
        room: user.room,
        initials: user.initials,
      }
    : CURRENT_DOCTOR

  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedPatientId, setSelectedPatientId] = useState<string>(readStoredPatientId)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    patientService
      .getQueue()
      .then((queue) => {
        if (!cancelled) setPatients(queue)
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

  const handleLogout = useCallback(() => {
    // Clears the JWT, auth state, and the selected patient, then the route
    // guard sends the user back to /doctor/login.
    logout()
    navigate("/doctor/login", { replace: true })
  }, [logout, navigate])

  const refresh = useCallback(() => setReloadToken((token) => token + 1), [])

  const selectPatient = useCallback(
    (patientId: string) => {
      setSelectedPatientId(patientId)
      storePatientId(patientId)
      navigate("/doctor/summary")
    },
    [navigate],
  )

  const clearSelectedPatient = useCallback(() => {
    setSelectedPatientId("")
    storePatientId("")
  }, [])

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
    clearSelectedPatient,
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
        onLogout={handleLogout}
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
            {/* Authenticated clinician identity (name + specialty). */}
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-sm font-semibold text-[#0D1B2A]">{doctor.name}</div>
              <div className="text-xs text-[#5A7184]">{doctor.specialty}</div>
            </div>
            <div className="w-8 h-8 bg-[#0A6E8A] rounded-full flex items-center justify-center text-white text-sm font-bold">
              {doctor.initials}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-[#D1E4ED] px-3 py-1.5 text-xs font-semibold text-[#5A7184] hover:bg-[#F0F7FA] hover:text-[#DC2626]"
            >
              Log out
            </button>
          </div>
        </div>

        {notice && (
          <div
            role="alert"
            className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#FCA5A5] bg-[#FEE2E2] px-4 py-2 text-sm text-[#B91C1C] sm:mx-6"
          >
            <span>⚠ {notice}</span>
            <button
              type="button"
              onClick={clearNotice}
              className="shrink-0 text-xs font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <Outlet context={context} />
        </div>
      </main>
    </div>
  )
}
