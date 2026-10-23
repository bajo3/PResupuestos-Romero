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
  const { save, data, voidMovement } = useCrm()
  const [m, setM] = useState<Movement>(initial)
  const set = <K extends keyof Movement>(k: K, v: Movement[K]) => setM((p) => ({ ...p, [k]: v }))
  const categories = m.type === 'ingreso' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const debt = m.debtId ? data.debts.find((d) => d.id === m.debtId) : undefined
  const isExisting = initial.createdAt > 0 && !initial.voided
  const canSave = m.amount > 0 && !!m.category
  const isIncome = m.type === 'ingreso'

  const changeType = (t: MovementType) =>
    setM((p) => ({ ...p, type: t, category: t === 'ingreso' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0] }))

  const onVoid = () => {
    const reason = prompt('Motivo de la anulación:')
    if (reason === null) return
    voidMovement(initial, reason)
    onClose()
  }

  return (
    <Modal
      title={debt ? `Pago a ${debt.creditor}` : isExisting ? 'Editar movimiento' : isIncome ? 'Cobré / entró plata' : 'Pagué / salió plata'}
      onClose={onClose}
      footer={
        <>
          {isExisting && <button className="btn-danger" onClick={onVoid}>Anular</button>}
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
      {!lockType && isExisting && (
        <Segmented
          value={m.type}
          onChange={changeType}
          options={[{ value: 'egreso', label: 'Salió' }, { value: 'ingreso', label: 'Entró' }]}
        />
      )}

      <Field label="Monto">
        <MoneyInput value={m.amount} onChange={(n) => set('amount', n)} placeholder="0" autoFocus className="[&_input]:text-[20px] [&_input]:font-bold" />
      </Field>

      <Field label="Detalle">
        <input
          className="input"
          value={m.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder={isIncome ? 'Ej: seña obra Castagnino' : 'Ej: 10 rollos de membrana'}
        />
      </Field>

      <Field label="Forma de pago">
        <Segmented value={m.method} onChange={(v) => set('method', v)} options={METHODS.map((x) => ({ value: x, label: x }))} />
      </Field>

      <Field label="Obra (si es de una obra)">
        <ObraSelect value={m.obraId} onChange={(id) => set('obraId', id)} emptyLabel="— Gasto general —" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        {!debt && (
          <Field label="Categoría">
            <select className="input" value={m.category} onChange={(e) => set('category', e.target.value)}>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        )}
        <Field label="Fecha">
          <input type="date" className="input" value={m.date} onChange={(e) => set('date', e.target.value)} />
        </Field>
      </div>

      {isIncome && m.category === 'Cobro de obra' && !isExisting && (
        <p className="text-[12px] text-romero-gray-3">
          Si necesitás darle comprobante al cliente, mejor cargalo desde Recibos: ahí suma a la caja y a la obra solo.
        </p>
      )}
    </Modal>
  )
}
