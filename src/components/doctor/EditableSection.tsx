import type { ReactNode } from "react"
import { SectionCard } from "@/components/common"

export interface EditableSectionProps {
  title: string
  icon: string
  value: string
  editing: boolean
  onChange: (value: string) => void
  rows?: number
  actions?: ReactNode
  /** Rendered under the text, e.g. the abnormal-values shortcut. */
  footer?: ReactNode
}

/** A clinical-summary block the doctor can edit in place. */
export function EditableSection({
  title,
  icon,
  value,
  editing,
  onChange,
  rows = 3,
  actions,
  footer,
}: EditableSectionProps) {
  return (
    <SectionCard title={title} icon={icon} actions={actions}>
      {editing ? (
        <textarea
          value={value}
          aria-label={title}
          onChange={(event) => onChange(event.target.value)}
          className="w-full border border-[#D1E4ED] rounded-xl px-3 py-2 text-sm text-[#0D1B2A] resize-none focus:outline-none focus:border-[#0A6E8A]"
          rows={rows}
        />
      ) : (
        <p className="text-[#0D1B2A] text-sm leading-relaxed">{value}</p>
      )}
      {footer}
    </SectionCard>
  )
}
