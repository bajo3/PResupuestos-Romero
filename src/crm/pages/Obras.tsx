import { useMemo, useState } from 'react'
import { useCrm } from '../CrmContext'
import { Badge, Empty, Field, Modal, Page, ProgressBar, Segmented, StatusBadge } from '../ui'
import { MovementForm, makeMovement } from '../MovementForm'
import { StockOutForm } from './Stock'
import { WarrantyForm, makeWarranty } from './Garantias'
import { Movement, Obra, ObraStatus, OBRA_STATUS_LABEL, StockMove, Warranty, newId, today } from '../../types/crm'
import { computeTotals } from '../../types/budget'
import { obraFinance, obraMaterials, obraReceipts } from '../../utils/crmCalc'
import { MoneyInput } from '../../components/MoneyInput'
import { formatMoney, formatLongDate, formatNumber } from '../../utils/money'

export function makeObra(preset: Partial<Obra> = {}): Obra {
  return {
    id: newId(),
    createdAt: 0,
    updatedAt: 0,
    name: '',
    client: '',
    address: '',
    amount: 0,
    status: 'presupuestada',
    startDate: today(),
    endDate: '',
    notes: '',
    ...preset,
  }
}

// ─── Formulario ───────────────────────────────────────────────────────────────

export function ObraForm({ initial, onClose, onSaved }: { initial: Obra; onClose: () => void; onSaved?: (o: Obra) => void }) {
  const { data, save, clients } = useCrm()
  const [o, setO] = useState<Obra>(initial)
  const set = <K extends keyof Obra>(k: K, v: Obra[K]) => setO((p) => ({ ...p, [k]: v }))
  const usedBudgets = new Set(data.obras.filter((x) => x.id !== o.id).map((x) => x.budgetId))
  const budgets = data.budgets.filter((b) => !usedBudgets.has(b.id))
  const linked = o.budgetId ? data.budgets.find((b) => b.id === o.budgetId) : undefined

  const linkBudget = (id: string) => {
    const b = data.budgets.find((x) => x.id === id)
    if (!b) { set('budgetId', undefined); return }
    setO((p) => ({
      ...p,
      budgetId: b.id,
      client: b.client,
      address: b.address,
      name: p.name || `${b.workTitle} — ${b.client}`,
    }))
  }

  const canSave = o.name.trim().length > 0

  return (
    <Modal
      title={initial.createdAt ? 'Editar obra' : 'Nueva obra'}
      onClose={onClose}
      footer={
        <>
          <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-primary flex-1" disabled={!canSave} onClick={() => { save('obras', o); onSaved?.(o); onClose() }}>
            Guardar
          </button>
        </>
      }
    >
      <Field label="Presupuesto vinculado">
        <select className="input" value={o.budgetId ?? ''} onChange={(e) => linkBudget(e.target.value)}>
          <option value="">— Sin presupuesto (monto manual) —</option>
          {budgets.map((b) => (
            <option key={b.id} value={b.id}>N° {b.number} · {b.client} · {formatMoney(computeTotals(b).total)}</option>
          ))}
        </select>
      </Field>
      <Field label="Nombre de la obra *">
        <input className="input" value={o.name} onChange={(e) => set('name', e.target.value)} placeholder="Reforma — Cliente Lucas" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Cliente">
          <input className="input" list="crm-clients" value={o.client} onChange={(e) => set('client', e.target.value)} />
          <datalist id="crm-clients">
            {clients.map((c) => <option key={c.id} value={c.name} />)}
          </datalist>
        </Field>
        <Field label="Dirección">
          <input className="input" value={o.address} onChange={(e) => set('address', e.target.value)} />
        </Field>
      </div>
      {linked ? (
        <div className="text-[13px] text-romero-gray-3">
          Total del presupuesto N° {linked.number}: <b className="text-romero-ink">{formatMoney(computeTotals(linked).total)}</b>
        </div>
      ) : (
        <Field label="Presupuesto total">
          <MoneyInput value={o.amount} onChange={(n) => set('amount', n)} placeholder="0" />
        </Field>
      )}
      <Field label="Estado">
        <select className="input" value={o.status} onChange={(e) => set('status', e.target.value as ObraStatus)}>
          {(Object.keys(OBRA_STATUS_LABEL) as ObraStatus[]).map((s) => <option key={s} value={s}>{OBRA_STATUS_LABEL[s]}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Inicio">
          <input type="date" className="input" value={o.startDate} onChange={(e) => set('startDate', e.target.value)} />
        </Field>
        <Field label="Fin">
          <input type="date" className="input" value={o.endDate} onChange={(e) => set('endDate', e.target.value)} />
        </Field>
      </div>
      <Field label="Notas">
        <textarea className="input min-h-[70px]" value={o.notes} onChange={(e) => set('notes', e.target.value)} />
      </Field>
    </Modal>
  )
}

// ─── Lista ────────────────────────────────────────────────────────────────────

export function ObrasList() {
  const { data, navigate } = useCrm()
  const [editing, setEditing] = useState<Obra | null>(null)
  const [status, setStatus] = useState<'activas' | 'todas' | ObraStatus>('activas')
  const [q, setQ] = useState('')

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return [...data.obras]
      .filter((o) =>
        status === 'todas' ? true : status === 'activas' ? o.status === 'en_ejecucion' || o.status === 'presupuestada' : o.status === status,
      )
      .filter((o) => !t || [o.name, o.client, o.address].some((v) => v.toLowerCase().includes(t)))
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }, [data.obras, status, q])

  return (
    <Page title="Obras" subtitle="Presupuesto, cobros, gastos y ganancia por obra"
      action={<button className="btn-yellow py-2 text-[13px]" onClick={() => setEditing(makeObra())}>+ Nueva obra</button>}>
      <div className="card p-3 mb-4 flex flex-wrap gap-2">
        <select className="input w-auto py-2" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="activas">Activas</option>
          <option value="todas">Todas</option>
          {(Object.keys(OBRA_STATUS_LABEL) as ObraStatus[]).map((s) => <option key={s} value={s}>{OBRA_STATUS_LABEL[s]}</option>)}
        </select>
        <input className="input py-2 flex-1 min-w-[160px]" placeholder="Buscar obra o cliente" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {list.length === 0 ? (
        <Empty title="No hay obras" hint="Creá una obra desde un presupuesto aceptado." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {list.map((o) => {
            const f = obraFinance(o, data)
            return (
              <button key={o.id} onClick={() => navigate('obras/' + o.id)} className="card p-4 text-left hover:border-romero-ink/30 transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold truncate">{o.name}</div>
                    <div className="text-[12px] text-romero-gray-3 truncate">{o.client || 'Sin cliente'}{o.address ? ` · ${o.address}` : ''}</div>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mt-3"><ProgressBar pct={f.collectedPct} /></div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-[12px]">
                  <div><div className="text-romero-gray-3">Total</div><div className="font-bold">{formatMoney(f.total)}</div></div>
                  <div><div className="text-romero-gray-3">Resta cobrar</div><div className="font-bold">{formatMoney(f.pending)}</div></div>
                  <div><div className="text-romero-gray-3">Ganancia est.</div><div className={`font-bold ${f.estimatedProfit < 0 ? 'text-red-700' : ''}`}>{formatMoney(f.estimatedProfit)}</div></div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {editing && <ObraForm initial={editing} onClose={() => setEditing(null)} onSaved={(o) => navigate('obras/' + o.id)} />}
    </Page>
  )
}

// ─── Detalle ──────────────────────────────────────────────────────────────────

export function ObraDetail({ id }: { id: string }) {
  const { data, navigate, docs, remove, voidMovement } = useCrm()
  const obra = data.obras.find((o) => o.id === id)
  const [editing, setEditing] = useState(false)
  const [movement, setMovement] = useState<Movement | null>(null)
  const [stockOut, setStockOut] = useState<StockMove | null>(null)
  const [warranty, setWarranty] = useState<Warranty | null>(null)
  const [tab, setTab] = useState<'cobros' | 'gastos' | 'materiales' | 'garantias'>('cobros')

  if (!obra) {
    return (
      <Page title="Obra no encontrada">
        <button className="btn-ghost" onClick={() => navigate('obras')}>← Volver a obras</button>
      </Page>
    )
  }

  const f = obraFinance(obra, data)
  const budget = obra.budgetId ? data.budgets.find((b) => b.id === obra.budgetId) : undefined
  const receipts = obraReceipts(obra, data)
  const incomes = data.movements.filter((m) => m.obraId === obra.id && m.type === 'ingreso')
  const expenses = data.movements.filter((m) => m.obraId === obra.id && m.type === 'egreso')
  const materials = obraMaterials(obra, data)
  const warranties = data.warranties.filter((w) => w.obraId === obra.id)

  const onVoid = (m: Movement) => {
    const reason = prompt('Motivo de la anulación:')
    if (reason !== null) voidMovement(m, reason)
  }

  return (
    <Page
      title={obra.name}
      subtitle={[obra.client, obra.address].filter(Boolean).join(' · ')}
      action={
        <>
          <button className="btn-ghost py-2 text-[13px]" onClick={() => navigate('obras')}>← Obras</button>
          <button className="btn-ghost py-2 text-[13px]" onClick={() => setEditing(true)}>Editar</button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <StatusBadge status={obra.status} />
        {budget && (
          <button className="text-[12px] underline text-romero-gray-3" onClick={() => docs.viewBudget(budget.id)}>
            Presupuesto N° {budget.number}
          </button>
        )}
        {obra.startDate && <span className="text-[12px] text-romero-gray-3">Inicio {formatLongDate(obra.startDate)}</span>}
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <button className="btn-yellow py-2.5 text-[13px]" onClick={() =>
          docs.newReceipt({ obraId: obra.id, budgetId: budget?.id, budgetNumber: budget?.number, client: obra.client, address: obra.address, concept: `Pago obra ${obra.name}` })}>
          + Recibo de cobro
        </button>
        <button className="btn-ghost py-2.5 text-[13px]" onClick={() => setMovement(makeMovement({ obraId: obra.id }))}>+ Gasto</button>
        <button className="btn-ghost py-2.5 text-[13px]" onClick={() => setStockOut(makeStockOut(obra.id))}>+ Material de stock</button>
        <button className="btn-ghost py-2.5 text-[13px]" onClick={() =>
          setWarranty(makeWarranty({ obraId: obra.id, client: obra.client, address: obra.address, work: budget?.workTitle ?? obra.name, startDate: obra.endDate || today() }))}>
          + Garantía
        </button>
      </div>

      {/* Resumen financiero */}
      <div className="card p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div><div className="label">Presupuesto total</div><div className="text-[18px] font-extrabold">{formatMoney(f.total)}</div></div>
          <div><div className="label">Total cobrado</div><div className="text-[18px] font-extrabold text-emerald-700">{formatMoney(f.collected)}</div></div>
          <div><div className="label">Gastos registrados</div><div className="text-[18px] font-extrabold text-red-700">{formatMoney(f.expenses)}</div></div>
          <div><div className="label">Resta cobrar</div><div className="text-[18px] font-extrabold">{formatMoney(f.pending)}</div></div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-[12px] mb-1">
            <span className="text-romero-gray-3">Cobrado del presupuesto</span>
            <b>{formatNumber(f.collectedPct)}%</b>
          </div>
          <ProgressBar pct={f.collectedPct} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div className="rounded-xl bg-romero-gray p-3">
            <div className="label">Ganancia estimada actual</div>
            <div className={`text-[20px] font-extrabold ${f.estimatedProfit < 0 ? 'text-red-700' : ''}`}>{formatMoney(f.estimatedProfit)}</div>
            <div className="text-[12px] text-romero-gray-3 mt-1">
              Presupuesto menos gastos registrados. No representa la ganancia definitiva hasta contabilizar todos los costos de la obra.
            </div>
          </div>
          <div className="rounded-xl bg-romero-gray p-3">
            <div className="label">Ganancia real a hoy</div>
            <div className={`text-[20px] font-extrabold ${f.realProfit < 0 ? 'text-red-700' : 'text-emerald-700'}`}>{formatMoney(f.realProfit)}</div>
            <div className="text-[12px] text-romero-gray-3 mt-1">Cobrado menos gastos: lo que efectivamente quedó hasta ahora.</div>
          </div>
        </div>
      </div>

      {/* Detalle */}
      <div className="mt-6">
        <Segmented value={tab} onChange={setTab} options={[
          { value: 'cobros', label: `Cobros (${receipts.length + incomes.length})` },
          { value: 'gastos', label: `Gastos (${expenses.length})` },
          { value: 'materiales', label: `Materiales (${materials.length})` },
          { value: 'garantias', label: `Garantías (${warranties.length})` },
        ]} />
      </div>

      <div className="mt-3">
        {tab === 'cobros' && (
          receipts.length + incomes.length === 0 ? <Empty title="Sin cobros registrados" /> : (
            <div className="card divide-y divide-romero-gray-2">
              {receipts.map((r) => (
                <button key={r.id} className="w-full text-left px-4 py-3 flex justify-between gap-3 hover:bg-romero-gray" onClick={() => docs.viewReceipt(r.id)}>
                  <div className="min-w-0">
                    <div className="text-[12px] text-romero-gray-3">{formatLongDate(r.date)} · Recibo N° {r.number} · {r.paymentMethod}</div>
                    <div className="text-[14px] truncate">{r.concept}</div>
                  </div>
                  <b className="text-emerald-700 shrink-0">{formatMoney(r.amount)}</b>
                </button>
              ))}
              {incomes.map((m) => <MovementRow key={m.id} m={m} onEdit={() => setMovement(m)} onVoid={() => onVoid(m)} />)}
            </div>
          )
        )}
        {tab === 'gastos' && (
          expenses.length === 0 ? <Empty title="Sin gastos registrados" /> : (
            <div className="card divide-y divide-romero-gray-2">
              {expenses.map((m) => <MovementRow key={m.id} m={m} onEdit={() => setMovement(m)} onVoid={() => onVoid(m)} />)}
            </div>
          )
        )}
        {tab === 'materiales' && (
          materials.length === 0 ? <Empty title="Sin materiales" hint="Asigná materiales del stock o registrá un gasto en la categoría Materiales." /> : (
            <div className="card divide-y divide-romero-gray-2">
              {materials.map((mt) => (
                <div key={mt.id} className="px-4 py-3 flex justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[12px] text-romero-gray-3">
                      {formatLongDate(mt.date)} · <Badge tone={mt.source === 'stock' ? 'info' : 'default'}>{mt.source === 'stock' ? 'Del stock' : 'Compra directa'}</Badge>
                    </div>
                    <div className="text-[14px] truncate">{mt.name}{mt.qty ? ` · ${formatNumber(mt.qty, 2)} ${mt.unit}` : ''}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <b>{formatMoney(mt.cost)}</b>
                    {mt.source === 'stock' && (
                      <div>
                        <button className="text-[12px] underline text-red-600" onClick={() => { if (confirm('¿Devolver este material al stock?')) remove('stock_moves', mt.id) }}>
                          Devolver al stock
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
        {tab === 'garantias' && (
          warranties.length === 0 ? <Empty title="Sin garantías" /> : (
            <div className="card divide-y divide-romero-gray-2">
              {warranties.map((w) => (
                <button key={w.id} className="w-full text-left px-4 py-3 hover:bg-romero-gray" onClick={() => navigate('garantias/' + w.id)}>
                  <div className="text-[12px] text-romero-gray-3">N° {w.number} · desde {formatLongDate(w.startDate)} · {w.months} meses</div>
                  <div className="text-[14px] truncate">{w.work}</div>
                </button>
              ))}
            </div>
          )
        )}
      </div>

      {obra.notes && <div className="card p-4 mt-4 text-[14px] whitespace-pre-wrap">{obra.notes}</div>}

      <div className="mt-6 text-right">
        <button className="text-[12px] underline text-red-600" onClick={() => {
          if (confirm('¿Eliminar esta obra? Los movimientos y recibos quedan en caja, sin obra asignada.')) { remove('obras', obra.id); navigate('obras') }
        }}>
          Eliminar obra
        </button>
      </div>

      {editing && <ObraForm initial={obra} onClose={() => setEditing(false)} />}
      {movement && <MovementForm initial={movement} onClose={() => setMovement(null)} lockType={!!movement.debtId} />}
      {stockOut && <StockOutForm initial={stockOut} onClose={() => setStockOut(null)} />}
      {warranty && <WarrantyForm initial={warranty} onClose={() => setWarranty(null)} onSaved={(w) => navigate('garantias/' + w.id)} />}
    </Page>
  )
}

function makeStockOut(obraId: string): StockMove {
  return { id: newId(), createdAt: 0, updatedAt: 0, itemId: '', date: today(), qty: 0, unitCost: 0, obraId, note: '' }
}

function MovementRow({ m, onEdit, onVoid }: { m: Movement; onEdit: () => void; onVoid: () => void }) {
  return (
    <div className={`px-4 py-3 flex justify-between gap-3 ${m.voided ? 'opacity-50' : ''}`}>
      <div className="min-w-0">
        <div className="text-[12px] text-romero-gray-3 flex flex-wrap gap-1.5 items-center">
          {formatLongDate(m.date)} · {m.method} <Badge>{m.category}</Badge>
          {m.voided && <Badge tone="bad">Anulado</Badge>}
        </div>
        <div className={`text-[14px] truncate ${m.voided ? 'line-through' : ''}`}>{m.description || '—'}</div>
      </div>
      <div className="text-right shrink-0">
        <b className={m.type === 'ingreso' ? 'text-emerald-700' : 'text-red-700'}>{formatMoney(m.amount)}</b>
        {!m.voided && (
          <div className="flex gap-2 justify-end text-[12px]">
            <button className="underline text-romero-gray-3" onClick={onEdit}>Editar</button>
            <button className="underline text-red-600" onClick={onVoid}>Anular</button>
          </div>
        )}
      </div>
    </div>
  )
}
