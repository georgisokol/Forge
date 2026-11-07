import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { Button } from '@/components/ui/button'

function Confirm({ trigger, title, confirmLabel = 'Confirm', description = "This can't be undone.", onConfirm }) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/70" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 flex w-[calc(100%-36px)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <AlertDialog.Title className="m-0 font-[family-name:var(--display)] text-xl uppercase tracking-[0.06em]">{title}</AlertDialog.Title>
          <AlertDialog.Description className="m-0 text-sm text-[var(--muted)]">{description}</AlertDialog.Description>
          <div className="flex gap-2.5">
            <AlertDialog.Cancel asChild><Button variant="muted" size="sm" className="flex-1">Cancel</Button></AlertDialog.Cancel>
            <AlertDialog.Action asChild><Button variant="destructive" size="sm" className="flex-1" onClick={onConfirm}>{confirmLabel}</Button></AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

export { Confirm }
