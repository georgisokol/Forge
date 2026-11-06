import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-block rounded-full text-xs uppercase', {
  variants: {
    variant: {
      default: 'bg-[var(--c)] px-3 py-1 font-bold tracking-[0.08em] text-[#111]',
      outline: 'border border-[var(--line)] px-3.5 py-1.5 text-[0.72rem] tracking-[0.2em] text-[var(--muted)]',
    },
  },
  defaultVariants: { variant: 'default' },
})

function Badge({ className, variant, ...props }) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge }
