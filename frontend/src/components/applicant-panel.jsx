"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@/components/ui/native-select"
import { ROLES, useAuth } from "@/api/context/AuthContext"
import { useRegions } from "@/api/hooks/useRegionsQuery"
import { useToast } from "@/helpers/ToastProvider"
import { useFormErrors } from "@/helpers/useFormErrors"

const PERSON = { function: "", name: "", phone: "", email: "" }
const EMPTY = { phone: "", street: "", postalCode: "", city: "", gminaId: "", krs: "", regon: "", representative: PERSON, contact: PERSON, experience: "", team: [] }

function fromProfile(profile) {
  const person = (p) => Object.fromEntries(Object.keys(PERSON).map((key) => [key, p?.[key] ?? ""]))
  return {
    ...Object.fromEntries(["phone", "street", "postalCode", "city", "gminaId", "krs", "regon", "experience"].map((key) => [key, profile?.[key] ?? ""])),
    representative: person(profile?.representative),
    contact: person(profile?.contact),
    team: (profile?.team ?? []).map((m) => ({ name: m.name ?? "", role: m.role ?? "", experience: m.experience ?? "" })),
  }
}

// what an application still lacks, for the completeness line in the grant tab
export function missingApplicantData(user) {
  if (!user) return []
  const p = user.profile ?? {}
  const missing = []
  if (!p.phone) missing.push("telefon")
  if (!p.street || !p.postalCode || !p.city) missing.push("adres")
  if (user.role === ROLES.NGO) {
    if (!p.krs) missing.push("KRS")
    if (!p.regon) missing.push("REGON")
    if (!p.representative?.name) missing.push("osoba reprezentująca")
    if (!p.contact?.name) missing.push("osoba do kontaktów")
    if (!p.experience && !p.team?.length) missing.push("doświadczenie i zespół")
  }
  return missing
}

