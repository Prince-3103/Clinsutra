import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { RequireDoctor } from "@/components/auth"
import { AuthProvider, useAuth } from "@/hooks"
import { request, setAuthToken } from "@/services"

type FetchHandler = (url: string, init: RequestInit) => { ok: boolean; status: number; json: () => Promise<unknown> }

function setFetch(handler: FetchHandler) {
  global.fetch = vi.fn((url: RequestInfo | URL, init?: RequestInit) =>
    Promise.resolve(handler(String(url), init ?? {})),
  ) as unknown as typeof fetch
}

const DEMO_USER = {
  id: "DOC-01",
  email: "doctor@clinsutra.demo",
  name: "Dr. Anjali Mehta",
  role: "doctor",
  isActive: true,
  specialty: "Cardiologist",
  room: "OPD 3",
  initials: "A",
}

/** A protected screen that can fire an authenticated request and log out. */
function DashboardHarness() {
  const { notice, logout } = useAuth()
  return (
    <div>
      <div>DASHBOARD</div>
      <div data-testid="notice">{notice ?? ""}</div>
      <button onClick={logout}>Log out</button>
      <button onClick={() => request("/patients").catch(() => {})}>call-api</button>
    </div>
  )
}

function renderApp(initialEntry: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/kiosk" element={<div>KIOSK PAGE</div>} />
          <Route path="/doctor/login" element={<div>LOGIN PAGE</div>} />
          <Route element={<RequireDoctor />}>
            <Route path="/doctor/queue" element={<DashboardHarness />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  setAuthToken(null)
})
afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  setAuthToken(null)
})

describe("Auth routing / RBAC", () => {
  it("redirects an unauthenticated visitor from a protected route to login", async () => {
    setFetch(() => ({ ok: false, status: 401, json: async () => ({}) }))
    renderApp("/doctor/queue")
    expect(await screen.findByText("LOGIN PAGE")).toBeInTheDocument()
    expect(screen.queryByText("DASHBOARD")).toBeNull()
  })

  it("keeps the patient kiosk accessible without login", async () => {
    renderApp("/kiosk")
    expect(await screen.findByText("KIOSK PAGE")).toBeInTheDocument()
  })

  it("allows a valid stored session and renders the protected route", async () => {
    localStorage.setItem("clinsutra:token", "jwt-123")
    setFetch((url) =>
      url.includes("/auth/me")
        ? { ok: true, status: 200, json: async () => DEMO_USER }
        : { ok: false, status: 404, json: async () => ({}) },
    )
    renderApp("/doctor/queue")
    expect(await screen.findByText("DASHBOARD")).toBeInTheDocument()
  })

  it("logs out: clears the session and returns to login", async () => {
    localStorage.setItem("clinsutra:token", "jwt-123")
    setFetch((url) =>
      url.includes("/auth/me")
        ? { ok: true, status: 200, json: async () => DEMO_USER }
        : { ok: false, status: 404, json: async () => ({}) },
    )
    renderApp("/doctor/queue")
    await screen.findByText("DASHBOARD")

    fireEvent.click(screen.getByRole("button", { name: /log out/i }))

    expect(await screen.findByText("LOGIN PAGE")).toBeInTheDocument()
    expect(localStorage.getItem("clinsutra:token")).toBeNull()
  })

  it("401 on an authenticated request expires the session and redirects to login", async () => {
    localStorage.setItem("clinsutra:token", "jwt-123")
    setFetch((url) =>
      url.includes("/auth/me")
        ? { ok: true, status: 200, json: async () => DEMO_USER }
        : { ok: false, status: 401, json: async () => ({}) }, // /patients -> 401
    )
    renderApp("/doctor/queue")
    await screen.findByText("DASHBOARD")

    fireEvent.click(screen.getByRole("button", { name: "call-api" }))

    expect(await screen.findByText("LOGIN PAGE")).toBeInTheDocument()
    expect(localStorage.getItem("clinsutra:token")).toBeNull()
  })

  it("403 on a request surfaces an authorization notice without logging out", async () => {
    localStorage.setItem("clinsutra:token", "jwt-123")
    setFetch((url) =>
      url.includes("/auth/me")
        ? { ok: true, status: 200, json: async () => DEMO_USER }
        : { ok: false, status: 403, json: async () => ({}) }, // /patients -> 403
    )
    renderApp("/doctor/queue")
    await screen.findByText("DASHBOARD")

    fireEvent.click(screen.getByRole("button", { name: "call-api" }))

    await waitFor(() =>
      expect(screen.getByTestId("notice")).toHaveTextContent(/not authorized/i),
    )
    // Still authenticated — a 403 is not a session expiry.
    expect(screen.getByText("DASHBOARD")).toBeInTheDocument()
  })
})
