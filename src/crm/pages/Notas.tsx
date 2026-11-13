import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useCrm } from '../CrmContext'
import { Empty, Field, Page } from '../ui'
import { Nota, newId, today } from '../../types/crm'
import { PrintActions } from '../../components/PrintActions'
import { BrandLogo } from '../../components/BrandLogo'
import { Scaler } from '../../components/BudgetPreview'
import { formatLongDate } from '../../utils/money'

const INK = '#0B0B0B'
const YELLOW = '#FFD60A'
const GRAY = '#9CA3AF'

/** Modelos para arrancar rápido; después se edita el texto libremente. */
const TEMPLATES: { label: string; subject: string; body: string }[] = [
  {
    label: 'Suspensión por lluvia',
    subject: 'Reprogramación de trabajos por condiciones climáticas',
    body: 'Por medio de la presente le informamos que, debido a las lluvias pronosticadas, mañana no podremos realizar los trabajos previstos en su obra.\n\nPara garantizar la correcta aplicación de los materiales y la calidad del trabajo, la tarea se reprogramará para el próximo día hábil con buen tiempo. Nos comunicaremos con usted para confirmar la nueva fecha.\n\nDisculpe las molestias ocasionadas.',
  },
  {
    label: 'Aviso de visita',
    subject: 'Aviso de visita técnica',
    body: 'Por medio de la presente le informamos que el día ____ a las ____ hs. realizaremos una visita técnica a su domicilio para relevar el estado de la superficie y tomar las medidas necesarias.\n\nLe solicitamos que alguien pueda recibirnos y facilitar el acceso a la zona de trabajo.',
  },
  {
    label: 'Recordatorio de pago',
    subject: 'Recordatorio de pago',
    body: 'Por medio de la presente le recordamos que se encuentra pendiente el pago correspondiente a los trabajos realizados.\n\nLe agradecemos que pueda regularizarlo a la brevedad. Ante cualquier consulta, quedamos a su disposición.',
  },
  {
    label: 'Fin de obra',
    subject: 'Finalización de trabajos',
    body: 'Por medio de la presente le informamos que hemos finalizado los trabajos de impermeabilización en su propiedad.\n\nLe recordamos realizar un mantenimiento periódico de la superficie para conservar el sistema aplicado en óptimas condiciones.\n\nAgradecemos su confianza.',
  },
]

function nextNumber(list: Nota[]): string {
  const max = list.reduce((a, n) => Math.max(a, parseInt(n.number, 10) || 0), 0)
  return String(max + 1).padStart(3, '0')
}

export function makeNota(list: Nota[]): Nota {
  return { id: newId(), createdAt: 0, updatedAt: 0, number: nextNumber(list), date: today(), to: '', subject: '', body: '' }
}

// ─── Hoja A4 membretada ───────────────────────────────────────────────────────

