import { useState, type FormEvent } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { BrandLogo } from "@/components/common"
import { useAuth } from "@/hooks"
import { ApiError } from "@/services"
import { cn } from "@/utils"

interface FromState {
  from?: { pathname?: string }
}

/** Doctor sign-in. Public route; the rest of `/doctor/*` requires the session. */
export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Already signed in — skip the form.
  if (isAuthenticated) return <Navigate to="/doctor/queue" replace />

  const target = (location.state as FromState | null)?.from?.pathname ?? "/doctor/queue"

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError("Please enter your email and password.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await login(email, password)
      navigate(target, { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Invalid email or password.")
      } else {
        setError("Couldn't sign in right now. Please try again.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F7FA] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-6">
          <BrandLogo size="md" />
          <h1 className="text-xl font-bold text-[#0D1B2A]">Clinsutra</h1>
          <p className="text-sm text-[#5A7184]">Doctor sign in</p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white border border-[#D1E4ED] rounded-2xl p-5 flex flex-col gap-4 shadow-sm"
        >
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-[#0D1B2A]">Email</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@clinsutra.demo"
              className="rounded-xl border border-[#D1E4ED] px-3 py-2.5 text-base outline-none focus:border-[#0A6E8A]"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-[#0D1B2A]">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded-xl border border-[#D1E4ED] px-3 py-2.5 text-base outline-none focus:border-[#0A6E8A]"
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-[#B91C1C] font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "rounded-xl bg-[#0A6E8A] px-4 py-3 text-base font-bold text-white transition-colors hover:bg-[#085F78]",
              submitting && "opacity-70",
            )}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-[#5A7184]">
          Patient?{" "}
          <a href="/kiosk" className="font-semibold text-[#0A6E8A] underline">
            Go to the kiosk
          </a>
        </p>
      </div>
    </div>
  )
}
