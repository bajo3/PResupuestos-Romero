import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Budget, computeTotals } from '../types/budget'
import { formatMoney, formatNumber, formatLongDate } from '../utils/money'
import { BrandLogo } from './BrandLogo'

interface Props {
  budget: Budget
}

const PAGE_W = 794 // A4 a 96 dpi
const INK = '#0B0B0B'
const YELLOW = '#FFD60A'
const GRAY = '#9CA3AF'

// ─── Escala: el documento se maqueta siempre a tamaño A4 y se reduce en pantallas chicas ──

function Scaler({ children }: { children: ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [height, setHeight] = useState<number | undefined>(undefined)

  useLayoutEffect(() => {
    const fit = () => {
      if (!wrap.current || !inner.current) return
      const s = Math.min(1, wrap.current.clientWidth / PAGE_W)
      setScale(s)
      setHeight(inner.current.offsetHeight * s)
    }
    fit()
    const ro = new ResizeObserver(fit)
    if (wrap.current) ro.observe(wrap.current)
    if (inner.current) ro.observe(inner.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={wrap} className="budget-scaler" style={{ maxWidth: PAGE_W, margin: '0 auto', height }}>
      <div
        ref={inner}
        className="budget-scale-inner"
        style={{ width: PAGE_W, transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        {children}
      </div>
    </div>
  )
}

// ─── Piezas ───────────────────────────────────────────────────────────────────

function Label({ children, color = GRAY }: { children: ReactNode; color?: string }) {
  return (
    <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.22em', color }}>
      {children}
    </div>
  )
}

function SectionTitle({ n, label }: { n: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span className="font-display" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1, color: '#E6BE00' }}>{n}</span>
      <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.22em', color: INK }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: 'rgba(11,11,11,0.15)' }} />
    </div>
  )
}

function Footer({ budget, page }: { budget: Budget; page: string }) {
  return (
    <footer style={{ marginTop: 'auto', background: INK, color: 'white', padding: '16px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ height: 5, width: 28, backgroundColor: '#F5C800', borderRadius: 999 }} />
          <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.24em', color: '#F5C800' }}>
            Lucas Gallastagui Impermeabilizaciones
          </div>
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: 'white' }}>Tandil · +54 9 2494 60-1118</div>
      </div>
      <div style={{ marginTop: 8, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.45)' }}>
        Pres. N° {budget.number || '—'} · Revestech · Aplicador homologado CE · Hoja {page}
      </div>
    </footer>
  )
}

// ─── Documento ────────────────────────────────────────────────────────────────

export function BudgetPreview({ budget }: Props) {
  const t = computeTotals(budget)
  const photos = (budget.photos ?? []).slice(0, 6)
  const pending = budget.pricingMode === 'pending'
  const p1 = useRef<HTMLDivElement>(null)
  const p2 = useRef<HTMLDivElement>(null)
  const [overflow, setOverflow] = useState(false)

  useEffect(() => {
    const check = () => {
      const over = [p1.current, p2.current].some((el) => !!el && el.scrollHeight > el.clientHeight + 1)
      setOverflow(over)
    }
    check()
    const id = window.setTimeout(check, 400)
    void document.fonts?.ready.then(check)
    return () => window.clearTimeout(id)
  }, [budget])

  return (
    <div>
      {overflow && (
        <div className="no-print mx-auto mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-semibold text-amber-800" style={{ maxWidth: PAGE_W }}>
          El presupuesto no entra en 2 hojas: se está cortando contenido. Acortá textos, etapas o condiciones, o sacá alguna foto.
        </div>
      )}
      <Scaler>
        <article className="budget-sheet">
          {/* ================= HOJA 1 ================= */}
          <section ref={p1} data-page className="budget-page">
            {/* Cabecera */}
            <header style={{ position: 'relative', background: INK, color: 'white', padding: '22px 40px 20px', overflow: 'hidden' }}>
              <div aria-hidden style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: YELLOW }} />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ background: 'white', borderRadius: 10, padding: '6px 10px' }}>
                  <BrandLogo variant="compact" />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h1 className="font-display" style={{ fontSize: 38, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.01em', color: 'white', margin: 0 }}>
                    PRESUPUESTO
                  </h1>
                  <div style={{ marginTop: 8, display: 'inline-block', background: YELLOW, color: INK, borderRadius: 8, padding: '5px 12px', fontSize: 13, fontWeight: 800, letterSpacing: '0.08em' }}>
                    N° {budget.number || '—'}
                  </div>
                </div>
              </div>
            </header>

            {/* Fecha / validez / entrega */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, padding: '10px 40px', background: '#F4F4F5', borderBottom: '1px solid #E4E4E7' }}>
              {[
                { label: 'Fecha', value: formatLongDate(budget.date) },
                { label: 'Validez', value: `${budget.validityDays} días` },
                { label: 'Entrega', value: budget.deliveryTime || '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <Label>{label}</Label>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 1 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Cliente */}
            <section style={{ padding: '22px 40px 6px' }}>
              <div style={{ position: 'relative', paddingLeft: 16 }}>
                <span style={{ position: 'absolute', left: 0, top: 2, bottom: 2, width: 5, borderRadius: 999, background: YELLOW }} />
                <Label>Presentado a</Label>
                <div className="font-display" style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.1, marginTop: 3, wordBreak: 'break-word' }}>
                  {budget.client || '—'}
                </div>
                <div style={{ marginTop: 6, fontSize: 12.5, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  <span><span style={{ color: GRAY }}>Dirección · </span><b>{budget.address || '—'}</b></span>
                  <span><span style={{ color: GRAY }}>Inmueble · </span><b>{budget.propertyType || '—'}</b></span>
                </div>
              </div>
            </section>

            {/* Trabajo */}
            <section style={{ padding: '18px 40px 4px' }}>
              <SectionTitle n="01" label="Trabajo a realizar" />
              <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2, margin: '0 0 8px' }}>
                {budget.workTitle}
              </h2>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: 'rgba(11,11,11,0.8)', whiteSpace: 'pre-line', margin: 0 }}>
                {budget.description}
              </p>
            </section>

            {/* Etapas + materiales */}
            <section style={{ padding: '18px 40px 4px', display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 28 }}>
              <div>
                <SectionTitle n="02" label="Etapas de obra" />
                <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9, fontSize: 12.5, lineHeight: 1.4 }}>
                  {budget.stages.map((s, i) => (
                    <li key={i} style={{ display: 'flex', gap: 8 }}>
                      <span style={{ flexShrink: 0, width: 22, textAlign: 'center', padding: '3px 0', borderRadius: 5, background: INK, color: 'white', fontSize: 10, fontWeight: 700, lineHeight: 1 }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span style={{ paddingTop: 1 }}>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <SectionTitle n="03" label="Materiales" />
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9, fontSize: 12.5, lineHeight: 1.4 }}>
                  {budget.materials.map((m, i) => (
                    <li key={i} style={{ display: 'flex', gap: 8 }}>
                      <span style={{ flexShrink: 0, marginTop: 1, width: 16, height: 16, borderRadius: 4, background: YELLOW, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <polyline points="3 8.5 6.5 12 13 4.5" />
                        </svg>
                      </span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Resumen económico */}
            <section style={{ padding: '18px 40px 0', marginTop: 'auto', marginBottom: 14 }}>
              <SectionTitle n="04" label="Resumen económico" />
              <div style={{ border: '1px solid #E4E4E7', borderRadius: 14, overflow: 'hidden', background: 'white' }}>
                {budget.pricingMode === 'per_m2' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#F4F4F5' }}>
                    {[
                      { label: 'Superficie', value: `${formatNumber(budget.squareMeters)} m²` },
                      { label: 'Precio / m²', value: formatMoney(budget.pricePerM2) },
                      { label: 'Subtotal', value: formatMoney(t.subtotal) },
                    ].map(({ label, value }, i) => (
                      <div key={label} style={{ padding: '9px 16px', borderLeft: i ? '1px solid #E4E4E7' : 'none' }}>
                        <Label>{label}</Label>
                        <div className="font-display" style={{ fontSize: 16, fontWeight: 700, marginTop: 1 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                )}
                {budget.pricingMode === 'fixed' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 16px', background: '#F4F4F5' }}>
                    <Label>Precio del trabajo</Label>
                    <div className="font-display" style={{ fontSize: 16, fontWeight: 700 }}>{formatMoney(t.subtotal)}</div>
                  </div>
                )}
                {pending && budget.squareMeters > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 16px', background: '#F4F4F5' }}>
                    <Label>Superficie</Label>
                    <div className="font-display" style={{ fontSize: 16, fontWeight: 700 }}>{formatNumber(budget.squareMeters)} m²</div>
                  </div>
                )}
                {!pending && budget.applyVat && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', borderTop: '1px solid #E4E4E7', fontSize: 12.5 }}>
                    <span style={{ color: GRAY, fontWeight: 600 }}>IVA ({budget.vatPct}%)</span>
                    <b>{formatMoney(t.vat)}</b>
                  </div>
                )}

                {/* Total */}
                <div style={{ position: 'relative', overflow: 'hidden', background: INK, color: 'white', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div aria-hidden style={{ position: 'absolute', right: -50, top: -70, width: 190, height: 190, borderRadius: 999, background: 'rgba(255,214,10,0.15)' }} />
                  <div style={{ position: 'relative' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.24em', color: YELLOW }}>
                      {pending ? 'Presupuesto económico' : 'Presupuesto final'}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                      {pending ? 'Importe a confirmar antes del inicio de obra' : budget.applyVat ? `Incluye IVA ${budget.vatPct}%` : 'No incluye IVA'}
                    </div>
                  </div>
                  <div className="font-display" style={{ position: 'relative', fontSize: 34, fontWeight: 700, lineHeight: 1, color: pending ? YELLOW : 'white' }}>
                    {pending ? 'A confirmar' : formatMoney(t.total)}
                  </div>
                </div>

                {!pending && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                    <div style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Label>Anticipo</Label>
                        <span style={{ padding: '1px 8px', fontSize: 10.5, fontWeight: 700, background: INK, color: 'white', borderRadius: 999 }}>{budget.advancePct}%</span>
                      </div>
                      <div className="font-display" style={{ fontSize: 19, fontWeight: 700, marginTop: 2 }}>{formatMoney(t.advance)}</div>
                      <div style={{ fontSize: 10, color: GRAY }}>Con fecha de inicio a coordinar.</div>
                    </div>
                    <div style={{ padding: '10px 16px', background: 'rgba(255,214,10,0.15)', borderLeft: '1px solid #E4E4E7' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Label color="rgba(11,11,11,0.6)">Finalización</Label>
                        <span style={{ padding: '1px 8px', fontSize: 10.5, fontWeight: 700, background: YELLOW, color: INK, borderRadius: 999 }}>{budget.finalPct}%</span>
                      </div>
                      <div className="font-display" style={{ fontSize: 19, fontWeight: 700, marginTop: 2 }}>{formatMoney(t.final)}</div>
                      <div style={{ fontSize: 10, color: 'rgba(11,11,11,0.55)' }}>Contra entrega de obra terminada.</div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <div style={{ padding: '0 40px 12px', textAlign: 'right', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: GRAY }}>
              Pres. N° {budget.number || '—'} · Hoja 1 de 2
            </div>
          </section>

          {/* ================= HOJA 2 ================= */}
          <section ref={p2} data-page className="budget-page">
            <header style={{ position: 'relative', background: INK, color: 'white', padding: '14px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div aria-hidden style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: YELLOW }} />
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.24em', color: YELLOW }}>
                Lucas Gallastagui Impermeabilizaciones
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', textAlign: 'right' }}>
                Presupuesto N° {budget.number || '—'} · {budget.client || '—'}
              </div>
            </header>

            <section style={{ padding: '26px 40px 4px' }}>
              <SectionTitle n="05" label="Condiciones comerciales" />
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, columnCount: 2, columnGap: 28, fontSize: 11.5, lineHeight: 1.4 }}>
                {budget.conditions.map((c, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8, breakInside: 'avoid', marginBottom: 10 }}>
                    <span className="font-display" style={{ flexShrink: 0, width: 20, fontSize: 10.5, fontWeight: 700, color: '#E6BE00' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span style={{ color: 'rgba(11,11,11,0.85)' }}>{c}</span>
                  </li>
                ))}
              </ul>
            </section>

            {photos.length > 0 && (
              <section style={{ padding: '22px 40px 4px' }}>
                <SectionTitle n="06" label="Registro fotográfico" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {photos.map((photo, i) => (
                    <figure key={`${photo.slice(0, 24)}-${i}`} style={{ margin: 0, overflow: 'hidden', borderRadius: 10, border: '1px solid #E4E4E7', background: '#F4F4F5' }}>
                      <img src={photo} alt={`Registro fotográfico de la obra ${i + 1}`} style={{ display: 'block', width: '100%', height: 135, objectFit: 'cover' }} />
                      <figcaption style={{ padding: '4px 8px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: GRAY }}>
                        Estado actual · Foto {i + 1}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            )}

            {/* Aceptación */}
            <section style={{ padding: '26px 40px 22px', marginTop: 'auto' }}>
              <SectionTitle n={photos.length > 0 ? '07' : '06'} label="Aceptación del presupuesto" />
              <p style={{ fontSize: 11, color: 'rgba(11,11,11,0.7)', margin: '0 0 28px' }}>
                Con la firma del cliente se da conformidad al presente presupuesto y a sus condiciones comerciales.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.7fr', gap: 28 }}>
                {[
                  { title: 'Firma del cliente', sub: budget.client || '' },
                  { title: 'Firma y sello', sub: 'Lucas Gallastagui Impermeabilizaciones' },
                  { title: 'Fecha', sub: '' },
                ].map(({ title, sub }) => (
                  <div key={title} style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: `1px solid ${INK}`, paddingTop: 5, fontSize: 11, fontWeight: 700 }}>{title}</div>
                    {sub && <div style={{ fontSize: 10, color: GRAY }}>{sub}</div>}
                  </div>
                ))}
              </div>
            </section>

            <Footer budget={budget} page="2 de 2" />
          </section>
        </article>
      </Scaler>
    </div>
  )
}
