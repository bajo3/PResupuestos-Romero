import { useEffect, useRef } from 'react'

/** Ejecuta `fn` al montar, cada `everyMs` y cuando la app vuelve a primer plano o a tener internet. */
export function useAutoRefresh(fn: () => void | Promise<void>, everyMs = 30_000): void {
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => {
    const run = () => { void ref.current() }
    run()
    const id = window.setInterval(() => { if (document.visibilityState === 'visible') run() }, everyMs)
    const onVisible = () => { if (document.visibilityState === 'visible') run() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', run)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', run)
    }
  }, [everyMs])
}
