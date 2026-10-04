"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@/components/ui/native-select"
import Modal from "@/components/modal"
import { SpeechButton } from "@/components/speech-button"
import { useSpeechSupported } from "@/hooks/useSpeechToText"
import { problemTokens } from "@/lib/problems"
import { PROBLEM_CATEGORY_OPTIONS, TARGET_GROUP_OPTIONS } from "@/lib/problemCategories"
import { findGmina, gminaCenter } from "@/lib/gminy"
import { useAddProblem } from "@/api/hooks/useProblemMutation"
import { useGminyShapes, useRegions } from "@/api/hooks/useRegionsQuery"
import { useStreet } from "@/api/hooks/useStreetQuery"
import { GeocodeService } from "@/api/services/GeocodeService"
import { useToast } from "@/helpers/ToastProvider"
import { useFormErrors } from "@/helpers/useFormErrors"
import {
  EMPTY_GMINA_MSG,
  EMPTY_LOCATION_MSG,
  OUTSIDE_MALOPOLSKA_MSG,
  PHOTO_TOO_LARGE_MSG,
  PROBLEM_ADDED_MSG,
  STREET_NOT_FOUND_MSG,
  emptyField,
} from "@/helpers/Errors"

const LocationPicker = dynamic(() => import("@/components/location-picker"), { ssr: false })

// location = exact pin; wholeGmina = no pin, the report is about gminaId as a whole
const EMPTY = { title: "", description: "", category: "", targetGroup: "", location: null, gminaId: "", wholeGmina: false, photo: null }
const MAX_PHOTO_BYTES = 5 * 1024 * 1024

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function validate(form, place) {
  if (!form.title.trim()) return ["title", emptyField("tytuł")]
  if (!form.description.trim()) return ["description", emptyField("opis")]
  if (!form.category) return ["category", "Wybierz kategorię problemu!"]
  if (!form.targetGroup) return ["targetGroup", "Wybierz, kogo dotyczy problem!"]
  if (!form.wholeGmina && !form.location) return ["address", EMPTY_LOCATION_MSG]
  if (place.outside) return ["address", OUTSIDE_MALOPOLSKA_MSG]
  if (!place.gminaId || !place.point) return ["gmina", EMPTY_GMINA_MSG]
  if (form.photo && form.photo.size > MAX_PHOTO_BYTES) return ["photo", PHOTO_TOO_LARGE_MSG]
  return null
}

