import { BaseRecord, CRM_KINDS, CrmCollections, CrmKind } from '../types/crm'
import { fetchCrmRecordsFromSupabase, syncCrmRecordToSupabase } from './supabase'

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
 * Trae los registros de Supabase y los mezcla con los locales: por id gana el
 * de updatedAt más nuevo. Lo que solo existe local se vuelve a subir.
 * Devuelve null si Supabase no está configurado o falló.
 */
export async function refreshCrmFromCloud(local: CrmCollections): Promise<CrmCollections | null> {
  const rows = await fetchCrmRecordsFromSupabase().catch(() => null)
  if (!rows) return null

  const merged = { ...local }
  for (const kind of CRM_KINDS) {
    const remote = rows.filter((r) => r.kind === kind).map((r) => r.data as BaseRecord)
    const byId = new Map<string, BaseRecord>()
    for (const r of remote) byId.set(r.id, r)
    for (const l of local[kind] as BaseRecord[]) {
      const r = byId.get(l.id)
      if (!r || (l.updatedAt ?? 0) > (r.updatedAt ?? 0)) {
        byId.set(l.id, l)
        pushRecord(kind, l)
      }
    }
    const list = [...byId.values()].filter((r) => !r.archived)
    writeKind(kind, list)
    ;(merged as Record<CrmKind, BaseRecord[]>)[kind] = list
  }
  return merged
}
