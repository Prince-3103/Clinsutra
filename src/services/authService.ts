import { CURRENT_DOCTOR } from "@/data"
import type { AuthUser, LoginResult } from "@/types"
import { API_CONFIG, ApiError, delay, request } from "./apiClient"

/**
 * Doctor authentication.
 *
 * Real mode calls the backend JWT endpoints (`/auth/login`, `/auth/me`). Mock
 * mode (`VITE_USE_MOCK_API=true`) uses a demo credential pair so the dashboard
 * is usable offline during a demo without a running backend.
 */

// Demo credentials for MOCK mode only. The real backend's demo doctor is seeded
// separately (see backend .env DEMO_DOCTOR_*), so real mode ignores these.
const MOCK_EMAIL = "doctor@clinsutra.demo"
const MOCK_TOKEN = "mock-doctor-token"

interface LoginResponse {
  accessToken: string
  tokenType: string
  user: AuthUser
}

function mockUser(): AuthUser {
  return {
    id: CURRENT_DOCTOR.id,
    email: MOCK_EMAIL,
    name: CURRENT_DOCTOR.name,
    role: "doctor",
    isActive: true,
    specialty: CURRENT_DOCTOR.specialty,
    room: CURRENT_DOCTOR.room,
    initials: CURRENT_DOCTOR.initials,
  }
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResult> {
    if (!API_CONFIG.useMock) {
      const response = await request<LoginResponse>("/auth/login", {
        method: "POST",
        body: { email, password },
      })
      return { token: response.accessToken, user: response.user }
    }

    // Mock demo auth: accept the demo email with any non-empty password.
    await delay(200)
    if (email.trim().toLowerCase() !== MOCK_EMAIL || !password) {
      throw new ApiError("Invalid email or password", 401, "http_401")
    }
    return { token: MOCK_TOKEN, user: mockUser() }
  },

  /** The currently authenticated user (validates the stored token in real mode). */
  async me(): Promise<AuthUser> {
    if (!API_CONFIG.useMock) return request<AuthUser>("/auth/me")
    await delay(40)
    return mockUser()
  },
}
