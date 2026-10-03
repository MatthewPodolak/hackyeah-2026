"use client"

import { useState } from "react"
import { cn } from "cn"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Cancel01Icon, Delete02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

export function optionValue(option) {
  return typeof option === "string" ? option : option.value
}

export function optionLabel(option) {
  return typeof option === "string" ? option : option.label
}

function findOption(options, value) {
  return (options ?? []).find((option) => optionValue(option) === value)
}

function Chip({ active, onClick, children, disabled }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-40",
        active ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "hover:bg-muted"
      )}
    >
      {children}
    </button>
  )
}

function SingleField({ section, value, onChange }) {
  const selected = typeof value === "object" && value !== null ? value.value : value
  const text = typeof value === "object" && value !== null ? value.text ?? "" : ""

  const select = (next) => onChange(section.withText ? { value: next, text } : next)

  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-2 sm:grid-cols-2">
        {section.options.map((option) => {
          const active = selected === optionValue(option)
          return (
            <button
              key={optionValue(option)}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => select(optionValue(option))}
              className={cn(
                "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                active ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500" : "hover:bg-muted"
              )}
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                {option.icon && <span aria-hidden="true">{option.icon}</span>}
                {optionLabel(option)}
              </span>
              {option.description && <span className="text-xs text-muted-foreground">{option.description}</span>}
            </button>
          )
        })}
      </div>
      {section.withText && (
        <Textarea
          rows={2}
          value={text}
          placeholder={section.withText}
          onChange={(e) => onChange({ value: selected ?? null, text: e.target.value })}
        />
      )}
    </div>
  )
}

