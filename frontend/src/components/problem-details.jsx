"use client"

import { useEffect, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, Calendar03Icon, Cancel01Icon, Location01Icon } from "@hugeicons/core-free-icons"
import { IconTile } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useProblem } from "@/api/hooks/useProblemsQuery"
import { useGminyIndex } from "@/api/hooks/useRegionsQuery"
import StatusPill from "@/components/status-pill"
import { problemStatus } from "@/lib/problems"
import { getProblemCategoryOption, getTargetGroupOption } from "@/lib/problemCategories"
import { problemPlace } from "@/lib/gminy"

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" })

export default function ProblemDetails({ problem, onClose, onProposeSolution }) {
  const details = useProblem(problem?.id)
  const gminy = useGminyIndex()
  const headingRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const problemId = problem?.id

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (problemId == null) return
    const opener = document.activeElement
    headingRef.current?.focus({ preventScroll: true })
    const onKeyDown = (e) => {
      if (e.key === "Escape") onCloseRef.current?.()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      if (opener instanceof HTMLElement && opener.isConnected && !document.querySelector("[role=dialog]")) {
        opener.focus({ preventScroll: true })
      }
    }
  }, [problemId])

  if (!problem) return null

  const imageUrl = details.data?.imageUrl
  const category = getProblemCategoryOption(problem.category)
  const targetGroup = getTargetGroupOption(problem.targetGroup)

  return (
    <section
      aria-labelledby="problem-details-heading"
      className="absolute z-[1000] left-4 right-20 bottom-4 sm:right-auto sm:w-120 animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="flex max-h-[calc(100vh-6rem)] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-elevation-3">

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
          <div className="flex items-start gap-3">
            <IconTile icon={Alert02Icon} tone="danger" />

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Zgłoszony problem
              </p>
              <h2 id="problem-details-heading" ref={headingRef} tabIndex={-1} className="font-heading text-xl font-bold tracking-tight leading-snug break-words outline-none">
                {problem.title}
              </h2>
            </div>

            <Button variant="ghost" size="icon" className="-mt-1 -mr-2" onClick={onClose} aria-label="Zamknij szczegóły problemu">
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            </Button>
          </div>

          <ul className="flex flex-wrap items-center gap-1.5" aria-label="Status i kategorie">
            <li>
              <StatusPill meta={problemStatus(problem.status)} />
            </li>
            <li>
              <Badge variant="secondary">
                <span aria-hidden="true">{category.icon}</span> {category.label}
              </Badge>
            </li>
            <li>
              <Badge variant="outline">
                <span aria-hidden="true">{targetGroup.icon}</span> {targetGroup.label}
              </Badge>
            </li>
          </ul>

          {imageUrl && (
            <img src={imageUrl} alt={problem.title} className="max-h-72 w-full rounded-xl border object-cover" />
          )}

          {problem.description && (
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line break-words">
              {problem.description}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl bg-muted/70 px-4 py-3 text-sm text-muted-foreground">
            <span className="flex min-w-0 items-center gap-1.5">
              <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-4 shrink-0" aria-hidden="true" />
              <span className="sr-only">Miejsce: </span>
              <span className="break-words">
                {problemPlace(problem, gminy)}
              </span>
            </span>
            {problem.localDate && (
              <span className="flex shrink-0 items-center gap-1.5 tabular-nums">
                <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-4" aria-hidden="true" />
                <span className="sr-only">Zgłoszono: </span>
                <time dateTime={problem.localDate}>{dateFormat.format(new Date(problem.localDate))}</time>
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-border px-5 py-4">
          <Button
            size="lg"
            className="w-full bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-800"
            onClick={() => onProposeSolution?.(problem)}
          >
            Zaproponuj rozwiązanie
          </Button>
        </div>
      </div>
    </section>
  )
}
