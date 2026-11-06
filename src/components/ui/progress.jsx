import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

function Progress({ className, value, ...props }) {
  return (
    <ProgressPrimitive.Root value={value} className={cn('relative h-3 flex-1 overflow-hidden rounded-full bg-[var(--panel2)]', className)} {...props}>
      <ProgressPrimitive.Indicator className="h-full rounded-full bg-[var(--yellow)]" style={{ width: `${Math.max(value, 6)}%` }} />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
