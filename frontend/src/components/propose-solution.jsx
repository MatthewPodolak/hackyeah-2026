"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "cn"
import { HugeiconsIcon } from "@hugeicons/react"
import { BulbIcon, Cancel01Icon, CheckmarkCircle02Icon, Copy01Icon, SparklesIcon } from "@hugeicons/core-free-icons"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import Modal from "@/components/modal"
import SelectChip from "@/components/select-chip"
import { useFormErrors } from "@/helpers/useFormErrors"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/helpers/ToastProvider"
import { IDEA_ADDED_MSG, emptyField } from "@/helpers/Errors"
import { useAddIdea, useDraftIdea } from "@/api/hooks/useIdeaMutation"
import { useSimilarInnovations } from "@/api/hooks/useIdeasQuery"
import { ideaTokens } from "@/lib/ideas"
import { useScopedTokens } from "@/hooks/useScopedTokens"
import { MatchItem } from "@/components/problem-solutions"
import { Spinner } from "@/components/ui/spinner"
import Link from "next/link"
import formCategories from "@/data/form-categories.json"

const STAGES = [
  { key: "IDEA", icon: "💡", label: "Tylko pomysł", hint: "Jeszcze nie sprawdzony w praktyce" },
  { key: "PROTOTYPE", icon: "🛠️", label: "Prototyp", hint: "Jest pierwsza wersja rozwiązania" },
  { key: "PILOT", icon: "🧪", label: "Testowane w małej skali", hint: "Sprawdzane na małej grupie" },
  { key: "RUNNING", icon: "🚀", label: "Działa", hint: "Rozwiązanie jest już wdrożone" },
]

const WHO = Object.entries(formCategories.whoCategories)

const EMPTY = { title: "", summary: "", essence: "", who: [], whoOther: "", stage: null, publishConsent: false }

const READINESS_BY_STAGE = { IDEA: "IDEA", PROTOTYPE: "PROTOTYPE", PILOT: "TESTED", RUNNING: "READY" }

function buildProblemDescription(form) {
  const summary = form.summary.trim()
  const whoOther = form.whoOther.trim()
  return whoOther ? `${summary}\n\nDla kogo (doprecyzowanie): ${whoOther}` : summary
}

function validate(form) {
  if (form.title.trim().length < 3) return ["title", "Tytuł musi mieć co najmniej 3 znaki!"]
  if (!form.summary.trim()) return ["summary", emptyField("krótki opis")]
  if (!form.essence.trim()) return ["essence", emptyField("istotę rozwiązania")]
  if (!form.who.length && !form.whoOther.trim()) return ["who", "Wybierz, dla kogo jest rozwiązanie, albo wpisz inną grupę!"]
  return null
}

