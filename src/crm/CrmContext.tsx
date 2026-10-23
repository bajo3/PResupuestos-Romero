import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Budget } from '../types/budget'
import { Receipt } from '../types/receipt'
import { BaseRecord, CrmCollections, CrmKind, Movement, Obra } from '../types/crm'
import { CrmData } from '../utils/crmCalc'
import { loadCrm, pushRecord, refreshCrmFromCloud, stamp, writeKind, getCurrentUser } from '../utils/crmStore'
import { loadClients, refreshClientsFromCloud, upsertClient } from '../utils/storage'
import type { ClientRecord } from '../utils/supabase'

/** Acciones de documentos (presupuestos / recibos) que viven en App. */
export interface DocActions {
  newBudget: () => void
  viewBudget: (id: string) => void
  newReceipt: (preset?: Partial<Receipt>) => void
  viewReceipt: (id: string) => void
}

interface CrmContextValue {
  data: CrmData
  clients: ClientRecord[]
  save: <K extends CrmKind>(kind: K, record: CrmCollections[K][number]) => void
  remove: (kind: CrmKind, id: string) => void
  voidMovement: (m: Movement, reason: string) => void
  saveClient: (c: ClientRecord) => void
  reloadClients: () => void
  navigate: (route: string) => void
  docs: DocActions
  obraById: (id?: string) => Obra | undefined
}

const Ctx = createContext<CrmContextValue | null>(null)

interface Props {
  budgets: Budget[]
  receipts: Receipt[]
  navigate: (route: string) => void
  docs: DocActions
  children: ReactNode
}

export function CrmProvider({ budgets, receipts, navigate, docs, children }: Props) {
  const [crm, setCrm] = useState<CrmCollections>(() => loadCrm())
  const [clients, setClients] = useState<ClientRecord[]>(() => loadClients())

  useEffect(() => {
    refreshCrmFromCloud(loadCrm()).then((merged) => { if (merged) setCrm(merged) })
    refreshClientsFromCloud().then(setClients)
  }, [])

  const save = useCallback(<K extends CrmKind>(kind: K, record: CrmCollections[K][number]) => {
    setCrm((prev) => {
      const list = prev[kind] as BaseRecord[]
      const isNew = !list.some((x) => x.id === record.id)
      const stamped = stamp(record as BaseRecord, isNew)
      const next = isNew ? [stamped, ...list] : list.map((x) => (x.id === stamped.id ? stamped : x))
      writeKind(kind, next)
      pushRecord(kind, stamped)
      return { ...prev, [kind]: next }
    })
  }, [])

  const remove = useCallback((kind: CrmKind, id: string) => {
    setCrm((prev) => {
      const list = prev[kind] as BaseRecord[]
      const target = list.find((x) => x.id === id)
      if (!target) return prev
      pushRecord(kind, stamp({ ...target, archived: true }, false))
      const next = list.filter((x) => x.id !== id)
      writeKind(kind, next)
      return { ...prev, [kind]: next }
    })
  }, [])

  const voidMovement = useCallback((m: Movement, reason: string) => {
    save('movements', {
      ...m,
      voided: true,
      voidedAt: Date.now(),
      voidedBy: getCurrentUser() || undefined,
      voidReason: reason,
    })
  }, [save])

  const saveClient = useCallback((c: ClientRecord) => {
    upsertClient({ ...c, updated_at: Date.now() })
    setClients(loadClients())
  }, [])

  const reloadClients = useCallback(() => setClients(loadClients()), [])

  const data = useMemo<CrmData>(() => ({ ...crm, budgets, receipts }), [crm, budgets, receipts])
  const obraById = useCallback((id?: string) => (id ? crm.obras.find((o) => o.id === id) : undefined), [crm.obras])

  const value = useMemo(
    () => ({ data, clients, save, remove, voidMovement, saveClient, reloadClients, navigate, docs, obraById }),
    [data, clients, save, remove, voidMovement, saveClient, reloadClients, navigate, docs, obraById],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCrm(): CrmContextValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useCrm fuera de CrmProvider')
  return v
}
