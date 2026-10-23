import { useMemo, useState } from 'react'
import { useCrm } from '../CrmContext'
import { Page } from '../ui'
import { MovementForm, makeMovement } from '../MovementForm'
import { cashEntries, cashSummary } from '../../utils/crmCalc'
import { Movement, today, toLocalIso } from '../../types/crm'
import { formatMoney } from '../../utils/money'

type Filter = 'todo' | 'ingreso' | 'egreso'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return `${MESES[m - 1]} ${y}`
}

function dayLabel(iso: string): string {
  if (iso === today()) return 'Hoy'
  const y = new Date()
  y.setDate(y.getDate() - 1)
  if (iso === toLocalIso(y)) return 'Ayer'
  const [, m, d] = iso.split('-').map(Number)
  return `${d} de ${MESES[m - 1]}`
}

export function Caja() {
  const { data, docs, obraById } = useCrm()
  const [editing, setEditing] = useState<Movement | null>(null)
  const [filter, setFilter] = useState<Filter>('todo')
  const [month, setMonth] = useState(() => today().slice(0, 7))
  const [q, setQ] = useState('')

  const all = useMemo(() => cashEntries(data), [data])
  const total = useMemo(() => cashSummary(all), [all])
  const inMonth = useMemo(() => all.filter((e) => e.date.startsWith(month)), [all, month])
  const monthSum = useMemo(() => cashSummary(inMonth), [inMonth])

  const days = useMemo(() => {
    const t = q.trim().toLowerCase()
    const list = inMonth.filter(
      (e) =>
        (filter === 'todo' || e.type === filter) &&
        (!t || [e.description, e.category, obraById(e.obraId)?.name ?? ''].some((v) => v.toLowerCase().includes(t))),
    )
    const map = new Map<string, typeof list>()
    for (const e of list) map.set(e.date, [...(map.get(e.date) ?? []), e])
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [inMonth, filter, q, obraById])

  const isCurrent = month === today().slice(0, 7)
  const otherMethods = (['Transferencia', 'Cheque'] as const).filter((k) => total.byMethod[k] !== 0)

  return (
    <Page title="Caja">
      {/* Saldo */}
      <div className="card p-5">
        <div className="text-[12px] font-semibold uppercase tracking-wider text-romero-gray-3">Plata en caja</div>
        <div className={`text-[32px] font-extrabold leading-tight tabular-nums ${total.balance < 0 ? 'text-red-700' : ''}`}>
          {formatMoney(total.balance)}
        </div>
        <div className="text-[13px] text-romero-gray-3 mt-1 flex flex-wrap gap-x-4">
          <span>Efectivo <b className="text-romero-ink">{formatMoney(total.byMethod.Efectivo)}</b></span>
          {otherMethods.map((k) => (
            <span key={k}>{k} <b className="text-romero-ink">{formatMoney(total.byMethod[k])}</b></span>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <button
          className="btn py-4 text-[16px] font-bold bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={() => setEditing(makeMovement({ type: 'ingreso', category: 'Cobro de obra' }))}
        >
          + Entró plata
        </button>
        <button
          className="btn-yellow py-4 text-[16px] font-bold"
          onClick={() => setEditing(makeMovement())}
        >
          − Salió plata
        </button>
      </div>

      {/* Mes */}
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center gap-1">
          <button className="btn-ghost px-3 py-2 text-[16px] leading-none" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Mes anterior">‹</button>
          <div className="min-w-[140px] text-center font-bold capitalize">{monthLabel(month)}</div>
          <button className="btn-ghost px-3 py-2 text-[16px] leading-none" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Mes siguiente">›</button>
        </div>
        {!isCurrent && <button className="text-[13px] underline text-romero-gray-3" onClick={() => setMonth(today().slice(0, 7))}>Este mes</button>}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        {([
          { id: 'ingreso', label: 'Entró', value: monthSum.income, cls: 'text-emerald-700' },
          { id: 'egreso', label: 'Salió', value: monthSum.expense, cls: 'text-red-700' },
          { id: 'todo', label: 'Resultado', value: monthSum.balance, cls: monthSum.balance < 0 ? 'text-red-700' : '' },
        ] as { id: Filter; label: string; value: number; cls: string }[]).map((c) => (
          <button
            key={c.id}
            onClick={() => setFilter(filter === c.id ? 'todo' : c.id)}
            className={`rounded-xl border px-2 py-2.5 transition ${filter === c.id ? 'border-romero-ink bg-white' : 'border-romero-gray-2 bg-white/60 hover:bg-white'}`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-romero-gray-3">{c.label}</div>
            <div className={`font-extrabold text-[14px] tabular-nums ${c.cls}`}>{formatMoney(c.value)}</div>
          </button>
        ))}
      </div>

      <input className="input mt-3 py-2.5" placeholder="Buscar en este mes" value={q} onChange={(e) => setQ(e.target.value)} />

      {/* Movimientos por día */}
      {days.length === 0 ? (
        <div className="card p-8 text-center text-romero-gray-3 mt-4">
          <div className="font-semibold">Sin movimientos en {monthLabel(month)}</div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {days.map(([date, entries]) => (
            <div key={date}>
              <div className="text-[12px] font-bold uppercase tracking-wider text-romero-gray-3 mb-1.5 px-1">{dayLabel(date)}</div>
              <div className="card divide-y divide-romero-gray-2 overflow-hidden">
                {entries.map((e) => {
                  const obra = obraById(e.obraId)
                  const editable = !!e.movement && !e.voided && !e.movement.stockMoveId
                  const onClick = e.receipt ? () => docs.viewReceipt(e.receipt!.id) : editable ? () => setEditing(e.movement!) : undefined
                  const sub = [e.source === 'recibo' ? 'Recibo' : e.category, obra?.name, e.method].filter(Boolean).join(' · ')
                  return (
                    <button
                      key={e.id}
                      disabled={!onClick}
                      onClick={onClick}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 ${onClick ? 'hover:bg-romero-gray' : 'cursor-default'} ${e.voided ? 'opacity-50' : ''}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className={`text-[15px] font-medium truncate ${e.voided ? 'line-through' : ''}`}>{e.description || e.category}</div>
                        <div className="text-[12px] text-romero-gray-3 truncate">
                          {sub}
                          {e.voided && ` · anulado${e.movement?.voidReason ? ': ' + e.movement.voidReason : ''}`}
                          {e.movement?.createdBy ? ` · ${e.movement.createdBy}` : ''}
                        </div>
                      </div>
                      <div className={`font-bold tabular-nums shrink-0 ${e.type === 'ingreso' ? 'text-emerald-700' : 'text-red-700'}`}>
                        {e.type === 'ingreso' ? '+' : '−'} {formatMoney(e.amount)}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <MovementForm initial={editing} onClose={() => setEditing(null)} lockType={!!editing.debtId} />}
    </Page>
  )
}
