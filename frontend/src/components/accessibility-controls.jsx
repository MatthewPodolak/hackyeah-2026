"use client"

import { useSyncExternalStore } from "react"
import { cn } from "cn"
import { getPrefs, getServerPrefs, setPrefs, subscribePrefs, TEXT_SCALES } from "@/lib/a11y-prefs"
import { localizeValues, t } from "@/lib/i18n";

const SCALE_LABELS = { 1: "A", 1.25: "A+", 1.5: "A++" }
const SCALE_NAMES = localizeValues({ 1: "Tekst standardowy", 1.25: "Tekst powiększony", 1.5: "Tekst duży" })

export default function AccessibilityControls() {
  const prefs = useSyncExternalStore(subscribePrefs, getPrefs, getServerPrefs)

  return (
    <div className="flex flex-col gap-3 px-2 text-sm">
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-xs font-medium text-sidebar-foreground/80">{t("Rozmiar tekstu")}</legend>
        <div className="flex gap-1">
          {TEXT_SCALES.map((scale) => (
            <label
              key={scale}
              className={cn(
                "flex min-h-9 flex-1 cursor-pointer items-center justify-center rounded-md border font-semibold has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-[var(--focus)]",
                prefs.textScale === scale ? "border-sidebar-foreground bg-sidebar-foreground text-sidebar" : "border-sidebar-foreground/45 hover:bg-sidebar-accent"
              )}
              style={{ fontSize: `${0.8 + (scale - 1) * 0.8}rem` }}
            >
              <input
                type="radio"
                name="text-scale"
                className="sr-only"
                checked={prefs.textScale === scale}
                onChange={() => setPrefs({ textScale: scale })}
              />
              <span aria-hidden="true">{SCALE_LABELS[scale]}</span>
              <span className="sr-only">{SCALE_NAMES[scale]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <button
        type="button"
        aria-pressed={prefs.contrast}
        onClick={() => setPrefs({ contrast: !prefs.contrast })}
        className={cn(
          "flex min-h-9 items-center justify-between gap-2 rounded-md border px-3 font-medium",
          prefs.contrast ? "border-sidebar-foreground bg-sidebar-foreground text-sidebar" : "border-sidebar-foreground/45 hover:bg-sidebar-accent"
        )}
      >
        {t("Wysoki kontrast")}
        <span aria-hidden="true" className="text-xs">{prefs.contrast ? t("WŁ.") : t("WYŁ.")}</span>
      </button>
    </div>
  )
}
