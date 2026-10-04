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
        "flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        active
          ? "border-transparent bg-secondary text-secondary-foreground"
          : "border-outline text-foreground hover:bg-muted",
        className
      )}
      {...props}
    >
      {active && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-4" aria-hidden="true" />}
      {children}
    </button>
  )
}