function PersonFields({ prefix, label, value, onChange }) {
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value })
  return (
    <fieldset className="grid gap-4 rounded-lg border p-3 sm:grid-cols-2">
      <legend className="px-1 text-sm font-medium">{label}</legend>
      <Field>
        <FieldLabel htmlFor={`${prefix}-function`}>Funkcja</FieldLabel>
        <Input id={`${prefix}-function`} placeholder="np. Prezes Zarządu" value={value.function} onChange={set("function")} />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${prefix}-name`}>Imię i nazwisko</FieldLabel>
        <Input id={`${prefix}-name`} autoComplete="off" value={value.name} onChange={set("name")} />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${prefix}-phone`}>Telefon</FieldLabel>
        <Input id={`${prefix}-phone`} type="tel" autoComplete="off" value={value.phone} onChange={set("phone")} />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${prefix}-email`}>E-mail</FieldLabel>
        <Input id={`${prefix}-email`} type="email" autoComplete="off" value={value.email} onChange={set("email")} />
      </Field>
    </fieldset>
  )
}

// optional applicant details for the grant application; saved to the account and reused in every application
export function ApplicantPanel() {
  const { user, role, isLogged, updateProfile } = useAuth()
  const regions = useRegions()
  const { showToast } = useToast()
  const { fail, clear, fieldProps, errorProps } = useFormErrors("applicant")
  const [form, setForm] = useState(() => fromProfile(user?.profile))
  const [saving, setSaving] = useState(false)
  const ngo = role === ROLES.NGO
  const dirty = JSON.stringify(form) !== JSON.stringify(fromProfile(user?.profile))

  if (!isLogged) {
    return (
      <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
        Zaloguj się, aby Twoje dane (imię i nazwisko lub nazwa organizacji, kontakt, adres) wpisały się do formularza wniosku.
      </p>
    )
  }
  if (role !== ROLES.CITIZEN && !ngo) return null

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    clear(key)
  }
  const setTeam = (index, key) => (e) =>
    setForm((f) => ({ ...f, team: f.team.map((m, i) => (i === index ? { ...m, [key]: e.target.value } : m)) }))

  const persist = async (model, message) => {
    setSaving(true)
    try {
      const saved = await updateProfile(model)
      setForm(fromProfile(saved?.profile))
      showToast(message, "success")
    } catch (err) {
      showToast(err?.body?.message ?? null, "error")
    } finally {
      setSaving(false)
    }
  }

  const save = (e) => {
    e.preventDefault()
    if (form.postalCode && !/^\d{2}-\d{3}$/.test(form.postalCode.trim())) return fail("postalCode", "Kod pocztowy w formacie 00-000")
    persist(form, "Zapisano dane do wniosku")
  }

  const removeAll = () => {
    if (!window.confirm("Usunąć wszystkie zapisane dane do wniosków?")) return
    persist(EMPTY, "Usunięto zapisane dane")
  }

  return (
    <details className="rounded-xl border p-4" open={!user?.profile?.city && !user?.profile?.phone}>
      <summary className="cursor-pointer font-medium">Twoje dane do wniosku (opcjonalne)</summary>
      <p className="mt-1 text-sm text-muted-foreground">
        Wpisują się do formularza w części „Dane pomysłodawcy”{ngo ? " i „Zespół projektowy”" : ""}. Zapisujesz je raz – kolejne wnioski wypełnią się same.
        Dane służą tylko do wypełniania Twoich wniosków; AI dostaje wyłącznie gminę{ngo ? ", role i doświadczenie" : ""}, bez telefonów i adresów.
      </p>
      <form onSubmit={save} noValidate className="mt-4">
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="applicant-phone">Telefon</FieldLabel>
              <Input {...fieldProps("phone")} type="tel" autoComplete="tel" placeholder="np. 600 100 200" value={form.phone} onChange={set("phone")} />
              <FieldError {...errorProps("phone")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="applicant-street">{ngo ? "Adres siedziby (ulica, nr)" : "Adres (ulica, nr)"}</FieldLabel>
              <Input {...fieldProps("street")} autoComplete="street-address" placeholder="np. ul. Długa 5/2" value={form.street} onChange={set("street")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="applicant-postalCode">Kod pocztowy</FieldLabel>
              <Input {...fieldProps("postalCode")} autoComplete="postal-code" placeholder="00-000" value={form.postalCode} onChange={set("postalCode")} />
              <FieldError {...errorProps("postalCode")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="applicant-city">Miejscowość</FieldLabel>
              <Input {...fieldProps("city")} autoComplete="address-level2" placeholder="np. Limanowa" value={form.city} onChange={set("city")} />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="applicant-gminaId">Gmina, w której działasz</FieldLabel>
              <NativeSelect {...fieldProps("gminaId", "applicant-gmina-hint")} className="w-full" value={form.gminaId} disabled={!regions.data} onChange={set("gminaId")}>
                <NativeSelectOption value="">{regions.isPending ? "Wczytuję gminy..." : "Nie wybrano"}</NativeSelectOption>
                {regions.data?.powiaty.map((powiat) => (
                  <NativeSelectOptGroup key={powiat.id} label={powiat.label}>
                    {powiat.gminy.map((gmina) => (
                      <NativeSelectOption key={gmina.id} value={gmina.id}>{gmina.label}</NativeSelectOption>
                    ))}
                  </NativeSelectOptGroup>
                ))}
              </NativeSelect>
              <FieldDescription id="applicant-gmina-hint">AI użyje jej w diagnozie problemu i opisie odbiorców.</FieldDescription>
            </Field>
            {ngo && (
              <>
                <Field>
                  <FieldLabel htmlFor="applicant-krs">KRS</FieldLabel>
                  <Input {...fieldProps("krs")} inputMode="numeric" placeholder="10 cyfr" value={form.krs} onChange={set("krs")} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="applicant-regon">REGON</FieldLabel>
                  <Input {...fieldProps("regon")} inputMode="numeric" placeholder="9 albo 14 cyfr" value={form.regon} onChange={set("regon")} />
                </Field>
              </>
            )}
          </div>

          {ngo && (
            <>
              <PersonFields prefix="applicant-rep" label="Osoba upoważniona do reprezentowania" value={form.representative} onChange={(v) => setForm((f) => ({ ...f, representative: v }))} />
              <PersonFields prefix="applicant-contact" label="Osoba do kontaktów roboczych" value={form.contact} onChange={(v) => setForm((f) => ({ ...f, contact: v }))} />
              <fieldset className="flex flex-col gap-4 rounded-lg border p-3">
                <legend className="px-1 text-sm font-medium">Doświadczenie i zespół</legend>
                <Field>
                  <FieldLabel htmlFor="applicant-experience">Doświadczenie organizacji</FieldLabel>
                  <Textarea id="applicant-experience" rows={3} maxLength={3000} placeholder="np. od 2018 r. prowadzimy wolontariat dla seniorów w powiecie limanowskim…" value={form.experience} onChange={set("experience")} />
                </Field>
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium">Zespół (wybierasz osoby przy każdym wniosku)</p>
                  {form.team.map((member, i) => (
                    <div key={i} className="grid gap-2 rounded-lg bg-muted/40 p-3 sm:grid-cols-[1fr_1fr_auto]">
                      <Input aria-label={`Osoba ${i + 1}: imię i nazwisko`} placeholder="Imię i nazwisko" value={member.name} onChange={setTeam(i, "name")} />
                      <Input aria-label={`Osoba ${i + 1}: rola w projekcie`} placeholder="Rola, np. koordynatorka" value={member.role} onChange={setTeam(i, "role")} />
                      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Usuń osobę ${i + 1}`} onClick={() => setForm((f) => ({ ...f, team: f.team.filter((_, j) => j !== i) }))}>
                        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} aria-hidden="true" />
                      </Button>
                      <Textarea className="sm:col-span-3" rows={2} maxLength={600} aria-label={`Osoba ${i + 1}: doświadczenie`} placeholder="Krótko: doświadczenie tej osoby" value={member.experience} onChange={setTeam(i, "experience")} />
                    </div>
                  ))}
                  {form.team.length < 10 && (
                    <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setForm((f) => ({ ...f, team: [...f.team, { name: "", role: "", experience: "" }] }))}>
                      <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
                      Dodaj osobę
                    </Button>
                  )}
                </div>
              </fieldset>
            </>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={removeAll} disabled={saving}>Usuń zapisane dane</Button>
            <div className="flex flex-wrap items-center gap-3">
              {dirty && <span className="text-sm text-muted-foreground">Masz niezapisane zmiany</span>}
              <Button type="submit" variant="outline" disabled={saving || !dirty}>{saving ? "Zapisywanie..." : "Zapisz dane"}</Button>
            </div>
          </div>
        </FieldGroup>
      </form>
    </details>
  )
}
