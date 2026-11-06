import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

function TabsList({ className, ...props }) {
  return <TabsPrimitive.List className={cn('flex gap-1 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-1', className)} {...props} />
}

function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "flex-1 cursor-pointer rounded-lg border border-transparent bg-transparent px-3 py-2.5 font-[family-name:var(--display)] text-base uppercase tracking-[0.14em] text-[var(--muted)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--yellow)]/60 data-[state=active]:border-[var(--yellow)]/50 data-[state=active]:bg-[var(--yellow-dim)] data-[state=active]:text-[var(--yellow)]",
        className,
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger }
