import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  level: "normal" | "caution" | "check"
  size?: "sm" | "md" | "lg"
  className?: string
}

const levelConfig = {
  normal: {
    label: "정상",
    bgClass: "bg-emerald-100",
    textClass: "text-emerald-700",
    dotClass: "bg-emerald-500",
  },
  caution: {
    label: "주의",
    bgClass: "bg-amber-100",
    textClass: "text-amber-700",
    dotClass: "bg-amber-500",
  },
  check: {
    label: "확인 필요",
    bgClass: "bg-rose-100",
    textClass: "text-rose-700",
    dotClass: "bg-rose-500",
  },
}

const sizeConfig = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-base",
}

export function StatusBadge({ level, size = "md", className }: StatusBadgeProps) {
  const config = levelConfig[level]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full",
        config.bgClass,
        config.textClass,
        sizeConfig[size],
        className,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dotClass)} />
      {config.label}
    </span>
  )
}
