"use client"

import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/api/context/AuthContext"

export default function Auth() {
  const { isPanelOpen, panelMode, closePanel } = useAuth()
  if (!isPanelOpen) { return null }

    return (
        <div onClick={(e) => { if (e.target === e.currentTarget) closePanel()}} className="fixed inset-0 z-50 flex overflow-y-auto bg-black/40 p-6">
            <div className="m-auto w-full max-w-md">
                <LoginForm key={panelMode} initialMode={panelMode} onSuccess={closePanel} />
            </div>
        </div>
    )
}