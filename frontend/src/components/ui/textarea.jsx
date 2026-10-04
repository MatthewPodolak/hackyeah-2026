"use client"

import * as React from "react"
import { cn } from "cn"
import { SpeechButton } from "@/components/speech-button"
import { useSpeechSupported } from "@/hooks/useSpeechToText"

// speech: 🎤 dictation button (on by default; the button hides itself where the browser can't dictate)
function Textarea({
  className,
  speech = true,
  ref,
  ...props
}) {
  const fieldRef = React.useRef(null)
  const supported = useSpeechSupported()

  const setRef = (node) => {
    fieldRef.current = node
    if (typeof ref === "function") ref(node)
    else if (ref) ref.current = node
  }

  const textarea = (
    <textarea
      ref={setRef}
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full resize-none rounded-lg border border-outline bg-card px-3.5 py-3 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        speech && supported && "pr-11",
        className
      )}
      {...props}
    />
  )

  if (!speech) return textarea

  return (
    <div className="relative w-full">
      {textarea}
      <SpeechButton target={fieldRef} disabled={props.disabled} className="bottom-1.5" />
    </div>
  )
}

export { Textarea }
