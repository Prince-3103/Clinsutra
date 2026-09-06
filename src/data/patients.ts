import type { Doctor, Patient } from "@/types"

/**
 * Demo patient queue. Synthetic records only — no real patient information is
 * kept in this repository. `patientService` returns these today and will return
 * FastAPI responses of the same shape later.
 */
export const MOCK_PATIENTS: Patient[] = [
  {
    id: "OPD-0847",
    name: "Ramesh Kumar",
    age: 52,
    gender: "Male",
    token: "OPD-0847",
    abha: "77-1234-5678-9012",
    priority: "P1",
    status: "Waiting",
    complaint: "Chest pain, radiating to left arm",
    waitTime: "8 min",
    redFlag: true,
    flags: ["Chest pain with radiation", "Diaphoresis reported"],
    submittedAt: "2026-09-06T09:12:00+05:30",
  },
  {
    id: "OPD-0848",
    name: "Sunita Devi",
    age: 38,
    gender: "Female",
    token: "OPD-0848",
    abha: "77-2345-6789-0123",
    priority: "P2",
    status: "Waiting",
    complaint: "Fever and body ache for 3 days",
    waitTime: "14 min",
    redFlag: false,
    flags: [],
    submittedAt: "2026-09-06T09:06:00+05:30",
  },
  {
    id: "OPD-0849",
    name: "Mohammad Iqbal",
    age: 67,
    gender: "Male",
    token: "OPD-0849",
    abha: "77-3456-7890-1234",
    priority: "P2",
    status: "Waiting",
    complaint: "Breathlessness on exertion",
    waitTime: "22 min",
    redFlag: false,
    flags: ["Known COPD"],
    submittedAt: "2026-09-06T08:58:00+05:30",
  },
  {
    id: "OPD-0845",
    name: "Priya Sharma",
    age: 29,
    gender: "Female",
    token: "OPD-0845",
    abha: "77-4567-8901-2345",
    priority: "P3",
    status: "Completed",
    complaint: "Headache and dizziness",
    waitTime: "—",
    redFlag: false,
    flags: [],
    submittedAt: "2026-09-06T08:31:00+05:30",
  },
  {
    id: "OPD-0846",
    name: "Vijay Patel",
    age: 44,
    gender: "Male",
    token: "OPD-0846",
    abha: "77-5678-9012-3456",
    priority: "P3",
    status: "Completed",
    complaint: "Follow-up: diabetes management",
    waitTime: "—",
    redFlag: false,
    flags: [],
    submittedAt: "2026-09-06T08:44:00+05:30",
  },
]

export const CURRENT_DOCTOR: Doctor = {
  id: "DOC-01",
  name: "Dr. Anjali Mehta",
  specialty: "Cardiologist",
  room: "OPD 3",
  initials: "A",
}

/** The queue row the dashboard opens on when no patient has been picked yet. */
export const DEFAULT_PATIENT_ID = MOCK_PATIENTS[0].id
