import { useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/button'

const CHECK_EVERY_MS = 30 * 60 * 1000

// Shows when a new version is downloading and offers a one-tap restart once it is ready.
export default function UpdateBanner() {
  const [downloading, setDownloading] = useState(false)
  const { needRefresh: [ready], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (!reg) return
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing
        if (!worker) return
        setDownloading(true)
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' || worker.state === 'redundant') setDownloading(false)
        })
      })
      const check = () => reg.update().catch(() => {})
      setInterval(check, CHECK_EVERY_MS)
      document.addEventListener('visibilitychange', () => { if (!document.hidden) check() })
    },
  })

  if (!ready && !downloading) return null
  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex justify-center p-3" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
      <div className="flex w-full max-w-md items-center justify-between gap-3 rounded-2xl border border-[var(--yellow)] bg-[var(--panel)] px-4 py-3 shadow-lg">
        <span className="text-sm">{ready ? 'New version ready' : 'Downloading update…'}</span>
        {ready && <Button size="sm" onClick={() => updateServiceWorker(true)}>Restart</Button>}
      </div>
    </div>
  )
}
