import { useMemo, useState } from 'react'
import { useCrm } from '../CrmContext'
import { Badge, Empty, Field, Modal, ObraSelect, Page, Segmented } from '../ui'
import { MovementMethod, StockItem, StockMove, newId, today } from '../../types/crm'
import { makeMovement } from '../MovementForm'
import { isLowStock, stockQty } from '../../utils/crmCalc'
import { MoneyInput } from '../../components/MoneyInput'
import { formatMoney, formatLongDate, formatNumber } from '../../utils/money'

const num = (v: string) => Number(v.replace(',', '.')) || 0

function makeItem(): StockItem {
  return { id: newId(), createdAt: 0, updatedAt: 0, name: '', unit: 'unidad', minStock: 0, unitCost: 0 }
}

function makeMove(preset: Partial<StockMove>): StockMove {
  return { id: newId(), createdAt: 0, updatedAt: 0, itemId: '', date: today(), qty: 0, unitCost: 0, note: '', ...preset }
}

// ─── Formularios ──────────────────────────────────────────────────────────────

function ItemForm({ initial, onClose }: { initial: StockItem; onClose: () => void }) {
  const { save } = useCrm()
  const [it, setIt] = useState(initial)
  return (
    <Modal title={initial.createdAt ? 'Editar material' : 'Nuevo material'} onClose={onClose}
      footer={<>
        <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
        <button className="btn-primary flex-1" disabled={!it.name.trim()} onClick={() => { save('stock_items', it); onClose() }}>Guardar</button>
      </>}>
      <Field label="Nombre *">
        <input className="input" value={it.name} onChange={(e) => setIt({ ...it, name: e.target.value })} placeholder="Membrana ECO DRY" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Unidad">
          <input className="input" value={it.unit} onChange={(e) => setIt({ ...it, unit: e.target.value })} placeholder="rollo, m², kg" />
        </Field>
        <Field label="Stock mínimo">
          <input className="input" inputMode="decimal" value={it.minStock || ''} onChange={(e) => setIt({ ...it, minStock: num(e.target.value) })} />
        </Field>
      </div>
      <Field label="Costo unitario de referencia">
        <MoneyInput value={it.unitCost} onChange={(n) => setIt({ ...it, unitCost: n })} />
      </Field>
    </Modal>
  )
}

/** Compra de stock: entra el material y sale la plata de caja en un solo paso. */
function PurchaseForm({ item, onClose }: { item: StockItem; onClose: () => void }) {
  const { save } = useCrm()
  const [qty, setQty] = useState('')
  const [unitCost, setUnitCost] = useState(item.unitCost)
  const [date, setDate] = useState(today())
  const [method, setMethod] = useState<MovementMethod>('Efectivo')
  const [paid, setPaid] = useState(true)
  const q = num(qty)
  const total = q * unitCost

  const submit = () => {
    const move = makeMove({ itemId: item.id, date, qty: q, unitCost, note: 'Compra' })
    save('stock_moves', move)
    if (paid && total > 0) {
      save('movements', makeMovement({
        date, type: 'egreso', category: 'Materiales', amount: total, method,
        description: `Compra stock: ${formatNumber(q, 2)} ${item.unit} ${item.name}`,
        stockMoveId: move.id,
      }))
    }
    if (unitCost !== item.unitCost) save('stock_items', { ...item, unitCost })
    onClose()
  }

  return (
    <Modal title={`Compra · ${item.name}`} onClose={onClose}
      footer={<>
        <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
        <button className="btn-primary flex-1" disabled={q <= 0} onClick={submit}>Registrar compra</button>
      </>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`Cantidad (${item.unit})`}>
          <input className="input" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        <Field label="Costo unitario">
          <MoneyInput value={unitCost} onChange={setUnitCost} />
        </Field>
      </div>
      <Field label="Fecha">
        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <label className="flex items-center gap-2 text-[14px]">
        <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
        Descontar de caja ({formatMoney(total)})
      </label>
      {paid && (
        <Segmented value={method} onChange={setMethod} options={(['Efectivo', 'Transferencia', 'Cheque'] as MovementMethod[]).map((m) => ({ value: m, label: m }))} />
      )}
      {!paid && <p className="text-[12px] text-romero-gray-3">Si lo compraste a cuenta, cargá la deuda en Deudas y registrá el pago desde ahí.</p>}
    </Modal>
  )
}

