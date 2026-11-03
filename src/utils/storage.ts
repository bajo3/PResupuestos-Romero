import { Budget } from '../types/budget'
import { Receipt } from '../types/receipt'
import { mergeWithRemote } from './syncMerge'
import {
  syncBudgetToSupabase,
  syncClientToSupabase,
  fetchBudgetsFromSupabase,
  fetchClientsFromSupabase,
  nextBudgetNumberFromSupabase,
  syncReceiptToSupabase,
  fetchReceiptsFromSupabase,
  nextReceiptNumberFromSupabase,
  ClientRecord,
} from './supabase'

const KEY = 'romero.budgets.v1'
const SEQ_KEY = 'romero.budget.seq.v1'
const CLIENTS_KEY = 'romero.clients.v1'
const RECEIPTS_KEY = 'romero.receipts.v1'
const RECEIPT_SEQ_KEY = 'romero.receipt.seq.v1'

// ─── Numeración correlativa ───────────────────────────────────────────────────

/** Incrementa local siempre; intenta Supabase async y actualiza si tiene éxito */
export function nextBudgetNumber(): string {
  const current = parseInt(localStorage.getItem(SEQ_KEY) || '0', 10)
  const next = current + 1
  localStorage.setItem(SEQ_KEY, String(next))
  return String(next).padStart(3, '0')
}

/** Versión async: usa Supabase como fuente de verdad, fallback a localStorage */
export async function nextBudgetNumberAsync(): Promise<string> {
  try {
    const remote = await nextBudgetNumberFromSupabase()
    if (remote) {
      // Sincroniza también el contador local para que no se desincronicen
      localStorage.setItem(SEQ_KEY, String(parseInt(remote, 10)))
      return remote
    }
  } catch { /* fallback */ }
  return nextBudgetNumber()
}

// ─── Clientes ─────────────────────────────────────────────────────────────────

function readLocalClients(): ClientRecord[] {
  try {
    const raw = localStorage.getItem(CLIENTS_KEY)
    if (raw) return JSON.parse(raw) as ClientRecord[]
  } catch { /* ignore */ }
  return []
}

function writeLocalClients(list: ClientRecord[]): void {
  try {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(list))
  } catch { /* ignore */ }
}

export function upsertClient(c: ClientRecord): void {
  const list = readLocalClients()
  const idx = list.findIndex((x) => x.id === c.id)
  if (idx === -1) list.unshift(c)
  else list[idx] = c
  writeLocalClients(list)
  syncClientToSupabase(c).catch(() => { /* fire-and-forget */ })
}

export function loadClients(): ClientRecord[] {
  return readLocalClients()
}

export async function refreshClientsFromCloud(): Promise<ClientRecord[]> {
  try {
    const remote = await fetchClientsFromSupabase()
    if (remote.length > 0) {
      writeLocalClients(remote)
      return remote
    }
  } catch { /* ignore */ }
  return readLocalClients()
}

// ─── Presupuestos ─────────────────────────────────────────────────────────────

export function loadBudgets(): Budget[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Budget>[]
      if (Array.isArray(parsed))
        return parsed.map((b) => ({
          fixedPrice: 0,
          pricingMode: 'per_m2' as const,
          ...b,
        } as Budget))
    }
  } catch { /* ignore */ }
  return []
}

/** Lo último que se subió de cada presupuesto/recibo: solo se sube lo que cambió desde entonces. */
const pushedBudgets = new Map<string, number>()
const pushedReceipts = new Map<string, number>()
let budgetsSynced = false
let receiptsSynced = false

export function saveBudgets(list: Budget[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch { /* ignore */ }
  if (!budgetsSynced) return // antes de comparar con la nube no se sube nada
  list.forEach((b) => {
    const t = b.updatedAt ?? 0
    if ((pushedBudgets.get(b.id) ?? -1) >= t) return
    pushedBudgets.set(b.id, t)
    syncBudgetToSupabase(b, b.id, b.archived ?? false, t).catch(() => pushedBudgets.delete(b.id))
  })
}

/** Archiva un presupuesto: lo marca como archived en localStorage y Supabase */
export function archiveBudget(id: string, budgets: Budget[]): Budget[] {
  const updated = budgets.map((b) =>
    b.id === id ? { ...b, archived: true, updatedAt: Date.now() } : b
  )
  // Guardar en localStorage sin el archivado (filtrado para la vista)
  const active = updated.filter((b) => !b.archived)
  try {
    localStorage.setItem(KEY, JSON.stringify(active))
  } catch { /* ignore */ }
  // Sync el archivado a Supabase marcando archived=true
  const target = updated.find((b) => b.id === id)
  if (target) syncBudgetToSupabase(target, target.id, true).catch(() => { /* ignore */ })
  return active
}

/** Mezcla con la nube (respetando lo archivado). Devuelve la lista nueva o null si no hubo conexión. */
export async function refreshBudgetsFromCloud(): Promise<Budget[] | null> {
  try {
    const rows = await fetchBudgetsFromSupabase()
    if (!rows) return null
    const { list, toPush, known } = mergeWithRemote<Budget>(loadBudgets(), rows)
    known.forEach((t, id) => pushedBudgets.set(id, t))
    budgetsSynced = true
    localStorage.setItem(KEY, JSON.stringify(list))
    toPush.forEach((b) => {
      const t = b.updatedAt ?? 0
      pushedBudgets.set(b.id, t)
      syncBudgetToSupabase(b, b.id, false, t).catch(() => pushedBudgets.delete(b.id))
    })
    return list
  } catch { /* ignore */ }
  return null
}

// ─── Recibos ─────────────────────────────────────────────────────────────────

export function nextReceiptNumber(): string {
  const current = parseInt(localStorage.getItem(RECEIPT_SEQ_KEY) || '0', 10)
  const next = current + 1
  localStorage.setItem(RECEIPT_SEQ_KEY, String(next))
  return String(next).padStart(3, '0')
}

export async function nextReceiptNumberAsync(): Promise<string> {
  try {
    const remote = await nextReceiptNumberFromSupabase()
    if (remote) {
      localStorage.setItem(RECEIPT_SEQ_KEY, String(parseInt(remote, 10)))
      return remote
    }
  } catch { /* fallback */ }
  return nextReceiptNumber()
}

export function loadReceipts(): Receipt[] {
  try {
    const raw = localStorage.getItem(RECEIPTS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Receipt[]
      if (Array.isArray(parsed)) return parsed
    }
  } catch { /* ignore */ }
  return []
}

export function saveReceipts(list: Receipt[]): void {
  try {
    localStorage.setItem(RECEIPTS_KEY, JSON.stringify(list))
  } catch { /* ignore */ }
  if (!receiptsSynced) return
  list.forEach((r) => {
    const t = r.updatedAt ?? 0
    if ((pushedReceipts.get(r.id) ?? -1) >= t) return
    pushedReceipts.set(r.id, t)
    syncReceiptToSupabase(r, r.id, r.archived ?? false, t).catch(() => pushedReceipts.delete(r.id))
  })
}

export function archiveReceipt(id: string, receipts: Receipt[]): Receipt[] {
  const updated = receipts.map((r) =>
    r.id === id ? { ...r, archived: true, updatedAt: Date.now() } : r
  )
  const active = updated.filter((r) => !r.archived)
  try {
    localStorage.setItem(RECEIPTS_KEY, JSON.stringify(active))
  } catch { /* ignore */ }
  const target = updated.find((r) => r.id === id)
  if (target) syncReceiptToSupabase(target, target.id, true).catch(() => { /* ignore */ })
  return active
}

export async function refreshReceiptsFromCloud(): Promise<Receipt[] | null> {
  try {
    const rows = await fetchReceiptsFromSupabase()
    if (!rows) return null
    const { list, toPush, known } = mergeWithRemote<Receipt>(loadReceipts(), rows)
    known.forEach((t, id) => pushedReceipts.set(id, t))
    receiptsSynced = true
    localStorage.setItem(RECEIPTS_KEY, JSON.stringify(list))
    toPush.forEach((r) => {
      const t = r.updatedAt ?? 0
      pushedReceipts.set(r.id, t)
      syncReceiptToSupabase(r, r.id, false, t).catch(() => pushedReceipts.delete(r.id))
    })
    return list
  } catch { /* ignore */ }
  return null
}
