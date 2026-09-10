import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { patientService, setAuthToken } from "@/services"

// Real apiClient path (VITE_USE_MOCK_API=false); only `fetch` is mocked.
interface Recorded {
  url: string
  init: RequestInit
}

let calls: Recorded[]

function setFetch(status: number, body: unknown = undefined) {
  calls = []
  global.fetch = vi.fn((url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} })
    return Promise.resolve({ ok: status < 300, status, json: async () => body })
  }) as unknown as typeof fetch
}

beforeEach(() => setAuthToken(null))
afterEach(() => {
  vi.restoreAllMocks()
  setAuthToken(null)
})

describe("Delete Patient Record with JWT", () => {
  it("attaches the bearer token and no legacy X-User-Role header", async () => {
    setAuthToken("jwt-abc")
    setFetch(204)

    await patientService.deletePatient("OPD-0851")

    expect(global.fetch).toHaveBeenCalledTimes(1)
    const { url, init } = calls[0]
    expect(url).toContain("/api/patients/OPD-0851")
    expect(init.method).toBe("DELETE")
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBe("Bearer jwt-abc")
    expect(headers["X-User-Role"]).toBeUndefined()
  })

  it("propagates a 403 as an ApiError (caller keeps the patient)", async () => {
    setAuthToken("jwt-abc")
    setFetch(403, { detail: "forbidden" })
    await expect(patientService.deletePatient("OPD-0851")).rejects.toMatchObject({
      status: 403,
    })
  })
})
