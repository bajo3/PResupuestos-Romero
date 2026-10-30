import { useMemo, useState } from 'react'
import { useCrm } from '../CrmContext'
import { Badge, Empty, Field, Modal, ObraSelect, Page, Segmented, Stat } from '../ui'
import { MovementForm, makeMovement } from '../MovementForm'
import { Debt, Movement, MovementMethod, newId, today } from '../../types/crm'
import { debtStatus } from '../../utils/crmCalc'
import { MoneyInput } from '../../components/MoneyInput'
import { formatMoney, formatLongDate, formatUsd } from '../../utils/money'
import { useBlueRate } from '../../utils/dolar'

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
      <Field label="Moneda">
        <Segmented value={d.currency === 'USD' ? 'USD' : 'ARS'} onChange={(c) => setD({ ...d, currency: c })} options={[{ value: 'ARS', label: 'Pesos' }, { value: 'USD', label: 'Dólares (blue)' }]} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={d.currency === 'USD' ? 'Monto total (US$) *' : 'Monto total *'}>
          <MoneyInput value={d.amount} prefix={d.currency === 'USD' ? 'US$' : '$'} onChange={(n) => setD({ ...d, amount: n })} />
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

/** Pago de una deuda en dólares: se carga en US$ y se convierte a pesos con la cotización del día. */
function UsdPaymentForm({ debt, pendingUsd, rate, onClose }: { debt: Debt; pendingUsd: number; rate: number; onClose: () => void }) {
  const { save } = useCrm()
  const [usd, setUsd] = useState(pendingUsd)
  const [cotiz, setCotiz] = useState(rate)
  const [method, setMethod] = useState<MovementMethod>('Efectivo')
  const [date, setDate] = useState(today())
  const ars = Math.round(usd * cotiz)
  const canSave = usd > 0 && cotiz > 0

  return (
    <Modal title={`Pago a ${debt.creditor} (US$)`} onClose={onClose}
      footer={<>
        <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
        <button className="btn-primary flex-1" disabled={!canSave} onClick={() => {
          save('movements', makeMovement({
            type: 'egreso', category: 'Pago de deuda', amount: ars, usd, rate: cotiz, method, date, debtId: debt.id, obraId: debt.obraId,
            description: `Pago a ${debt.creditor} · ${formatUsd(usd)} a $ ${cotiz}`,
          }))
          onClose()
        }}>Guardar</button>
      </>}>
      <Field label="Monto a pagar (US$)">
        <MoneyInput value={usd} prefix="US$" onChange={setUsd} autoFocus />
      </Field>
      <Field label="Cotización (pesos por dólar)">
        <MoneyInput value={cotiz} onChange={setCotiz} />
      </Field>
      <p className="text-[13px]">Salen de caja <b>{formatMoney(ars)}</b>. Queda pendiente {formatUsd(Math.max(0, pendingUsd - usd))}.</p>
      <p className="text-[12px] text-romero-gray-3">La cotización viene del dólar blue (venta) y la podés cambiar si pagaste a otro valor.</p>
      <Field label="Forma de pago">
        <Segmented value={method} onChange={setMethod} options={(['Efectivo', 'Transferencia', 'Cheque'] as MovementMethod[]).map((m) => ({ value: m, label: m }))} />
      </Field>
      <Field label="Fecha">
        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
    </Modal>
  )
}

export function Deudas() {
  const { data, remove, obraById } = useCrm()
  const blue = useBlueRate()
  const rate = blue?.venta ?? 0
  const [usdPay, setUsdPay] = useState<{ debt: Debt; pendingUsd: number } | null>(null)
  const [form, setForm] = useState<Debt | null>(null)
  const [payment, setPayment] = useState<Movement | null>(null)
  const [showPaid, setShowPaid] = useState(false)

  const rows = useMemo(
    () => data.debts
      .map((d) => ({ d, st: debtStatus(d, data, rate) }))
      .sort((a, b) => (a.d.dueDate || '9').localeCompare(b.d.dueDate || '9')),
    [data, rate],
  )
  const open = rows.filter((r) => r.st.pending > 0)
  const visible = showPaid ? rows : open
  const total = open.reduce((a, r) => a + r.st.pendingArs, 0)
  const overdue = open.filter((r) => r.st.overdue).reduce((a, r) => a + r.st.pendingArs, 0)
  const usdPending = open.filter((r) => r.st.currency === 'USD').reduce((a, r) => a + r.st.pending, 0)

  return (
    <Page title="Deudas de la empresa" action={<button className="btn-yellow py-2 text-[13px]" onClick={() => setForm(makeDebt())}>+ Deuda</button>}>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Stat label="Total adeudado" value={formatMoney(total)} tone={total > 0 ? 'bad' : 'default'} hint={`${open.length} deuda(s)${usdPending > 0 ? ` · incluye ${formatUsd(usdPending)}` : ''}`} />
        <Stat label="Vencido" value={formatMoney(overdue)} tone={overdue > 0 ? 'bad' : 'default'} />
      </div>
      {blue && <p className="text-[12px] text-romero-gray-3 -mt-2 mb-3">Dólar blue (venta): <b className="text-romero-ink">{formatMoney(blue.venta)}</b> · las deudas en US$ se pasan a pesos con este valor.</p>}
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
                  <div className="text-[12px] text-romero-gray-3">Total {st.currency === 'USD' ? formatUsd(d.amount) : formatMoney(d.amount)} · pagado {st.currency === 'USD' ? formatUsd(st.paid) : formatMoney(st.paid)}</div>
                </div>
                <div className="sm:text-right shrink-0 font-extrabold text-[17px] sm:text-[16px]">{st.currency === 'USD' ? formatUsd(st.pending) : formatMoney(st.pending)} <span className="sm:hidden text-[12px] font-semibold text-romero-gray-3">pendiente</span>{st.currency === 'USD' && rate > 0 && st.pending > 0 && <div className="text-[12px] font-semibold text-romero-gray-3">≈ {formatMoney(st.pendingArs)}</div>}</div>
              </div>
              <div className="flex gap-2 mt-3">
                {st.pending > 0 && st.currency === 'USD' && (
                  <button className="btn-yellow flex-1 py-2.5 text-[14px]" disabled={rate <= 0} onClick={() => setUsdPay({ debt: d, pendingUsd: st.pending })}>Pagar</button>
                )}
                {st.pending > 0 && st.currency !== 'USD' && (
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
              {st.payments.length > 0 && (
                <div className="mt-3 rounded-xl bg-romero-gray px-3 py-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-romero-gray-3 mb-1">Pagos ({st.payments.length})</div>
                  {[...st.payments].sort((a, b) => b.date.localeCompare(a.date)).map((p) => (
                    <div key={p.id} className="flex items-baseline justify-between gap-3 py-0.5 text-[13px]">
                      <span className="text-romero-gray-3">{formatLongDate(p.date)} · {p.method}</span>
                      <b className="tabular-nums shrink-0">{p.usd ? `${formatUsd(p.usd)} · ${formatMoney(p.amount)}` : formatMoney(p.amount)}</b>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {form && <DebtForm initial={form} onClose={() => setForm(null)} />}
      {usdPay && <UsdPaymentForm debt={usdPay.debt} pendingUsd={usdPay.pendingUsd} rate={rate} onClose={() => setUsdPay(null)} />}
      {payment && <MovementForm initial={payment} onClose={() => setPayment(null)} lockType />}
    </Page>
  )
}
