import { cn } from "cn"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"

export default function SelectChip({ active, disabled, onClick, className, children, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        active
          ? "border-emerald-700 bg-emerald-500/10 text-emerald-800 dark:border-emerald-400 dark:text-emerald-300"
          : "border-foreground/45 hover:bg-muted",
        className
      )}
      {...props}
    >
      {active && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-3.5" aria-hidden="true" />}
      {children}
    </button>
  )
}
