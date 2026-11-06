import { cn } from '@/lib/utils'

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'w-full rounded-xl border border-[var(--line)] bg-[var(--panel2)] p-4 text-[1.05rem] text-[var(--text)] outline-none focus:border-[var(--yellow)]',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
