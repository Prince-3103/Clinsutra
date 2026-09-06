import { useContext } from "react"
import { KioskSessionContext } from "./kioskSessionContext"

export function useKioskSession() {
  const context = useContext(KioskSessionContext)
  if (!context) {
    throw new Error("useKioskSession must be used inside <KioskSessionProvider>")
  }
  return context
}
