import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const alertVariants = cva('relative w-full rounded-lg border p-4', {
  variants: {
    variant: {
      default: 'border-slate-200 bg-white text-slate-950',
      destructive: 'border-rose-200 bg-rose-50 text-rose-950',
      success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
      info: 'border-sky-200 bg-sky-50 text-sky-950',
      warning: 'border-amber-200 bg-amber-50 text-amber-950'
    }
  },
  defaultVariants: {
    variant: 'default'
  }
})

function Alert({ className, variant, ...props }) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}

function AlertTitle({ className, ...props }) {
  return <h5 className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props} />
}

function AlertDescription({ className, ...props }) {
  return <div className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
}

export { Alert, AlertTitle, AlertDescription }
