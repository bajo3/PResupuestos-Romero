import { useMemo, useState } from 'react'
import { useCrm } from '../CrmContext'
import { Empty, Page, StatusBadge } from '../ui'
import { cashEntries, cashSummary, obraFinance } from '../../utils/crmCalc'
import { formatMoney } from '../../utils/money'

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function Reportes() {
  const { data, navigate } = useCrm()
  const [year, setYear] = useState(() => new Date().getFullYear())

  const { months, categories, yearTotal } = useMemo(() => {
    const entries = cashEntries(data).filter((e) => !e.voided && e.date.startsWith(String(year)))
    const months = MONTHS.map((label, i) => {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`
      return { label, ...cashSummary(entries.filter((e) => e.date.startsWith(key))) }
    })
    const cat = new Map<string, number>()
    for (const e of entries) if (e.type === 'egreso') cat.set(e.category, (cat.get(e.category) ?? 0) + e.amount)
    const categories = [...cat.entries()].sort((a, b) => b[1] - a[1])
    return { months, categories, yearTotal: cashSummary(entries) }
  }, [data, year])

  const obras = useMemo(
    () => data.obras
      .filter((o) => o.status !== 'cancelada')
      .map((o) => ({ o, f: obraFinance(o, data) }))
      .sort((a, b) => b.f.estimatedProfit - a.f.estimatedProfit),
    [data],
  )
  const max = Math.max(1, ...months.map((m) => Math.max(m.income, m.expense)))

  return (
    <Page title="Reportes"
      action={
        <select className="input w-auto py-2" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {[0, 1, 2, 3].map((d) => { const y = new Date().getFullYear() - d; return <option key={y} value={y}>{y}</option> })}
        </select>
      }>
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 text-[13px] mb-3">
          <span>Ingresos <b className="text-emerald-700">{formatMoney(yearTotal.income)}</b></span>
          <span>Egresos <b className="text-red-700">{formatMoney(yearTotal.expense)}</b></span>
          <span>Resultado <b>{formatMoney(yearTotal.balance)}</b></span>
        </div>
        <div className="space-y-1.5">
          {months.map((m) => (
            <div key={m.label} className="grid grid-cols-[36px_1fr_auto] items-center gap-2 text-[12px]">
              <span className="text-romero-gray-3">{m.label}</span>
              <div className="space-y-0.5">
                <div className="h-2 rounded bg-emerald-500/80" style={{ width: `${(m.income / max) * 100}%` }} />
                <div className="h-2 rounded bg-red-500/70" style={{ width: `${(m.expense / max) * 100}%` }} />
              </div>
              <span className={`font-semibold tabular-nums ${m.balance < 0 ? 'text-red-700' : ''}`}>{formatMoney(m.balance)}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 text-[11px] text-romero-gray-3 mt-3">
          <span><span className="inline-block w-2 h-2 rounded bg-emerald-500/80 mr-1" />Ingresos</span>
          <span><span className="inline-block w-2 h-2 rounded bg-red-500/70 mr-1" />Egresos</span>
        </div>
      </div>

      <h2 className="font-bold text-[15px] mt-7 mb-3">Egresos por categoría ({year})</h2>
      {categories.length === 0 ? <Empty title="Sin egresos en el año" /> : (
        <div className="card divide-y divide-romero-gray-2">
          {categories.map(([c, v]) => (
            <div key={c} className="px-4 py-2.5 flex justify-between text-[14px]"><span>{c}</span><b>{formatMoney(v)}</b></div>
          ))}
        </div>
      )}

      <h2 className="font-bold text-[15px] mt-7 mb-3">Rentabilidad por obra</h2>
      {obras.length === 0 ? <Empty title="Sin obras" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-romero-gray-3 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2">Obra</th>
                <th className="px-2 py-2 text-right">Presupuesto</th>
                <th className="px-2 py-2 text-right">Cobrado</th>
                <th className="px-2 py-2 text-right">Gastos</th>
                <th className="px-4 py-2 text-right">Ganancia est.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-romero-gray-2">
              {obras.map(({ o, f }) => (
                <tr key={o.id} className="hover:bg-romero-gray cursor-pointer" onClick={() => navigate('obras/' + o.id)}>
                  <td className="px-4 py-2"><div className="font-semibold">{o.name}</div><StatusBadge status={o.status} /></td>
                  <td className="px-2 py-2 text-right tabular-nums">{formatMoney(f.total)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{formatMoney(f.collected)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{formatMoney(f.expenses)}</td>
                  <td className={`px-4 py-2 text-right tabular-nums font-bold ${f.estimatedProfit < 0 ? 'text-red-700' : ''}`}>{formatMoney(f.estimatedProfit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  )
}
