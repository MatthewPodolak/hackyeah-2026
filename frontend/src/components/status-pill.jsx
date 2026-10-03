import { cn } from "cn"

export default function StatusPill({ meta, label = "Status" }) {
  if (!meta) return null
  return (
    <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", meta.className)}>
      <span className="sr-only">{label}: </span>
      {meta.label}
    </span>
  )
}
