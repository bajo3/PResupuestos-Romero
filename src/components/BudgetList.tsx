import { useMemo, useState } from 'react'
import { Budget, computeTotals } from '../types/budget'
import { formatMoney, formatLongDate } from '../utils/money'

interface Props {
  budgets: Budget[]
  onNew: () => void
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onPrint: (id: string) => void
}

export function BudgetList({ budgets, onNew, onView, onEdit, onDuplicate, onDelete, onPrint }: Props) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    const list = [...budgets].sort((a, b) => b.updatedAt - a.updatedAt)
    if (!t) return list
    return list.filter((b) =>
      [b.client, b.address, b.number, b.workTitle].some((v) =>
        (v ?? '').toLowerCase().includes(t),
      ),
    )
  }, [budgets, q])

  return (
    <div className="min-h-screen">
      {/* Top bar con marca */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-romero-gray-2">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          <div className="bg-romero-yellow rounded-xl p-1.5">
            <img src="/logo-romero.svg" alt="ROMERO" className="h-8 w-auto object-contain" style={{ maxWidth: '160px' }} />
          </div>
          <div className="leading-tight min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-romero-gray-3 truncate">
              Especialistas en Impermeabilización
            </div>
            <div className="text-base font-extrabold leading-none">Presupuestos</div>
          </div>
          <div className="flex-1" />
          <span className="text-[11px] font-semibold text-romero-gray-3">
            {budgets.length} {budgets.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pt-5 pb-28">
        {/* CTA nuevo */}
        <button
          onClick={onNew}
          className="btn-yellow w-full py-4 text-[15px] font-bold mb-4 shadow-sm"
        >
          + Nuevo presupuesto
        </button>

        {/* Buscador */}
        <div className="relative mb-5">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-romero-gray-3 text-[18px] leading-none">
            ⌕
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por cliente, dirección o N°"
            className="input pl-10"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-romero-gray-3 hover:text-romero-ink text-lg"
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <div className="card p-10 text-center text-romero-gray-3">
            {q ? (
              <>
                <div className="text-3xl mb-2">🔍</div>
                <div className="font-semibold">Sin resultados para "{q}"</div>
              </>
            ) : (
              <>
                <div className="text-3xl mb-2">📄</div>
                <div className="font-semibold">Aún no hay presupuestos</div>
                <div className="text-sm mt-1">Tocá el botón de arriba para crear el primero.</div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((b) => {
              const tot = computeTotals(b)
              return (
                <div key={b.id} className="card overflow-hidden">
                  {/* Barra superior amarilla fina */}
                  <div className="h-1 bg-romero-yellow" />

                  <div className="p-4">
                    {/* Encabezado de card */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-romero-gray-3">
                          N° {b.number || '—'} · {formatLongDate(b.date)}
                        </div>
                        <div className="font-bold text-[17px] leading-tight truncate mt-0.5">
                          {b.client || 'Sin cliente'}
                        </div>
                        <div className="text-[13px] text-romero-gray-3 truncate">
                          {b.address || 'Sin dirección'} · {b.propertyType}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] uppercase tracking-wider text-romero-gray-3">Total</div>
                        <div className="font-extrabold text-[15px]">{formatMoney(tot.total)}</div>
                      </div>
                    </div>

                    {/* Acciones principales */}
                    <div className="mt-3.5 grid grid-cols-3 gap-2">
                      <button
                        onClick={() => onView(b.id)}
                        className="btn-ghost py-2.5 text-[13px]"
                      >
                        👁 Ver
                      </button>
                      <button
                        onClick={() => onEdit(b.id)}
                        className="btn-ghost py-2.5 text-[13px]"
                      >
                        ✏ Editar
                      </button>
                      <button
                        onClick={() => onPrint(b.id)}
                        className="btn-yellow py-2.5 text-[13px]"
                      >
                        PDF
                      </button>
                    </div>

                    {/* Acciones secundarias */}
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => onDuplicate(b.id)}
                        className="flex-1 btn-ghost py-2 text-[12px] text-romero-gray-3"
                      >
                        Duplicar
                      </button>
                      <button
                        onClick={() => { if (confirm('¿Eliminar este presupuesto?')) onDelete(b.id) }}
                        className="flex-1 btn-danger py-2 text-[12px]"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
