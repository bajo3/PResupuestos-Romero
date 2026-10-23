import { useState } from 'react'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, Movement, MovementMethod, MovementType, newId, today } from '../types/crm'
import { MoneyInput } from '../components/MoneyInput'
import { useCrm } from './CrmContext'
import { Field, Modal, ObraSelect, Segmented } from './ui'

const METHODS: MovementMethod[] = ['Efectivo', 'Transferencia', 'Cheque']

export function makeMovement(preset: Partial<Movement> = {}): Movement {
  return {
    id: newId(),
    createdAt: 0,
    updatedAt: 0,
    date: today(),
    type: 'egreso',
    category: 'Materiales',
    amount: 0,
    method: 'Efectivo',
    description: '',
    ...preset,
  }
}

export function MovementForm({ initial, onClose, lockType }: {
  initial: Movement
  onClose: () => void
  /** Oculta el selector ingreso/egreso (p. ej. al pagar una deuda). */
  lockType?: boolean
}) {
  const { save, data } = useCrm()
  const [m, setM] = useState<Movement>(initial)
  const set = <K extends keyof Movement>(k: K, v: Movement[K]) => setM((p) => ({ ...p, [k]: v }))
  const categories = m.type === 'ingreso' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const debt = m.debtId ? data.debts.find((d) => d.id === m.debtId) : undefined
  const canSave = m.amount > 0 && !!m.category

  const changeType = (t: MovementType) =>
    setM((p) => ({ ...p, type: t, category: t === 'ingreso' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0] }))

  return (
    <Modal
      title={debt ? `Pago a ${debt.creditor}` : m.type === 'ingreso' ? 'Registrar ingreso' : 'Registrar egreso'}
      onClose={onClose}
      footer={
        <>
          <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
          <button
            className="btn-primary flex-1"
            disabled={!canSave}
            onClick={() => { save('movements', m); onClose() }}
          >
            Guardar
          </button>
        </>
      }
    >
      {!lockType && (
        <Segmented
          value={m.type}
          onChange={changeType}
          options={[{ value: 'egreso', label: 'Egreso' }, { value: 'ingreso', label: 'Ingreso' }]}
        />
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha">
          <input type="date" className="input" value={m.date} onChange={(e) => set('date', e.target.value)} />
        </Field>
        <Field label="Monto *">
          <MoneyInput value={m.amount} onChange={(n) => set('amount', n)} placeholder="0" />
        </Field>
      </div>
      {!debt && (
        <Field label="Categoría">
          <select className="input" value={m.category} onChange={(e) => set('category', e.target.value)}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
      )}
      <Field label="Forma de pago">
        <Segmented value={m.method} onChange={(v) => set('method', v)} options={METHODS.map((x) => ({ value: x, label: x }))} />
      </Field>
      <Field label="Obra">
        <ObraSelect value={m.obraId} onChange={(id) => set('obraId', id)} emptyLabel="— Gasto general (sin obra) —" />
      </Field>
      <Field label="Detalle">
        <input
          className="input"
          value={m.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder={m.type === 'ingreso' ? 'Ej: seña obra Castagnino' : 'Ej: 10 rollos membrana'}
        />
      </Field>
      {m.type === 'ingreso' && m.category === 'Cobro de obra' && (
        <p className="text-[12px] text-romero-gray-3">
          Si querés entregarle comprobante al cliente, mejor registralo como recibo: el recibo ya suma en caja y en la obra.
        </p>
      )}
    </Modal>
  )
}