function MultiField({ section, value, onChange }) {
  const selected = Array.isArray(value) ? value : []
  const [other, setOther] = useState("")
  const known = new Set(section.options.map(optionValue))
  const custom = selected.filter((item) => !known.has(item))
  const full = section.maxSelected != null && selected.length >= section.maxSelected

  const toggle = (item) =>
    onChange(selected.includes(item) ? selected.filter((x) => x !== item) : [...selected, item])

  const addOther = () => {
    const item = other.trim()
    if (!item || selected.includes(item) || full) return
    onChange([...selected, item])
    setOther("")
  }

  return (
    <div className="flex flex-col gap-2">
      {section.maxSelected != null && (
        <p className="text-xs text-muted-foreground">
          Wybierz maksymalnie {section.maxSelected} ({selected.length}/{section.maxSelected})
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {section.options.map((option) => {
          const item = optionValue(option)
          const active = selected.includes(item)
          return (
            <Chip key={item} active={active} disabled={!active && full} onClick={() => toggle(item)}>
              {option.icon && <span aria-hidden="true">{option.icon}</span>}
              {optionLabel(option)}
            </Chip>
          )
        })}
        {custom.map((item) => (
          <Chip key={item} active onClick={() => toggle(item)}>
            {item}
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" />
          </Chip>
        ))}
      </div>
      {section.allowOther && (
        <div className="flex gap-2">
          <Input
            value={other}
            disabled={full}
            placeholder="Inne — wpisz własne"
            onChange={(e) => setOther(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return
              e.preventDefault()
              addOther()
            }}
          />
          <Button type="button" variant="outline" onClick={addOther} disabled={full || !other.trim()}>
            Dodaj
          </Button>
        </div>
      )}
    </div>
  )
}

function TextListField({ section, value, onChange }) {
  const items = Array.isArray(value) && value.length ? value : [""]

  const update = (index, text) => onChange(items.map((item, i) => (i === index ? text : item)))
  const remove = (index) => onChange(items.filter((_, i) => i !== index))

  return (
    <div className="flex flex-col gap-2">
      {section.hints?.length > 0 && (
        <ul className="list-disc pl-5 text-xs text-muted-foreground">
          {section.hints.map((hint) => <li key={hint}>{hint}</li>)}
        </ul>
      )}
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input value={item} placeholder="Wpisz osobę, grupę lub instytucję" onChange={(e) => update(index, e.target.value)} />
          <Button type="button" variant="ghost" size="icon" aria-label="Usuń" onClick={() => remove(index)}>
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => onChange([...items, ""])} disabled={items.length >= 20}>
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
        Dodaj pozycję
      </Button>
    </div>
  )
}

function PartnerListField({ section, value, onChange }) {
  const partners = Array.isArray(value) ? value : []

  const update = (index, changes) => onChange(partners.map((p, i) => (i === index ? { ...p, ...changes } : p)))
  const remove = (index) => onChange(partners.filter((_, i) => i !== index))
  const add = () => onChange([...partners, { name: "", roles: [], status: "POTENTIAL", note: "" }])

  return (
    <div className="flex flex-col gap-3">
      <ul className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        {section.roles.map((role) => (
          <li key={role.value} className="rounded-lg bg-muted/60 p-2">
            <span className="font-medium text-foreground">{role.icon} {role.label}</span>
            <br />
            {role.description}
          </li>
        ))}
      </ul>
      {partners.map((partner, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-xl border p-3">
          <div className="flex gap-2">
            <Input value={partner.name ?? ""} placeholder="Nazwa partnera" onChange={(e) => update(index, { name: e.target.value })} />
            <Button type="button" variant="ghost" size="icon" aria-label="Usuń partnera" onClick={() => remove(index)}>
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {section.roles.map((role) => {
              const roles = partner.roles ?? []
              const active = roles.includes(role.value)
              return (
                <Chip
                  key={role.value}
                  active={active}
                  onClick={() => update(index, { roles: active ? roles.filter((r) => r !== role.value) : [...roles, role.value] })}
                >
                  <span aria-hidden="true">{role.icon}</span> {role.label}
                </Chip>
              )
            })}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <NativeSelect className="sm:w-64" value={partner.status ?? "POTENTIAL"} onChange={(e) => update(index, { status: e.target.value })} aria-label="Status partnera">
              {section.statuses.map((status) => (
                <NativeSelectOption key={status.value} value={status.value}>{status.label}</NativeSelectOption>
              ))}
            </NativeSelect>
            <Input value={partner.note ?? ""} placeholder="Jak pomaga? (opcjonalnie)" onChange={(e) => update(index, { note: e.target.value })} />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={add} disabled={partners.length >= 20}>
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
        Dodaj partnera
      </Button>
    </div>
  )
}

function ImpactField({ section, value, onChange }) {
  const levels = value && typeof value === "object" ? value : {}

  return (
    <div className="flex flex-col gap-3">
      {section.dimensions.map((dimension) => (
        <div key={dimension.value} className="flex flex-col gap-2 rounded-xl border p-3">
          <div>
            <p className="text-sm font-medium">{dimension.icon} {dimension.label}</p>
            <p className="text-xs text-muted-foreground">{dimension.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {section.levels.map((level) => (
              <Chip
                key={level.value}
                active={levels[dimension.value] === level.value}
                onClick={() => onChange({ ...levels, [dimension.value]: level.value })}
              >
                {level.label}
              </Chip>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function CanvasField({ section, value, onChange }) {
  switch (section.type) {
    case "single": return <SingleField section={section} value={value} onChange={onChange} />
    case "multi": return <MultiField section={section} value={value} onChange={onChange} />
    case "textList": return <TextListField section={section} value={value} onChange={onChange} />
    case "partnerList": return <PartnerListField section={section} value={value} onChange={onChange} />
    case "impactMatrix": return <ImpactField section={section} value={value} onChange={onChange} />
    default: return null
  }
}

export function formatCanvasValue(section, value) {
  if (value == null) return null
  switch (section.type) {
    case "single": {
      const selected = typeof value === "object" ? value.value : value
      const option = findOption(section.options, selected)
      const label = option ? `${option.icon ? `${option.icon} ` : ""}${optionLabel(option)}` : selected
      return typeof value === "object" && value.text ? `${label} — ${value.text}` : label
    }
    case "multi":
    case "textList":
      return Array.isArray(value) && value.length ? value.filter(Boolean).join(", ") : null
    case "partnerList":
      return Array.isArray(value) && value.length
        ? value.map((p) => {
            const status = section.statuses.find((s) => s.value === p.status)?.label
            const roles = (p.roles ?? []).map((r) => section.roles.find((x) => x.value === r)?.icon).join("")
            return `${p.name}${roles ? ` ${roles}` : ""}${status ? ` (${status.toLowerCase()})` : ""}`
          }).join("; ")
        : null
    case "impactMatrix":
      return Object.entries(value)
        .map(([dim, level]) => {
          const d = section.dimensions.find((x) => x.value === dim)
          const l = section.levels.find((x) => x.value === level)
          return d && l ? `${d.icon} ${d.label}: ${l.label}` : null
        })
        .filter(Boolean)
        .join(" · ") || null
    default:
      return null
  }
}

export function CanvasSummary({ spec, answers }) {
  if (!spec || !answers || !Object.keys(answers).length) return null

  return (
    <div className="flex flex-col gap-4">
      {spec.steps.map((step) => {
        const rows = step.sections
          .map((section) => ({ section, text: formatCanvasValue(section, answers[section.id]) }))
          .filter((row) => row.text)
        if (!rows.length) return null
        return (
          <section key={step.id}>
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{step.title}</h4>
            <dl className="grid gap-1.5 text-sm">
              {rows.map(({ section, text }) => (
                <div key={section.id} className="grid gap-0.5 sm:grid-cols-[12rem_1fr] sm:gap-3">
                  <dt className="font-medium">{section.title}</dt>
                  <dd className="text-muted-foreground break-words">{text}</dd>
                </div>
              ))}
            </dl>
          </section>
        )
      })}
    </div>
  )
}
