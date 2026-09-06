import { useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/utils"

/**
 * Jump between the kiosk and the dashboard while demonstrating the system.
 *
 * Development only — `App` mounts it behind `import.meta.env.DEV`, so it is
 * absent from production bundles and from the deployed kiosk.
 */
export function DemoModeSwitcher() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const inDoctorMode = pathname.startsWith("/doctor")

  return (
    <div className="fixed top-3 right-3 z-50 flex items-center gap-2 bg-[#0D1B2A]/90 backdrop-blur-sm px-3 py-2 rounded-2xl shadow-xl border border-white/10">
      <span className="text-white/60 text-xs font-semibold uppercase tracking-wider mr-1">
        Demo
      </span>
      <button
        type="button"
        onClick={() => navigate("/kiosk")}
        className={cn(
          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
          !inDoctorMode ? "bg-[#0A6E8A] text-white" : "text-white/60 hover:text-white",
        )}
      >
        🏥 Patient Kiosk
      </button>
      <button
        type="button"
        onClick={() => navigate("/doctor/queue")}
        className={cn(
          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
          inDoctorMode ? "bg-[#0A6E8A] text-white" : "text-white/60 hover:text-white",
        )}
      >
        👨‍⚕️ Doctor Dashboard
      </button>
    </div>
  )
}
