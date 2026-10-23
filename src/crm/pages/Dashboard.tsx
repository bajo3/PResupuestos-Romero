import { useMemo } from 'react'
import { useCrm } from '../CrmContext'
import { Badge, Page, Stat } from '../ui'
import { cashEntries, cashSummary, debtStatus, isLowStock, obraFinance, pendingBudgets, stockQty } from '../../utils/crmCalc'
import { computeTotals } from '../../types/budget'
import { formatMoney, formatLongDate } from '../../utils/money'

export function Dashboard() {
  const { data, navigate } = useCrm()

  const s = useMemo(() => {
    const cash = cashSummary(cashEntries(data))
    const debts = data.debts.map((d) => ({ d, st: debtStatus(d, data) })).filter((x) => x.st.pending > 0)
    const activeObras = data.obras.filter((o) => o.status === 'en_ejecucion')
    const obrasFin = data.obras
      .filter((o) => o.status !== 'cancelada')
      .map((o) => ({ o, f: obraFinance(o, data) }))
    const pending = pendingBudgets(data)
    const low = data.stock_items.filter((i) => isLowStock(i, data))
    const toCollect = obrasFin.filter((x) => x.o.status !== 'presupuestada' && x.f.pending > 0)
    return {
      cash,
      debts,
      debtTotal: debts.reduce((a, x) => a + x.st.pending, 0),
      activeObras,
      pending,
      pendingTotal: pending.reduce((a, b) => a + computeTotals(b).total, 0),
      estimated: obrasFin.filter((x) => x.o.status !== 'presupuestada').reduce((a, x) => a + x.f.estimatedProfit, 0),
      real: obrasFin.reduce((a, x) => a + x.f.realProfit, 0),
      toCollect,
      toCollectTotal: toCollect.reduce((a, x) => a + x.f.pending, 0),
      low,
    }
  }, [data])

  const alerts = [
    ...s.debts
      .filter((x) => x.st.overdue || x.st.dueSoon)
      .map((x) => ({
        key: 'd' + x.d.id,
        tone: x.st.overdue ? ('bad' as const) : ('warn' as const),
        tag: x.st.overdue ? 'Deuda vencida' : 'Deuda por vencer',
        text: `${x.d.creditor} · ${formatMoney(x.st.pending)} · vence ${formatLongDate(x.d.dueDate)}`,
        to: 'deudas',
      })),
    ...s.toCollect.map((x) => ({
      key: 'o' + x.o.id,
      tone: 'info' as const,
      tag: 'Pago pendiente',
      text: `${x.o.client || x.o.name} · resta cobrar ${formatMoney(x.f.pending)}`,
      to: 'obras/' + x.o.id,
    })),
    ...s.low.map((i) => ({
      key: 's' + i.id,
      tone: 'warn' as const,
      tag: 'Stock bajo',
      text: `${i.name} · quedan ${stockQty(i, data)} ${i.unit}`,
      to: 'stock',
    })),
  ]

  return (
    <Page title="Panel general" subtitle="Resumen de la empresa">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="col-span-2 lg:col-span-1">
          <Stat label="Dinero en caja" value={formatMoney(s.cash.balance)} tone={s.cash.balance < 0 ? 'bad' : 'default'}
            hint={`Efectivo ${formatMoney(s.cash.byMethod.Efectivo)}`} />
        </div>
        <Stat label="Deudas pendientes" value={formatMoney(s.debtTotal)} tone={s.debtTotal > 0 ? 'bad' : 'default'}
          hint={`${s.debts.length} deuda(s)`} />
        <Stat label="Disponible" value={formatMoney(s.cash.balance - s.debtTotal)} tone={s.cash.balance - s.debtTotal < 0 ? 'bad' : 'default'}
          hint="Caja − deudas" />
        <Stat label="Obras activas" value={String(s.activeObras.length)} hint={`Resta cobrar ${formatMoney(s.toCollectTotal)}`} />
        <Stat label="Presupuestos pendientes" value={String(s.pending.length)} hint={formatMoney(s.pendingTotal)} />
        <Stat label="Ganancia estimada" value={formatMoney(s.estimated)} hint="Presupuesto − gastos" />
        <Stat label="Ganancia real" value={formatMoney(s.real)} tone={s.real < 0 ? 'bad' : 'good'} hint="Cobrado − gastos" />
      </div>

      <h2 className="font-bold text-[15px] mt-7 mb-3">Alertas</h2>
      {alerts.length === 0 ? (
        <div className="card p-5 text-sm text-romero-gray-3">Sin alertas por ahora.</div>
      ) : (
        <div className="card divide-y divide-romero-gray-2">
          {alerts.map((a) => (
            <button key={a.key} onClick={() => navigate(a.to)} className="w-full text-left px-4 py-3 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3 hover:bg-romero-gray">
              <Badge tone={a.tone}>{a.tag}</Badge>
              <span className="text-[14px] sm:truncate">{a.text}</span>
            </button>
          ))}
        </div>
      )}

      <h2 className="font-bold text-[15px] mt-7 mb-3">Obras en ejecución</h2>
      {s.activeObras.length === 0 ? (
        <div className="card p-5 text-sm text-romero-gray-3">No hay obras en ejecución.</div>
      ) : (
        <div className="card divide-y divide-romero-gray-2">
          {s.activeObras.map((o) => {
            const f = obraFinance(o, data)
            return (
              <button key={o.id} onClick={() => navigate('obras/' + o.id)} className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-romero-gray">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{o.name}</div>
                  <div className="text-[12px] text-romero-gray-3 truncate">{o.client}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[12px] text-romero-gray-3">Cobrado {Math.round(f.collectedPct)}%</div>
                  <div className="font-bold text-[14px]">{formatMoney(f.pending)} resta</div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </Page>
  )
}
