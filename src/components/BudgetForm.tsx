import { useMemo, useState } from 'react'
import { Budget, computeTotals } from '../types/budget'
import { MoneyInput } from './MoneyInput'
import { EditableList } from './EditableList'
import { BudgetPreview } from './BudgetPreview'
import { formatMoney } from '../utils/money'

interface Props {
  initial: Budget
  onCancel: () => void
  onSave: (b: Budget) => void
  onPreview: (b: Budget) => void
}

interface SectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function Section({ title, defaultOpen = true, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
      >
        <span className="font-bold text-[15px]">{title}</span>
        <span className="text-romero-gray-3 text-lg">{open ? '–' : '+'}</span>
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t border-romero-gray-2/70">{children}</div>}
    </div>
  )
}

export function BudgetForm({ initial, onCancel, onSave, onPreview }: Props) {
  const [b, setB] = useState<Budget>({ ...initial })

  const set = <K extends keyof Budget>(k: K, v: Budget[K]) => setB((p) => ({ ...p, [k]: v }))

  const totals = useMemo(() => computeTotals(b), [b])

  const errors: string[] = []
  if (!b.client.trim()) errors.push('Cliente es obligatorio')
  if (!b.address.trim()) errors.push('Dirección es obligatoria')
  if (!(b.squareMeters > 0)) errors.push('m² debe ser mayor a 0')
  if (!(b.pricePerM2 > 0)) errors.push('Precio por m² debe ser mayor a 0')
  if (b.advancePct + b.finalPct !== 100) errors.push('Anticipo + finalización debe sumar 100%')

  const canSave = errors.length === 0

  const save = () => {
    if (!canSave) return
    onSave({ ...b, updatedAt: Date.now() })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-32 pt-4 sm:pt-6">
      {/* Top bar */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onCancel} className="btn-ghost py-2 text-[13px]">← Volver</button>
        <div className="flex-1" />
        {/* Vista previa solo en desktop; en mobile está en la barra sticky del fondo */}
        <button
          onClick={() => onPreview({ ...b, updatedAt: Date.now() })}
          className="hidden lg:inline-flex btn-ghost py-2 text-[13px]"
        >
          Vista previa
        </button>
        <button onClick={save} className="btn-primary py-2 text-[13px]" disabled={!canSave}>
          Guardar
        </button>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-6">
        {/* Form */}
        <div className="space-y-4">
          <Section title="Datos del presupuesto">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Número</label>
                <input
                  className="input"
                  value={b.number}
                  onChange={(e) => set('number', e.target.value)}
                  placeholder="700 - 433"
                />
              </div>
              <div>
                <label className="label">Fecha</label>
                <input
                  type="date"
                  className="input"
                  value={b.date}
                  onChange={(e) => set('date', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Validez (días)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="input"
                  value={b.validityDays}
                  onChange={(e) => set('validityDays', Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="label">Tiempo de entrega</label>
                <input
                  className="input"
                  value={b.deliveryTime}
                  onChange={(e) => set('deliveryTime', e.target.value)}
                />
              </div>
            </div>
          </Section>

          <Section title="Cliente">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="label">Cliente *</label>
                <input
                  className="input"
                  value={b.client}
                  onChange={(e) => set('client', e.target.value)}
                  placeholder="Consorcio Castagnino"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Dirección *</label>
                <input
                  className="input"
                  value={b.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="Paz 1333"
                />
              </div>
              <div>
                <label className="label">Tipo de inmueble</label>
                <input
                  className="input"
                  value={b.propertyType}
                  onChange={(e) => set('propertyType', e.target.value)}
                  placeholder="Vivienda"
                />
              </div>
            </div>
          </Section>

          <Section title="Trabajo">
            <div className="space-y-3">
              <div>
                <label className="label">Título del trabajo</label>
                <input
                  className="input"
                  value={b.workTitle}
                  onChange={(e) => set('workTitle', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Descripción</label>
                <textarea
                  className="input min-h-[110px]"
                  value={b.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </div>
            </div>
          </Section>

          <Section title="Cálculo económico">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Metros cuadrados</label>
                <input
                  type="number"
                  inputMode="decimal"
                  className="input"
                  value={b.squareMeters || ''}
                  onChange={(e) => set('squareMeters', Number(e.target.value) || 0)}
                  placeholder="200"
                />
              </div>
              <div>
                <label className="label">Precio por m²</label>
                <MoneyInput
                  value={b.pricePerM2}
                  onChange={(n) => set('pricePerM2', n)}
                  placeholder="69.000"
                />
              </div>
              <div>
                <label className="label">Anticipo (%)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="input"
                  value={b.advancePct}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0
                    setB((p) => ({ ...p, advancePct: v, finalPct: 100 - v }))
                  }}
                />
              </div>
              <div>
                <label className="label">Finalización (%)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="input"
                  value={b.finalPct}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0
                    setB((p) => ({ ...p, finalPct: v, advancePct: 100 - v }))
                  }}
                />
              </div>
              <div className="sm:col-span-2 flex flex-wrap items-center gap-4 rounded-xl bg-romero-gray p-3">
                <label className="inline-flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-romero-ink"
                    checked={b.applyVat}
                    onChange={(e) => set('applyVat', e.target.checked)}
                  />
                  Calcular IVA
                </label>
                {b.applyVat && (
                  <>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-romero-ink"
                        checked={b.vatIncluded}
                        onChange={(e) => set('vatIncluded', e.target.checked)}
                      />
                      IVA incluido en el precio
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <span className="text-romero-gray-3">% IVA</span>
                      <input
                        type="number"
                        className="input w-24 py-2"
                        value={b.vatPct}
                        onChange={(e) => set('vatPct', Number(e.target.value) || 0)}
                      />
                    </label>
                  </>
                )}
              </div>

              <div className="sm:col-span-2 card p-4 bg-romero-gray border-romero-gray-2">
                <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                  <span className="text-romero-gray-3">Subtotal</span>
                  <span className="text-right font-semibold">{formatMoney(totals.subtotal)}</span>
                  {b.applyVat && (
                    <>
                      <span className="text-romero-gray-3">IVA ({b.vatPct}%)</span>
                      <span className="text-right font-semibold">{formatMoney(totals.vat)}</span>
                    </>
                  )}
                  <span className="font-bold">Total</span>
                  <span className="text-right font-extrabold text-base">{formatMoney(totals.total)}</span>
                  <span className="text-romero-gray-3">Anticipo {b.advancePct}%</span>
                  <span className="text-right font-semibold">{formatMoney(totals.advance)}</span>
                  <span className="text-romero-gray-3">Finalización {b.finalPct}%</span>
                  <span className="text-right font-semibold">{formatMoney(totals.final)}</span>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Etapas de obra" defaultOpen={false}>
            <EditableList
              items={b.stages}
              onChange={(items) => set('stages', items)}
              placeholder="Describir etapa…"
              addLabel="Agregar etapa"
            />
          </Section>

          <Section title="Materiales incluidos" defaultOpen={false}>
            <EditableList
              items={b.materials}
              onChange={(items) => set('materials', items)}
              placeholder="Material…"
              addLabel="Agregar material"
            />
          </Section>

          <Section title="Condiciones comerciales" defaultOpen={false}>
            <EditableList
              items={b.conditions}
              onChange={(items) => set('conditions', items)}
              placeholder="Condición…"
              addLabel="Agregar condición"
            />
          </Section>

          <Section title="Observaciones internas" defaultOpen={false}>
            <textarea
              className="input min-h-[100px]"
              value={b.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="No se imprime"
            />
          </Section>

          {errors.length > 0 && (
            <div className="card border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="font-bold mb-1">Revisá estos campos:</div>
              <ul className="list-disc pl-5 space-y-0.5">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Live preview desktop */}
        <div className="hidden lg:block">
          <div className="sticky top-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-romero-gray-3 mb-2">
              Vista previa en vivo
            </div>
            <div className="overflow-auto max-h-[calc(100vh-2rem)] rounded-2xl">
              <div className="origin-top-left scale-[0.85]">
                <BudgetPreview budget={b} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky save bar mobile */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur border-t border-romero-gray-2 px-4 py-3 flex gap-2">
        <button onClick={() => onPreview({ ...b, updatedAt: Date.now() })} className="btn-ghost flex-1">
          Vista previa
        </button>
        <button onClick={save} disabled={!canSave} className="btn-primary flex-1">
          Guardar
        </button>
      </div>
    </div>
  )
}
