"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, InformationCircleIcon, Alert02Icon, MultiplicationSignCircleIcon, Loading03Icon } from "@hugeicons/core-free-icons"

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  const handleClick = (e) => {
    if (e.target.closest("button")) { return; }
    e.target.closest("[data-sonner-toast]") ?.querySelector("[data-close-button]") ?.click()
  }

  return (
    <div className="cursor-pointer" onClick={handleClick}>
      <Sonner
        theme={theme}
        className="toaster group"
        icons={{
          success: (
            <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-4" />
          ),
          info: (
            <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className="size-4" />
          ),
          warning: (
            <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-4" />
          ),
          error: (
            <HugeiconsIcon icon={MultiplicationSignCircleIcon} strokeWidth={2} className="size-4" />
          ),
          loading: (
            <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-4 animate-spin" />
          ),
        }}
        style={
          {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",

          "--success-bg": "var(--success)",
          "--success-text": "var(--success-foreground)",
          "--success-border": "var(--success)",

          "--error-bg": "var(--danger)",
          "--error-text": "var(--danger-foreground)",
          "--error-border": "var(--danger)",

          "--info-bg": "var(--info)",
          "--info-text": "var(--info-foreground)",
          "--info-border": "var(--info)",
          }
        }
        toastOptions={{
          classNames: {
            toast: "cn-toast cursor-pointer",
            closeButton: "hidden!",
          },
        }}
        {...props}
      />
    </div>
  );
}

export { Toaster }
