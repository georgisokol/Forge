import { cn } from '@/lib/utils'

function Card({ className, ...props }) {
  return <div data-slot="card" className={cn('rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4', className)} {...props} />
}

export { Card }
