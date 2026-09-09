import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import type { SpeechEngine, VoiceSessionOptions } from "@/types"
import type * as Services from "@/services"

// Captures the options the mic hands the (mocked) voice engine, so a test can
// emit partial/final transcripts on demand — exercising the real VoiceInput ->
// useSpeechRecognition -> matcher -> selection pipeline.
const voiceCtl = vi.hoisted(() => ({ current: null as VoiceSessionOptions | null }))

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof Services>()
  const { CHIEF_COMPLAINT_QUESTION } = await import("@/data")
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
      getOpeningQuestion: async () => CHIEF_COMPLAINT_QUESTION,
    },
    voiceService: {
      ...actual.voiceService,
      isSupported: () => true,
      resolveEngine: () => fakeEngine,
      resolveEngines: () => [fakeEngine],
    },
  }
})

// Imported after the mock so the page picks up the mocked services.
const { InterviewPage } = await import("./InterviewPage")
const { KioskSessionProvider, useKioskSession } = await import("@/hooks")
const { CHIEF_COMPLAINT_QUESTION } = await import("@/data")

/** Surfaces the stored chief-complaint answer so tests can assert free text. */
function AnswerProbe() {
  const { getAnswer } = useKioskSession()
  const answer = getAnswer(CHIEF_COMPLAINT_QUESTION.id)
  return (
    <div data-testid="chief-answer" data-transcript={answer?.transcript ?? ""}>
      {answer?.optionIds[0] ?? ""}
    </div>
  )
}

function renderInterview() {
  return render(
    <KioskSessionProvider>
      <MemoryRouter initialEntries={["/kiosk/interview"]}>
        <Routes>
          <Route path="/kiosk/interview" element={<InterviewPage />} />
          <Route path="/kiosk/follow-up" element={<div>FOLLOWUP PAGE</div>} />
          <Route path="/kiosk/identify" element={<div>IDENTIFY PAGE</div>} />
        </Routes>
      </MemoryRouter>
      <AnswerProbe />
    </KioskSessionProvider>,
  )
}

async function ready() {
  await screen.findByText("What problem are you experiencing today?")
}

function option(name: RegExp) {
  return screen.getByRole("radio", { name })
}
function nextButton() {
  return screen.getByRole("button", { name: /next/i })
}
async function startMic() {
  fireEvent.click(screen.getByRole("button", { name: /^speak$/i }))
  // The mic starts the engine synchronously in the mock.
  expect(voiceCtl.current).not.toBeNull()
}
function speakFinal(text: string) {
  act(() => voiceCtl.current!.onResult({ transcript: text, interim: "", isFinal: true }))
}
function speakPartial(text: string) {
  act(() => voiceCtl.current!.onResult({ transcript: "", interim: text, isFinal: false }))
}

