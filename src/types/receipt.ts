export type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Cheque'

export interface Receipt {
  id: string
  number: string
  date: string // ISO yyyy-mm-dd
  budgetId?: string
  budgetNumber?: string
  client: string
  address: string
  amount: number
  paymentMethod: PaymentMethod
  concept: string
  notes?: string
  createdAt: number
  updatedAt: number
  archived?: boolean
}

export function makeEmptyReceipt(): Receipt {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    number: '',
    date: new Date().toISOString().slice(0, 10),
    client: '',
    address: '',
    amount: 0,
    paymentMethod: 'Efectivo',
    concept: '',
    notes: '',
    createdAt: now,
    updatedAt: now,
  }
}
