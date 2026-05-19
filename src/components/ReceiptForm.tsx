import { useRef, useState } from 'react'
import { Receipt, PaymentMethod, makeEmptyReceipt } from '../types/receipt'
import { Budget, computeTotals } from '../types/budget'
import { MoneyInput } from './MoneyInput'
import { formatMoney } from '../utils/money'
import { loadClients } from '../utils/storage'
import type { ClientRecord } from '../utils/supabase'

interface Props {
  initial: Receipt
  budgets: Budget[]
  onCancel: () => void
  onSave: (r: Receipt) => void
}

const PAYMENT_METHODS: PaymentMethod[] = ['Efectivo', 'Transferencia', 'Cheque']

export function ReceiptForm({ initial, budgets, onCancel, onSave }: Props) {
  const [r, setR] = useState<Receipt>({ ...initial })
  const [clientSuggestions, setClientSuggestions] = useState<ClientRecord[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const set = <K extends keyof Receipt>(k: K, v: Receipt[K]) => setR((p) => ({ ...p, [k]: v }))

  const handleClientInput = (value: string) => {
    set('client', value)
    if (value.trim().length < 1) {
      setClientSuggestions([])
      setShowSuggestions(false)
      return
    }
    const all = loadClients()
    const filtered = all.filter((c) => c.name.toLowerCase().includes(value.toLowerCase()))
    setClientSuggestions(filtered)
    setShowSuggestions(filtered.length > 0)
  }

  const applyClient = (c: ClientRecord) => {
    setR((p) => ({ ...p, client: c.name, address: c.address }))
    setShowSuggestions(false)
  }

  const linkBudget = (budgetId: string) => {
    if (!budgetId) {
      setR((p) => ({ ...p, budgetId: undefined, budgetNumber: undefined }))
      return
    }
    const b = budgets.find((x) => x.id === budgetId)
    if (!b) return
    const totals = computeTotals(b)
    setR((p) => ({
      ...p,
      budgetId: b.id,
      budgetNumber: b.number,
      client: b.client,
      address: b.address,
      concept: `Anticipo presupuesto N° ${b.number}`,
      amount: Math.round(totals.advance),
    }))
  }

  const errors: string[] = []
  if (!r.client.trim()) errors.push('Cliente es obligatorio')
  if (!(r.amount > 0)) errors.push('El monto debe ser mayor a 0')
  if (!r.concept.trim()) errors.push('El concepto es obligatorio')
  const canSave = errors.length === 0

  const save = () => {
    if (!canSave) return
    onSave({ ...r, updatedAt: Date.now() })
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-32 pt-4 sm:pt-6">
      {/* Top bar */}
      <div className="flex items-center gap-2 mb-5">
        <button onClick={onCancel} className="btn-ghost py-2 text-[13px]">← Volver</button>
        <div className="flex-1" />
        <button onClick={save} className="btn-primary py-2 text-[13px]" disabled={!canSave}>
          Guardar
        </button>
      </div>

      <div className="space-y-4">
        {/* Datos del recibo */}
        <div className="card p-4 space-y-3">
          <div className="font-bold text-[15px] mb-1">Datos del recibo</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Número</label>
              <input
                className="input"
                value={r.number}
                onChange={(e) => set('number', e.target.value)}
                placeholder="001"
              />
            </div>
            <div>
              <label className="label">Fecha</label>
              <input
                type="date"
                className="input"
                value={r.date}
                onChange={(e) => set('date', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Vincular presupuesto */}
        <div className="card p-4">
          <div className="font-bold text-[15px] mb-3">Vincular a presupuesto</div>
          <select
            className="input"
            value={r.budgetId ?? ''}
            onChange={(e) => linkBudget(e.target.value)}
          >
            <option value="">— Sin vincular —</option>
            {budgets.map((b) => (
              <option key={b.id} value={b.id}>
                N° {b.number} · {b.client}
              </option>
            ))}
          </select>
          {r.budgetId && (
            <p className="text-[12px] text-romero-gray-3 mt-2">
              Cliente, dirección, concepto y monto se completaron automáticamente. Podés editarlos abajo.
            </p>
          )}
        </div>

        {/* Cliente */}
        <div className="card p-4 space-y-3">
          <div className="font-bold text-[15px] mb-1">Cliente</div>
          <div className="relative">
            <label className="label">Nombre *</label>
            <input
              className="input"
              value={r.client}
              onChange={(e) => handleClientInput(e.target.value)}
              onFocus={() => r.client && setShowSuggestions(clientSuggestions.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Consorcio Castagnino"
              autoComplete="off"
            />
            {showSuggestions && (
              <div
                ref={suggestionsRef}
                className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-romero-gray-2 rounded-xl shadow-lg overflow-hidden"
              >
                {clientSuggestions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={() => applyClient(c)}
                    className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-romero-gray border-b border-romero-gray-2 last:border-0"
                  >
                    <div className="font-semibold">{c.name}</div>
                    {c.address && (
                      <div className="text-romero-gray-3 text-[12px]">{c.address}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="label">Dirección</label>
            <input
              className="input"
              value={r.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="Paz 1333"
            />
          </div>
        </div>

        {/* Pago */}
        <div className="card p-4 space-y-3">
          <div className="font-bold text-[15px] mb-1">Pago</div>

          <div>
            <label className="label">Monto recibido *</label>
            <MoneyInput
              value={r.amount}
              onChange={(n) => set('amount', n)}
              placeholder="0"
            />
          </div>

          <div>
            <label className="label">Forma de pago</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => set('paymentMethod', m)}
                  className={`py-2.5 rounded-xl text-[13px] font-semibold border transition-all text-center ${
                    r.paymentMethod === m
                      ? 'bg-romero-ink text-white border-romero-ink'
                      : 'bg-white text-romero-gray-3 border-romero-gray-2 hover:border-romero-ink/40'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Concepto *</label>
            <input
              className="input"
              value={r.concept}
              onChange={(e) => set('concept', e.target.value)}
              placeholder="Anticipo presupuesto N° 001"
            />
          </div>

          <div>
            <label className="label">Observaciones</label>
            <textarea
              className="input min-h-[80px]"
              value={r.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Datos adicionales..."
            />
          </div>
        </div>

        {/* Resumen */}
        {r.amount > 0 && (
          <div className="card p-4 bg-romero-gray border-romero-gray-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-romero-gray-3 mb-2">
              Resumen del recibo
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-romero-gray-3">{r.concept || 'Sin concepto'}</span>
              <span className="font-extrabold text-[18px]">{formatMoney(r.amount)}</span>
            </div>
            <div className="text-[12px] text-romero-gray-3 mt-1">{r.paymentMethod}</div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="card border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="font-bold mb-1">Revisá estos campos:</div>
            <ul className="list-disc pl-5 space-y-0.5">
              {errors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* Sticky save bar mobile */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur border-t border-romero-gray-2 px-4 py-3 flex gap-2">
        <button onClick={onCancel} className="btn-ghost flex-1">Cancelar</button>
        <button onClick={save} disabled={!canSave} className="btn-primary flex-1">
          Guardar recibo
        </button>
      </div>
    </div>
  )
}
