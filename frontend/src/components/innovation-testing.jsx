"use client"

import { useState } from "react"
import { cn } from "cn"
import { HugeiconsIcon } from "@hugeicons/react"
import { StarIcon, TestTube01Icon } from "@hugeicons/core-free-icons"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import Modal from "@/components/modal"
import LoadingStatus from "@/components/loading-status"
import { ROLES, useAuth } from "@/api/context/AuthContext"
import { useAddReview, useInnovationReviews, useParticipate } from "@/api/hooks/useTesting"
import { useToast } from "@/helpers/ToastProvider"
import { useFormErrors } from "@/helpers/useFormErrors"
import { DialogBody, DialogHeader, DialogPanel } from "@/components/dialog-parts"

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" })
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function reviewsLabel(count) {
  if (count === 1) return "1 opinia"
  const last = count % 10
  const lastTwo = count % 100
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${count} opinie`
  return `${count} opinii`
}

export function Stars({ value, className }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      <span className="sr-only">Ocena: {String(value).replace(".", ",")} z 5</span>
      {[1, 2, 3, 4, 5].map((n) => (
        <HugeiconsIcon
          key={n}
          icon={StarIcon}
          strokeWidth={2}
          aria-hidden="true"
          className={cn("size-4", n <= Math.round(value) ? "fill-amber-400 text-amber-700 dark:text-amber-400" : "text-muted-foreground")}
        />
      ))}
    </span>
  )
}

function RatingInput({ value, onChange, error, errorId }) {
  return (
    <fieldset aria-describedby={error ? errorId : undefined} aria-invalid={error ? true : undefined} id="review-rating" className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">Ocena (wymagane)</legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer rounded-md p-1 has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-[var(--focus)]">
            <input
              type="radio"
              name="review-rating"
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
            />
            <span className="sr-only">{n} z 5</span>
            <HugeiconsIcon
              icon={StarIcon}
              strokeWidth={2}
              aria-hidden="true"
              className={cn("size-8", n <= value ? "fill-amber-400 text-amber-700 dark:text-amber-400" : "text-muted-foreground")}
            />
          </label>
        ))}
      </div>
      <p className="text-xs text-muted-foreground" aria-hidden="true">{value ? `Wybrano ${value} z 5` : "Nie wybrano oceny"}</p>
    </fieldset>
  )
}

function ModalCard({ headingId, title, description, onClose, children }) {
  return (
    <DialogPanel>
      <DialogHeader icon={TestTube01Icon} title={title} titleId={headingId} description={description} onClose={onClose} />
      <DialogBody className="pt-1">{children}</DialogBody>
    </DialogPanel>
  )
}

function ParticipationForm({ innovationId, innovationName, onDone }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ contactName: user?.name ?? "", contactEmail: user?.email ?? "", contactPhone: "", motivation: "" })
  const participate = useParticipate(innovationId)
  const { showToast } = useToast()
  const { fail, clear, fieldProps, errorProps } = useFormErrors("tp")

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    clear(key)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!user && !form.contactEmail.trim() && !form.contactPhone.trim()) return fail("contactEmail", "Podaj email lub telefon, żebyśmy mogli się skontaktować")
    if (form.contactEmail.trim() && !EMAIL_REGEX.test(form.contactEmail.trim())) return fail("contactEmail", "Niepoprawny adres email, np. jan@example.com")
    if (!form.motivation.trim()) return fail("motivation", "Napisz, dlaczego chcesz przetestować tę innowację")
    try {
      await participate.mutateAsync({
        contactName: form.contactName.trim() || null,
        contactEmail: form.contactEmail.trim() || null,
        contactPhone: form.contactPhone.trim() || null,
        motivation: form.motivation.trim(),
      })
      showToast("Zgłoszenie do testów zostało wysłane. ROPS skontaktuje się z Tobą.", "success")
      onDone()
    } catch (err) {
      if (err?.status === 400) fail("motivation", err.body?.message ?? "Sprawdź poprawność danych")
      else showToast(null, "error")
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <p className="text-sm text-muted-foreground">
          {user ? "Status zgłoszenia zobaczysz w zakładce „Moje testy”." : "Zaloguj się, aby śledzić status zgłoszenia. Możesz też wysłać je bez konta."}
        </p>
        <Field>
          <FieldLabel htmlFor="tp-contactName">Imię i nazwisko lub nazwa organizacji</FieldLabel>
          <Input {...fieldProps("contactName")} autoComplete="name" value={form.contactName} onChange={set("contactName")} maxLength={120} />
        </Field>
        <Field>
          <FieldLabel htmlFor="tp-contactEmail">Email</FieldLabel>
          <Input {...fieldProps("contactEmail")} type="email" autoComplete="email" value={form.contactEmail} onChange={set("contactEmail")} maxLength={160} />
          <FieldError {...errorProps("contactEmail")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="tp-contactPhone">Telefon (opcjonalnie)</FieldLabel>
          <Input {...fieldProps("contactPhone")} type="tel" autoComplete="tel" value={form.contactPhone} onChange={set("contactPhone")} maxLength={30} />
        </Field>
        <Field>
          <FieldLabel htmlFor="tp-motivation">Dlaczego chcesz przetestować „{innovationName}”? (wymagane)</FieldLabel>
          <Textarea {...fieldProps("motivation", "tp-motivation-hint")} required rows={4} value={form.motivation} onChange={set("motivation")} maxLength={2000} />
          <FieldDescription id="tp-motivation-hint">Np. gdzie i z kim chcesz ją wdrożyć.</FieldDescription>
          <FieldError {...errorProps("motivation")} />
        </Field>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onDone}>Anuluj</Button>
          <Button type="submit" disabled={participate.isPending}>
            {participate.isPending ? "Wysyłanie..." : "Wyślij zgłoszenie"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}

function ReviewForm({ innovationId, onDone }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ reviewerName: user?.name ?? "", rating: 0, comment: "", improvementSuggestion: "" })
  const addReview = useAddReview(innovationId)
  const { showToast } = useToast()
  const { errors, fail, clear, fieldProps, errorProps } = useFormErrors("review")

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    clear(key)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.rating) return fail("rating", "Wybierz ocenę od 1 do 5")
    if (!form.comment.trim()) return fail("comment", "Napisz kilka słów o swoich doświadczeniach")
    try {
      await addReview.mutateAsync({
        reviewerName: form.reviewerName.trim() || null,
        rating: form.rating,
        comment: form.comment.trim(),
        improvementSuggestion: form.improvementSuggestion.trim() || null,
      })
      showToast("Dziękujemy za opinię!", "success")
      onDone()
    } catch (err) {
      if (err?.status === 400) fail("comment", err.body?.message ?? "Sprawdź poprawność danych")
      else showToast(null, "error")
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <RatingInput
          value={form.rating}
          onChange={(rating) => {
            setForm((f) => ({ ...f, rating }))
            clear("rating")
          }}
          error={errors.rating}
          errorId="review-rating-error"
        />
        <FieldError {...errorProps("rating")} />
        <Field>
          <FieldLabel htmlFor="review-reviewerName">Podpis (opcjonalnie)</FieldLabel>
          <Input {...fieldProps("reviewerName", "review-name-hint")} value={form.reviewerName} onChange={set("reviewerName")} maxLength={100} />
          <FieldDescription id="review-name-hint">Bez podpisu opinia będzie oznaczona jako „Anonimowy tester”.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="review-comment">Opinia (wymagane)</FieldLabel>
          <Textarea {...fieldProps("comment")} required rows={4} value={form.comment} onChange={set("comment")} maxLength={2000} />
          <FieldError {...errorProps("comment")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="review-improvementSuggestion">Co można poprawić? (opcjonalnie)</FieldLabel>
          <Textarea {...fieldProps("improvementSuggestion")} rows={3} value={form.improvementSuggestion} onChange={set("improvementSuggestion")} maxLength={2000} />
        </Field>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onDone}>Anuluj</Button>
          <Button type="submit" disabled={addReview.isPending}>
            {addReview.isPending ? "Wysyłanie..." : "Dodaj opinię"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}

export default function InnovationTesting({ innovationId, innovationName }) {
  const { role } = useAuth()
  const canTest = role !== ROLES.JST
  const reviews = useInnovationReviews(innovationId)
  const [dialog, setDialog] = useState(null)
  const close = () => setDialog(null)
  const data = reviews.data

  return (
    <section aria-labelledby="section-testing" className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-elevation-1 sm:p-6">
      <h2 id="section-testing" className="mb-1.5 font-heading text-lg font-semibold tracking-tight">{canTest ? "Przetestuj i oceń" : "Opinie i wdrożenie"}</h2>
      <p className="mb-4 text-muted-foreground">
        {canTest
          ? "Chcesz wypróbować tę innowację u siebie? Zgłoś się do testów. Testowałeś ją już? Podziel się opinią."
          : "Sprawdź, jak oceniają tę innowację testerzy, i przygotuj plan jej wdrożenia w swojej gminie."}
      </p>
      <div className="mb-6 flex flex-wrap gap-2">
        {canTest && (
          <Button onClick={() => setDialog("participate")}>
            <HugeiconsIcon icon={TestTube01Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
            Zgłoś się do testów
          </Button>
        )}
        <Link href={`/implementation-plan?innovation=${encodeURIComponent(innovationId)}`} className={buttonVariants({ variant: "outline" })}>
          Plan wdrożenia w mojej gminie
        </Link>
        {canTest && (
          <Button variant="outline" onClick={() => setDialog("review")}>
            <HugeiconsIcon icon={StarIcon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
            Dodaj opinię
          </Button>
        )}
      </div>

      <h3 className="mb-3 font-heading font-semibold">Opinie testerów</h3>
      {reviews.isPending ? (
        <LoadingStatus label="Wczytywanie opinii"><Skeleton className="h-24 w-full rounded-xl" /></LoadingStatus>
      ) : !data?.totalReviews ? (
        <p className="text-sm text-muted-foreground">{canTest ? "Ta innowacja nie ma jeszcze opinii. Twoja może być pierwsza!" : "Ta innowacja nie ma jeszcze opinii testerów."}</p>
      ) : (
        <>
          <p className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <Stars value={data.averageRating} />
            <span className="font-semibold">{String(data.averageRating).replace(".", ",")}</span>
            <span className="text-muted-foreground">({reviewsLabel(data.totalReviews)})</span>
          </p>
          <ul className="flex flex-col gap-3">
            {data.reviews.map((review) => (
              <li key={review.id} className="rounded-2xl border border-border p-4">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{review.reviewerName}</span>
                  <Stars value={review.rating} />
                </div>
                <p className="text-sm whitespace-pre-line break-words">{review.comment}</p>
                {review.improvementSuggestion && (
                  <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line break-words">
                    <span className="font-medium text-foreground">Do poprawy: </span>{review.improvementSuggestion}
                  </p>
                )}
                {review.createdAt && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <time dateTime={review.createdAt}>{dateFormat.format(new Date(review.createdAt))}</time>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      <Modal open={dialog === "participate"} onClose={close} labelledBy="tp-heading" className="max-w-lg">
        <ModalCard headingId="tp-heading" title="Zgłoś się do testów" description={innovationName} onClose={close}>
          <ParticipationForm innovationId={innovationId} innovationName={innovationName} onDone={close} />
        </ModalCard>
      </Modal>
      <Modal open={dialog === "review"} onClose={close} labelledBy="review-heading" className="max-w-lg">
        <ModalCard headingId="review-heading" title="Dodaj opinię" description={innovationName} onClose={close}>
          <ReviewForm innovationId={innovationId} onDone={close} />
        </ModalCard>
      </Modal>
    </section>
  )
}
