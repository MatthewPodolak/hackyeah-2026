"use client"

import { useEffect, useRef } from "react"
import { cn } from "cn"

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "[tabindex]:not([tabindex='-1'])",
  "[contenteditable=true]",
].join(",")

function focusables(root) {
  return [...root.querySelectorAll(FOCUSABLE)].filter(
    (el) => !el.closest("[inert]") && el.getClientRects().length > 0
  )
}

export default function Modal({ open, onClose, labelledBy, describedBy, initialFocus, className, zIndex = "z-[2000]", children }) {
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    const previouslyFocused = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const target = (initialFocus && dialog.querySelector(initialFocus)) || dialog
    target.focus({ preventScroll: true })

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        onCloseRef.current?.()
        return
      }
      if (e.key !== "Tab") return
      const items = focusables(dialog)
      if (!items.length) {
        e.preventDefault()
        dialog.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    dialog.addEventListener("keydown", onKeyDown)
    return () => {
      dialog.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus({ preventScroll: true })
      }
    }
  }, [open, initialFocus])

  if (!open) return null

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
      className={cn("fixed inset-0 flex overflow-y-auto bg-black/50 p-4 sm:p-6", zIndex)}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={cn("m-auto w-full outline-none animate-in fade-in zoom-in-95 duration-200", className)}
      >
        {children}
      </div>
    </div>
  )
}
