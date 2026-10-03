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
import { useAddProblem } from "@/api/hooks/useProblemMutation"
import { useToast } from "@/helpers/ToastProvider"
import {
  EMPTY_LOCATION_MSG,
  PHOTO_TOO_LARGE_MSG,
  PROBLEM_ADDED_MSG,
  emptyField,
} from "@/helpers/Errors"

const LocationPicker = dynamic(() => import("@/components/location-picker"), { ssr: false })

const EMPTY = { title: "", description: "", location: null, photo: null }
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
  if (!form.location) return EMPTY_LOCATION_MSG
  if (form.photo && form.photo.size > MAX_PHOTO_BYTES) return PHOTO_TOO_LARGE_MSG
  return null
}

export default function AddQuestionary({ open, onClose }) {
  const [form, setForm] = useState(EMPTY)
  const { showToast } = useToast()
  const addProblem = useAddProblem()
  const [photoPreview, setPhotoPreview] = useState(null)

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
    onClose?.()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const error = validate(form)
    if (error) {
      showToast(error, "error")
      return
    }

    try {
      await addProblem.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim(),
        latitude: form.location.lat,
        longitude: form.location.lon,
        imageUrl: form.photo ? await readAsDataUrl(form.photo) : null,
      })
      showToast(PROBLEM_ADDED_MSG, "success")
      close()
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
                  <FieldLabel>Lokalizacja</FieldLabel>
                  <div className="h-56 w-full overflow-hidden rounded-md border">
                    <LocationPicker value={form.location} onChange={set("location")} />
                  </div>
                  <FieldDescription>
                    {form.location
                      ? `${form.location.lat.toFixed(5)}, ${form.location.lon.toFixed(5)}`
                      : "Kliknij na mapie, aby wybrać miejsce"}
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
                  <Button type="submit" disabled={addProblem.isPending}>
                    {addProblem.isPending ? "Wysyłanie..." : "Dodaj"}
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
