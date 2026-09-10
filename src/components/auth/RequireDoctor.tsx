import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks"

/**
 * Route guard for `/doctor/*`. Sends unauthenticated visitors to the login
 * page (remembering where they were headed), and holds rendering while a
 * stored token is still being validated so a valid session isn't briefly
 * bounced to login on a refresh.
 */
export function RequireDoctor() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#F0F7FA] flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-[#0A6E8A] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (status !== "authenticated") {
    return <Navigate to="/doctor/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
