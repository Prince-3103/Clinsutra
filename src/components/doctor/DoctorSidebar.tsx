import { NavLink, useNavigate } from "react-router-dom"
import { BrandLogo } from "@/components/common"
import type { Doctor } from "@/types"
import { cn } from "@/utils"

export interface DoctorNavItem {
  to: string
  icon: string
  label: string
  /** Rendered as a red pill on the right, e.g. the waiting count. */
  badge?: number
}

export interface DoctorSidebarProps {
  doctor: Doctor
  navItems: DoctorNavItem[]
  search: string
  onSearchChange: (value: string) => void
  stats: { waiting: number; seen: number; flags: number }
}

export function DoctorSidebar({
  doctor,
  navItems,
  search,
  onSearchChange,
  stats,
}: DoctorSidebarProps) {
  const navigate = useNavigate()

  return (
    <aside className="w-full shrink-0 bg-[#0D1B2A] flex flex-col h-auto max-h-[48vh] md:w-64 md:h-full md:max-h-none">
      <div className="px-4 py-4 border-b border-white/10 md:px-5 md:py-5">
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" />
          <div>
            <div className="text-white font-bold text-sm leading-tight sm:text-base">
              Clinsutra
            </div>
            <div className="text-[#5A9AB8] text-xs">Doctor Dashboard</div>
          </div>
        </div>
      </div>

      <div className="hidden px-5 py-4 border-b border-white/10 md:block">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1A3A52] rounded-full flex items-center justify-center text-[#5A9AB8] font-bold">
            Dr
          </div>
          <div>
            <div className="text-white text-sm font-semibold">{doctor.name}</div>
            <div className="text-[#5A9AB8] text-xs">
              {doctor.specialty} • {doctor.room}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden px-4 py-3 md:block">
        <div className="bg-[#1A3A52] rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="text-[#5A9AB8] text-sm" aria-hidden>
            🔍
          </span>
          <input
            value={search}
            onChange={(event) => {
              onSearchChange(event.target.value)
              // Searching only makes sense on the queue, so jump there.
              navigate("/doctor/queue")
            }}
            placeholder="Search patients…"
            aria-label="Search patients"
            className="bg-transparent text-white text-sm flex-1 outline-none placeholder:text-[#4A7A8A]"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="text-[#5A9AB8] text-xs hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto px-3 py-2 md:flex-1 md:flex-col md:gap-1 md:overflow-x-visible">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex shrink-0 items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all text-left md:w-full md:gap-3",
                isActive
                  ? "bg-[#0A6E8A] text-white shadow"
                  : "text-[#8AB4CC] hover:bg-white/5 hover:text-white",
              )
            }
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
            {item.badge !== undefined && item.badge > 0 && (
              <span className="ml-auto bg-[#DC2626] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="hidden px-4 py-3 border-t border-white/10 md:block">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Waiting", value: stats.waiting, color: "text-[#F59E0B]" },
            { label: "Seen", value: stats.seen, color: "text-[#10B981]" },
            { label: "Flags", value: stats.flags, color: "text-[#DC2626]" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#1A3A52] rounded-xl py-2">
              <div className={cn("font-bold text-lg sm:text-xl", stat.color)}>
                {stat.value}
              </div>
              <div className="text-[#5A9AB8] text-xs">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <NavLink
        to="/kiosk"
        className="hidden mx-4 mb-4 py-2 rounded-xl text-xs text-center text-[#5A9AB8] hover:text-white hover:bg-white/5 transition-colors md:block"
      >
        ← Patient Kiosk
      </NavLink>
    </aside>
  )
}
