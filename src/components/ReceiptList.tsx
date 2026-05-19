import { useMemo, useState } from 'react'
import { Receipt } from '../types/receipt'
import { formatMoney, formatLongDate } from '../utils/money'

interface Props {
  receipts: Receipt[]
  onNew: () => void
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

const PAYMENT_ICONS: Record<string, string> = {
  Efectivo: '💵',
  Transferencia: '🏦',
  Cheque: '📋',
}

export function ReceiptList({ receipts, onNew, onView, onEdit, onDelete }: Props) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    const list = [...receipts].sort((a, b) => b.updatedAt - a.updatedAt)
    if (!t) return list
    return list.filter((r) =>
      [r.client, r.address, r.number, r.concept].some((v) =>
        (v ?? '').toLowerCase().includes(t),
      ),
    )
  }, [receipts, q])

  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 pt-5 pb-28">
        {/* CTA nuevo */}
        <button
          onClick={onNew}
          className="btn-yellow w-full py-4 text-[15px] font-bold mb-4 shadow-sm"
        >
          + Nuevo recibo
        </button>

        {/* Buscador */}
        <div className="relative mb-5">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-romero-gray-3 text-[18px] leading-none">
            ⌕
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por cliente, concepto o N°"
            className="input pl-10"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-romero-gray-3 hover:text-romero-ink text-lg"
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
                <div className="text-3xl mb-2">🧾</div>
                <div className="font-semibold">Aún no hay recibos</div>
                <div className="text-sm mt-1">Tocá el botón de arriba para crear el primero.</div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <div key={r.id} className="card overflow-hidden">
                <div className="h-1 bg-romero-yellow" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-romero-gray-3">
                        Recibo N° {r.number || '—'} · {formatLongDate(r.date)}
                      </div>
                      <div className="font-bold text-[17px] leading-tight truncate mt-0.5">
                        {r.client || 'Sin cliente'}
                      </div>
                      <div className="text-[13px] text-romero-gray-3 truncate">
                        {r.concept || 'Sin concepto'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] uppercase tracking-wider text-romero-gray-3">
                        {PAYMENT_ICONS[r.paymentMethod]} {r.paymentMethod}
                      </div>
                      <div className="font-extrabold text-[15px]">{formatMoney(r.amount)}</div>
                    </div>
                  </div>

                  <div className="mt-3.5 grid grid-cols-3 gap-2">
                    <button onClick={() => onView(r.id)} className="btn-ghost py-2.5 text-[13px]">
                      👁 Ver
                    </button>
                    <button onClick={() => onEdit(r.id)} className="btn-ghost py-2.5 text-[13px]">
                      ✏ Editar
                    </button>
                    <button onClick={() => onView(r.id)} className="btn-yellow py-2.5 text-[13px]">
                      PDF
                    </button>
                  </div>

                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => { if (confirm('¿Eliminar este recibo?')) onDelete(r.id) }}
                      className="flex-1 btn-danger py-2 text-[12px]"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