export default function ProposeSolution({ open, problem, onClose }) {
  const { remember: rememberIdeaToken } = useScopedTokens(ideaTokens)
  const [form, setForm] = useState(EMPTY)
  const [submitted, setSubmitted] = useState(null)
  const { showToast } = useToast()
  const addIdea = useAddIdea()
  const draftIdea = useDraftIdea()
  const [aiText, setAiText] = useState("")
  const { fail, clear, reset, fieldProps, errorProps } = useFormErrors("s")
  const successRef = useRef(null)

  useEffect(() => {
    if (submitted) successRef.current?.focus({ preventScroll: true })
  }, [submitted])

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }))
    clear(key === "whoOther" ? "who" : key)
  }

  const toggleWho = (key) => {
    setForm((f) => ({ ...f, who: f.who.includes(key) ? f.who.filter((k) => k !== key) : [...f.who, key] }))
    clear("who")
  }

  const close = () => {
    setForm(EMPTY)
    setSubmitted(null)
    setAiText("")
    reset()
    onClose?.()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (addIdea.isPending) return

    const error = validate(form)
    if (error) {
      fail(...error)
      return
    }

    try {
      const idea = await addIdea.mutateAsync({
        title: form.title.trim(),
        essence: form.essence.trim(),
        problemDescription: buildProblemDescription(form),
        whoCategories: form.who,
        readiness: form.stage ? READINESS_BY_STAGE[form.stage] : null,
        sourceProblemId: problem?.id ?? null,
        publishConsent: form.publishConsent,
      })
      rememberIdeaToken(idea.trackingToken)
      setSubmitted(idea)
      showToast(IDEA_ADDED_MSG, "success")
    } catch (err) {
      if (err?.status === 400 && err.body?.message) fail("title", err.body.message)
      else showToast(null, "error")
    }
  }

  const fillWithAi = async () => {
    if (aiText.trim().length < 10) {
      fail("ai", "Opisz pomysł w kilku zdaniach, żeby AI miało z czego skorzystać!")
      return
    }
    clear("ai")

    try {
      const draft = await draftIdea.mutateAsync({ text: aiText.trim(), sourceProblemId: problem?.id ?? null })
      setForm((f) => ({
        ...f,
        title: draft.title ?? f.title,
        summary: draft.problemDescription ?? f.summary,
        essence: draft.essence ?? f.essence,
        who: draft.whoCategories?.length ? draft.whoCategories : f.who,
      }))
      showToast("Uzupełniono fiszkę, sprawdź i popraw w razie potrzeby", "success")
    } catch (err) {
      showToast(err?.status === 429 ? "Za dużo zapytań do AI, spróbuj za chwilę" : err?.body?.message ?? null, "error")
    }
  }

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(submitted.trackingToken)
      showToast("Skopiowano kod", "success")
    } catch {
      showToast(null, "error")
    }
  }

  return (
    <Modal open={open} onClose={close} labelledBy="s-heading" describedBy="s-subheading" className="max-w-xl">
        <Card className="pt-0">
          <div aria-hidden="true" className="h-1.5 bg-emerald-500" />
          <CardHeader>
            <div className="flex items-start gap-3">
              <div aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <HugeiconsIcon icon={BulbIcon} strokeWidth={2} className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle>
                  <h2 id="s-heading" className="font-heading text-xl font-bold tracking-tight">{problem ? "Zaproponuj rozwiązanie" : "Zaproponuj innowację"}</h2>
                </CardTitle>
                <CardDescription id="s-subheading" className="mt-1">
                  {problem ? (
                    <>Problem: <span className="font-medium text-foreground">{problem.title}</span></>
                  ) : (
                    "Podziel się pomysłem na innowację społeczną"
                  )}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Zamknij okno">
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {submitted ? (
              <div className="flex flex-col items-center gap-4 py-2 text-center">
                <div aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-8" />
                </div>
                <div>
                  <h3 ref={successRef} tabIndex={-1} className="text-lg font-semibold outline-none">Dziękujemy za propozycję!</h3>
                  <p className="text-sm text-muted-foreground">
                    „{submitted.title}” trafiła do Hubu i czeka na weryfikację.
                  </p>
                </div>
                <div className="w-full rounded-xl border bg-muted/50 p-3 text-left">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Kod Twojej propozycji</p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="min-w-0 flex-1 break-all font-mono text-sm">{submitted.trackingToken}</code>
                    <Button type="button" variant="outline" size="sm" onClick={copyToken} aria-label="Kopiuj kod propozycji">
                      <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
                      Kopiuj
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Zachowaj go, by później sprawdzić status lub edytować propozycję.</p>
                </div>
                <SimilarInnovations token={submitted.trackingToken} />
                <div className="flex w-full flex-col gap-2 sm:flex-row">
                  <Link href="/my-ideas" onClick={close} className={cn(buttonVariants({ variant: "outline" }), "flex-1")}>
                    Moje propozycje
                  </Link>
                  <Button className="flex-1" onClick={close}>Zamknij</Button>
                </div>
              </div>
            ) : (
            <form onSubmit={handleSubmit} noValidate>
              <FieldGroup>
                <p className="text-sm text-muted-foreground">Pola tytuł, krótki opis, istota i dla kogo są wymagane.</p>
                <div className="flex flex-col gap-2 rounded-xl border border-dashed border-emerald-700/60 bg-emerald-500/5 p-3">
                  <label htmlFor="s-ai" className="flex items-center gap-1.5 text-sm font-medium">
                    <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                    Pomóż mi opisać (opcjonalnie)
                  </label>
                  <Textarea
                    {...fieldProps("ai")}
                    rows={2}
                    value={aiText}
                    placeholder="Opisz pomysł własnymi słowami, a AI wypełni pola poniżej"
                    onChange={(e) => setAiText(e.target.value)}
                  />
                  <FieldError {...errorProps("ai")} />
                  <Button type="button" variant="outline" size="sm" className="self-end" onClick={fillWithAi} disabled={draftIdea.isPending}>
                    {draftIdea.isPending ? <Spinner data-icon="inline-start" /> : <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} data-icon="inline-start" />}
                    {draftIdea.isPending ? "AI pisze..." : "Uzupełnij z AI"}
                  </Button>
                </div>

                <Field>
                  <FieldLabel htmlFor="s-title">Tytuł</FieldLabel>
                  <Input
                    {...fieldProps("title")}
                    required
                    value={form.title}
                    maxLength={150}
                    placeholder="Krótka nazwa Twojego pomysłu"
                    onChange={(e) => set("title")(e.target.value)}
                  />
                  <FieldError {...errorProps("title")} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="s-summary">Krótki opis</FieldLabel>
                  <Textarea
                    {...fieldProps("summary")}
                    required
                    rows={3}
                    value={form.summary}
                    placeholder="Co to jest? Opisz w 2–3 zdaniach."
                    onChange={(e) => set("summary")(e.target.value)}
                  />
                  <FieldError {...errorProps("summary")} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="s-essence">Istota</FieldLabel>
                  <Textarea
                    {...fieldProps("essence")}
                    required
                    rows={4}
                    value={form.essence}
                    placeholder="Na czym polega rozwiązanie i co jest w nim nowego?"
                    onChange={(e) => set("essence")(e.target.value)}
                  />
                  <FieldError {...errorProps("essence")} />
                </Field>

                <Field>
                  <p id="s-who-label" className="text-sm font-medium">Dla kogo</p>
                  <FieldDescription id="s-who-hint">Wybierz jedną lub kilka grup docelowych</FieldDescription>
                  <div
                    {...fieldProps("who", "s-who-hint")}
                    role="group"
                    aria-labelledby="s-who-label"
                    className="flex flex-wrap gap-2"
                  >
                    {WHO.map(([key, category]) => (
                      <SelectChip key={key} active={form.who.includes(key)} onClick={() => toggleWho(key)}>
                        <span aria-hidden="true">{category.icon}</span>
                        {category.label}
                      </SelectChip>
                    ))}
                  </div>
                  <FieldLabel htmlFor="s-whoOther" className="sr-only">Inna grupa lub doprecyzowanie</FieldLabel>
                  <Input
                    id="s-whoOther"
                    value={form.whoOther}
                    placeholder="Inna grupa lub doprecyzowanie (opcjonalnie)"
                    onChange={(e) => set("whoOther")(e.target.value)}
                  />
                  <FieldError {...errorProps("who")} />
                </Field>

                <Field orientation="horizontal">
                  <Checkbox
                    id="s-publish"
                    checked={form.publishConsent}
                    onCheckedChange={(checked) => set("publishConsent")(checked === true)}
                  />
                  <FieldLabel htmlFor="s-publish" className="font-normal">
                    Zgadzam się na publikację propozycji w galerii pomysłów mieszkańców, jeśli zostanie zaakceptowana
                  </FieldLabel>
                </Field>

                <Field>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={addIdea.isPending}
                    className="w-full bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-800"
                  >
                    {addIdea.isPending ? "Wysyłanie..." : "Wyślij propozycję"}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
            )}
          </CardContent>
        </Card>
    </Modal>
  )
}

function SimilarInnovations({ token }) {
  const similar = useSimilarInnovations(token)

  if (similar.isError) return null

  return (
    <div className="w-full text-left">
      <h4 className="mb-2 text-sm font-semibold">Podobne istniejące innowacje</h4>
      {similar.isPending ? (
        <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground">
          <Spinner aria-hidden="true" /> Szukam podobnych rozwiązań...
        </p>
      ) : similar.data?.length ? (
        <ol className="flex flex-col gap-3">
          {similar.data.map((match, i) => (
            <MatchItem key={match.id} match={match} rank={i + 1} headingLevel={5} />
          ))}
        </ol>
      ) : (
        <p className="text-xs text-muted-foreground">Nie znaleźliśmy podobnych innowacji w katalogu — może to coś nowego!</p>
      )}
    </div>
  )
}
