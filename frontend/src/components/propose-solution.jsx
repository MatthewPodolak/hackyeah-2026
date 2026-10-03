"use client"

import { useState } from "react"
import { cn } from "cn"
import { HugeiconsIcon } from "@hugeicons/react"
import { BulbIcon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/helpers/ToastProvider"
import { SUCCESS_MSG, emptyField } from "@/helpers/Errors"
import formCategories from "@/data/form-categories.json"

const STAGES = [
  { key: "IDEA", icon: "💡", label: "Tylko pomysł", hint: "Jeszcze nie sprawdzony w praktyce" },
  { key: "PROTOTYPE", icon: "🛠️", label: "Prototyp", hint: "Jest pierwsza wersja rozwiązania" },
  { key: "PILOT", icon: "🧪", label: "Testowane w małej skali", hint: "Sprawdzane na małej grupie" },
  { key: "RUNNING", icon: "🚀", label: "Działa", hint: "Rozwiązanie jest już wdrożone" },
]

const WHO = Object.entries(formCategories.whoCategories)

const EMPTY = { summary: "", essence: "", who: [], whoOther: "", stage: null }

function validate(form) {
  if (!form.summary.trim()) return emptyField("krótki opis")
  if (!form.essence.trim()) return emptyField("istotę rozwiązania")
  if (!form.who.length && !form.whoOther.trim()) return "Wybierz, dla kogo jest rozwiązanie!"
  return null
}

export default function ProposeSolution({ open, problem, onClose }) {
  const [form, setForm] = useState(EMPTY)
  const { showToast } = useToast()

  if (!open) return null

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const toggleWho = (key) =>
    setForm((f) => ({ ...f, who: f.who.includes(key) ? f.who.filter((k) => k !== key) : [...f.who, key] }))

  const close = () => {
    setForm(EMPTY)
    onClose?.()
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const error = validate(form)
    if (error) {
      showToast(error, "error")
      return
    }

    showToast(SUCCESS_MSG, "success")
    close()
  }

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) close() }} className="fixed inset-0 z-[2000] flex overflow-y-auto bg-black/40 p-6">
      <div className="m-auto w-full max-w-xl animate-in fade-in zoom-in-95 duration-200">
        <Card className="pt-0">
          <div className="h-1.5 bg-emerald-500" />
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <HugeiconsIcon icon={BulbIcon} strokeWidth={2} className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle>{problem ? "Zaproponuj rozwiązanie" : "Zaproponuj innowację"}</CardTitle>
                <CardDescription className="mt-1">
                  {problem ? (
                    <>Problem: <span className="font-medium text-foreground">{problem.title}</span></>
                  ) : (
                    "Podziel się pomysłem na innowację społeczną"
                  )}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Zamknij">
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="s-summary">Krótki opis</FieldLabel>
                  <Textarea
                    id="s-summary"
                    rows={3}
                    value={form.summary}
                    placeholder="Co to jest? Opisz w 2–3 zdaniach."
                    onChange={(e) => set("summary")(e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="s-essence">Istota</FieldLabel>
                  <Textarea
                    id="s-essence"
                    rows={4}
                    value={form.essence}
                    placeholder="Na czym polega rozwiązanie i co jest w nim nowego?"
                    onChange={(e) => set("essence")(e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel>Dla kogo</FieldLabel>
                  <FieldDescription>Wybierz jedną lub kilka grup docelowych</FieldDescription>
                  <div className="flex flex-wrap gap-2">
                    {WHO.map(([key, category]) => {
                      const active = form.who.includes(key)
                      return (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleWho(key)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                            active
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : "hover:bg-muted"
                          )}
                        >
                          <span aria-hidden="true">{category.icon}</span>
                          {category.label}
                        </button>
                      )
                    })}
                  </div>
                  <Input
                    value={form.whoOther}
                    placeholder="Inna grupa lub doprecyzowanie (opcjonalnie)"
                    onChange={(e) => set("whoOther")(e.target.value)}
                  />
                </Field>
           

                <Field>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  >
                    Wyślij propozycję
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
