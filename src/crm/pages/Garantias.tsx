import { useState } from 'react'
import { useCrm } from '../CrmContext'
import { Badge, Empty, Field, Modal, ObraSelect, Page } from '../ui'
import { DEFAULT_WARRANTY_COVERAGE, DEFAULT_WARRANTY_EXCLUSIONS, Warranty, newId, today } from '../../types/crm'
import { daysUntil, warrantyEnd } from '../../utils/crmCalc'
import { PrintActions } from '../../components/PrintActions'
import { BrandLogo } from '../../components/BrandLogo'
import { formatLongDate } from '../../utils/money'

export function makeWarranty(preset: Partial<Warranty> = {}): Warranty {
  return {
    id: newId(),
    createdAt: 0,
    updatedAt: 0,
    number: '',
    client: '',
    address: '',
    work: '',
    startDate: today(),
    months: 24,
    coverage: DEFAULT_WARRANTY_COVERAGE,
    exclusions: DEFAULT_WARRANTY_EXCLUSIONS,
    ...preset,
  }
}

function nextNumber(list: Warranty[]): string {
  const max = list.reduce((a, w) => Math.max(a, parseInt(w.number, 10) || 0), 0)
  return String(max + 1).padStart(3, '0')
}

export function WarrantyForm({ initial, onClose, onSaved }: { initial: Warranty; onClose: () => void; onSaved?: (w: Warranty) => void }) {
  const { save, data } = useCrm()
  const [w, setW] = useState<Warranty>(() => ({ ...initial, number: initial.number || nextNumber(data.warranties) }))
  const set = <K extends keyof Warranty>(k: K, v: Warranty[K]) => setW((p) => ({ ...p, [k]: v }))

  const pickObra = (id?: string) => {
    const o = data.obras.find((x) => x.id === id)
    setW((p) => ({ ...p, obraId: id, ...(o ? { client: o.client, address: o.address, work: p.work || o.name } : {}) }))
  }

  return (
    <Modal title={initial.createdAt ? 'Editar garantía' : 'Nueva garantía'} onClose={onClose}
      footer={<>
        <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
        <button className="btn-primary flex-1" disabled={!w.client.trim()} onClick={() => { save('warranties', w); onSaved?.(w); onClose() }}>Guardar</button>
      </>}>
      <Field label="Obra">
        <ObraSelect value={w.obraId} onChange={pickObra} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Número"><input className="input" value={w.number} onChange={(e) => set('number', e.target.value)} /></Field>
        <Field label="Meses de garantía">
          <input className="input" inputMode="numeric" value={w.months || ''} onChange={(e) => set('months', parseInt(e.target.value, 10) || 0)} />
        </Field>
      </div>
      <Field label="Cliente *"><input className="input" value={w.client} onChange={(e) => set('client', e.target.value)} /></Field>
      <Field label="Dirección"><input className="input" value={w.address} onChange={(e) => set('address', e.target.value)} /></Field>
      <Field label="Trabajo realizado"><input className="input" value={w.work} onChange={(e) => set('work', e.target.value)} /></Field>
      <Field label="Fecha de inicio (entrega)">
        <input type="date" className="input" value={w.startDate} onChange={(e) => set('startDate', e.target.value)} />
      </Field>
      <Field label="Cobertura"><textarea className="input min-h-[80px]" value={w.coverage} onChange={(e) => set('coverage', e.target.value)} /></Field>
      <Field label="Exclusiones"><textarea className="input min-h-[80px]" value={w.exclusions} onChange={(e) => set('exclusions', e.target.value)} /></Field>
    </Modal>
  )
}

