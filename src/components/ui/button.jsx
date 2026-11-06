import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex w-full cursor-pointer items-center justify-center rounded-xl border-0 font-[family-name:var(--display)] font-bold uppercase tracking-[0.14em] outline-none transition-[filter,transform] focus-visible:ring-2 focus-visible:ring-[var(--yellow)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:scale-[0.98] active:brightness-90 disabled:cursor-not-allowed disabled:opacity-30",
  {
    variants: {
      variant: {
        default: 'bg-[var(--yellow)] text-[#14110a]',
        secondary: 'border border-[var(--line)] bg-[var(--panel)] text-[var(--text)]',
        bank: 'bg-gradient-to-br from-[#d49a1c] to-[#a8741a] text-[#1a1206]',
        destructive: 'border border-[#8a2236] bg-gradient-to-br from-[#6e1423] to-[#45101b] text-[#f3dcdc]',
        muted: 'border border-[var(--line)] bg-[var(--panel2)] text-[var(--muted)]',
        outline: 'border-[1.5px] border-[var(--yellow)] bg-transparent text-[var(--yellow)]',
      },
      size: {
        default: 'p-[18px] text-[1.25rem]',
        lg: 'p-[22px] text-[1.5rem]',
        icon: 'size-10 w-10 rounded-[10px] border border-[var(--line)] bg-[var(--panel2)] p-0 text-[1.1rem] tracking-normal text-[var(--text)]',
        sm: 'w-auto px-[14px] py-[10px] text-base',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : 'button'
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export { Button, buttonVariants }
