import { useEffect, useRef, type ReactNode } from "react"
import { cn } from "@/utils"

export interface ModalProps {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  /** Rendered bottom-right, e.g. confirm/cancel buttons. */
  footer?: ReactNode
  className?: string
}

/** Accessible dialog: focus moves in on open, Escape and backdrop clicks close. */
export function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    panelRef.current?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D1B2A]/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "bg-white rounded-3xl shadow-2xl border border-[#D1E4ED] w-full max-w-lg max-h-[85vh] overflow-y-auto outline-none",
          className,
        )}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#EEF3F6]">
          <h2 className="font-bold text-[#0D1B2A] text-base sm:text-lg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full text-[#5A7184] hover:bg-[#F0F7FA] transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 px-5 py-4 border-t border-[#EEF3F6] bg-[#F8FAFC]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
