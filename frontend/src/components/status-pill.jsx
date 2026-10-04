import { cn } from "cn"
import { t } from "@/lib/i18n";

export default function StatusPill({ meta, label = t("Status") }) {
  if (!meta) return null
  return (
    <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", meta.className)}>
      <span className="sr-only">{label}: </span>
      {meta.label}
    </span>
  )
}
