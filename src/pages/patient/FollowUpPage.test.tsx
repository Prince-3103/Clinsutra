import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useEffect } from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import type {
  ComplaintId,
  Question,
  RedFlagAssessment,
  SpeechEngine,
  VoiceSessionOptions,
} from "@/types"
import type * as Services from "@/services"

const voiceCtl = vi.hoisted(() => ({ current: null as VoiceSessionOptions | null }))

// Two follow-ups with clearly distinct labels so matching is unambiguous.
const FOLLOWUPS: Question[] = [
  {
    id: "fv-duration",
    kind: "single",
    prompt: { en: "How long have you had fever?", hi: "बुखार कब से है?" },
    options: [
      { id: "fv-dur-today", label: { en: "Since today", hi: "आज से" } },
      { id: "fv-dur-week", label: { en: "About a week", hi: "लगभग एक सप्ताह" } },
    ],
  },
  {
    id: "fv-chills",
    kind: "single",
    prompt: { en: "Do you have chills?", hi: "क्या आपको ठंड लगती है?" },
    options: [
      { id: "fv-chills-yes", label: { en: "Yes chills", hi: "हाँ ठंड" } },
      { id: "fv-chills-no", label: { en: "No chills", hi: "नहीं ठंड" } },
    ],
  },
]

const NO_RED_FLAG: RedFlagAssessment = {
  triggered: false,
  priority: "P3",
  ruleIds: [],
  reasons: [],
}

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof Services>()
  const fakeEngine: SpeechEngine = {
    id: "gemini-live",
    isSupported: () => true,
    start: (options: VoiceSessionOptions) => {
      voiceCtl.current = options
    },
    stop: () => voiceCtl.current?.onEnd(),
    abort: () => {},
  }
  return {
    ...actual,
    clinicalService: {
      ...actual.clinicalService,
      getFollowUpQuestions: async () => FOLLOWUPS,
      assessRedFlags: async () => NO_RED_FLAG,
    },
    voiceService: {
      ...actual.voiceService,
      isSupported: () => true,
      resolveEngine: () => fakeEngine,
      resolveEngines: () => [fakeEngine],
    },
  }
})

const { FollowUpPage } = await import("./FollowUpPage")
const { KioskSessionProvider, useKioskSession } = await import("@/hooks")
const { clinicalService } = await import("@/services")

/**
 * Seeds the chief complaint, then renders FollowUpPage only once it is set —
 * otherwise FollowUpPage's `!complaintId` guard would redirect on first render
 * before the seeding effect runs.
 */
function Harness({ complaint }: { complaint: ComplaintId }) {
  const { complaintId, setComplaint } = useKioskSession()
  useEffect(() => {
    if (!complaintId) setComplaint(complaint, complaint)
  }, [complaint, complaintId, setComplaint])

  if (!complaintId) return null
  return (
    <MemoryRouter initialEntries={["/kiosk/follow-up"]}>
      <Routes>
        <Route path="/kiosk/follow-up" element={<FollowUpPage />} />
        <Route path="/kiosk/documents" element={<div>DOCUMENTS PAGE</div>} />
        <Route path="/kiosk/red-flag" element={<div>RED FLAG PAGE</div>} />
        <Route path="/kiosk/interview" element={<div>INTERVIEW PAGE</div>} />
      </Routes>
    </MemoryRouter>
  )
}

function renderFollowUp() {
  return render(
    <KioskSessionProvider>
      <Harness complaint="fever" />
    </KioskSessionProvider>,
  )
}

async function startMic() {
  fireEvent.click(screen.getByRole("button", { name: /^speak$/i }))
  expect(voiceCtl.current).not.toBeNull()
}
function speakFinal(text: string) {
  act(() => voiceCtl.current!.onResult({ transcript: text, interim: "", isFinal: true }))
}

describe("FollowUpPage — voice selection", () => {
  beforeEach(() => {
    voiceCtl.current = null
  })

  it("11 voice selects the correct question's option, not others", async () => {
    renderFollowUp()
    await screen.findByText("How long have you had fever?")
    await startMic()

    speakFinal("about a week")

    expect(screen.getByRole("radio", { name: /About a week/i }).getAttribute("aria-checked")).toBe("true")
    // Other options across both questions stay unselected.
    expect(screen.getByRole("radio", { name: /Since today/i }).getAttribute("aria-checked")).toBe("false")
    expect(screen.getByRole("radio", { name: /Yes chills/i }).getAttribute("aria-checked")).toBe("false")
    expect(screen.getByRole("radio", { name: /No chills/i }).getAttribute("aria-checked")).toBe("false")
  })

  it("12 Continue works after a voice selection", async () => {
    renderFollowUp()
    await screen.findByText("Do you have chills?")
    await startMic()

    speakFinal("yes chills")
    expect(screen.getByRole("radio", { name: /Yes chills/i }).getAttribute("aria-checked")).toBe("true")

    fireEvent.click(screen.getByRole("button", { name: /continue/i }))
    await waitFor(() => expect(screen.getByText("DOCUMENTS PAGE")).toBeInTheDocument())
  })

  it("ambiguous voice does not answer any question", async () => {
    renderFollowUp()
    await screen.findByText("How long have you had fever?")
    await startMic()

    // "chills" hits both "Yes chills" and "No chills" -> ambiguous, no selection.
    speakFinal("chills")

    expect(screen.getByRole("radio", { name: /Yes chills/i }).getAttribute("aria-checked")).toBe("false")
    expect(screen.getByRole("radio", { name: /No chills/i }).getAttribute("aria-checked")).toBe("false")
    expect(screen.getByRole("status").textContent).toContain("chills")
  })
})

describe("FollowUpPage — Continue robustness (BUG 2)", () => {
  beforeEach(() => {
    voiceCtl.current = null
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("Continue is enabled once questions have loaded", async () => {
    renderFollowUp()
    await screen.findByText("How long have you had fever?")
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled()
  })

  it("shows an error, keeps the answer, and does not navigate when the API fails", async () => {
    vi.spyOn(clinicalService, "assessRedFlags").mockRejectedValueOnce(
      new Error("network down"),
    )
    renderFollowUp()
    await screen.findByText("Do you have chills?")

    fireEvent.click(screen.getByRole("radio", { name: /Yes chills/i }))
    expect(screen.getByRole("radio", { name: /Yes chills/i }).getAttribute("aria-checked")).toBe("true")

    fireEvent.click(screen.getByRole("button", { name: /continue/i }))

    // A user-facing error appears...
    await screen.findByRole("alert")
    expect(screen.getByRole("alert").textContent).toMatch(/unable to continue/i)
    // ...navigation did NOT happen...
    expect(screen.queryByText("DOCUMENTS PAGE")).toBeNull()
    // ...and the entered answer is preserved for a retry.
    expect(screen.getByRole("radio", { name: /Yes chills/i }).getAttribute("aria-checked")).toBe("true")
    // Continue is usable again.
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled()
  })

  it("recovers on retry after a transient failure", async () => {
    const spy = vi
      .spyOn(clinicalService, "assessRedFlags")
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(NO_RED_FLAG)
    renderFollowUp()
    await screen.findByText("Do you have chills?")
    fireEvent.click(screen.getByRole("radio", { name: /No chills/i }))

    fireEvent.click(screen.getByRole("button", { name: /continue/i }))
    await screen.findByRole("alert")

    // Retry succeeds -> navigates, error gone.
    fireEvent.click(screen.getByRole("button", { name: /continue/i }))
    await waitFor(() => expect(screen.getByText("DOCUMENTS PAGE")).toBeInTheDocument())
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