describe("InterviewPage — selection + Continue for tap and voice", () => {
  beforeEach(() => {
    voiceCtl.current = null
  })

  it("A/1/2 manual tap selects, enables Next, and advances", async () => {
    renderInterview()
    await ready()

    expect(nextButton()).toBeDisabled()
    fireEvent.click(option(/Fever or body ache/i))

    expect(option(/Fever or body ache/i).getAttribute("aria-checked")).toBe("true")
    expect(nextButton()).not.toBeDisabled()

    fireEvent.click(nextButton())
    expect(screen.getByText("FOLLOWUP PAGE")).toBeTruthy()
  })

  it("B/3/4/5 voice clear match selects, enables Next, and advances", async () => {
    renderInterview()
    await ready()
    await startMic()

    speakFinal("I have fever")

    expect(option(/Fever or body ache/i).getAttribute("aria-checked")).toBe("true")
    expect(nextButton()).not.toBeDisabled()

    fireEvent.click(nextButton())
    expect(screen.getByText("FOLLOWUP PAGE")).toBeTruthy()
  })

  it("C voice exact label selects and Next works", async () => {
    renderInterview()
    await ready()
    await startMic()

    speakFinal("Fever or body ache")

    expect(option(/Fever or body ache/i).getAttribute("aria-checked")).toBe("true")
    expect(nextButton()).not.toBeDisabled()
  })

  it("D/6 ambiguous voice makes no selection and keeps Next disabled + prompt", async () => {
    // On this question (which HAS a catch-all), an ambiguous known term is NOT
    // routed to Something else — the patient is asked to disambiguate.
    renderInterview()
    await ready()
    await startMic()

    speakFinal("pain")

    expect(nextButton()).toBeDisabled()
    expect(screen.getByRole("status").textContent).toContain("pain")
  })

  it("E/7 ambiguous voice does not select any of the tied options", async () => {
    renderInterview()
    await ready()
    await startMic()

    speakFinal("pain")

    expect(
      option(/Chest pain or tightness/i).getAttribute("aria-checked"),
    ).toBe("false")
    expect(
      option(/Stomach pain or nausea/i).getAttribute("aria-checked"),
    ).toBe("false")
    // "Something else" is NOT auto-picked for an ambiguous (known) term.
    expect(option(/Something else/i).getAttribute("aria-checked")).toBe("false")
  })

  it("F/8 manual tap works after an ambiguous voice attempt", async () => {
    renderInterview()
    await ready()
    await startMic()

    speakFinal("pain")
    expect(nextButton()).toBeDisabled()

    fireEvent.click(option(/Headache or dizziness/i))
    expect(option(/Headache or dizziness/i).getAttribute("aria-checked")).toBe("true")
    expect(nextButton()).not.toBeDisabled()
    fireEvent.click(nextButton())
    expect(screen.getByText("FOLLOWUP PAGE")).toBeTruthy()
  })

  it("G/9 voice after a manual selection updates to the latest option", async () => {
    renderInterview()
    await ready()

    fireEvent.click(option(/Headache or dizziness/i))
    expect(option(/Headache or dizziness/i).getAttribute("aria-checked")).toBe("true")

    await startMic()
    speakFinal("I have fever")

    expect(option(/Fever or body ache/i).getAttribute("aria-checked")).toBe("true")
    expect(option(/Headache or dizziness/i).getAttribute("aria-checked")).toBe("false")
    expect(nextButton()).not.toBeDisabled()
  })

  it("10 a partial transcript does not select; only the final does", async () => {
    renderInterview()
    await ready()
    await startMic()

    speakPartial("I have fever")
    expect(option(/Fever or body ache/i).getAttribute("aria-checked")).toBe("false")
    expect(nextButton()).toBeDisabled()

    speakFinal("I have fever")
    expect(option(/Fever or body ache/i).getAttribute("aria-checked")).toBe("true")
    expect(nextButton()).not.toBeDisabled()
  })

  describe('unknown answer -> "Something else" (BUG 1)', () => {
    it("selects Something else, enables Next, and preserves the transcript", async () => {
      renderInterview()
      await ready()
      await startMic()

      speakFinal("I have skin problem")

      // Routed to the catch-all — never an unrelated specific option.
      expect(option(/Something else/i).getAttribute("aria-checked")).toBe("true")
      expect(option(/Fever or body ache/i).getAttribute("aria-checked")).toBe("false")
      expect(nextButton()).not.toBeDisabled()

      // Original spoken text is stored as free text and displayed.
      const probe = screen.getByTestId("chief-answer")
      expect(probe.getAttribute("data-transcript")).toBe("I have skin problem")
      expect(screen.getByText(/I have skin problem/)).toBeInTheDocument()

      // No "please choose" prompt, since an option is now selected.
      expect(screen.queryByRole("status")).toBeNull()
    })

    it("lets the patient manually change the auto-selected Something else", async () => {
      renderInterview()
      await ready()
      await startMic()

      speakFinal("I have skin problem")
      expect(option(/Something else/i).getAttribute("aria-checked")).toBe("true")

      fireEvent.click(option(/Fever or body ache/i))
      expect(option(/Fever or body ache/i).getAttribute("aria-checked")).toBe("true")
      expect(option(/Something else/i).getAttribute("aria-checked")).toBe("false")
      expect(nextButton()).not.toBeDisabled()
      fireEvent.click(nextButton())
      expect(screen.getByText("FOLLOWUP PAGE")).toBeTruthy()
    })
  })
})
