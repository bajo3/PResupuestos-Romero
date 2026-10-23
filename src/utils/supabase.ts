import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface ClientRecord {
  id: string
  name: string
  address: string
  property_type: string
  phone?: string
  notes?: string
  updated_at: number
}

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null

export async function syncBudgetToSupabase(data: object, id: string, archived = false): Promise<void> {
  if (!supabase) return
  await supabase.from('budgets').upsert({ id, data, updated_at: Date.now(), archived })
}

export async function syncClientToSupabase(client: ClientRecord): Promise<void> {
  if (!supabase) return
  await supabase.from('clients').upsert(client)
}

export async function fetchClientsFromSupabase(): Promise<ClientRecord[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('clients')
    .select('*')
    .order('name')
  return (data as ClientRecord[]) ?? []
}

export async function fetchBudgetsFromSupabase(): Promise<object[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('budgets')
    .select('data')
    .eq('archived', false)
    .order('updated_at', { ascending: false })
  return data?.map((r: { data: object }) => r.data) ?? []
}

/** Incrementa el contador en Supabase y devuelve el número formateado "001", "002"... */
export async function nextBudgetNumberFromSupabase(): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('increment_budget_sequence')
  if (error || data == null) return null
  return String(data as number).padStart(3, '0')
}

// ─── Recibos ──────────────────────────────────────────────────────────────────

export async function syncReceiptToSupabase(data: object, id: string, archived = false): Promise<void> {
  if (!supabase) return
  await supabase.from('receipts').upsert({ id, data, updated_at: Date.now(), archived })
}

export async function fetchReceiptsFromSupabase(): Promise<object[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('receipts')
    .select('data')
    .eq('archived', false)
    .order('updated_at', { ascending: false })
  return data?.map((r: { data: object }) => r.data) ?? []
}

export async function nextReceiptNumberFromSupabase(): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('increment_receipt_sequence')
  if (error || data == null) return null
  return String(data as number).padStart(3, '0')
}

// ─── CRM (obras, caja, deudas, stock, garantías) ─────────────────────────────

export async function syncCrmRecordToSupabase(
  kind: string,
  record: { id: string; updatedAt: number; archived?: boolean },
): Promise<void> {
  if (!supabase) return
  await supabase.from('crm_records').upsert({
    id: record.id,
    kind,
    data: record,
    updated_at: record.updatedAt,
    archived: record.archived ?? false,
  })
}

export async function fetchCrmRecordsFromSupabase(): Promise<{ kind: string; data: object }[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('crm_records')
    .select('kind, data')
    .eq('archived', false)
    .order('updated_at', { ascending: false })
  if (error) return null
  return (data as { kind: string; data: object }[]) ?? []
}
