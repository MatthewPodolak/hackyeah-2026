"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "cn"
import { HugeiconsIcon } from "@hugeicons/react"
import { BulbIcon, CheckmarkCircle02Icon, Copy01Icon, SparklesIcon } from "@hugeicons/core-free-icons"
import { Button, buttonVariants } from "@/components/ui/button"
import { DialogBody, DialogFooter, DialogHeader, DialogPanel, FormStep } from "@/components/dialog-parts"
import { IconTile } from "@/components/page-header"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
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
    <Modal open={open} onClose={close} labelledBy="s-heading" describedBy="s-subheading" className="max-w-2xl">
      <DialogPanel>
        <DialogHeader
          icon={BulbIcon}
          title={problem ? "Zaproponuj rozwiązanie" : "Zaproponuj innowację"}
          titleId="s-heading"
          description={problem ? (
            <>Problem: <span className="font-medium text-foreground">{problem.title}</span></>
          ) : (
            "Podziel się pomysłem na innowację społeczną. Wymagane: tytuł, opis, istota i dla kogo."
          )}
          descriptionId="s-subheading"
          onClose={close}
        />

        {submitted ? (
          <>
            <DialogBody className="pt-2">
              <div className="flex flex-col items-center gap-5 text-center">
                <IconTile icon={CheckmarkCircle02Icon} tone="success" size="lg" />
                <div>
                  <h3 ref={successRef} tabIndex={-1} className="font-heading text-lg font-bold tracking-tight outline-none">Dziękujemy za propozycję!</h3>
                  <p className="text-sm text-muted-foreground">
                    „{submitted.title}” trafiła do Hubu i czeka na weryfikację.
                  </p>
                </div>
                <div className="w-full rounded-2xl bg-muted/70 p-4 text-left">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Kod Twojej propozycji</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <code className="min-w-0 flex-1 break-all font-mono text-sm">{submitted.trackingToken}</code>
                    <Button type="button" variant="outline" size="sm" onClick={copyToken} aria-label="Kopiuj kod propozycji">
                      <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
                      Kopiuj
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Zachowaj go, by później sprawdzić status lub edytować propozycję.</p>
                </div>
                <SimilarInnovations token={submitted.trackingToken} />
              </div>
            </DialogBody>
            <DialogFooter>
              <Link href="/my-ideas" onClick={close} className={buttonVariants({ variant: "outline" })}>
                Moje propozycje
              </Link>
              <Button onClick={close}>Zamknij</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="pt-2">
              <FieldGroup className="gap-6">
                <div className="flex flex-col gap-3 rounded-2xl bg-secondary/50 p-4 dark:bg-secondary/30">
                  <label htmlFor="s-ai" className="flex items-center gap-2 text-sm font-semibold">
                    <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-5 text-primary" aria-hidden="true" />
                    Pomóż mi opisać
                    <span className="font-normal text-muted-foreground">(opcjonalnie)</span>
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

                <FormStep number={1} title="Pomysł">
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
                </FormStep>

                <FormStep number={2} title="Dla kogo?" description="Wybierz jedną lub kilka grup.">
                  <Field>
                    <div
                      {...fieldProps("who", "s-who-hint")}
                      role="group"
                      aria-label="Dla kogo"
                      className="flex flex-wrap gap-2"
                    >
                      {WHO.map(([key, category]) => (
                        <SelectChip key={key} active={form.who.includes(key)} onClick={() => toggleWho(key)}>
                          <span aria-hidden="true">{category.icon}</span>
                          {category.label}
                        </SelectChip>
                      ))}
                    </div>
                    <span id="s-who-hint" className="sr-only">Wybierz jedną lub kilka grup docelowych</span>
                    <FieldLabel htmlFor="s-whoOther" className="sr-only">Inna grupa lub doprecyzowanie</FieldLabel>
                    <Input
                      id="s-whoOther"
                      value={form.whoOther}
                      placeholder="Inna grupa lub doprecyzowanie (opcjonalnie)"
                      onChange={(e) => set("whoOther")(e.target.value)}
                    />
                    <FieldError {...errorProps("who")} />
                  </Field>
                </FormStep>

                <FormStep number={3} title="Etap realizacji" description="Opcjonalnie – na jakim etapie jest pomysł?">
                  <div role="radiogroup" aria-label="Etap realizacji" className="grid gap-2 sm:grid-cols-2">
                    {STAGES.map((stage) => {
                      const checked = form.stage === stage.key
                      return (
                        <label
                          key={stage.key}
                          className={cn(
                            "relative flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]",
                            checked ? "border-primary bg-secondary/60 dark:bg-secondary/40" : "border-outline hover:bg-muted/60"
                          )}
                        >
                          <input
                            type="radio"
                            name="s-stage"
                            value={stage.key}
                            checked={checked}
                            onChange={() => set("stage")(stage.key)}
                            onClick={() => checked && set("stage")(null)}
                            className="sr-only"
                          />
                          <span aria-hidden="true" className="text-xl leading-none">{stage.icon}</span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold">{stage.label}</span>
                            <span className="block text-xs text-muted-foreground">{stage.hint}</span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                  <Field orientation="horizontal" className="rounded-xl bg-muted/60 p-3">
                    <Checkbox
                      id="s-publish"
                      checked={form.publishConsent}
                      onCheckedChange={(checked) => set("publishConsent")(checked === true)}
                    />
                    <FieldLabel htmlFor="s-publish" className="font-normal">
                      Zgadzam się na publikację propozycji w galerii pomysłów mieszkańców, jeśli zostanie zaakceptowana
                    </FieldLabel>
                  </Field>
                </FormStep>
              </FieldGroup>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={close}>Anuluj</Button>
              <Button type="submit" disabled={addIdea.isPending}>
                {addIdea.isPending ? "Wysyłanie..." : "Wyślij propozycję"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogPanel>
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