export default function AddQuestionary({ open, onClose, onSubmitted }) {
  const [form, setForm] = useState(EMPTY)
  const { showToast } = useToast()
  const addProblem = useAddProblem()
  const street = useStreet(form.location)
  const [address, setAddress] = useState("")
  const [searching, setSearching] = useState(false)
  const titleRef = useRef(null)
  const speechSupported = useSpeechSupported()
  const { fail, clear, reset, fieldProps, errorProps } = useFormErrors("q")
  const regions = useRegions()
  const shapes = useGminyShapes()

  const pinGmina = form.location && shapes.data ? findGmina(shapes.data, form.location) : null
  const outside = !form.wholeGmina && !!form.location && !!shapes.data && !pinGmina
  const gminaId = form.wholeGmina ? form.gminaId : pinGmina?.properties.id ?? ""
  const wholeGminaShape = form.wholeGmina ? shapes.data?.find((shape) => shape.properties.id === form.gminaId) : null
  const gminaFocus = useMemo(() => (wholeGminaShape ? gminaCenter(wholeGminaShape) : null), [wholeGminaShape])

  const photoPreview = useMemo(() => (form.photo ? URL.createObjectURL(form.photo) : null), [form.photo])

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
  }, [photoPreview])

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }))
    clear(key === "location" ? "address" : key)
  }

  const clearPlaceErrors = () => {
    clear("address")
    clear("gmina")
  }

  const pickLocation = (location) => {
    setForm((f) => ({ ...f, location, wholeGmina: false }))
    clearPlaceErrors()
  }

  // a gmina from the list replaces a pin that lies in another gmina
  const pickGmina = (id) => {
    if (id === pinGmina?.properties.id) return
    setForm((f) => ({ ...f, gminaId: id, wholeGmina: true, location: null }))
    clearPlaceErrors()
  }

  const setWholeGmina = (checked) => {
    setForm((f) => (checked ? { ...f, gminaId, wholeGmina: true, location: null } : { ...f, wholeGmina: false }))
    clearPlaceErrors()
  }

  const close = () => {
    setForm(EMPTY)
    setAddress("")
    reset()
    onClose?.()
  }

  const searchAddress = async () => {
    const query = address.trim()
    if (!query) {
      fail("address", emptyField("adres"))
      return
    }

    setSearching(true)
    try {
      const location = await GeocodeService.search(query)
      if (location) pickLocation(location)
      else fail("address", STREET_NOT_FOUND_MSG)
    } catch {
      showToast(null, "error")
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const point = form.wholeGmina ? gminaFocus : form.location
    const error = validate(form, { gminaId, outside, point })
    if (error) {
      fail(...error)
      return
    }

    try {
      const result = await addProblem.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim(),
        latitude: point.lat,
        longitude: point.lon,
        imageUrl: form.photo ? await readAsDataUrl(form.photo) : null,
        street: form.wholeGmina ? null : street.data ?? null,
        category: form.category,
        targetGroup: form.targetGroup,
        gminaId,
        wholeGmina: form.wholeGmina,
      })
      if (result?.trackingToken) problemTokens.remember(result.trackingToken)
      showToast(PROBLEM_ADDED_MSG, "success")
      close()
      onSubmitted?.(result)
    } catch {
      showToast(null, "error")
    }
  }

  const locationStatus = form.wholeGmina
    ? "Zgłoszenie dotyczy całej gminy. Kliknij na mapie, jeśli chcesz wskazać dokładne miejsce."
    : !form.location
    ? "Wpisz adres i wybierz Szukaj albo kliknij miejsce na mapie."
    : street.isFetching
      ? "Szukam adresu..."
      : `Wybrane miejsce: ${street.data ?? `${form.location.lat.toFixed(5)}, ${form.location.lon.toFixed(5)}`}`

  return (
    <Modal open={open} onClose={close} labelledBy="q-heading" describedBy="q-intro" className="max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 id="q-heading" className="font-heading text-xl font-bold tracking-tight">Zgłoś problem</h2>
          </CardTitle>
          <CardDescription id="q-intro">
            Uzupełnij dane problemu i wskaż lokalizację. Wszystkie pola poza zdjęciem są wymagane.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="q-title">Tytuł</FieldLabel>
                <div className="relative">
                  <Input
                    {...fieldProps("title")}
                    ref={titleRef}
                    required
                    className={speechSupported ? "pr-11" : undefined}
                    value={form.title}
                    onChange={(e) => set("title")(e.target.value)}
                  />
                  <SpeechButton target={titleRef} className="top-1/2 -translate-y-1/2" />
                </div>
                <FieldError {...errorProps("title")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="q-description">Opis</FieldLabel>
                <FieldDescription id="q-description-hint">Nie podawaj imion, nazwisk ani adresów.</FieldDescription>
                <Textarea
                  {...fieldProps("description", "q-description-hint")}
                  required
                  value={form.description}
                  onChange={(e) => set("description")(e.target.value)}
                />
                <FieldError {...errorProps("description")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="q-category">Kategoria</FieldLabel>
                <NativeSelect
                  {...fieldProps("category")}
                  required
                  className="w-full"
                  value={form.category}
                  onChange={(e) => set("category")(e.target.value)}
                >
                  <NativeSelectOption value="" disabled>Wybierz kategorię</NativeSelectOption>
                  {PROBLEM_CATEGORY_OPTIONS.map((option) => (
                    <NativeSelectOption key={option.value} value={option.value}>
                      {option.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError {...errorProps("category")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="q-targetGroup">Kogo dotyczy</FieldLabel>
                <NativeSelect
                  {...fieldProps("targetGroup")}
                  required
                  className="w-full"
                  value={form.targetGroup}
                  onChange={(e) => set("targetGroup")(e.target.value)}
                >
                  <NativeSelectOption value="" disabled>Wybierz grupę</NativeSelectOption>
                  {TARGET_GROUP_OPTIONS.map((option) => (
                    <NativeSelectOption key={option.value} value={option.value}>
                      {option.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError {...errorProps("targetGroup")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="q-address">Lokalizacja (adres)</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    {...fieldProps("address", "q-location-status")}
                    value={address}
                    autoComplete="off"
                    placeholder="np. Floriańska 15"
                    onChange={(e) => setAddress(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return
                      e.preventDefault()
                      searchAddress()
                    }}
                  />
                  <Button type="button" variant="outline" onClick={searchAddress} disabled={searching}>
                    {searching ? "Szukam..." : "Szukaj"}
                  </Button>
                </div>
                <FieldError {...errorProps("address")} />
                <div className="h-56 w-full overflow-hidden rounded-md border">
                  <LocationPicker value={form.location} focus={gminaFocus} onChange={pickLocation} />
                </div>
                <FieldDescription id="q-location-status" aria-live="polite">
                  {locationStatus}
                </FieldDescription>
                {outside && (
                  <p role="alert" className="text-sm text-destructive">{OUTSIDE_MALOPOLSKA_MSG}</p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="q-gmina">Gmina</FieldLabel>
                <NativeSelect
                  {...fieldProps("gmina", "q-gmina-hint")}
                  required
                  className="w-full"
                  value={gminaId}
                  disabled={!regions.data}
                  onChange={(e) => pickGmina(e.target.value)}
                >
                  <NativeSelectOption value="" disabled>
                    {regions.isPending ? "Wczytuję gminy..." : "Wybierz gminę z listy"}
                  </NativeSelectOption>
                  {regions.data?.powiaty.map((powiat) => (
                    <NativeSelectOptGroup key={powiat.id} label={powiat.label}>
                      {powiat.gminy.map((gmina) => (
                        <NativeSelectOption key={gmina.id} value={gmina.id}>{gmina.label}</NativeSelectOption>
                      ))}
                    </NativeSelectOptGroup>
                  ))}
                </NativeSelect>
                <FieldDescription id="q-gmina-hint">Uzupełnia się po wybraniu miejsca na mapie. Możesz też wybrać gminę bez mapy.</FieldDescription>
                <FieldError {...errorProps("gmina")} />
              </Field>
              <Field orientation="horizontal">
                <Checkbox
                  id="q-whole-gmina"
                  checked={form.wholeGmina}
                  disabled={!gminaId}
                  onCheckedChange={setWholeGmina}
                />
                <FieldLabel htmlFor="q-whole-gmina">Dotyczy całej gminy, bez dokładnego miejsca</FieldLabel>
              </Field>
              <Field>
                <FieldLabel htmlFor="q-photo">Zdjęcie (opcjonalne, do 5 MB)</FieldLabel>
                <Input
                  {...fieldProps("photo")}
                  type="file"
                  accept="image/*"
                  onChange={(e) => set("photo")(e.target.files?.[0] ?? null)}
                />
                <FieldError {...errorProps("photo")} />
                {photoPreview && (
                  <img src={photoPreview} alt="Podgląd wybranego zdjęcia" className="max-h-40 w-full rounded-md object-cover" />
                )}
              </Field>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={close}>Anuluj</Button>
                <Button type="submit" disabled={addProblem.isPending || street.isFetching || searching || shapes.isPending}>
                  {addProblem.isPending ? "Szukam rozwiązań..." : "Dodaj"}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </Modal>
  )
}
