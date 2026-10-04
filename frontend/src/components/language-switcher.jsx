"use client";

import { useId } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import { LOCALES, t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function Flag({ code, className }) {
  const id = useId();
  const box = cn("block h-[15px] w-[22px] shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/10", className);
  if (code === "pl") {
    return (
      <svg viewBox="0 0 16 10" className={box} aria-hidden="true" focusable="false">
        <rect width="16" height="5" fill="#ffffff" />
        <rect y="5" width="16" height="5" fill="#dc143c" />
      </svg>
    );
  }
  if (code === "uk") {
    return (
      <svg viewBox="0 0 16 10" className={box} aria-hidden="true" focusable="false">
        <rect width="16" height="5" fill="#0057b7" />
        <rect y="5" width="16" height="5" fill="#ffd700" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 60 30" className={box} aria-hidden="true" focusable="false">
      <clipPath id={`${id}-s`}><path d="M0,0 v30 h60 v-30 z" /></clipPath>
      <clipPath id={`${id}-t`}><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" /></clipPath>
      <g clipPath={`url(#${id}-s)`}>
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#ffffff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#${id}-t)`} stroke="#c8102e" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#ffffff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" strokeWidth="6" />
      </g>
    </svg>
  );
}

export default function LanguageSwitcher({ className }) {
  const { locale, setLocale } = useLanguage();
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("Język strony: {language}. Zmień język", { language: current.label })}
        title={t("Zmień język")}
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "h-11 cursor-pointer gap-2 border border-border bg-card px-3 text-foreground shadow-elevation-2 hover:bg-muted",
          className
        )}
      >
        <Flag code={current.code} />
        <span className="text-sm font-semibold">{current.short}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} positionerClassName="z-[1500]" className="w-52">
        <DropdownMenuRadioGroup value={locale} onValueChange={(value) => value !== locale && setLocale(value)}>
          {LOCALES.map((l) => (
            <DropdownMenuRadioItem key={l.code} value={l.code} lang={l.code} className="min-h-11 gap-3 text-sm">
              <Flag code={l.code} />
              {l.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
