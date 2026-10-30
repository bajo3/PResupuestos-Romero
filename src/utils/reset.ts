import { supabase } from './supabase'

// Reinicio compartido: un registro "meta-reset" en crm_records guarda cuándo se dejó
// el CRM en cero. Cada dispositivo, al abrir la app y ANTES de subir nada, compara esa
// fecha con la que ya aplicó; si es más nueva, borra su copia local. Así un celular con
// datos viejos no los vuelve a subir.

const RESET_KEY = 'lg.resetAt.v1'
const META_ID = 'meta-reset'
const CLOUD_TABLES = ['budgets', 'receipts', 'crm_records']

/** Borra la copia local de datos (conserva el nombre de usuario y la marca de reinicio). */
export function clearLocalData(): void {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('lg.crm.') || k.startsWith('romero.'))
      .forEach((k) => localStorage.removeItem(k))
  } catch { /* ignore */ }
}

function seenResetAt(): number {
  try {
    return Number(localStorage.getItem(RESET_KEY) || 0)
  } catch {
    return 0
  }
}

function markSeen(at: number): void {
  try {
    localStorage.setItem(RESET_KEY, String(at))
  } catch { /* ignore */ }
}

/** Se llama antes de renderizar la app. Nunca falla ni demora más de 3 s. */
export async function applyRemoteReset(): Promise<void> {
  const client = supabase
  if (!client) return
  try {
    const query = client.from('crm_records').select('data').eq('id', META_ID).maybeSingle()
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
    const res = await Promise.race([query, timeout])
    const at = Number((res?.data as { data?: { at?: number } } | null)?.data?.at ?? 0)
    if (at > seenResetAt()) {
      clearLocalData()
      markSeen(at)
    }
  } catch { /* sin conexión: se sigue con lo local */ }
}

/** Deja el CRM en cero para todos los dispositivos. Devuelve un mensaje si falla. */
export async function resetEverything(): Promise<string | null> {
  const at = Date.now()
  if (supabase) {
    for (const table of CLOUD_TABLES) {
      const { error } = await supabase.from(table).update({ archived: true, updated_at: at }).eq('archived', false)
      if (error) return `No se pudo archivar ${table}: ${error.message}`
    }
    const { error } = await supabase
      .from('crm_records')
      .upsert({ id: META_ID, kind: 'meta', data: { id: META_ID, at }, updated_at: at, archived: false })
    if (error) return `No se pudo registrar el reinicio: ${error.message}`
  }
  clearLocalData()
  markSeen(at)
  return null
}
