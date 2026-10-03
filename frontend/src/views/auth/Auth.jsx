"use client"

import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/api/context/AuthContext"
import Modal from "@/components/modal"

export default function Auth() {
  const { isPanelOpen, panelMode, closePanel } = useAuth()

  return (
    <Modal open={isPanelOpen} onClose={closePanel} labelledBy="auth-heading" describedBy="auth-description" className="max-w-md" zIndex="z-[2500]">
      <LoginForm key={panelMode} initialMode={panelMode} onSuccess={closePanel} />
    </Modal>
  )
}
