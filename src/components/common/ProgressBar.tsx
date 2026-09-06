import { useTranslation } from "@/hooks"

export function ProgressBar({ current, total }: { current: number; total: number }) {
  const { t } = useTranslation()
  const percent = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-[#5A7184] mb-2 font-medium">
        <span>{t("progress.step", { current, total })}</span>
        <span>{t("progress.complete", { percent })}</span>
      </div>
      <div
        className="h-3 bg-[#D1E4ED] rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-[#0A6E8A] rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
