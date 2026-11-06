import { cn } from '@/lib/utils'

function Badge({ className, ...props }) {
  return (
    <span
      data-slot="badge"
      className={cn('inline-block rounded-full bg-[var(--c)] px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-[#111]', className)}
      {...props}
    />
  )
}

export { Badge }
