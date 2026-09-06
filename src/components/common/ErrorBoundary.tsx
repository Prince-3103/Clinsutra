import { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Keeps a render failure on one screen from blanking the whole kiosk.
 *
 * The error itself is not printed: on a clinical screen the React tree can hold
 * patient answers, and console output on a shared kiosk is not private.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("Render error:", error.message, info.componentStack)
    }
  }

  override render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-[#F0F7FA] px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#FEF2F2] border-2 border-[#FCA5A5] flex items-center justify-center text-3xl">
          ⚠
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#0D1B2A] sm:text-2xl">
            Something went wrong on this screen
          </h1>
          <p className="text-sm text-[#5A7184] mt-2 max-w-md">
            Please call a staff member for assistance, or reload to start again.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.assign("/kiosk")}
          className="px-6 py-3 rounded-2xl bg-[#0A6E8A] text-white font-semibold hover:bg-[#085F78] transition-colors"
        >
          Start again
        </button>
      </div>
    )
  }
}