function NotaSheet({ nota }: { nota: Nota }) {
  const page = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState(14)
  const [overflow, setOverflow] = useState(false)

  // Si el texto no entra, se achica la letra (hasta 11 px) para que todo quede en una hoja.
  useLayoutEffect(() => { setFontSize(14) }, [nota.body, nota.subject, nota.to])
  useEffect(() => {
    const el = page.current
    if (!el) return
    const over = el.scrollHeight > el.clientHeight + 1
    if (over && fontSize > 11) setFontSize((f) => Math.round((f - 0.5) * 10) / 10)
    else setOverflow(over)
  }, [fontSize, nota.body, nota.subject, nota.to])

  return (
    <div>
      {overflow && (
        <div className="no-print mx-auto mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-semibold text-amber-800" style={{ maxWidth: 794 }}>
          El texto no entra en una hoja: se está cortando. Acortalo un poco.
        </div>
      )}
      <Scaler>
        <article className="budget-sheet">
          <section ref={page} data-page className="budget-page">
            {/* Membrete */}
            <header style={{ position: 'relative', background: INK, color: 'white', padding: '22px 40px 20px' }}>
              <div aria-hidden style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: YELLOW }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ background: 'white', borderRadius: 10, padding: '6px 10px' }}>
                  <BrandLogo variant="compact" />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="font-display" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.15 }}>Lucas Gallastagui</div>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.24em', color: YELLOW, marginTop: 4 }}>
                    Impermeabilizaciones
                  </div>
                  <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.75)', marginTop: 8 }}>Tandil · +54 9 2494 60-1118</div>
                </div>
              </div>
            </header>
            <div style={{ height: 5, background: YELLOW }} />

            {/* Cuerpo */}
            <section style={{ padding: '34px 48px 0', display: 'flex', flexDirection: 'column', gap: 18, fontSize }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ minWidth: 0 }}>
                  {nota.to && (
                    <>
                      <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.22em', color: GRAY }}>Para</div>
                      <div style={{ fontSize: '1.15em', fontWeight: 700, marginTop: 2, overflowWrap: 'anywhere' }}>{nota.to}</div>
                    </>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, color: 'rgba(11,11,11,0.7)' }}>Tandil, {formatLongDate(nota.date)}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: GRAY, marginTop: 4 }}>Nota N° {nota.number}</div>
                </div>
              </div>

              {nota.subject && (
                <div style={{ borderLeft: `4px solid ${YELLOW}`, paddingLeft: 12 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.22em', color: GRAY }}>Asunto</div>
                  <div className="font-display" style={{ fontSize: '1.25em', fontWeight: 700, lineHeight: 1.25, marginTop: 2, overflowWrap: 'anywhere' }}>{nota.subject}</div>
                </div>
              )}

              <div style={{ lineHeight: 1.65, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: 'rgba(11,11,11,0.9)', minHeight: 40 }}>
                {nota.body || <span style={{ color: GRAY }}>(Escribí el texto de la nota)</span>}
              </div>
            </section>

            {/* Firma */}
            <section style={{ padding: '24px 48px 30px', marginTop: 'auto' }}>
              <div style={{ width: 240, marginLeft: 'auto', textAlign: 'center' }}>
                <div style={{ height: 48 }} />
                <div style={{ borderTop: `1px solid ${INK}`, paddingTop: 6, fontSize: 12, fontWeight: 700 }}>Lucas Gallastagui</div>
                <div style={{ fontSize: 10.5, color: GRAY }}>Impermeabilizaciones</div>
              </div>
            </section>

            <footer style={{ background: INK, color: 'white', padding: '14px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ height: 5, width: 28, backgroundColor: '#F5C800', borderRadius: 999 }} />
                <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.24em', color: '#F5C800' }}>
                  Lucas Gallastagui Impermeabilizaciones
                </div>
              </div>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.5)' }}>Revestech · Aplicador homologado CE</div>
            </footer>
          </section>
        </article>
      </Scaler>
    </div>
  )
}

// ─── Editor ───────────────────────────────────────────────────────────────────

function NotaEditor({ initial, onDone, onCancel }: { initial: Nota; onDone: (n: Nota) => void; onCancel: () => void }) {
  const { clients, data } = useCrm()
  const [n, setN] = useState<Nota>(initial)
  const set = <K extends keyof Nota>(k: K, v: Nota[K]) => setN((p) => ({ ...p, [k]: v }))
  const names = Array.from(new Set([...clients.map((c) => c.name), ...data.obras.map((o) => o.client)].filter(Boolean))).sort()

  return (
    <div className="mx-auto max-w-2xl px-4 pt-4 pb-28">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onCancel} className="btn-ghost py-2 text-[13px]">← Volver</button>
        <div className="flex-1" />
        <button onClick={() => onDone(n)} className="btn-primary py-2 text-[13px]" disabled={!n.body.trim()}>Ver nota</button>
      </div>

      <div className="card p-4 space-y-3">
        <div className="font-bold text-[15px]">Modelos rápidos</div>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              type="button"
              className="rounded-full border border-romero-gray-2 bg-white px-3 py-1.5 text-[13px] font-semibold hover:border-romero-ink/40"
              onClick={() => {
                if (n.body.trim() && !confirm('¿Reemplazar el texto actual por el modelo?')) return
                setN((p) => ({ ...p, subject: t.subject, body: t.body }))
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-4 mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha">
            <input type="date" className="input" value={n.date} onChange={(e) => set('date', e.target.value)} />
          </Field>
          <Field label="Número">
            <input className="input" value={n.number} onChange={(e) => set('number', e.target.value)} />
          </Field>
        </div>
        <Field label="Para (opcional)">
          <input className="input" list="nota-clientes" value={n.to} onChange={(e) => set('to', e.target.value)} placeholder="Cliente o destinatario" />
          <datalist id="nota-clientes">{names.map((x) => <option key={x} value={x} />)}</datalist>
        </Field>
        <Field label="Asunto (opcional)">
          <input className="input" value={n.subject} onChange={(e) => set('subject', e.target.value)} placeholder="Ej: Reprogramación por lluvia" />
        </Field>
        <Field label="Texto *">
          <textarea
            className="input min-h-[260px] leading-relaxed"
            value={n.body}
            autoFocus
            onChange={(e) => set('body', e.target.value)}
            placeholder="Ej: Mañana no podremos ir porque está pronosticada lluvia…"
          />
        </Field>
      </div>

      <div className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur border-t border-romero-gray-2 px-4 py-3 flex gap-2">
        <button onClick={onCancel} className="btn-ghost flex-1">Cancelar</button>
        <button onClick={() => onDone(n)} disabled={!n.body.trim()} className="btn-primary flex-1">Ver nota</button>
      </div>
    </div>
  )
}

// ─── Vista de una nota (editar / ver e imprimir) ──────────────────────────────

export function NotaView({ id }: { id: string }) {
  const { data, save, navigate, remove } = useCrm()
  const nota = data.notes.find((x) => x.id === id)
  const [editing, setEditing] = useState(() => !nota || !nota.body.trim())

  if (!nota) {
    return <Page title="Nota no encontrada"><button className="btn-ghost" onClick={() => navigate('notas')}>← Volver</button></Page>
  }

  if (editing) {
    return (
      <NotaEditor
        initial={nota}
        onCancel={() => { if (!nota.body.trim()) { remove('notes', nota.id); navigate('notas') } else setEditing(false) }}
        onDone={(n) => { save('notes', n); setEditing(false) }}
      />
    )
  }

  return (
    <>
      <PrintActions onBack={() => navigate('notas')} onEdit={() => setEditing(true)} clientName={nota.to} docType="nota" />
      <main className="px-3 sm:px-6 py-4 sm:py-8 print:p-0">
        <NotaSheet nota={nota} />
        <div className="no-print text-center mt-4">
          <button className="text-[12px] underline text-red-600" onClick={() => { if (confirm('¿Eliminar esta nota?')) { remove('notes', nota.id); navigate('notas') } }}>
            Eliminar nota
          </button>
        </div>
      </main>
    </>
  )
}

// ─── Lista ────────────────────────────────────────────────────────────────────

export function NotasList() {
  const { data, save, navigate } = useCrm()
  const list = [...data.notes].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)

  const create = () => {
    const n = makeNota(data.notes)
    save('notes', n)
    navigate('notas/' + n.id)
  }

  return (
    <Page title="Notas" subtitle="Hojas con membrete para avisos a clientes: imprimir, PDF o WhatsApp"
      action={<button className="btn-yellow py-2 text-[13px]" onClick={create}>+ Nueva nota</button>}>
      {list.length === 0 ? (
        <Empty title="Todavía no hay notas" hint="Por ejemplo: aviso de suspensión por lluvia." />
      ) : (
        <div className="card divide-y divide-romero-gray-2">
          {list.map((n) => (
            <button key={n.id} onClick={() => navigate('notas/' + n.id)} className="w-full text-left px-4 py-3 hover:bg-romero-gray">
              <div className="text-[12px] text-romero-gray-3">N° {n.number} · {formatLongDate(n.date)}{n.to ? ` · ${n.to}` : ''}</div>
              <div className="font-semibold truncate">{n.subject || n.body.split('\n')[0] || 'Nota sin texto'}</div>
            </button>
          ))}
        </div>
      )}
    </Page>
  )
}
