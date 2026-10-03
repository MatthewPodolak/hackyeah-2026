"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  BulbIcon,
  Building03Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Location01Icon,
  SearchRemoveIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import innovations from "@/data/innovations.json"
import { InnovationCover } from "@/components/innovation-card"

const innovationsById = new Map(innovations.map((innovation) => [innovation.id, innovation]))

function scoreTone(score) {
  if (score >= 75) return { label: "Bardzo dobre dopasowanie", bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" }
  if (score >= 50) return { label: "Dobre dopasowanie", bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" }
  return { label: "Częściowe dopasowanie", bar: "bg-muted-foreground", text: "text-muted-foreground" }
}

export function MatchItem({ match, rank }) {
  const innovation = innovationsById.get(match.id)
  const tone = scoreTone(match.score)

  return (
    <li className="relative overflow-hidden rounded-xl border bg-background transition-shadow hover:shadow-md has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50">
      <div className="flex gap-3 p-3">
        <div className="relative w-24 shrink-0 overflow-hidden rounded-lg sm:w-28">
          {innovation ? (
            <InnovationCover innovation={innovation} className="h-full text-4xl" />
          ) : (
            <div className="flex aspect-video h-full items-center justify-center bg-muted text-muted-foreground">
              <HugeiconsIcon icon={BulbIcon} strokeWidth={2} className="size-8" />
            </div>
          )}
          <span className="absolute left-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-background/90 text-xs font-semibold shadow">
            {rank}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h3 className="text-sm font-semibold leading-snug">
            <Link href={`/innovations/${match.id}`} className="outline-none after:absolute after:inset-0">
              {match.name}
            </Link>
          </h3>

          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${match.score}%` }} />
            </div>
            <span className={`shrink-0 text-xs font-semibold tabular-nums ${tone.text}`}>{match.score}%</span>
          </div>
          <span className={`text-[11px] font-medium uppercase tracking-wide ${tone.text}`}>{tone.label}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t bg-muted/40 px-3 py-2.5 text-xs">
        {match.reason && (
          <p className="flex gap-2">
            <HugeiconsIcon icon={BulbIcon} strokeWidth={2} className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <span className="leading-relaxed">{match.reason}</span>
          </p>
        )}
        {match.whoCanImplement && (
          <p className="flex gap-2 text-muted-foreground">
            <HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
            <span className="line-clamp-2 leading-relaxed">{match.whoCanImplement}</span>
          </p>
        )}
        <span className="flex items-center gap-1 self-end font-medium text-primary">
          Szczegóły <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
        </span>
      </div>
    </li>
  )
}

export default function ProblemSolutions({ result, onClose }) {
  if (!result) return null

  const { problem, matches = [] } = result

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }} className="fixed inset-0 z-[2000] flex overflow-y-auto bg-black/40 p-6">
      <div className="m-auto w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
        <Card className="pt-0">
          <div className="h-1 bg-emerald-500" />
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  Problem zgłoszony
                </p>
                <h2 className="text-base font-semibold leading-snug break-words">{problem?.title}</h2>
                {problem?.street && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-3.5 shrink-0" />
                    <span className="truncate">{problem.street}</span>
                  </p>
                )}
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Zamknij">
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-3">
            {matches.length > 0 ? (
              <>
                <div>
                  <h3 className="text-sm font-semibold">Możliwe rozwiązania</h3>
                  <p className="text-xs text-muted-foreground">
                    Innowacje społeczne z Biblioteki ROPS, które mogą pomóc w tym problemie
                  </p>
                </div>
                <ol className="flex flex-col gap-3">
                  {matches.map((match, i) => (
                    <MatchItem key={match.id} match={match} rank={i + 1} />
                  ))}
                </ol>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <HugeiconsIcon icon={SearchRemoveIcon} strokeWidth={2} className="size-5" />
                </div>
                <p className="text-sm font-medium">Brak dopasowanych rozwiązań</p>
                <p className="text-xs text-muted-foreground">
                  Nie znaleźliśmy jeszcze innowacji pasującej do tego problemu. Zgłoszenie zostało zapisane i jest widoczne na mapie.
                </p>
              </div>
            )}

            <Button variant="outline" onClick={onClose}>Zamknij</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
