import { useEffect, useMemo, useState } from 'react'
import { useCrm } from '../CrmContext'
import { Empty, Field, Modal, Page, StatusBadge } from '../ui'
import { obraFinance } from '../../utils/crmCalc'
import { computeTotals } from '../../types/budget'
import type { ClientRecord } from '../../utils/supabase'
import { formatMoney, formatLongDate } from '../../utils/money'

const norm = (s: string) => s.trim().toLowerCase()

function makeClient(name = ''): ClientRecord {
  return { id: crypto.randomUUID(), name, address: '', property_type: 'Vivienda', phone: '', notes: '', updated_at: 0 }
}

function ClientForm({ initial, onClose }: { initial: ClientRecord; onClose: () => void }) {
  const { saveClient } = useCrm()
  const [c, setC] = useState(initial)
  return (
    <Modal title={initial.updated_at ? 'Editar cliente' : 'Nuevo cliente'} onClose={onClose}
      footer={<>
        <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
        <button className="btn-primary flex-1" disabled={!c.name.trim()} onClick={() => { saveClient(c); onClose() }}>Guardar</button>
      </>}>
      <Field label="Nombre *"><input className="input" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} /></Field>
      <Field label="Teléfono / WhatsApp"><input className="input" inputMode="tel" value={c.phone ?? ''} onChange={(e) => setC({ ...c, phone: e.target.value })} placeholder="11 2345 6789" /></Field>
      <Field label="Dirección"><input className="input" value={c.address} onChange={(e) => setC({ ...c, address: e.target.value })} /></Field>
      <Field label="Tipo de inmueble"><input className="input" value={c.property_type} onChange={(e) => setC({ ...c, property_type: e.target.value })} /></Field>
      <Field label="Notas"><textarea className="input min-h-[70px]" value={c.notes ?? ''} onChange={(e) => setC({ ...c, notes: e.target.value })} /></Field>
    </Modal>
  )
}

export function Clientes() {
  const { data, clients, reloadClients, navigate, docs } = useCrm()
  const [q, setQ] = useState('')
  const [form, setForm] = useState<ClientRecord | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  // BudgetForm guarda clientes por su cuenta: releer al entrar.
  useEffect(() => { reloadClients() }, [reloadClients])

  const rows = useMemo(() => {
    // Clientes cargados + nombres que solo aparecen en presupuestos/obras/recibos
    const map = new Map<string, ClientRecord>()
    for (const c of clients) map.set(norm(c.name), c)
    for (const name of [...data.budgets.map((b) => b.client), ...data.obras.map((o) => o.client), ...data.receipts.map((r) => r.client)]) {
      if (name?.trim() && !map.has(norm(name))) map.set(norm(name), { ...makeClient(name.trim()), id: 'n:' + norm(name) })
    }
    const t = norm(q)
    return [...map.values()]
      .filter((c) => !t || norm(c.name).includes(t) || norm(c.address).includes(t) || (c.phone ?? '').includes(t))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => {
        const key = norm(c.name)
        const obras = data.obras.filter((o) => norm(o.client) === key)
        const budgets = data.budgets.filter((b) => norm(b.client) === key)
        const receipts = data.receipts.filter((r) => norm(r.client) === key)
        const pending = obras.filter((o) => o.status !== 'cancelada').reduce((a, o) => a + obraFinance(o, data).pending, 0)
        return { c, obras, budgets, receipts, pending, saved: clients.some((x) => x.id === c.id) }
      })
  }, [clients, data, q])

  return (
    <Page title="Clientes" action={<button className="btn-yellow py-2 text-[13px]" onClick={() => setForm(makeClient())}>+ Cliente</button>}>
      <input className="input mb-4" placeholder="Buscar por nombre, dirección o teléfono" value={q} onChange={(e) => setQ(e.target.value)} />
      {rows.length === 0 ? <Empty title="Sin clientes" /> : (
        <div className="card divide-y divide-romero-gray-2">
          {rows.map(({ c, obras, budgets, receipts, pending, saved }) => {
            const phone = (c.phone ?? '').replace(/\D/g, '')
            return (
              <div key={c.id}>
                <button className="w-full text-left px-4 py-3 flex justify-between gap-3 hover:bg-romero-gray" onClick={() => setOpen(open === c.id ? null : c.id)}>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{c.name}</div>
                    <div className="text-[12px] text-romero-gray-3 truncate">
                      {[c.phone, c.address].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                    </div>
                  </div>
                  <div className="text-right shrink-0 text-[12px]">
                    <div className="text-romero-gray-3">{obras.length} obra(s) · {budgets.length} presup.</div>
                    {pending > 0 && <div className="font-bold text-amber-700">Debe {formatMoney(pending)}</div>}
                  </div>
                </button>
                {open === c.id && (
                  <div className="bg-romero-gray px-4 py-3 text-[13px] space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <button className="btn-ghost py-1.5 text-[12px]" onClick={() => setForm(c)}>{saved ? 'Editar datos' : 'Guardar como cliente'}</button>
                      {phone && <a className="btn-ghost py-1.5 text-[12px]" href={`https://wa.me/${phone.startsWith('54') ? phone : '54' + phone}`} target="_blank" rel="noreferrer">WhatsApp</a>}
                      <button className="btn-ghost py-1.5 text-[12px]" onClick={() => docs.newReceipt({ client: c.name, address: c.address })}>+ Recibo</button>
                    </div>
                    {c.notes && <div className="whitespace-pre-wrap">{c.notes}</div>}
                    {obras.length > 0 && (
                      <div>
                        <div className="label">Obras</div>
                        {obras.map((o) => (
                          <button key={o.id} className="w-full flex justify-between gap-2 py-1 text-left hover:underline" onClick={() => navigate('obras/' + o.id)}>
                            <span className="truncate">{o.name}</span><StatusBadge status={o.status} />
                          </button>
                        ))}
                      </div>
                    )}
                    {budgets.length > 0 && (
                      <div>
                        <div className="label">Presupuestos</div>
                        {budgets.map((b) => (
                          <button key={b.id} className="w-full flex justify-between gap-2 py-1 text-left hover:underline" onClick={() => docs.viewBudget(b.id)}>
                            <span className="truncate">N° {b.number} · {formatLongDate(b.date)}</span><b>{formatMoney(computeTotals(b).total)}</b>
                          </button>
                        ))}
                      </div>
                    )}
                    {receipts.length > 0 && (
                      <div>
                        <div className="label">Recibos</div>
                        {receipts.map((r) => (
                          <button key={r.id} className="w-full flex justify-between gap-2 py-1 text-left hover:underline" onClick={() => docs.viewReceipt(r.id)}>
                            <span className="truncate">N° {r.number} · {formatLongDate(r.date)}</span><b>{formatMoney(r.amount)}</b>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      {form && <ClientForm initial={form} onClose={() => setForm(null)} />}
    </Page>
  )
}
