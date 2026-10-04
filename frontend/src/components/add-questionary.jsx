"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Checkbox } from "@/components/ui/checkbox"
import { DialogBody, DialogFooter, DialogHeader, DialogPanel, FormStep } from "@/components/dialog-parts"
import { HugeiconsIcon } from "@hugeicons/react"
import { ImageAdd01Icon, Location01Icon, Megaphone01Icon, Search01Icon } from "@hugeicons/core-free-icons"
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
import { useScopedTokens } from "@/hooks/useScopedTokens"
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
  const { remember: rememberProblemToken } = useScopedTokens(problemTokens)
  const [form, setForm] = useState(EMPTY)
  const { showToast } = useToast()
  const addProblem = useAddProblem()
  const street = useStreet(form.location)
  const [address, setAddress] = useState("")
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationFocus, setLocationFocus] = useState(null)
  const locationRequestRef = useRef(0)
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

  useEffect(() => () => {
    locationRequestRef.current += 1
  }, [open])

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }))
    clear(key === "location" ? "address" : key)
  }

  const clearPlaceErrors = () => {
    clear("address")
    clear("gmina")
  }

  // Browser location requests cannot be cancelled; ignore callbacks after a new selection or closing.
  const cancelLocationRequest = () => {
    locationRequestRef.current += 1
    setLocating(false)
    setLocationFocus(null)
  }

  const pickLocation = (location) => {
    cancelLocationRequest()
    setForm((f) => ({ ...f, location, wholeGmina: false }))
    clearPlaceErrors()
  }

  // a gmina from the list replaces a pin that lies in another gmina
  const pickGmina = (id) => {
    cancelLocationRequest()
    if (id === pinGmina?.properties.id) return
    setForm((f) => ({ ...f, gminaId: id, wholeGmina: true, location: null }))
    clearPlaceErrors()
  }

  const setWholeGmina = (checked) => {
    cancelLocationRequest()
    setForm((f) => (checked ? { ...f, gminaId, wholeGmina: true, location: null } : { ...f, wholeGmina: false }))
    clearPlaceErrors()
  }

  const close = () => {
    cancelLocationRequest()
    setForm(EMPTY)
    setAddress("")
    reset()
    onClose?.()
  }

  const searchAddress = async () => {
    if (searching || locating) return
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

  const locateCurrentLocation = () => {
    if (locating || searching) return
    clearPlaceErrors()
    if (!navigator.geolocation) {
      fail("address", "Ta przeglądarka nie udostępnia lokalizacji. Wpisz adres albo wybierz miejsce na mapie.")
      return
    }
    if (!window.isSecureContext) {
      fail("address", "Lokalizacja wymaga bezpiecznego połączenia HTTPS. Wpisz adres albo wybierz miejsce na mapie.")
      return
    }

    const requestId = ++locationRequestRef.current
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (locationRequestRef.current !== requestId) return
        const location = { lat: coords.latitude, lon: coords.longitude }
        setLocating(false)
        if (shapes.data && !findGmina(shapes.data, location)) {
          fail("address", OUTSIDE_MALOPOLSKA_MSG)
          return
        }
        pickLocation(location)
        setLocationFocus(location)
      },
      (error) => {
        if (locationRequestRef.current !== requestId) return
        setLocating(false)
        const messages = {
          1: "Nie udzielono zgody na lokalizację. Zezwól na nią w przeglądarce albo wybierz miejsce na mapie.",
          2: "Nie udało się ustalić lokalizacji. Wpisz adres albo wybierz miejsce na mapie.",
          3: "Ustalanie lokalizacji trwało zbyt długo. Spróbuj ponownie albo wybierz miejsce na mapie.",
        }
        fail("address", messages[error.code] ?? messages[2])
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (locating || searching || addProblem.isPending) return

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
      if (result?.trackingToken) rememberProblemToken(result.trackingToken)
      showToast(PROBLEM_ADDED_MSG, "success")
      close()
      onSubmitted?.(result)
    } catch {
      showToast(null, "error")
    }
  }

  const locationStatus = locating
    ? "Ustalam Twoją lokalizację. Jeśli przeglądarka zapyta o zgodę, zezwól na dostęp do lokalizacji."
    : form.wholeGmina
    ? "Zgłoszenie dotyczy całej gminy. Kliknij na mapie, jeśli chcesz wskazać dokładne miejsce."
    : !form.location
    ? "Wpisz adres, użyj swojej lokalizacji albo kliknij miejsce na mapie."
    : street.isFetching
      ? "Szukam adresu..."
      : `Wybrane miejsce: ${street.data ?? `${form.location.lat.toFixed(5)}, ${form.location.lon.toFixed(5)}`}`

  return (
    <Modal open={open} onClose={close} labelledBy="q-heading" describedBy="q-intro" className="max-w-2xl">
      <DialogPanel>
        <DialogHeader
          icon={Megaphone01Icon}
          tone="danger"
          title="Zgłoś problem"
          titleId="q-heading"
          description="Opisz problem i wskaż miejsce. Wszystkie pola poza zdjęciem są wymagane."
          descriptionId="q-intro"
          onClose={close}
        />
        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="pt-2">
            <FieldGroup className="gap-6">
              <FormStep number={1} title="Co się dzieje?">
                <Field>
                  <FieldLabel htmlFor="q-title">Tytuł</FieldLabel>
                  <div className="relative">
                    <Input
                      {...fieldProps("title")}
                      ref={titleRef}
                      required
                      placeholder="np. Brak podjazdu dla wózków przy przychodni"
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
                  <Textarea
                    {...fieldProps("description", "q-description-hint")}
                    required
                    placeholder="Kogo i jak dotyka ten problem? Od kiedy trwa?"
                    value={form.description}
                    onChange={(e) => set("description")(e.target.value)}
                  />
                  <FieldDescription id="q-description-hint">Nie podawaj imion, nazwisk ani adresów prywatnych.</FieldDescription>
                  <FieldError {...errorProps("description")} />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
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
                </div>
              </FormStep>

              <FormStep number={2} title="Gdzie?" description="Wpisz adres, użyj swojej lokalizacji albo kliknij miejsce na mapie.">
                <Field>
                  <FieldLabel htmlFor="q-address">Adres</FieldLabel>
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
                    <Button type="button" variant="outline" className="h-11" onClick={searchAddress} disabled={searching || locating}>
                      <HugeiconsIcon icon={Search01Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
                      {searching ? "Szukam..." : "Szukaj"}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full sm:w-fit"
                    onClick={locateCurrentLocation}
                    disabled={locating || searching || shapes.isPending || addProblem.isPending}
                    aria-describedby="q-location-status"
                  >
                    {locating
                      ? <Spinner data-icon="inline-start" aria-hidden="true" />
                      : <HugeiconsIcon icon={Location01Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />}
                    {locating ? "Ustalam lokalizację..." : "Użyj mojej lokalizacji"}
                  </Button>
                  <FieldError {...errorProps("address")} />
                  <div className="h-60 w-full overflow-hidden rounded-2xl border border-border">
                    <LocationPicker value={form.location} focus={gminaFocus ?? locationFocus} focusZoom={form.wholeGmina ? 11 : 16} onChange={pickLocation} />
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
                <Field orientation="horizontal" className="rounded-xl bg-muted/60 p-3">
                  <Checkbox
                    id="q-whole-gmina"
                    checked={form.wholeGmina}
                    disabled={!gminaId}
                    onCheckedChange={setWholeGmina}
                  />
                  <FieldLabel htmlFor="q-whole-gmina">Dotyczy całej gminy, bez dokładnego miejsca</FieldLabel>
                </Field>
              </FormStep>

              <FormStep number={3} title="Zdjęcie" description="Opcjonalnie, do 5 MB.">
                <Field>
                  <label
                    htmlFor="q-photo"
                    className="flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-outline p-4 hover:bg-muted/60 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]"
                  >
                    <Input
                      {...fieldProps("photo")}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => set("photo")(e.target.files?.[0] ?? null)}
                    />
                    {photoPreview ? (
                      <img src={photoPreview} alt="Podgląd wybranego zdjęcia" className="size-16 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <HugeiconsIcon icon={ImageAdd01Icon} strokeWidth={1.8} className="size-7" />
                      </span>
                    )}
                    <span className="min-w-0 text-sm">
                      <span className="block font-semibold">{form.photo ? form.photo.name : "Dodaj zdjęcie"}</span>
                      <span className="block text-muted-foreground">{form.photo ? "Kliknij, aby zmienić" : "JPG lub PNG, maks. 5 MB"}</span>
                    </span>
                  </label>
                  <FieldError {...errorProps("photo")} />
                </Field>
              </FormStep>
            </FieldGroup>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={close}>Anuluj</Button>
            <Button type="submit" disabled={addProblem.isPending || street.isFetching || searching || locating || shapes.isPending}>
              {addProblem.isPending ? "Szukam rozwiązań..." : "Wyślij zgłoszenie"}
            </Button>
          </DialogFooter>
        </form>
      </DialogPanel>
    </Modal>
  )
}