/** Salida de stock hacia una obra (o ajuste si no hay obra). No mueve caja. */
export function StockOutForm({ initial, onClose }: { initial: StockMove; onClose: () => void }) {
  const { save, data } = useCrm()
  const [m, setM] = useState<StockMove>(initial)
  const [qty, setQty] = useState(initial.qty ? String(-initial.qty) : '')
  const item = data.stock_items.find((i) => i.id === m.itemId)
  const available = item ? stockQty(item, data) : 0
  const q = num(qty)

  return (
    <Modal title="Usar material del stock" onClose={onClose}
      footer={<>
        <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
        <button className="btn-primary flex-1" disabled={!item || q <= 0}
          onClick={() => { save('stock_moves', { ...m, qty: -q, unitCost: item!.unitCost }); onClose() }}>
          Guardar
        </button>
      </>}>
      <Field label="Material">
        <select className="input" value={m.itemId} onChange={(e) => setM({ ...m, itemId: e.target.value })}>
          <option value="">— Elegir —</option>
          {data.stock_items.map((i) => <option key={i.id} value={i.id}>{i.name} ({formatNumber(stockQty(i, data), 2)} {i.unit})</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`Cantidad${item ? ` (${item.unit})` : ''}`}>
          <input className="input" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        <Field label="Fecha">
          <input type="date" className="input" value={m.date} onChange={(e) => setM({ ...m, date: e.target.value })} />
        </Field>
      </div>
      <Field label="Obra">
        <ObraSelect value={m.obraId} onChange={(id) => setM({ ...m, obraId: id })} emptyLabel="— Ajuste / pérdida (sin obra) —" />
      </Field>
      <Field label="Nota">
        <input className="input" value={m.note} onChange={(e) => setM({ ...m, note: e.target.value })} />
      </Field>
      {item && q > available && <p className="text-[12px] text-amber-700">Atención: hay {formatNumber(available, 2)} {item.unit} en stock.</p>}
      {item && q > 0 && <p className="text-[12px] text-romero-gray-3">Costo imputado a la obra: {formatMoney(q * item.unitCost)}</p>}
    </Modal>
  )
}

/** Corrige la cantidad: se carga lo que hay realmente y se registra la diferencia como ajuste. */
function AdjustForm({ item, onClose }: { item: StockItem; onClose: () => void }) {
  const { save, data } = useCrm()
  const current = stockQty(item, data)
  const [real, setReal] = useState(String(current))
  const [note, setNote] = useState('')
  const target = num(real)
  const diff = target - current

  return (
    <Modal title={`Ajustar · ${item.name}`} onClose={onClose}
      footer={<>
        <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
        <button className="btn-primary flex-1" disabled={diff === 0 || real.trim() === ''}
          onClick={() => {
            save('stock_moves', makeMove({ itemId: item.id, qty: diff, unitCost: item.unitCost, note: note.trim() ? `Ajuste: ${note.trim()}` : 'Ajuste de stock' }))
            onClose()
          }}>
          Guardar ajuste
        </button>
      </>}>
      <p className="text-[13px] text-romero-gray-3">En el sistema hay <b className="text-romero-ink">{formatNumber(current, 2)} {item.unit}</b>.</p>
      <Field label={`Cantidad real en depósito (${item.unit})`}>
        <input className="input text-[18px] font-bold" inputMode="decimal" autoFocus value={real} onChange={(e) => setReal(e.target.value)} />
      </Field>
      <Field label="Motivo (opcional)">
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Conteo, pérdida, rotura…" />
      </Field>
      {diff !== 0 && real.trim() !== '' && (
        <p className="text-[13px] font-semibold">
          Se registra un ajuste de <span className={diff > 0 ? 'text-emerald-700' : 'text-red-700'}>{diff > 0 ? '+' : ''}{formatNumber(diff, 2)} {item.unit}</span>. No mueve la caja.
        </p>
      )}
    </Modal>
  )
}

/** Edita un movimiento ya cargado. Si era una compra, también corrige el egreso de caja. */
function EditMoveForm({ move, onClose }: { move: StockMove; onClose: () => void }) {
  const { save, data } = useCrm()
  const item = data.stock_items.find((i) => i.id === move.itemId)
  const linked = data.movements.find((x) => x.stockMoveId === move.id && !x.voided)
  const isEntry = move.qty > 0
  const [qty, setQty] = useState(String(Math.abs(move.qty)))
  const [unitCost, setUnitCost] = useState(move.unitCost)
  const [date, setDate] = useState(move.date)
  const [note, setNote] = useState(move.note)
  const [obraId, setObraId] = useState<string | undefined>(move.obraId)
  const q = num(qty)

  const submit = () => {
    const signed = isEntry ? q : -q
    save('stock_moves', { ...move, qty: signed, unitCost: isEntry ? unitCost : move.unitCost, date, note, obraId: isEntry ? undefined : obraId })
    if (linked) save('movements', { ...linked, amount: q * unitCost, date })
    onClose()
  }

  return (
    <Modal title={isEntry ? 'Editar entrada de stock' : 'Editar salida de stock'} onClose={onClose}
      footer={<>
        <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
        <button className="btn-primary flex-1" disabled={q <= 0} onClick={submit}>Guardar</button>
      </>}>
      <p className="text-[13px] text-romero-gray-3">{item?.name ?? 'Material'}</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`Cantidad${item ? ` (${item.unit})` : ''}`}>
          <input className="input" inputMode="decimal" autoFocus value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        <Field label="Fecha">
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      {isEntry ? (
        <Field label="Costo unitario">
          <MoneyInput value={unitCost} onChange={setUnitCost} />
        </Field>
      ) : (
        <Field label="Obra">
          <ObraSelect value={obraId} onChange={setObraId} emptyLabel="— Ajuste / pérdida (sin obra) —" />
        </Field>
      )}
      <Field label="Nota">
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      {isEntry && linked && (
        <p className="text-[12px] text-romero-gray-3">Esta compra salió de caja: el egreso se corrige a {formatMoney(q * unitCost)}.</p>
      )}
    </Modal>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export function Stock() {
  const { data, remove, obraById } = useCrm()
  const [itemForm, setItemForm] = useState<StockItem | null>(null)
  const [purchase, setPurchase] = useState<StockItem | null>(null)
  const [out, setOut] = useState<StockMove | null>(null)
  const [detail, setDetail] = useState<string | null>(null)
  const [adjust, setAdjust] = useState<StockItem | null>(null)
  const [editMove, setEditMove] = useState<StockMove | null>(null)

  const items = useMemo(() => [...data.stock_items].sort((a, b) => a.name.localeCompare(b.name)), [data.stock_items])
  const value = items.reduce((a, i) => a + Math.max(0, stockQty(i, data)) * i.unitCost, 0)

  const removeMove = (m: StockMove) => {
    if (!confirm('¿Eliminar este movimiento de stock? Si fue una compra, también se anula el egreso de caja.')) return
    remove('stock_moves', m.id)
    const linked = data.movements.find((x) => x.stockMoveId === m.id)
    if (linked) remove('movements', linked.id)
  }

  return (
    <Page title="Stock" subtitle={`Valor estimado en depósito: ${formatMoney(value)}`}
      action={<>
        <button className="btn-ghost py-2 text-[13px]" onClick={() => setOut(makeMove({}))}>Usar en obra</button>
        <button className="btn-yellow py-2 text-[13px]" onClick={() => setItemForm(makeItem())}>+ Material</button>
      </>}>
      {items.length === 0 ? (
        <Empty title="Sin materiales cargados" hint="Cargá los materiales que tenés en depósito." />
      ) : (
        <div className="card divide-y divide-romero-gray-2">
          {items.map((i) => {
            const qty = stockQty(i, data)
            const moves = data.stock_moves.filter((s) => s.itemId === i.id).sort((a, b) => b.date.localeCompare(a.date))
            return (
              <div key={i.id}>
                <div className="px-4 py-3 flex items-center gap-3">
                  <button className="min-w-0 flex-1 text-left" onClick={() => setDetail(detail === i.id ? null : i.id)}>
                    <div className="font-semibold truncate flex items-center gap-2">
                      {i.name} {isLowStock(i, data) && <Badge tone="warn">Stock bajo</Badge>}
                    </div>
                    <div className="text-[12px] text-romero-gray-3">
                      {formatMoney(i.unitCost)} / {i.unit}{i.minStock ? ` · mínimo ${formatNumber(i.minStock, 2)}` : ''}
                    </div>
                  </button>
                  <div className="text-right shrink-0">
                    <div className={`font-extrabold ${qty <= 0 ? 'text-red-700' : ''}`}>{formatNumber(qty, 2)} {i.unit}</div>
                  </div>
                </div>
                <div className="flex gap-2 px-4 pb-3">
                  <button className="btn-yellow flex-1 py-2 text-[13px]" onClick={() => setPurchase(i)}>+ Compra</button>
                  <button className="btn-ghost flex-1 py-2 text-[13px]" onClick={() => setAdjust(i)}>Ajustar</button>
                  <button className="btn-ghost flex-1 py-2 text-[13px]" onClick={() => setItemForm(i)}>Editar</button>
                </div>
                {detail === i.id && (
                  <div className="bg-romero-gray px-4 py-2 text-[13px]">
                    {moves.length === 0 ? <div className="text-romero-gray-3 py-1">Sin movimientos.</div> : moves.map((m) => (
                      <div key={m.id} className="flex justify-between gap-2 py-1">
                        <span className="truncate">
                          {formatLongDate(m.date)} · {m.qty > 0 ? 'Entrada' : obraById(m.obraId)?.name ?? 'Ajuste'}{m.note ? ` · ${m.note}` : ''}
                        </span>
                        <span className="shrink-0">
                          <b className={m.qty > 0 ? 'text-emerald-700' : 'text-red-700'}>{m.qty > 0 ? '+' : ''}{formatNumber(m.qty, 2)}</b>
                          <button className="ml-1 underline text-[12px]" onClick={() => setEditMove(m)}>Editar</button>
                          <button className="underline text-red-600 text-[12px]" onClick={() => removeMove(m)}>Eliminar</button>
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 pb-1">
                      <button className="text-[12px] underline text-red-600" onClick={() => {
                        if (confirm(`¿Eliminar ${i.name}? Los movimientos ya imputados a obras se mantienen.`)) remove('stock_items', i.id)
                      }}>Eliminar material</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {itemForm && <ItemForm initial={itemForm} onClose={() => setItemForm(null)} />}
      {purchase && <PurchaseForm item={purchase} onClose={() => setPurchase(null)} />}
      {out && <StockOutForm initial={out} onClose={() => setOut(null)} />}
      {adjust && <AdjustForm item={adjust} onClose={() => setAdjust(null)} />}
      {editMove && <EditMoveForm move={editMove} onClose={() => setEditMove(null)} />}
    </Page>
  )
}
