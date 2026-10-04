"use client"

import { useState } from "react"
import { cn } from "cn"
import { localNumberFormat, t } from "@/lib/i18n";

const numberFormat = localNumberFormat()
const percentFormat = localNumberFormat({ style: "percent", maximumFractionDigits: 0 })

function DataTable({ caption, rows, labelHeader, valueHeader }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-muted-foreground underline-offset-4 hover:underline">{t("Pokaż dane w tabeli")}</summary>
      <table className="mt-2 w-full text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b">
            <th scope="col" className="py-1.5 pr-4 font-medium">{labelHeader}</th>
            <th scope="col" className="py-1.5 text-right font-medium">{valueHeader}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b last:border-0">
              <th scope="row" className="py-1.5 pr-4 font-normal">{row.label}</th>
              <td className="py-1.5 text-right tabular-nums">{numberFormat.format(row.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}

export function ChartCard({ title, description, children, className }) {
  return (
    <figure className={cn("flex flex-col rounded-2xl border bg-card p-5", className)}>
      <figcaption className="mb-4">
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </figcaption>
      {children}
    </figure>
  )
}

export function BarList({ rows, caption, labelHeader = t("Kategoria"), valueHeader = t("Liczba") }) {
  const [hovered, setHovered] = useState(null)
  const max = Math.max(1, ...rows.map((r) => r.value))
  const total = rows.reduce((sum, r) => sum + r.value, 0)

  return (
    <>
      <ul className="flex flex-col gap-2" aria-hidden="true">
        {rows.map((row) => {
          const width = (row.value / max) * 100
          return (
            <li
              key={row.key}
              className="relative grid grid-cols-[minmax(7rem,40%)_1fr] items-center gap-3 text-sm"
              onPointerEnter={() => setHovered(row.key)}
              onPointerLeave={() => setHovered(null)}
            >
              <span className="break-words text-foreground">
                {row.icon && <span className="mr-1">{row.icon}</span>}
                {row.label}
              </span>
              <span className="flex items-center gap-2">
                <span
                  className={cn("block h-4 rounded-r-[4px] transition-opacity", hovered && hovered !== row.key ? "opacity-50" : "opacity-100")}
                  style={{ width: row.value ? `max(${width}%, 4px)` : "0", background: "var(--chart-bar)", maxWidth: "calc(100% - 3rem)" }}
                />
                <span className="tabular-nums text-muted-foreground">{numberFormat.format(row.value)}</span>
              </span>
              {hovered === row.key && (
                <span className="pointer-events-none absolute -top-8 left-[40%] z-10 rounded-md border bg-popover px-2 py-1 text-xs shadow-md">
                  <strong className="font-semibold">{numberFormat.format(row.value)}</strong>
                  {total > 0 && <span className="text-muted-foreground"> ({percentFormat.format(row.value / total)})</span>}
                  <span className="text-muted-foreground"> · {row.label}</span>
                </span>
              )}
            </li>
          )
        })}
      </ul>
      <p className="sr-only">
        {caption}: {rows.map((r) => `${r.label} ${r.value}`).join(", ")}.
      </p>
      <DataTable caption={caption} rows={rows} labelHeader={labelHeader} valueHeader={valueHeader} />
    </>
  )
}

export function ColumnChart({ rows, caption, labelHeader = t("Miesiąc"), valueHeader = t("Liczba") }) {
  const [hovered, setHovered] = useState(null)
  const max = Math.max(1, ...rows.map((r) => r.value))
  const maxRow = rows.reduce((best, r) => (r.value > (best?.value ?? -1) ? r : best), null)
  const last = rows[rows.length - 1]

  return (
    <>
      <div aria-hidden="true" className="relative">
        <div className="flex h-40 items-end gap-1 border-b" style={{ borderColor: "var(--chart-grid)" }}>
          {rows.map((row) => {
            const labelled = row.value > 0 && (row.key === maxRow?.key || row.key === last?.key)
            return (
              <div
                key={row.key}
                className="relative flex h-full flex-1 flex-col items-center justify-end"
                onPointerEnter={() => setHovered(row.key)}
                onPointerLeave={() => setHovered(null)}
              >
                {labelled && <span className="mb-1 text-xs tabular-nums text-muted-foreground">{numberFormat.format(row.value)}</span>}
                <span
                  className={cn("block w-full max-w-6 rounded-t-[4px] transition-opacity", hovered && hovered !== row.key ? "opacity-50" : "opacity-100")}
                  style={{ height: row.value ? `max(${(row.value / max) * 85}%, 4px)` : "0", background: "var(--chart-bar)" }}
                />
                {hovered === row.key && (
                  <span className="pointer-events-none absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs shadow-md">
                    <strong className="font-semibold">{numberFormat.format(row.value)}</strong>
                    <span className="text-muted-foreground"> · {row.label}</span>
                  </span>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-1 flex gap-1">
          {rows.map((row) => (
            <span key={row.key} className="flex-1 text-center text-[11px] text-muted-foreground">{row.short}</span>
          ))}
        </div>
      </div>
      <p className="sr-only">
        {caption}: {rows.map((r) => `${r.label} ${r.value}`).join(", ")}.
      </p>
      <DataTable caption={caption} rows={rows} labelHeader={labelHeader} valueHeader={valueHeader} />
    </>
  )
}

export function StatTile({ label, value, hint }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-semibold">{numberFormat.format(value ?? 0)}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
