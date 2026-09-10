import { createContext, useContext } from "react"
import type { AuthUser } from "@/types"

export type AuthStatus = "loading" | "authenticated" | "unauthenticated"

export interface AuthContextValue {
  user: AuthUser | null
  status: AuthStatus
  isAuthenticated: boolean
  /** Transient authorization notice (e.g. a 403), or null. */
  notice: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  clearNotice: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error("useAuth must be used within an AuthProvider")
  return value
}

/** localStorage key for the JWT. Survives refreshes; per-origin. */
export const TOKEN_STORAGE_KEY = "clinsutra:token"
/** sessionStorage key DoctorLayout uses for the selected patient. */
export const SELECTED_PATIENT_KEY = "clinsutra:selectedPatientId"
