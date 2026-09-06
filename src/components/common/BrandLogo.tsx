import { cn } from "@/utils"

export type BrandLogoSize = "xs" | "sm" | "md" | "lg"

const SIZES: Record<BrandLogoSize, string> = {
  xs: "w-8 h-8 rounded-lg",
  sm: "w-9 h-9 rounded-xl",
  md: "w-14 h-14 rounded-2xl",
  lg: "w-28 h-28 rounded-3xl sm:w-32 sm:h-32",
}

const SHADOWS: Record<BrandLogoSize, string> = {
  xs: "shadow",
  sm: "shadow",
  md: "shadow-lg shadow-[#0A6E8A]/15",
  lg: "shadow-lg shadow-[#0A6E8A]/15",
}

/** The Clinsutra mark. The asset lives in `public/` so it is cacheable. */
export function BrandLogo({ size = "md" }: { size?: BrandLogoSize }) {
  return (
    <img
      src="/clinsutra-logo.png"
      alt="Clinsutra logo"
      className={cn(SIZES[size], "object-cover", SHADOWS[size])}
    />
  )
}
