import { useMemo, useState } from 'react'
import { useCrm } from '../CrmContext'
import { Badge, Empty, Page, Stat } from '../ui'
import { MovementForm, makeMovement } from '../MovementForm'
import { CashEntry, cashEntries, cashSummary } from '../../utils/crmCalc'
import { Movement, today } from '../../types/crm'
import { formatMoney, formatLongDate } from '../../utils/money'

type Filter = 'todos' | 'ingreso' | 'egreso'

export function Caja() {
  const { data, voidMovement, docs, obraById } = useCrm()
  const [editing, setEditing] = useState<Movement | null>(null)
  const [filter, setFilter] = useState<Filter>('todos')
  const [month, setMonth] = useState(() => today().slice(0, 7))
  const [q, setQ] = useState('')

  const all = useMemo(() => cashEntries(data), [data])
  const total = useMemo(() => cashSummary(all), [all])
  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return all.filter((e) =>
      (filter === 'todos' || e.type === filter) &&
      (!month || e.date.startsWith(month)) &&
      (!t || [e.description, e.category, obraById(e.obraId)?.name ?? ''].some((v) => v.toLowerCase().includes(t))),
    )
  }, [all, filter, month, q, obraById])
  const monthSum = useMemo(() => cashSummary(list), [list])

  const onVoid = (e: CashEntry) => {
    if (!e.movement) return
    const reason = prompt('Motivo de la anulación:')
    if (reason === null) return
    voidMovement(e.movement, reason)
  }

  return (
    <Page
      title="Caja"
      subtitle="Ingresos y egresos. Los recibos suman como ingreso automáticamente."
      action={
        <>
          <button className="btn-ghost py-2 text-[13px]" onClick={() => setEditing(makeMovement({ type: 'ingreso', category: 'Cobro de obra' }))}>+ Ingreso</button>
          <button className="btn-yellow py-2 text-[13px]" onClick={() => setEditing(makeMovement())}>+ Egreso</button>
        </>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Saldo total" value={formatMoney(total.balance)} tone={total.balance < 0 ? 'bad' : 'default'} />
        <Stat label="Efectivo" value={formatMoney(total.byMethod.Efectivo)} />
        <Stat label="Transferencia" value={formatMoney(total.byMethod.Transferencia)} />
        <Stat label="Cheques" value={formatMoney(total.byMethod.Cheque)} />
      </div>

      <div className="card p-3 mt-4 flex flex-wrap gap-2 items-center">
        <input type="month" className="input w-auto py-2" value={month} onChange={(e) => setMonth(e.target.value)} />
        <select className="input w-auto py-2" value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
          <option value="todos">Todos</option>
          <option value="ingreso">Ingresos</option>
          <option value="egreso">Egresos</option>
        </select>
        <input className="input py-2 flex-1 min-w-[160px]" placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />
        {month && <button className="text-[12px] text-romero-gray-3 underline" onClick={() => setMonth('')}>Ver todos los meses</button>}
      </div>

      <div className="flex gap-4 text-[13px] mt-3 mb-2 px-1">
        <span>Ingresos <b className="text-emerald-700">{formatMoney(monthSum.income)}</b></span>
        <span>Egresos <b className="text-red-700">{formatMoney(monthSum.expense)}</b></span>
        <span>Neto <b>{formatMoney(monthSum.balance)}</b></span>
      </div>

      {list.length === 0 ? (
        <Empty title="Sin movimientos" hint="Registrá un ingreso o egreso con los botones de arriba." />
      ) : (
        <div className="card divide-y divide-romero-gray-2">
          {list.map((e) => {
            const obra = obraById(e.obraId)
            return (
              <div key={e.id} className={`px-4 py-3 flex items-start gap-3 ${e.voided ? 'opacity-50' : ''}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[12px] text-romero-gray-3">{formatLongDate(e.date)}</span>
                    <Badge>{e.category}</Badge>
                    {e.source === 'recibo' && <Badge tone="info">Recibo</Badge>}
                    {e.voided && <Badge tone="bad">Anulado</Badge>}
                  </div>
                  <div className={`text-[14px] mt-0.5 ${e.voided ? 'line-through' : ''}`}>{e.description || '—'}</div>
                  <div className="text-[12px] text-romero-gray-3">
                    {e.method}{obra ? ` · ${obra.name}` : ''}
                    {e.movement?.createdBy ? ` · cargó ${e.movement.createdBy}` : ''}
                    {e.voided && e.movement?.voidReason ? ` · motivo: ${e.movement.voidReason}` : ''}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`font-bold ${e.type === 'ingreso' ? 'text-emerald-700' : 'text-red-700'}`}>
                    {e.type === 'ingreso' ? '+' : '−'} {formatMoney(e.amount)}
                  </div>
                  <div className="flex gap-2 justify-end mt-1 text-[12px]">
                    {e.receipt && <button className="underline text-romero-gray-3" onClick={() => docs.viewReceipt(e.receipt!.id)}>Ver recibo</button>}
                    {e.movement && !e.voided && !e.movement.stockMoveId && (
                      <>
                        <button className="underline text-romero-gray-3" onClick={() => setEditing(e.movement!)}>Editar</button>
                        <button className="underline text-red-600" onClick={() => onVoid(e)}>Anular</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && <MovementForm initial={editing} onClose={() => setEditing(null)} lockType={!!editing.debtId} />}
    </Page>
  )
}
