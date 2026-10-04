import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

export function IconTile({ icon, tone = "primary", size = "md", className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center",
        size === "lg" ? "size-12 rounded-2xl" : size === "sm" ? "size-9 rounded-xl" : "size-11 rounded-2xl",
        TONES[tone],
        className
      )}
    >
      <HugeiconsIcon icon={icon} strokeWidth={1.8} className={size === "sm" ? "size-5" : "size-6"} />
    </span>
  );
}

export const TONES = {
  primary: "bg-secondary text-secondary-foreground",
  danger: "bg-destructive/10 text-destructive",
  success: "bg-emerald-600/10 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300",
  warning: "bg-amber-500/15 text-amber-900 dark:text-amber-200",
  neutral: "bg-muted text-foreground",
};

export function PageHeader({ icon, title, description, actions, children, className }) {
  return (
    <header className={cn("mb-8 flex flex-wrap items-start justify-between gap-x-6 gap-y-4", className)}>
      <div className="flex min-w-0 flex-1 items-start gap-4">
        {icon && <IconTile icon={icon} size="lg" className="mt-0.5 hidden sm:flex" />}
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-3xl font-bold tracking-tight break-words">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-muted-foreground">{description}</p>}
          {children}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function PageContainer({ size = "md", className, children }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div
        className={cn(
          "mx-auto w-full px-4 pt-18 pb-12 md:px-8",
          { sm: "max-w-3xl", md: "max-w-5xl", lg: "max-w-6xl" }[size],
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function Section({ title, description, icon, actions, id, className, children }) {
  return (
    <section aria-labelledby={id} className={cn("rounded-2xl border border-border bg-card p-5 shadow-elevation-1 sm:p-6", className)}>
      {(title || actions) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {icon && <IconTile icon={icon} size="sm" />}
            <div className="min-w-0">
              {title && <h2 id={id} className="font-heading text-lg font-semibold tracking-tight">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
            </div>
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
