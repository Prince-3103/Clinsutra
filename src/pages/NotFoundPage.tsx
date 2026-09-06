import { Link } from "react-router-dom"

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-[#F0F7FA] px-6 text-center">
      <div className="text-5xl">🔎</div>
      <div>
        <h1 className="text-xl font-bold text-[#0D1B2A] sm:text-2xl">
          This screen does not exist
        </h1>
        <p className="text-sm text-[#5A7184] mt-2">
          The page you tried to open is not part of Clinsutra.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/kiosk"
          className="px-5 py-3 rounded-2xl bg-[#0A6E8A] text-white font-semibold hover:bg-[#085F78] transition-colors"
        >
          Patient Kiosk
        </Link>
        <Link
          to="/doctor/queue"
          className="px-5 py-3 rounded-2xl border-2 border-[#D1E4ED] bg-white text-[#0D1B2A] font-semibold hover:bg-[#F0F7FA] transition-colors"
        >
          Doctor Dashboard
        </Link>
      </div>
    </div>
  )
}
