"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Mic01Icon, MicOff01Icon } from "@hugeicons/core-free-icons"
import { cn } from "cn"
import { useToast } from "@/helpers/ToastProvider"
import { appendDictation, useSpeechToText } from "@/hooks/useSpeechToText"

const TOOLTIP = "Dyktowanie: mowę zamienia na tekst przeglądarka (Google/Microsoft)"

// 🎤 for the field in `target` (a ref to an <input> or <textarea>); renders nothing where the browser can't dictate
export function SpeechButton({ target, disabled, className }) {
  const { showToast } = useToast()
  const speech = useSpeechToText({
    onText: (text) => (target.current ? appendDictation(target.current, text) : false),
    onError: (message) => showToast(message, "error"),
  })

  if (!speech.supported) return null

  return (
    <div className={cn("absolute right-1.5 flex items-center gap-1.5", className)}>
      <span aria-live="polite" className={cn("rounded bg-background/90 px-1 text-xs font-medium text-red-700 dark:text-red-400", !speech.listening && "sr-only")}>
        {speech.listening ? "Słucham…" : speech.status === "ended" ? "Dyktowanie zakończone" : ""}
      </span>
      <button
        type="button"
        aria-pressed={speech.listening}
        aria-label={speech.listening ? "Zatrzymaj dyktowanie" : "Dyktuj tekst"}
        title={TOOLTIP}
        disabled={disabled}
        onClick={speech.toggle}
        className={cn(
          "flex size-7 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
          speech.listening ? "bg-red-600 text-white hover:bg-red-700" : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <HugeiconsIcon icon={speech.listening ? MicOff01Icon : Mic01Icon} strokeWidth={2} className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
