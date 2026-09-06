import { useLocation } from "react-router-dom"
import { useKioskSession } from "./useKioskSession"

export interface KioskStep {
  path: string
  /** Progress is hidden on the first and last screens, as in the original design. */
  showProgress: boolean
}

/**
 * The kiosk journey, in order. The red-flag screen is conditional: it only
 * enters the flow when the demo triage rules fire, so the progress total
 * reflects what the patient will actually see.
 */
const BASE_STEPS: KioskStep[] = [
  { path: "/kiosk", showProgress: false },
  { path: "/kiosk/identify", showProgress: true },
  { path: "/kiosk/interview", showProgress: true },
  { path: "/kiosk/follow-up", showProgress: true },
  { path: "/kiosk/documents", showProgress: true },
  { path: "/kiosk/processing", showProgress: true },
  { path: "/kiosk/review", showProgress: true },
  { path: "/kiosk/complete", showProgress: false },
]

const RED_FLAG_STEP: KioskStep = { path: "/kiosk/red-flag", showProgress: true }

export interface KioskFlow {
  steps: KioskStep[]
  /** 1-based position of the current route, or 0 when off-flow. */
  step: number
  total: number
  showProgress: boolean
  /** Path of the next screen, or null at the end. */
  nextPath: string | null
  previousPath: string | null
}

export function useKioskFlow(): KioskFlow {
  const { pathname } = useLocation()
  const { assessment } = useKioskSession()

  const steps = [...BASE_STEPS]
  if (assessment?.triggered) {
    steps.splice(4, 0, RED_FLAG_STEP)
  }

  const index = steps.findIndex((entry) => entry.path === pathname)
  const current = index >= 0 ? steps[index] : null

  return {
    steps,
    step: index + 1,
    total: steps.length,
    showProgress: current?.showProgress ?? false,
    nextPath: index >= 0 && index < steps.length - 1 ? steps[index + 1].path : null,
    previousPath: index > 0 ? steps[index - 1].path : null,
  }
}
