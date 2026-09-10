import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "@/hooks"
import { setAuthToken } from "@/services"
import { LoginPage } from "./LoginPage"

// Only `fetch` is mocked, so the real AuthProvider + authService + apiClient
// stack runs end to end (tests run with VITE_USE_MOCK_API=false).
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

function renderLogin() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/doctor/login"]}>
        <Routes>
          <Route path="/doctor/login" element={<LoginPage />} />
          <Route path="/doctor/queue" element={<div>QUEUE PAGE</div>} />
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

describe("LoginPage", () => {
  it("renders the sign-in form", async () => {
    setFetch(() => ({ ok: false, status: 404, json: async () => ({}) }))
    renderLogin()
    expect(await screen.findByRole("button", { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/clinsutra\.demo/i)).toBeInTheDocument()
  })

  it("validates empty fields without calling the API", async () => {
    const fetchSpy = vi.fn()
    global.fetch = fetchSpy as unknown as typeof fetch
    renderLogin()
    await screen.findByRole("button", { name: /sign in/i })

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/enter your email and password/i)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("shows an error on invalid credentials (401)", async () => {
    setFetch((url) =>
      url.includes("/auth/login")
        ? { ok: false, status: 401, json: async () => ({ detail: "bad" }) }
        : { ok: false, status: 404, json: async () => ({}) },
    )
    renderLogin()
    await screen.findByRole("button", { name: /sign in/i })

    fireEvent.change(screen.getByPlaceholderText(/clinsutra\.demo/i), {
      target: { value: "doctor@clinsutra.demo" },
    })
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "wrong-password" },
    })
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid email or password/i)
    expect(screen.queryByText("QUEUE PAGE")).toBeNull()
  })

  it("logs in successfully and redirects to the queue", async () => {
    setFetch((url) =>
      url.includes("/auth/login")
        ? {
            ok: true,
            status: 200,
            json: async () => ({ accessToken: "jwt-123", tokenType: "bearer", user: DEMO_USER }),
          }
        : { ok: false, status: 404, json: async () => ({}) },
    )
    renderLogin()
    await screen.findByRole("button", { name: /sign in/i })

    fireEvent.change(screen.getByPlaceholderText(/clinsutra\.demo/i), {
      target: { value: "doctor@clinsutra.demo" },
    })
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "change-me" },
    })
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    expect(await screen.findByText("QUEUE PAGE")).toBeInTheDocument()
    // Token persisted for future sessions.
    expect(localStorage.getItem("clinsutra:token")).toBe("jwt-123")
  })
})
