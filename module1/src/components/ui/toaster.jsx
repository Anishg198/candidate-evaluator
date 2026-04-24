import { useEffect, useState } from 'react'
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './toast'
import { useAppStore } from '../../store/appStore'

export function Toaster() {
  const toasts = useAppStore((state) => state.toasts)
  const dismissToast = useAppStore((state) => state.dismissToast)
  const [openState, setOpenState] = useState({})

  useEffect(() => {
    const next = {}
    toasts.forEach((toast) => {
      next[toast.id] = true
    })
    setOpenState((current) => ({ ...current, ...next }))
  }, [toasts])

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          open={openState[toast.id] ?? true}
          onOpenChange={(open) => {
            setOpenState((current) => ({ ...current, [toast.id]: open }))
            if (!open) dismissToast(toast.id)
          }}
          variant={toast.variant === 'success' ? 'success' : toast.variant === 'error' ? 'error' : 'info'}
        >
          <div className="grid gap-1">
            <ToastTitle>{toast.title || 'Notice'}</ToastTitle>
            <ToastDescription>{toast.message}</ToastDescription>
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
