import { useOutletContext } from "react-router-dom"
import type { Patient } from "@/types"

export interface DoctorLayoutContext {
  /** Free-text query shared by the sidebar search box and the queue. */
  search: string
  setSearch: (value: string) => void
  /** Patient whose record the summary, timeline and alerts screens show. */
  selectedPatientId: string
  selectPatient: (patientId: string) => void
  patients: Patient[]
  loading: boolean
  /** Re-reads the queue, e.g. after a status change. */
  refresh: () => void
}

export function useDoctorLayout(): DoctorLayoutContext {
  return useOutletContext<DoctorLayoutContext>()
}
