import { useEffect, useState } from 'react'

// Cotización del dólar blue (Argentina). Se consulta dolarapi.com y, si falla,
// bluelytics. Se guarda la última en el dispositivo para usarla sin conexión.

export interface BlueRate {
  venta: number
  compra: number
  /** Fecha de la cotización (ISO). */
  at: string
}

const KEY = 'lg.blue.v1'
const MAX_AGE_MS = 10 * 60 * 1000

export function cachedBlue(): (BlueRate & { fetchedAt: number }) | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

async function fromDolarApi(): Promise<BlueRate> {
  const r = await fetch('https://dolarapi.com/v1/dolares/blue')
  if (!r.ok) throw new Error('dolarapi ' + r.status)
  const j = await r.json()
  if (!(j.venta > 0)) throw new Error('dolarapi sin venta')
  return { venta: Number(j.venta), compra: Number(j.compra) || Number(j.venta), at: j.fechaActualizacion ?? new Date().toISOString() }
}

async function fromBluelytics(): Promise<BlueRate> {
  const r = await fetch('https://api.bluelytics.com.ar/v2/latest')
  if (!r.ok) throw new Error('bluelytics ' + r.status)
  const j = await r.json()
  const b = j.blue
  if (!(b?.value_sell > 0)) throw new Error('bluelytics sin venta')
  return { venta: Number(b.value_sell), compra: Number(b.value_buy) || Number(b.value_sell), at: j.last_update ?? new Date().toISOString() }
}

export async function fetchBlue(): Promise<BlueRate | null> {
  let rate: BlueRate | null = null
  try {
    rate = await fromDolarApi()
  } catch {
    try { rate = await fromBluelytics() } catch { rate = null }
  }
  if (rate) {
    try { localStorage.setItem(KEY, JSON.stringify({ ...rate, fetchedAt: Date.now() })) } catch { /* ignore */ }
  }
  return rate
}

/** Cotización blue (venta). Usa la guardada y la refresca en segundo plano. */
export function useBlueRate(): BlueRate | null {
  const [rate, setRate] = useState<BlueRate | null>(() => cachedBlue())
  useEffect(() => {
    const c = cachedBlue()
    if (c && Date.now() - c.fetchedAt < MAX_AGE_MS) return
    let alive = true
    void fetchBlue().then((r) => { if (alive && r) setRate(r) })
    return () => { alive = false }
  }, [])
  return rate
}
