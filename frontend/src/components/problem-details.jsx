"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, BulbIcon, Calendar03Icon, Cancel01Icon, Location01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { useProblem } from "@/api/hooks/useProblemsQuery"

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" })

export default function ProblemDetails({ problem, onClose, onProposeSolution }) {
  const details = useProblem(problem?.id)

  if (!problem) return null

  const imageUrl = details.data?.imageUrl

  return (
    <div className="absolute z-[1000] left-4 right-20 bottom-4 sm:right-auto sm:w-120 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex max-h-[calc(100vh-6rem)] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl">
        <div className="h-1.5 shrink-0 bg-red-500" />

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
          <div className="flex items-start gap-3">
            <div className="shrink-0 size-11 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
              <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-6" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-red-600 dark:text-red-400">
                Zgłoszony problem
              </p>
              <h2 className="text-lg font-semibold leading-snug break-words">
                {problem.title}
              </h2>
            </div>

            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Zamknij">
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            </Button>
          </div>

          {imageUrl && (
            <img src={imageUrl} alt={problem.title} className="max-h-72 w-full rounded-xl border object-cover" />
          )}

          {problem.description && (
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line break-words">
              {problem.description}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
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

        <div className="shrink-0 border-t p-4">
          <Button
            size="lg"
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            onClick={() => onProposeSolution?.(problem)}
          >
            Zaproponuj rozwiązanie
          </Button>
        </div>
      </div>
    </div>
  )
}
