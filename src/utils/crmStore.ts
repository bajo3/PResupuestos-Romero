import { BaseRecord, CRM_KINDS, CrmCollections, CrmKind } from '../types/crm'
import { fetchCrmRecordsFromSupabase, syncCrmRecordToSupabase } from './supabase'
import { mergeWithRemote } from './syncMerge'

const keyFor = (kind: CrmKind) => `lg.crm.${kind}.v1`
const USER_KEY = 'lg.user.v1'

// ─── Usuario actual (para el historial: quién registró / modificó) ────────────

export function getCurrentUser(): string {
  try {
    return localStorage.getItem(USER_KEY) || ''
  } catch {
    return ''
  }
}

export function setCurrentUser(name: string): void {
  try {
    localStorage.setItem(USER_KEY, name.trim())
  } catch { /* ignore */ }
}

// ─── Alerta de sobrecosto ─────────────────────────────────────────────────────

const OVERRUN_KEY = 'lg.overrunPct.v1'

/** % del presupuesto gastado a partir del cual se avisa (por defecto 80). */
export function getOverrunPct(): number {
  try {
    const n = Number(localStorage.getItem(OVERRUN_KEY))
    if (n > 0 && n <= 200) return n
  } catch { /* ignore */ }
  return 80
}

export function setOverrunPct(n: number): void {
  try {
    localStorage.setItem(OVERRUN_KEY, String(n))
  } catch { /* ignore */ }
}

// ─── Local ────────────────────────────────────────────────────────────────────

function readKind<T>(kind: CrmKind): T[] {
  try {
    const raw = localStorage.getItem(keyFor(kind))
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed as T[]
    }
  } catch { /* ignore */ }
  return []
}

export function writeKind(kind: CrmKind, list: BaseRecord[]): void {
  try {
    localStorage.setItem(keyFor(kind), JSON.stringify(list))
  } catch { /* ignore */ }
}

export function loadCrm(): CrmCollections {
  return {
    obras: readKind('obras'),
    movements: readKind('movements'),
    debts: readKind('debts'),
    stock_items: readKind('stock_items'),
    stock_moves: readKind('stock_moves'),
    warranties: readKind('warranties'),
  }
}

/** Sube un registro a Supabase (si está configurado). Fire-and-forget. */
export function pushRecord(kind: CrmKind, record: BaseRecord): void {
  syncCrmRecordToSupabase(kind, record).catch(() => { /* ignore */ })
}

/** Completa createdAt/updatedAt/createdBy/updatedBy antes de guardar. */
export function stamp<T extends BaseRecord>(record: T, isNew: boolean): T {
  const now = Date.now()
  const user = getCurrentUser() || undefined
  return {
    ...record,
    createdAt: isNew ? now : record.createdAt || now,
    createdBy: isNew ? user : record.createdBy,
    updatedAt: now,
    updatedBy: user,
  }
}

// ─── Nube ─────────────────────────────────────────────────────────────────────

/**
 * Mezcla con Supabase respetando lo archivado: gana lo más reciente; una copia local vieja
 * de algo archivado en la nube se descarta (antes se resucitaba). Lo nuevo creado sin
 * conexión se sube. Devuelve null si no hay conexión.
 */
export async function refreshCrmFromCloud(getLocal: () => CrmCollections): Promise<CrmCollections | null> {
  const rows = await fetchCrmRecordsFromSupabase().catch(() => null)
  if (!rows) return null
  const local = getLocal() // se lee después de la consulta: así no pisa lo que se cargó mientras tanto

  const merged = { ...local }
  for (const kind of CRM_KINDS) {
    const remote = rows.filter((r) => r.kind === kind)
    const { list, toPush } = mergeWithRemote(local[kind] as BaseRecord[], remote)
    toPush.forEach((rec) => pushRecord(kind, rec))
    writeKind(kind, list)
    ;(merged as Record<CrmKind, BaseRecord[]>)[kind] = list
  }
  return merged
}
