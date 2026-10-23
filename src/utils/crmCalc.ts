import { Budget, computeTotals } from '../types/budget'
import { Receipt } from '../types/receipt'
import { CrmCollections, Debt, Movement, MovementMethod, Obra, StockItem, toLocalIso } from '../types/crm'

export interface CrmData extends CrmCollections {
  budgets: Budget[]
  receipts: Receipt[]
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + (b || 0), 0)
const activeMovements = (d: CrmData) => d.movements.filter((m) => !m.voided)

// ─── Obras ────────────────────────────────────────────────────────────────────

/** Recibos que cuentan como cobro de la obra (vinculados directo o por su presupuesto). */
export function obraReceipts(obra: Obra, d: CrmData): Receipt[] {
  return d.receipts.filter(
    (r) => r.obraId === obra.id || (!r.obraId && !!obra.budgetId && r.budgetId === obra.budgetId),
  )
}

export function obraBudgetTotal(obra: Obra, d: CrmData): number {
  if (obra.budgetId) {
    const b = d.budgets.find((x) => x.id === obra.budgetId)
    if (b && b.pricingMode !== 'pending') return computeTotals(b).total
  }
  return obra.amount || 0
}

export interface MaterialUse {
  id: string
  date: string
  name: string
  qty: number
  unit: string
  cost: number
  source: 'stock' | 'compra'
}

export function obraMaterials(obra: Obra, d: CrmData): MaterialUse[] {
  const fromStock: MaterialUse[] = d.stock_moves
    .filter((s) => s.obraId === obra.id && s.qty < 0)
    .map((s) => {
      const item = d.stock_items.find((i) => i.id === s.itemId)
      return {
        id: s.id,
        date: s.date,
        name: item?.name ?? 'Material eliminado',
        qty: -s.qty,
        unit: item?.unit ?? '',
        cost: -s.qty * s.unitCost,
        source: 'stock',
      }
    })
  const bought: MaterialUse[] = activeMovements(d)
    .filter((m) => m.obraId === obra.id && m.type === 'egreso' && m.category === 'Materiales')
    .map((m) => ({
      id: m.id,
      date: m.date,
      name: m.description || 'Compra de materiales',
      qty: 0,
      unit: '',
      cost: m.amount,
      source: 'compra',
    }))
  return [...fromStock, ...bought].sort((a, b) => b.date.localeCompare(a.date))
}

export interface ObraFinance {
  total: number
  collected: number
  expenses: number
  stockMaterials: number
  pending: number
  collectedPct: number
  /** Presupuesto − gastos registrados. */
  estimatedProfit: number
  /** Cobrado − gastos: lo que efectivamente quedó hasta hoy. */
  realProfit: number
}

export function obraFinance(obra: Obra, d: CrmData): ObraFinance {
  const total = obraBudgetTotal(obra, d)
  const collected =
    sum(obraReceipts(obra, d).map((r) => r.amount)) +
    sum(activeMovements(d).filter((m) => m.obraId === obra.id && m.type === 'ingreso').map((m) => m.amount))
  const cashExpenses = sum(
    activeMovements(d).filter((m) => m.obraId === obra.id && m.type === 'egreso').map((m) => m.amount),
  )
  const stockMaterials = sum(
    d.stock_moves.filter((s) => s.obraId === obra.id && s.qty < 0).map((s) => -s.qty * s.unitCost),
  )
  const expenses = cashExpenses + stockMaterials
  return {
    total,
    collected,
    expenses,
    stockMaterials,
    pending: Math.max(0, total - collected),
    collectedPct: total > 0 ? Math.min(100, (collected / total) * 100) : 0,
    estimatedProfit: total - expenses,
    realProfit: collected - expenses,
  }
}

// ─── Caja ─────────────────────────────────────────────────────────────────────

/** Movimiento unificado para listar caja: incluye los recibos como ingresos. */
export interface CashEntry {
  id: string
  date: string
  type: 'ingreso' | 'egreso'
  category: string
  amount: number
  method: MovementMethod
  description: string
  obraId?: string
  source: 'movimiento' | 'recibo'
  voided?: boolean
  movement?: Movement
  receipt?: Receipt
}

