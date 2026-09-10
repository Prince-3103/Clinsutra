import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { authService, registerAuthHandlers, setAuthToken } from "@/services"
import type { AuthUser } from "@/types"
import {
  AuthContext,
  SELECTED_PATIENT_KEY,
  TOKEN_STORAGE_KEY,
  type AuthContextValue,
  type AuthStatus,
} from "./authContext"

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStoredToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token)
    else localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    // Private mode / storage disabled — auth just won't survive a refresh.
  }
}

function clearSelectedPatient(): void {
  try {
    sessionStorage.removeItem(SELECTED_PATIENT_KEY)
  } catch {
    // ignore
  }
}

/**
 * Central auth state: the JWT (persisted in localStorage) and the authenticated
 * user. Attaches the token to the API client, validates a stored token on load
 * via `/auth/me`, and wires the client's global 401/403 handlers so no
 * component has to deal with session expiry itself.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>("loading")
  const [notice, setNotice] = useState<string | null>(null)

  const logout = useCallback(() => {
    setAuthToken(null)
    writeStoredToken(null)
    clearSelectedPatient()
    setUser(null)
    setNotice(null)
    setStatus("unauthenticated")
  }, [])

  // Keep the latest logout in a ref so the (once-registered) 401 handler always
  // calls the current one without re-registering on every render.
  const logoutRef = useRef(logout)
  logoutRef.current = logout

  useEffect(() => {
    registerAuthHandlers({
      onUnauthorized: () => logoutRef.current(),
      onForbidden: (message) => setNotice(message),
    })
    return () => registerAuthHandlers({})
  }, [])

  // Validate a stored token once on mount.
  useEffect(() => {
    const token = readStoredToken()
    if (!token) {
      setStatus("unauthenticated")
      return
    }
    setAuthToken(token)
    let cancelled = false
    authService
      .me()
      .then((me) => {
        if (cancelled) return
        setUser(me)
        setStatus("authenticated")
      })
      .catch(() => {
        // Invalid/expired stored token.
        if (cancelled) return
        setAuthToken(null)
        writeStoredToken(null)
        setStatus("unauthenticated")
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: loggedIn } = await authService.login(email, password)
    setAuthToken(token)
    writeStoredToken(token)
    setUser(loggedIn)
    setNotice(null)
    setStatus("authenticated")
  }, [])

  const clearNotice = useCallback(() => setNotice(null), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated",
      notice,
      login,
      logout,
      clearNotice,
    }),
    [user, status, notice, login, logout, clearNotice],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