export function GarantiasList() {
  const { data, navigate } = useCrm()
  const [form, setForm] = useState<Warranty | null>(null)
  const list = [...data.warranties].sort((a, b) => b.startDate.localeCompare(a.startDate))

  return (
    <Page title="Garantías de obra" action={<button className="btn-yellow py-2 text-[13px]" onClick={() => setForm(makeWarranty())}>+ Garantía</button>}>
      {list.length === 0 ? <Empty title="Sin garantías emitidas" hint="Podés emitirlas desde la obra al finalizarla." /> : (
        <div className="card divide-y divide-romero-gray-2">
          {list.map((w) => {
            const end = warrantyEnd(w.startDate, w.months)
            const left = end ? daysUntil(end) : 0
            return (
              <button key={w.id} onClick={() => navigate('garantias/' + w.id)} className="w-full text-left px-4 py-3 flex justify-between gap-3 hover:bg-romero-gray">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{w.client}</div>
                  <div className="text-[12px] text-romero-gray-3 truncate">N° {w.number} · {w.work}</div>
                </div>
                <div className="text-right shrink-0 text-[12px]">
                  {left >= 0 ? <Badge tone="good">Vigente</Badge> : <Badge>Vencida</Badge>}
                  <div className="text-romero-gray-3 mt-1">hasta {formatLongDate(end)}</div>
                </div>
              </button>
            )
          })}
        </div>
      )}
      {form && <WarrantyForm initial={form} onClose={() => setForm(null)} onSaved={(w) => navigate('garantias/' + w.id)} />}
    </Page>
  )
}

export function GarantiaView({ id }: { id: string }) {
  const { data, navigate, remove } = useCrm()
  const [editing, setEditing] = useState(false)
  const w = data.warranties.find((x) => x.id === id)
  if (!w) {
    return <Page title="Garantía no encontrada"><button className="btn-ghost" onClick={() => navigate('garantias')}>← Volver</button></Page>
  }
  const end = warrantyEnd(w.startDate, w.months)

  return (
    <>
      <PrintActions onBack={() => navigate('garantias')} onEdit={() => setEditing(true)} clientName={w.client} docType="garantia" />
      <main className="px-3 sm:px-6 py-4 sm:py-8 print:p-0">
        <div className="sheet overflow-hidden" style={{ maxWidth: '680px' }}>
          <div style={{ backgroundColor: '#0B0B0B' }} className="px-8 pt-7 pb-6">
            <div className="flex items-center justify-between gap-6">
              <div className="rounded-xl px-3 py-2 shrink-0" style={{ backgroundColor: '#FFFFFF' }}>
                <BrandLogo variant="document" />
              </div>
              <div className="text-right">
                <div className="font-extrabold uppercase tracking-[0.22em]" style={{ fontSize: '24px', color: '#F5C800', lineHeight: 1 }}>GARANTÍA</div>
                <div className="font-semibold uppercase tracking-[0.16em] mt-1" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>de obra · N° {w.number}</div>
              </div>
            </div>
          </div>
          <div className="px-8 py-6 space-y-5 text-[14px]">
            <div className="grid grid-cols-2 gap-4">
              <div><div className="label">Cliente</div><div className="font-bold">{w.client}</div></div>
              <div><div className="label">Dirección</div><div className="font-medium">{w.address || '—'}</div></div>
              <div><div className="label">Vigencia desde</div><div className="font-medium">{formatLongDate(w.startDate)}</div></div>
              <div><div className="label">Vigencia hasta</div><div className="font-medium">{formatLongDate(end)} ({w.months} meses)</div></div>
            </div>
            <div><div className="label">Trabajo realizado</div><div className="font-medium">{w.work || '—'}</div></div>
            <div><div className="label">Cobertura</div><p className="leading-relaxed whitespace-pre-wrap">{w.coverage}</p></div>
            <div><div className="label">No cubre</div><p className="leading-relaxed whitespace-pre-wrap">{w.exclusions}</p></div>
            <p className="text-[12px] text-romero-gray-3">
              Para hacer válida la garantía, el cliente debe comunicar el inconveniente dentro del período de vigencia presentando este documento.
            </p>
            <div className="grid grid-cols-2 gap-8 pt-10">
              {['Firma y sello', 'Conformidad del cliente'].map((t) => (
                <div key={t} className="text-center">
                  <div className="border-t border-romero-ink pt-2 text-[12px] font-semibold">{t}</div>
                  {t === 'Firma y sello' && <div className="text-[11px] text-romero-gray-3">Lucas Gallastagui Impermeabilizaciones</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="no-print text-center mt-4">
          <button className="text-[12px] underline text-red-600" onClick={() => { if (confirm('¿Eliminar esta garantía?')) { remove('warranties', w.id); navigate('garantias') } }}>
            Eliminar garantía
          </button>
        </div>
      </main>
      {editing && <WarrantyForm initial={w} onClose={() => setEditing(false)} />}
    </>
  )
}
