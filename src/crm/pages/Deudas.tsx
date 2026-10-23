import { useMemo, useState } from 'react'
import { useCrm } from '../CrmContext'
import { Badge, Empty, Field, Modal, ObraSelect, Page, Stat } from '../ui'
import { MovementForm, makeMovement } from '../MovementForm'
import { Debt, Movement, newId, today } from '../../types/crm'
import { debtStatus } from '../../utils/crmCalc'
import { MoneyInput } from '../../components/MoneyInput'
import { formatMoney, formatLongDate } from '../../utils/money'

function makeDebt(): Debt {
  return { id: newId(), createdAt: 0, updatedAt: 0, creditor: '', description: '', amount: 0, dueDate: today() }
}

function DebtForm({ initial, onClose }: { initial: Debt; onClose: () => void }) {
  const { save } = useCrm()
  const [d, setD] = useState(initial)
  const canSave = d.creditor.trim() !== '' && d.amount > 0
  return (
    <Modal title={initial.createdAt ? 'Editar deuda' : 'Nueva deuda'} onClose={onClose}
      footer={<>
        <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
        <button className="btn-primary flex-1" disabled={!canSave} onClick={() => { save('debts', d); onClose() }}>Guardar</button>
      </>}>
      <Field label="Acreedor *">
        <input className="input" value={d.creditor} onChange={(e) => setD({ ...d, creditor: e.target.value })} placeholder="Proveedor, banco, AFIP…" />
      </Field>
      <Field label="Detalle">
        <input className="input" value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Monto total *">
          <MoneyInput value={d.amount} onChange={(n) => setD({ ...d, amount: n })} />
        </Field>
        <Field label="Vencimiento">
          <input type="date" className="input" value={d.dueDate} onChange={(e) => setD({ ...d, dueDate: e.target.value })} />
        </Field>
      </div>
      <Field label="Obra relacionada">
        <ObraSelect value={d.obraId} onChange={(id) => setD({ ...d, obraId: id })} />
      </Field>
      <p className="text-[12px] text-romero-gray-3">
        Cargar la deuda no mueve la caja. Cada pago que registres sale de caja (y de la obra, si tiene una asignada).
      </p>
    </Modal>
  )
}

export function Deudas() {
  const { data, remove, obraById } = useCrm()
  const [form, setForm] = useState<Debt | null>(null)
  const [payment, setPayment] = useState<Movement | null>(null)
  const [showPaid, setShowPaid] = useState(false)

  const rows = useMemo(
    () => data.debts
      .map((d) => ({ d, st: debtStatus(d, data) }))
      .sort((a, b) => (a.d.dueDate || '9').localeCompare(b.d.dueDate || '9')),
    [data],
  )
  const open = rows.filter((r) => r.st.pending > 0)
  const visible = showPaid ? rows : open
  const total = open.reduce((a, r) => a + r.st.pending, 0)
  const overdue = open.filter((r) => r.st.overdue).reduce((a, r) => a + r.st.pending, 0)

  return (
    <Page title="Deudas de la empresa" action={<button className="btn-yellow py-2 text-[13px]" onClick={() => setForm(makeDebt())}>+ Deuda</button>}>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Stat label="Total adeudado" value={formatMoney(total)} tone={total > 0 ? 'bad' : 'default'} hint={`${open.length} deuda(s)`} />
        <Stat label="Vencido" value={formatMoney(overdue)} tone={overdue > 0 ? 'bad' : 'default'} />
      </div>
      <label className="flex items-center gap-2 text-[13px] mb-3">
        <input type="checkbox" checked={showPaid} onChange={(e) => setShowPaid(e.target.checked)} /> Mostrar deudas pagadas
      </label>

      {visible.length === 0 ? <Empty title="Sin deudas pendientes" /> : (
        <div className="card divide-y divide-romero-gray-2">
          {visible.map(({ d, st }) => (
            <div key={d.id} className="px-4 py-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div className="min-w-0">
                  <div className="font-semibold flex flex-wrap items-center gap-2">
                    {d.creditor}
                    {st.pending === 0 ? <Badge tone="good">Pagada</Badge> : st.overdue ? <Badge tone="bad">Vencida</Badge> : st.dueSoon ? <Badge tone="warn">Vence pronto</Badge> : null}
                  </div>
                  <div className="text-[12px] text-romero-gray-3">
                    {d.description}{d.dueDate ? ` · vence ${formatLongDate(d.dueDate)}` : ''}{obraById(d.obraId) ? ` · ${obraById(d.obraId)!.name}` : ''}
                  </div>
                  <div className="text-[12px] text-romero-gray-3">Total {formatMoney(d.amount)} · pagado {formatMoney(st.paid)}</div>
                </div>
                <div className="sm:text-right shrink-0 font-extrabold text-[17px] sm:text-[16px]">{formatMoney(st.pending)} <span className="sm:hidden text-[12px] font-semibold text-romero-gray-3">pendiente</span></div>
              </div>
              <div className="flex gap-2 mt-3">
                {st.pending > 0 && (
                  <button className="btn-yellow flex-1 py-2.5 text-[14px]" onClick={() => setPayment(makeMovement({
                    type: 'egreso', category: 'Pago de deuda', amount: st.pending, debtId: d.id, obraId: d.obraId,
                    description: `Pago a ${d.creditor}${d.description ? ' · ' + d.description : ''}`,
                  }))}>Pagar</button>
                )}
                <button className="btn-ghost flex-1 py-2.5 text-[14px]" onClick={() => setForm(d)}>Editar</button>
                {st.paid === 0 && (
                  <button className="btn-danger py-2.5 px-3.5 text-[14px]" aria-label="Eliminar deuda" onClick={() => { if (confirm('¿Eliminar esta deuda?')) remove('debts', d.id) }}>✕</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {form && <DebtForm initial={form} onClose={() => setForm(null)} />}
      {payment && <MovementForm initial={payment} onClose={() => setPayment(null)} lockType />}
    </Page>
  )
}
