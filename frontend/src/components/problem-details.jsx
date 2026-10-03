"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, Calendar03Icon, Cancel01Icon, Location01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" })

export default function ProblemDetails({ problem, onClose }) {
  if (!problem) return null

  return (
    <div className="absolute z-[1000] left-4 right-20 bottom-4 sm:right-auto sm:w-96 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="rounded-xl border bg-background shadow-xl overflow-hidden">
        <div className="h-1 bg-red-500" />

        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="shrink-0 size-9 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
              <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-red-600 dark:text-red-400">
                Zgłoszony problem
              </p>
              <h2 className="text-base font-semibold leading-snug break-words">
                {problem.title}
              </h2>
            </div>

            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Zamknij">
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            </Button>
          </div>

          {problem.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-line break-words max-h-48 overflow-y-auto">
              {problem.description}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-xs text-muted-foreground border-t pt-3">
            <span className="flex min-w-0 items-center gap-1.5">
              <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-4 shrink-0" />
              <span className="truncate">
                {problem.street ?? `${problem.latitude.toFixed(5)}, ${problem.longitude.toFixed(5)}`}
              </span>
            </span>
            {problem.localDate && (
              <span className="flex shrink-0 items-center gap-1.5 tabular-nums">
                <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-4" />
                {dateFormat.format(new Date(problem.localDate))}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
