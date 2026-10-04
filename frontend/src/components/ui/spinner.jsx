import { cn } from "cn"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon } from "@hugeicons/core-free-icons"
import { t } from "@/lib/i18n";

function Spinner({
  className,
  ...props
}) {
  return (
    <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} data-slot="spinner" role="status" aria-label={t("Ładowanie")} className={cn("size-4 animate-spin", className)} {...props} />
  )
}

export { Spinner }
