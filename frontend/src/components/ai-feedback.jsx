import { HugeiconsIcon } from "@hugeicons/react"
import { SparklesIcon } from "@hugeicons/core-free-icons"

export default function AiFeedback({ feedback }) {
  if (!feedback) return null

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border p-4 text-sm">
      <p className="flex items-center gap-1.5 font-semibold">
        <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-4 text-emerald-700 dark:text-emerald-400" />
        Ocena AI
      </p>
      {feedback.strengths?.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-800 dark:text-emerald-300">Mocne strony</p>
          <ul className="list-disc pl-5">{feedback.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
      )}
      {feedback.improvements?.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-amber-800 dark:text-amber-300">Do poprawy</p>
          <ul className="list-disc pl-5">{feedback.improvements.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
      )}
      {feedback.readinessAssessment && (
        <p><span className="font-medium">Gotowość do wdrożenia:</span> {feedback.readinessAssessment}</p>
      )}
      {feedback.nextStep && (
        <p className="rounded-lg bg-emerald-500/10 p-2.5"><span className="font-medium">Następny krok:</span> {feedback.nextStep}</p>
      )}
    </div>
  )
}
