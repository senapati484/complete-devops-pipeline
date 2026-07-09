"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react"

export type ToastVariant = "default" | "success" | "error" | "warning" | "info"

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastContextValue {
  toast: (props: Omit<Toast, "id">) => string
  dismiss: (id: string) => void
  toasts: Toast[]
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

let toastCount = 0

function generateId() {
  toastCount += 1
  return `toast-${toastCount}-${Date.now()}`
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (props: Omit<Toast, "id">) => {
      const id = generateId()
      const newToast: Toast = { id, ...props }
      setToasts((prev) => [...prev, newToast])

      const duration = props.duration ?? 5000
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration)
      }

      return id
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ toast, dismiss, toasts }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
