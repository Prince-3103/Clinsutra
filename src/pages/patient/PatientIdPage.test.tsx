import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { KioskSessionProvider } from "@/hooks"
import { PatientIdPage } from "./PatientIdPage"

function renderPage() {
  const result = render(
    <KioskSessionProvider>
      <MemoryRouter initialEntries={["/kiosk/identify"]}>
        <Routes>
          <Route path="/kiosk/identify" element={<PatientIdPage />} />
          <Route path="/kiosk/interview" element={<div>INTERVIEW PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </KioskSessionProvider>,
  )
  // Switch to the New Patient tab so name/age/phone fields render.
  fireEvent.click(screen.getByRole("tab", { name: /new patient/i }))
  return result
}

const continueBtn = () => screen.getByRole("button", { name: /continue/i })

describe("PatientIdPage — new patient validation", () => {
  it("rejects age 0: shows a message and disables Continue", () => {
    renderPage()
    fireEvent.change(screen.getByLabelText(/full name|name/i), { target: { value: "Test" } })
    fireEvent.change(screen.getByLabelText(/age/i), { target: { value: "0" } })

    expect(screen.getByText(/valid age between 1 and 120/i)).toBeInTheDocument()
    expect(continueBtn()).toBeDisabled()
  })

  it("strips non-digits and rejects a mobile number that is not 10 digits", () => {
    renderPage()
    const phone = screen.getByLabelText(/phone|mobile/i) as HTMLInputElement
    fireEvent.change(phone, { target: { value: "98abc" } })
    // Non-digits stripped.
    expect(phone.value).toBe("98")
    expect(screen.getByText(/valid 10-digit mobile number/i)).toBeInTheDocument()
    expect(continueBtn()).toBeDisabled()
  })

  it("accepts a valid new patient and proceeds to the interview", () => {
    renderPage()
    fireEvent.change(screen.getByLabelText(/full name|name/i), { target: { value: "Asha" } })
    fireEvent.change(screen.getByLabelText(/age/i), { target: { value: "34" } })

    expect(continueBtn()).not.toBeDisabled()
    fireEvent.click(continueBtn())
    expect(screen.getByText("INTERVIEW PAGE")).toBeInTheDocument()
  })

  it("caps age at 3 digits / 120 max", () => {
    renderPage()
    fireEvent.change(screen.getByLabelText(/age/i), { target: { value: "999" } })
    expect(screen.getByText(/valid age between 1 and 120/i)).toBeInTheDocument()
    expect(continueBtn()).toBeDisabled()
  })
})
