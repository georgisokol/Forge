import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const itemVariants = cva(
  'cursor-pointer border bg-[var(--panel2)] text-[var(--muted)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--yellow)]/60 data-[state=on]:border-[var(--yellow)] data-[state=on]:bg-[var(--yellow-dim)] data-[state=on]:text-[var(--yellow)] border-[var(--line)]',
  {
    variants: {
      size: {
        lg: 'rounded-xl py-5 text-[1.7rem] font-bold',
        sm: 'rounded-full px-3 py-1.5 text-[0.8rem]',
      },
    },
    defaultVariants: { size: 'lg' },
  },
)

function ToggleGroup({ className, ...props }) {
  return <ToggleGroupPrimitive.Root className={className} {...props} />
}

function ToggleGroupItem({ className, size, ...props }) {
  return <ToggleGroupPrimitive.Item className={cn(itemVariants({ size }), className)} {...props} />
}

export { ToggleGroup, ToggleGroupItem }
