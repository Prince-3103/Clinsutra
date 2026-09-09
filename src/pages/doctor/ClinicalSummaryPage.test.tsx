import { afterEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom"
import type { ClinicalHistory, Patient } from "@/types"
import type { DoctorLayoutContext } from "@/layouts"
import type * as Services from "@/services"

const deletePatientMock = vi.hoisted(() => vi.fn<(id: string) => Promise<void>>())

const HISTORY: ClinicalHistory = {
  patientId: "OPD-0851",
  chiefComplaint: "Fever for 3 days",
  historyOfPresentIllness: "",
  pastMedicalHistory: "",
  pastSurgicalHistory: "",
  medications: [],
  allergies: [],
  familyHistory: "",
  personalHistory: "",
  reviewOfSystems: "",
  investigationsSummary: "",
  keySymptoms: [],
  riskIndicators: [],
  suggestedQuestions: [],
  clinicalSummary: "",
  aiGenerated: true,
  confirmedByClinician: false,
  updatedAt: "2026-01-01T00:00:00Z",
}

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof Services>()
  return {
    ...actual,
    clinicalService: {
      ...actual.clinicalService,
      getHistory: async () => HISTORY,
      getAlerts: async () => [],
    },
    patientService: {
      ...actual.patientService,
      deletePatient: deletePatientMock,
    },
  }
})

const { ClinicalSummaryPage } = await import("./ClinicalSummaryPage")
const { QueuePage } = await import("./QueuePage")

function makePatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: "OPD-0851",
    name: "Test Patient",
    age: 40,
    gender: "Male",
    token: "OPD-0851",
    abha: "—",
    priority: "P2",
    status: "Completed",
    complaint: "Fever for 3 days",
    waitTime: "—",
    redFlag: false,
    flags: [],
    redFlagResolved: false,
    submittedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

function makeContext(patient: Patient): DoctorLayoutContext {
  return {
    search: "",
    setSearch: vi.fn(),
    selectedPatientId: patient.id,
    selectPatient: vi.fn(),
    clearSelectedPatient: vi.fn(),
    patients: [patient],
    loading: false,
    refresh: vi.fn(),
  }
}

function renderSummary(patient: Patient) {
  const ctx = makeContext(patient)
  render(
    <MemoryRouter initialEntries={["/doctor/summary"]}>
      <Routes>
        <Route element={<Outlet context={ctx} />}>
          <Route path="/doctor/summary" element={<ClinicalSummaryPage />} />
          <Route path="/doctor/queue" element={<QueuePage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
  return ctx
}

async function ready() {
  // Wait past the initial history/alerts load.
  await screen.findByText("Delete Patient Record")
}

afterEach(() => {
  deletePatientMock.mockReset()
})

describe("ClinicalSummaryPage — Delete Patient Record", () => {
  it("1 shows the Delete button for a completed/reviewed patient", async () => {
    renderSummary(makePatient({ status: "Completed" }))
    expect(await screen.findByRole("button", { name: "Delete Patient Record" })).toBeInTheDocument()
  })

  it("2 hides the Delete button for a waiting/active patient", async () => {
    renderSummary(makePatient({ status: "Waiting" }))
    // The section renders, but with an explanatory note instead of the button.
    await screen.findByText("Patient Record")
    expect(screen.queryByRole("button", { name: "Delete Patient Record" })).toBeNull()
    expect(screen.getByText(/only be deleted once the patient is marked/i)).toBeInTheDocument()
  })

  it("3 opens a confirmation modal with the patient details", async () => {
    renderSummary(makePatient({ status: "Completed", name: "Asha Kiran", age: 34 }))
    await ready()
    fireEvent.click(screen.getByRole("button", { name: "Delete Patient Record" }))

    const dialog = await screen.findByRole("dialog")
    const modal = within(dialog)
    expect(modal.getByText("Asha Kiran")).toBeInTheDocument()
    expect(modal.getByText("OPD-0851")).toBeInTheDocument()
    expect(modal.getByText("34 yrs")).toBeInTheDocument()
    expect(modal.getByText("Completed")).toBeInTheDocument()
    expect(modal.getByText(/this action cannot be undone/i)).toBeInTheDocument()
    expect(modal.getByRole("button", { name: "Delete Record" })).toBeInTheDocument()
    expect(modal.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
  })

  it("4 Cancel closes the modal without deleting", async () => {
    renderSummary(makePatient({ status: "Completed" }))
    await ready()
    fireEvent.click(screen.getByRole("button", { name: "Delete Patient Record" }))
    const dialog = await screen.findByRole("dialog")

    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(deletePatientMock).not.toHaveBeenCalled()
  })

  it("5 Confirm calls the backend delete with the patient id", async () => {
    deletePatientMock.mockResolvedValueOnce(undefined)
    renderSummary(makePatient({ status: "Completed" }))
    await ready()
    fireEvent.click(screen.getByRole("button", { name: "Delete Patient Record" }))
    const dialog = await screen.findByRole("dialog")

    fireEvent.click(within(dialog).getByRole("button", { name: "Delete Record" }))

    await waitFor(() => expect(deletePatientMock).toHaveBeenCalledWith("OPD-0851"))
  })

  it("6 & 12 success navigates to the queue, shows the message, clears selection & refreshes", async () => {
    deletePatientMock.mockResolvedValueOnce(undefined)
    const ctx = renderSummary(makePatient({ status: "Completed" }))
    await ready()
    fireEvent.click(screen.getByRole("button", { name: "Delete Patient Record" }))
    const dialog = await screen.findByRole("dialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete Record" }))

    // Success message appears only after the backend resolved, on the queue.
    expect(await screen.findByText("✓ Patient record deleted successfully.")).toBeInTheDocument()
    expect(screen.getByText("Patient Queue")).toBeInTheDocument()
    expect(ctx.refresh).toHaveBeenCalled()
    expect(ctx.clearSelectedPatient).toHaveBeenCalled()
  })

  it("11 & 12 failure keeps the patient, keeps the modal, shows an error, no success", async () => {
    deletePatientMock.mockRejectedValueOnce(new Error("server error"))
    renderSummary(makePatient({ status: "Completed" }))
    await ready()
    fireEvent.click(screen.getByRole("button", { name: "Delete Patient Record" }))
    const dialog = await screen.findByRole("dialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete Record" }))

    // Error surfaced, modal still open and usable, no success message.
    expect(await screen.findByText(/couldn't delete this patient record/i)).toBeInTheDocument()
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Delete Record" })).toBeEnabled()
    expect(screen.queryByText("✓ Patient record deleted successfully.")).toBeNull()
    // Still on the summary page (did not navigate away).
    expect(screen.queryByText("Patient Queue")).toBeNull()
  })
})
