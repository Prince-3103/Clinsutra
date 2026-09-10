/** The authenticated clinician, as returned by `/api/auth/me` and login. */
export interface AuthUser {
  id: string
  email: string | null
  name: string
  role: string
  isActive: boolean
  specialty: string
  room: string
  initials: string
}

export interface LoginResult {
  token: string
  user: AuthUser
}
