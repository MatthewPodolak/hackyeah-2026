"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

export function DialogPanel({ className, children, ...props }) {
  return (
    <div
      className={cn("flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-elevation-3 sm:max-h-[calc(100dvh-3rem)]", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogHeader({ icon, tone = "primary", eyebrow, title, titleId, titleRef, titleTag: Title = "h2", description, descriptionId, onClose, closeLabel = t("Zamknij okno"), children }) {
  return (
    <div className="flex shrink-0 items-start gap-4 px-6 pt-6 pb-4">
      {icon && <IconTile icon={icon} tone={tone} />}
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{eyebrow}</p>}
        <Title id={titleId} ref={titleRef} tabIndex={titleRef ? -1 : undefined} className="font-heading text-xl font-bold tracking-tight break-words outline-none">
          {title}
        </Title>
        {description && (
          <div id={descriptionId} className="mt-1 text-sm text-muted-foreground">
            {description}
          </div>
        )}
        {children}
      </div>
      {onClose && (
        <Button variant="ghost" size="icon" className="-mt-1 -mr-2 shrink-0" onClick={onClose} aria-label={closeLabel}>
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-5" />
        </Button>
      )}
    </div>
  );
}

export function DialogBody({ className, children }) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto px-6 pb-6", className)}>{children}</div>;
}

export function DialogFooter({ className, children }) {
  return (
    <div className={cn("flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-card px-6 py-4 sm:flex-row sm:items-center sm:justify-end", className)}>
      {children}
    </div>
  );
}

export function FormStep({ number, title, description, className, children }) {
  return (
    <fieldset className={cn("min-w-0 border-t border-border pt-6 first:border-t-0 first:pt-0", className)}>
      <legend className="float-left mb-4 flex w-full items-center gap-3">
        {number != null && (
          <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
            {number}
          </span>
        )}
        <span className="min-w-0">
          <span className="block font-heading text-base font-semibold tracking-tight">{title}</span>
          {description && <span className="block text-sm text-muted-foreground">{description}</span>}
        </span>
      </legend>
      <div className="clear-both flex flex-col gap-5">{children}</div>
    </fieldset>
  );
}
