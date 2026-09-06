import type { ReactNode } from "react"

export interface SectionCardProps {
  title: string
  children: ReactNode
  icon?: string
  /** Rendered on the right of the header, e.g. a "View timeline" link. */
  actions?: ReactNode
}

/** Titled panel used throughout the doctor dashboard. */
export function SectionCard({ title, children, icon, actions }: SectionCardProps) {
  return (
    <div className="bg-white border border-[#D1E4ED] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#EEF3F6] bg-[#F8FAFC] sm:px-5">
        <div className="flex items-center gap-2 font-semibold text-[#0D1B2A] text-sm">
          {icon && <span aria-hidden>{icon}</span>}
          {title}
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}