export function cashEntries(d: CrmData): CashEntry[] {
  const fromReceipts: CashEntry[] = d.receipts.map((r) => {
    const obra = d.obras.find((o) => o.id === r.obraId || (!r.obraId && !!o.budgetId && o.budgetId === r.budgetId))
    return {
      id: 'r-' + r.id,
      date: r.date,
      type: 'ingreso',
      category: 'Cobro de obra',
      amount: r.amount,
      method: r.paymentMethod,
      description: `Recibo N° ${r.number} · ${r.client}${r.concept ? ' · ' + r.concept : ''}`,
      obraId: obra?.id,
      source: 'recibo',
      receipt: r,
    }
  })
  const fromMovements: CashEntry[] = d.movements.map((m) => ({
    id: m.id,
    date: m.date,
    type: m.type,
    category: m.category,
    amount: m.amount,
    method: m.method,
    description: m.description,
    obraId: m.obraId,
    source: 'movimiento',
    voided: m.voided,
    movement: m,
  }))
  return [...fromReceipts, ...fromMovements].sort(
    (a, b) => b.date.localeCompare(a.date) || (b.movement?.createdAt ?? b.receipt?.createdAt ?? 0) - (a.movement?.createdAt ?? a.receipt?.createdAt ?? 0),
  )
}

export interface CashSummary {
  income: number
  expense: number
  balance: number
  byMethod: Record<MovementMethod, number>
}

export function cashSummary(entries: CashEntry[]): CashSummary {
  const byMethod: Record<MovementMethod, number> = { Efectivo: 0, Transferencia: 0, Cheque: 0 }
  let income = 0
  let expense = 0
  for (const e of entries) {
    if (e.voided) continue
    const signed = e.type === 'ingreso' ? e.amount : -e.amount
    if (e.type === 'ingreso') income += e.amount
    else expense += e.amount
    byMethod[e.method] = (byMethod[e.method] ?? 0) + signed
  }
  return { income, expense, balance: income - expense, byMethod }
}

// ─── Deudas ───────────────────────────────────────────────────────────────────

export interface DebtStatus {
  paid: number
  pending: number
  overdue: boolean
  dueSoon: boolean
  payments: Movement[]
}

export function debtStatus(debt: Debt, d: CrmData): DebtStatus {
  const payments = activeMovements(d).filter((m) => m.debtId === debt.id && m.type === 'egreso')
  const paid = sum(payments.map((m) => m.amount))
  const pending = Math.max(0, debt.amount - paid)
  const days = debt.dueDate ? daysUntil(debt.dueDate) : Infinity
  return {
    paid,
    pending,
    overdue: pending > 0 && days < 0,
    dueSoon: pending > 0 && days >= 0 && days <= 7,
    payments,
  }
}

export function daysUntil(iso: string): number {
  const [y, m, dd] = iso.split('-').map(Number)
  const target = new Date(y, (m || 1) - 1, dd || 1).getTime()
  const now = new Date()
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return Math.round((target - base) / 86_400_000)
}

// ─── Stock ────────────────────────────────────────────────────────────────────

export function stockQty(item: StockItem, d: CrmData): number {
  return sum(d.stock_moves.filter((s) => s.itemId === item.id).map((s) => s.qty))
}

export function isLowStock(item: StockItem, d: CrmData): boolean {
  return item.minStock > 0 && stockQty(item, d) <= item.minStock
}

// ─── Garantías ────────────────────────────────────────────────────────────────

export function warrantyEnd(startDate: string, months: number): string {
  if (!startDate) return ''
  const [y, m, dd] = startDate.split('-').map(Number)
  return toLocalIso(new Date(y, (m || 1) - 1 + (months || 0), dd || 1))
}

// ─── Presupuestos ─────────────────────────────────────────────────────────────

/** Presupuestos que todavía no se convirtieron en obra. */
export function pendingBudgets(d: CrmData): Budget[] {
  const linked = new Set(d.obras.map((o) => o.budgetId).filter(Boolean))
  return d.budgets.filter((b) => !linked.has(b.id))
}
