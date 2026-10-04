"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  BulbIcon,
  Building03Icon,
  CheckmarkCircle02Icon,
  Location01Icon,
  SearchRemoveIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import innovations from "@/data/innovations.json"
import { InnovationCover } from "@/components/innovation-card"
import Modal from "@/components/modal"
import { useGminyIndex } from "@/api/hooks/useRegionsQuery"
import { problemPlace } from "@/lib/gminy"
import { useToast } from "@/helpers/ToastProvider"
import { Copy01Icon } from "@hugeicons/core-free-icons"
import { DialogBody, DialogFooter, DialogHeader, DialogPanel } from "@/components/dialog-parts"
import { t } from "@/lib/i18n";

function TrackingCode({ token }) {
  const { showToast } = useToast()

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(token)
      showToast("Skopiowano kod zgłoszenia", "success")
    } catch {
      showToast(null, "error")
    }
  }

  return (
    <div className="rounded-xl border bg-muted/50 p-3 text-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("Kod Twojego zgłoszenia")}</p>
      <div className="mt-1 flex items-center gap-2">
        <code className="min-w-0 flex-1 break-all font-mono">{token}</code>
        <Button type="button" variant="outline" size="sm" onClick={copy} aria-label={t("Kopiuj kod zgłoszenia")}>
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
          {t("Kopiuj")}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {t("Pod tym kodem sprawdzisz status i odpowiedź ROPS w zakładce")}{" "}
        <Link href="/my-reports" className="font-medium text-foreground underline underline-offset-4">{t("Moje zgłoszenia")}</Link>.
      </p>
    </div>
  )
}

const innovationsById = new Map(innovations.map((innovation) => [innovation.id, innovation]))

function scoreTone(score) {
  if (score >= 75) return { label: t("Bardzo dobre dopasowanie"), bar: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400" }
  if (score >= 50) return { label: t("Dobre dopasowanie"), bar: "bg-amber-500", text: "text-amber-700 dark:text-amber-400" }
  return { label: t("Częściowe dopasowanie"), bar: "bg-muted-foreground", text: "text-muted-foreground" }
}

export function MatchItem({ match, rank, headingLevel = 3 }) {
  const Heading = `h${headingLevel}`
  const innovation = innovationsById.get(match.id)
  const tone = scoreTone(match.score)

  return (
    <li className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-elevation-1 transition-shadow hover:shadow-elevation-2 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50">
      <div className="flex gap-3 p-3">
        <div className="relative w-24 shrink-0 overflow-hidden rounded-lg sm:w-28">
          {innovation ? (
            <InnovationCover innovation={innovation} className="h-full text-4xl" />
          ) : (
            <div className="flex aspect-video h-full items-center justify-center bg-muted text-muted-foreground">
              <HugeiconsIcon icon={BulbIcon} strokeWidth={2} className="size-8" />
            </div>
          )}
          <span aria-hidden="true" className="absolute left-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-background/90 text-xs font-semibold shadow">
            {rank}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Heading className="text-sm font-semibold leading-snug">
            <Link href={`/innovations/${match.id}`} className="outline-none after:absolute after:inset-0">
              <span className="sr-only">{rank}. </span>
              {match.name}
            </Link>
          </Heading>

          <div className="flex items-center gap-2">
            <div aria-hidden="true" className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${match.score}%` }} />
            </div>
            <span className={`shrink-0 text-xs font-semibold tabular-nums ${tone.text}`}><span className="sr-only">{t("Dopasowanie:")}{" "}</span>{match.score}%</span>
          </div>
          <span className={`text-[11px] font-medium uppercase tracking-wide ${tone.text}`}>{tone.label}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t bg-muted/40 px-3 py-2.5 text-xs">
        {match.reason && (
          <p className="flex gap-2">
            <HugeiconsIcon icon={BulbIcon} strokeWidth={2} className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden="true" />
            <span className="leading-relaxed"><span className="sr-only">{t("Dlaczego pasuje:")}{" "}</span>{match.reason}</span>
          </p>
        )}
        {match.whoCanImplement && (
          <p className="flex gap-2 text-muted-foreground">
            <HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="leading-relaxed"><span className="sr-only">{t("Kto może wdrożyć:")}{" "}</span>{match.whoCanImplement}</span>
          </p>
        )}
        <span aria-hidden="true" className="flex items-center gap-1 self-end font-medium text-primary">
          {t("Szczegóły")} <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
        </span>
      </div>
    </li>
  )
}

export default function ProblemSolutions({ result, onClose }) {
  const gminy = useGminyIndex()
  if (!result) return null

  const { problem, matches = [] } = result

  return (
    <Modal open onClose={onClose} labelledBy="solutions-heading" className="max-w-lg">
      <DialogPanel>
        <DialogHeader
          icon={CheckmarkCircle02Icon}
          tone="success"
          eyebrow={t("Problem zgłoszony")}
          title={<><span className="sr-only">{t("Problem zgłoszony:")}{" "}</span>{problem?.title}</>}
          titleId="solutions-heading"
          onClose={onClose}
        >
          {problem && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="break-words">{problemPlace(problem, gminy)}</span>
            </p>
          )}
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4 pt-1">
            {result.trackingToken && <TrackingCode token={result.trackingToken} />}
            {matches.length > 0 ? (
              <>
                <div>
                  <h3 className="text-sm font-semibold">{t("Możliwe rozwiązania")}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t("Innowacje społeczne z Biblioteki ROPS, które mogą pomóc w tym problemie")}
                  </p>
                </div>
                <ol className="flex flex-col gap-3">
                  {matches.map((match, i) => (
                    <MatchItem key={match.id} match={match} rank={i + 1} />
                  ))}
                </ol>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-outline px-4 py-8 text-center">
                <div aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <HugeiconsIcon icon={SearchRemoveIcon} strokeWidth={2} className="size-5" />
                </div>
                <p className="text-sm font-medium">{t("Brak dopasowanych rozwiązań")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("Nie znaleźliśmy jeszcze innowacji pasującej do tego problemu. Zgłoszenie zostało zapisane i jest widoczne na mapie.")}
                </p>
              </div>
            )}

        </DialogBody>
        <DialogFooter>
          <Button onClick={onClose}>{t("Zamknij")}</Button>
        </DialogFooter>
      </DialogPanel>
    </Modal>
  )
}
