import { useState } from 'react'
import { useAutoRefresh } from './useAutoRefresh'

export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev'

/** Avisa cuando se publicó una versión distinta de la que está abierta. Solo en la versión publicada. */
export function useAppUpdate(): boolean {
  const [outdated, setOutdated] = useState(false)
  useAutoRefresh(async () => {
    if (!import.meta.env.PROD || outdated) return
    try {
      const r = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' })
      if (!r.ok) return
      const j = (await r.json()) as { version?: string }
      if (j.version && j.version !== APP_VERSION) setOutdated(true)
    } catch { /* sin conexión */ }
  }, 60_000)
  return outdated
}

/** Recarga trayendo la versión nueva (limpia lo guardado por el modo sin conexión). */
export async function updateNow(): Promise<void> {
  try {
    const regs = await navigator.serviceWorker?.getRegistrations()
    await Promise.all((regs ?? []).map((r) => r.update()))
    const keys = await caches.keys()
    await Promise.all(keys.map((k) => caches.delete(k)))
  } catch { /* ignore */ }
  window.location.reload()
}
