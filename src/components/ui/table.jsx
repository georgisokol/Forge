import { cn } from '@/lib/utils'

function Table({ className, ...props }) {
  return (
    <div data-slot="table-container" className="w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)]">
      <table data-slot="table" className={cn('w-full caption-bottom border-collapse text-sm', className)} {...props} />
    </div>
  )
}
const TableHeader = ({ className, ...props }) => <thead className={cn('border-b border-[var(--line)] bg-[var(--panel2)]/50', className)} {...props} />
const TableBody = ({ className, ...props }) => <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
const TableRow = ({ className, ...props }) => (
  <tr className={cn('border-b border-[var(--line)] transition-colors data-[state=open]:bg-[var(--yellow-dim)]', className)} {...props} />
)
const TableHead = ({ className, ...props }) => (
  <th className={cn('h-11 px-4 text-left align-middle text-[0.7rem] font-normal uppercase tracking-[0.2em] text-[var(--muted)]', className)} {...props} />
)
const TableCell = ({ className, ...props }) => <td className={cn('px-4 py-4 align-middle text-[0.95rem]', className)} {...props} />

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
