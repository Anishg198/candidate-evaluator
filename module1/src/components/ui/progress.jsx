import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '../../lib/utils'

function Progress({ className, value = 0, indicatorClassName, ...props }) {
  const safeValue = Math.max(0, Math.min(100, value))
  return (
    <ProgressPrimitive.Root
      className={cn('relative h-3 w-full overflow-hidden rounded-full bg-slate-100', className)}
      value={safeValue}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn('h-full w-full flex-1 bg-slate-900 transition-all', indicatorClassName)}
        style={{ transform: `translateX(-${100 - safeValue}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
