// ─── Tipos del CRM ────────────────────────────────────────────────────────────
// Regla central: cada operación de dinero se registra UNA sola vez.
// - Cobros: recibos (Receipt) o movimientos de ingreso.
// - Gastos: movimientos de egreso (con obraId si son de una obra, con debtId si pagan una deuda).
// - Materiales de stock usados en una obra: StockMove negativo con obraId (no mueve caja,
//   la plata ya salió cuando se compró el stock).
// Todo lo demás (saldo de obra, caja, deudas pendientes, stock) se calcula a partir de eso.

export interface BaseRecord {
  id: string
  createdAt: number
  updatedAt: number
  createdBy?: string
  updatedBy?: string
  archived?: boolean
}

export type ObraStatus = 'presupuestada' | 'en_ejecucion' | 'finalizada' | 'cancelada'

export const OBRA_STATUS_LABEL: Record<ObraStatus, string> = {
  presupuestada: 'Presupuestada',
  en_ejecucion: 'En ejecución',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
}

export interface Obra extends BaseRecord {
  name: string
  client: string
  address: string
  budgetId?: string
  /** Total manual; se usa solo si la obra no está vinculada a un presupuesto. */
  amount: number
  status: ObraStatus
  startDate: string
  endDate: string
  notes: string
}

export type MovementType = 'ingreso' | 'egreso'
export type MovementMethod = 'Efectivo' | 'Transferencia' | 'Cheque'

export const EXPENSE_CATEGORIES = [
  'Materiales',
  'Mano de obra',
  'Combustible / traslados',
  'Herramientas',
  'Alquileres',
  'Impuestos',
  'Pago de deuda',
  'Sueldos',
  'Gastos generales',
  'Otros',
]

export const INCOME_CATEGORIES = ['Cobro de obra', 'Aporte de capital', 'Otros ingresos']

export interface Movement extends BaseRecord {
  date: string
  type: MovementType
  category: string
  amount: number
  method: MovementMethod
  description: string
  obraId?: string
  debtId?: string
  stockMoveId?: string
  voided?: boolean
  voidedAt?: number
  voidedBy?: string
  voidReason?: string
}

export interface Debt extends BaseRecord {
  creditor: string
  description: string
  amount: number
  dueDate: string
  obraId?: string
}

export interface StockItem extends BaseRecord {
  name: string
  unit: string
  minStock: number
  unitCost: number
}

export interface StockMove extends BaseRecord {
  itemId: string
  date: string
  /** Positivo = entrada (compra), negativo = salida (uso en obra / ajuste). */
  qty: number
  unitCost: number
  obraId?: string
  note: string
}

export interface Warranty extends BaseRecord {
  number: string
  obraId?: string
  client: string
  address: string
  work: string
  startDate: string
  months: number
  coverage: string
  exclusions: string
}

export type CrmKind = 'obras' | 'movements' | 'debts' | 'stock_items' | 'stock_moves' | 'warranties'

export interface CrmCollections {
  obras: Obra[]
  movements: Movement[]
  debts: Debt[]
  stock_items: StockItem[]
  stock_moves: StockMove[]
  warranties: Warranty[]
}

export const CRM_KINDS: CrmKind[] = ['obras', 'movements', 'debts', 'stock_items', 'stock_moves', 'warranties']

/** Fecha local yyyy-mm-dd (toISOString usa UTC y a la noche da el día siguiente). */
export function toLocalIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function today(): string {
  return toLocalIso(new Date())
}

export function newId(): string {
  return crypto.randomUUID()
}

export const DEFAULT_WARRANTY_COVERAGE =
  'Filtraciones y desprendimientos del sistema de impermeabilización aplicado, en la superficie trabajada, derivados de defectos de material o de mano de obra.'

export const DEFAULT_WARRANTY_EXCLUSIONS =
  'Daños por golpes, perforaciones, intervenciones de terceros, falta de mantenimiento periódico, movimientos estructurales, fenómenos climáticos extraordinarios o modificaciones posteriores a la entrega.'
