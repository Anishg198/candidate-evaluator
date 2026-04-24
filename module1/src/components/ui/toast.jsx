import * as React from 'react'
import * as ToastPrimitives from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef(function ToastViewport({ className, ...props }, ref) {
  return (
    <ToastPrimitives.Viewport
      ref={ref}
      className={cn('fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]', className)}
      {...props}
    />
  )
})

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-start justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all bg-white',
  {
    variants: {
      variant: {
        default: 'border-slate-200',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
        error: 'border-rose-200 bg-rose-50 text-rose-950',
        info: 'border-sky-200 bg-sky-50 text-sky-950'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

const Toast = React.forwardRef(function Toast({ className, variant, ...props }, ref) {
  return <ToastPrimitives.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />
})

const ToastTitle = React.forwardRef(function ToastTitle({ className, ...props }, ref) {
  return <ToastPrimitives.Title ref={ref} className={cn('text-sm font-semibold', className)} {...props} />
})

const ToastDescription = React.forwardRef(function ToastDescription({ className, ...props }, ref) {
  return <ToastPrimitives.Description ref={ref} className={cn('text-sm opacity-90', className)} {...props} />
})

const ToastClose = React.forwardRef(function ToastClose({ className, ...props }, ref) {
  return (
    <ToastPrimitives.Close
      ref={ref}
      className={cn('absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100', className)}
      toast-close=""
      {...props}
    >
      <X className="h-4 w-4" />
    </ToastPrimitives.Close>
  )
})

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose
}
