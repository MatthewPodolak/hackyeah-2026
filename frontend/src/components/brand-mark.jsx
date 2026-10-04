import { cn } from "@/lib/utils";

export default function BrandMark({ className }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false" className={cn("size-10 shrink-0", className)}>
      <rect width="40" height="40" rx="12" fill="var(--primary)" />
      <path d="M9 29h22" stroke="var(--primary-foreground)" strokeWidth="3" strokeLinecap="round" />
      <path d="M11 29 29 13" stroke="var(--primary-foreground)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="29" cy="13" r="3.2" fill="var(--primary-foreground)" />
    </svg>
  );
}
