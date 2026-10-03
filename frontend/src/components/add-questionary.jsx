"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
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
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { PROBLEM_CATEGORY_OPTIONS, TARGET_GROUP_OPTIONS } from "@/lib/problemCategories"
import { useAddProblem } from "@/api/hooks/useProblemMutation"
import { useStreet } from "@/api/hooks/useStreetQuery"
import { GeocodeService } from "@/api/services/GeocodeService"
import { useToast } from "@/helpers/ToastProvider"
import {
  EMPTY_LOCATION_MSG,
  PHOTO_TOO_LARGE_MSG,
  PROBLEM_ADDED_MSG,
  STREET_NOT_FOUND_MSG,
  emptyField,
} from "@/helpers/Errors"

const LocationPicker = dynamic(() => import("@/components/location-picker"), { ssr: false })

const EMPTY = { title: "", description: "", category: "", targetGroup: "", location: null, photo: null }
const MAX_PHOTO_BYTES = 5 * 1024 * 1024

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function validate(form) {
  if (!form.title.trim()) return emptyField("tytuł")
  if (!form.description.trim()) return emptyField("opis")
  if (!form.category) return "Wybierz kategorię problemu!"
  if (!form.targetGroup) return "Wybierz, kogo dotyczy problem!"
  if (!form.location) return EMPTY_LOCATION_MSG
  if (form.photo && form.photo.size > MAX_PHOTO_BYTES) return PHOTO_TOO_LARGE_MSG
  return null
}

export default function AddQuestionary({ open, onClose, onSubmitted }) {
  const [form, setForm] = useState(EMPTY)
  const { showToast } = useToast()
  const addProblem = useAddProblem()
  const street = useStreet(form.location)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [address, setAddress] = useState("")
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!form.photo) {
      setPhotoPreview(null)
      return
    }
    const url = URL.createObjectURL(form.photo)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [form.photo])

  if (!open) return null

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const close = () => {
    setForm(EMPTY)
    setAddress("")
    onClose?.()
  }

  const searchAddress = async () => {
    const query = address.trim()
    if (!query) {
      showToast(emptyField("adres"), "error")
      return
    }

    setSearching(true)
    try {
      const location = await GeocodeService.search(query)
      if (location) set("location")(location)
      else showToast(STREET_NOT_FOUND_MSG, "error")
    } catch {
      showToast(null, "error")
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const error = validate(form)
    if (error) {
      showToast(error, "error")
      return
    }

    try {
      const result = await addProblem.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim(),
        latitude: form.location.lat,
        longitude: form.location.lon,
        imageUrl: form.photo ? await readAsDataUrl(form.photo) : null,
        street: street.data ?? null,
        category: form.category,
        targetGroup: form.targetGroup,
      })
      showToast(PROBLEM_ADDED_MSG, "success")
      close()
      onSubmitted?.(result)
    } catch {
      showToast(null, "error")
    }
  }

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) close()}} className="fixed inset-0 z-[2000] flex overflow-y-auto bg-black/40 p-6">
      <div className="m-auto w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Zglos problem</CardTitle>
            <CardDescription>Uzupełnij dane problemu i wskaż lokalizację na mapie</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="q-title">Tytuł</FieldLabel>
                  <Input
                    id="q-title"
                    value={form.title}
                    onChange={(e) => set("title")(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="q-description">Opis</FieldLabel>
                  <Textarea
                    id="q-description"
                    value={form.description}
                    onChange={(e) => set("description")(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="q-category">Kategoria</FieldLabel>
                  <NativeSelect
                    id="q-category"
                    className="w-full"
                    value={form.category}
                    onChange={(e) => set("category")(e.target.value)}
                  >
                    <NativeSelectOption value="" disabled>Wybierz kategorię</NativeSelectOption>
                    {PROBLEM_CATEGORY_OPTIONS.map((option) => (
                      <NativeSelectOption key={option.value} value={option.value}>
                        {option.icon} {option.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="q-target-group">Kogo dotyczy</FieldLabel>
                  <NativeSelect
                    id="q-target-group"
                    className="w-full"
                    value={form.targetGroup}
                    onChange={(e) => set("targetGroup")(e.target.value)}
                  >
                    <NativeSelectOption value="" disabled>Wybierz grupę</NativeSelectOption>
                    {TARGET_GROUP_OPTIONS.map((option) => (
                      <NativeSelectOption key={option.value} value={option.value}>
                        {option.icon} {option.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="q-address">Lokalizacja</FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      id="q-address"
                      value={address}
                      placeholder="Wpisz ulicę, np. Floriańska 15"
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
                  <div className="h-56 w-full overflow-hidden rounded-md border">
                    <LocationPicker value={form.location} onChange={set("location")} />
                  </div>
                  <FieldDescription>
                    {!form.location
                      ? "Wpisz adres lub kliknij na mapie, aby wybrać miejsce"
                      : street.isFetching
                        ? "Szukam adresu..."
                        : street.data ?? `${form.location.lat.toFixed(5)}, ${form.location.lon.toFixed(5)}`}
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="q-photo">Zdjęcie (opcjonalne)</FieldLabel>
                  <Input
                    id="q-photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => set("photo")(e.target.files?.[0] ?? null)}
                  />
                  {photoPreview && (
                    <img src={photoPreview} alt="" className="max-h-40 w-full rounded-md object-cover" />
                  )}
                </Field>
                <Field>
                  <Button type="submit" disabled={addProblem.isPending || street.isFetching || searching}>
                    {addProblem.isPending ? "Szukam rozwiązań..." : "Dodaj"}
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
