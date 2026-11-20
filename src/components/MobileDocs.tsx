import { ReactNode } from 'react'
import { Budget, computeTotals } from '../types/budget'
import { Receipt } from '../types/receipt'
import { formatMoney, formatNumber, formatLongDate } from '../utils/money'
import { BrandLogo } from './BrandLogo'

// Vista del presupuesto y del recibo para pantallas angostas (celular).
// Es una versión "de lectura": letra de tamaño normal, una sola columna.
// El PDF y la impresión salen siempre de la hoja A4 (que queda armada fuera de pantalla).

const INK = '#0B0B0B'
const YELLOW = '#FFD60A'

const PAYMENT_LABELS: Record<string, string> = {
  Efectivo: 'Efectivo',
  Transferencia: 'Transferencia',
  Cheque: 'Cheque',
}

function Label({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <div className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${dark ? 'text-white/50' : 'text-romero-gray-3'}`}>
      {children}
    </div>
  )
}

function Block({ n, title, children }: { n?: string; title: string; children: ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-romero-gray-2 p-4">
      <div className="flex items-center gap-2 mb-3">
        {n && <span className="font-display text-[18px] font-bold leading-none" style={{ color: '#E6BE00' }}>{n}</span>}
        <span className="text-[11px] font-extrabold uppercase tracking-[0.18em]">{title}</span>
        <span className="flex-1 h-px bg-black/10" />
      </div>
      {children}
    </section>
  )
}

export function BudgetMobile({ budget }: { budget: Budget }) {
  const t = computeTotals(budget)
  const pending = budget.pricingMode === 'pending'
  const photos = (budget.photos ?? []).slice(0, 6)

  return (
    <article className="space-y-3 pb-4" style={{ overflowWrap: 'break-word' }}>
      {/* Cabecera */}
      <header className="rounded-2xl overflow-hidden relative px-5 py-4" style={{ background: INK, color: 'white' }}>
        <div aria-hidden className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: YELLOW }} />
        <div className="flex items-center justify-between gap-3">
          <div className="bg-white rounded-lg px-2 py-1.5 shrink-0"><BrandLogo variant="compact" /></div>
          <div className="text-right min-w-0">
            <h1 className="font-display text-[24px] font-bold leading-none whitespace-nowrap">PRESUPUESTO</h1>
            <div className="mt-2 inline-block rounded-md px-2.5 py-1 text-[12px] font-extrabold tracking-wider" style={{ background: YELLOW, color: INK }}>
              N° {budget.number || '—'}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/15">
          {[
            { label: 'Fecha', value: formatLongDate(budget.date) },
            { label: 'Validez', value: `${budget.validityDays} días` },
            { label: 'Entrega', value: budget.deliveryTime || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="min-w-0">
              <Label dark>{label}</Label>
              <div className="text-[12.5px] font-bold mt-0.5 leading-tight">{value}</div>
            </div>
          ))}
        </div>
      </header>

      {/* Cliente */}
      <section className="bg-white rounded-2xl border border-romero-gray-2 p-4 relative pl-6">
        <span className="absolute left-3 top-4 bottom-4 w-1 rounded-full" style={{ background: YELLOW }} />
        <Label>Presentado a</Label>
        <div className="font-display text-[22px] font-bold leading-tight mt-0.5">{budget.client || '—'}</div>
        <div className="mt-2 text-[14px] space-y-0.5">
          <div><span className="text-romero-gray-3">Dirección · </span><b>{budget.address || '—'}</b></div>
          <div><span className="text-romero-gray-3">Inmueble · </span><b>{budget.propertyType || '—'}</b></div>
        </div>
      </section>

      <Block n="01" title="Trabajo a realizar">
        <h2 className="font-display text-[17px] font-bold leading-snug mb-1.5">{budget.workTitle}</h2>
        <p className="text-[14px] leading-relaxed text-black/80 whitespace-pre-line">{budget.description}</p>
      </Block>

      <Block n="02" title="Etapas de obra">
        <ol className="space-y-2.5">
          {budget.stages.map((s, i) => (
            <li key={i} className="flex gap-2.5 text-[14px] leading-snug">
              <span className="shrink-0 w-7 text-center rounded-md py-1 text-[11px] font-bold leading-none text-white" style={{ background: INK }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      </Block>

      {budget.materials.length > 0 && (
        <Block n="03" title="Materiales">
          <ul className="space-y-2.5">
            {budget.materials.map((m, i) => (
              <li key={i} className="flex gap-2.5 text-[14px] leading-snug">
                <span className="shrink-0 mt-0.5 w-[18px] h-[18px] rounded inline-flex items-center justify-center" style={{ background: YELLOW }}>
                  <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="3 8.5 6.5 12 13 4.5" />
                  </svg>
                </span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {/* Resumen económico */}
      <Block n="04" title="Resumen económico">
        <div className="rounded-xl border border-romero-gray-2 overflow-hidden">
          {budget.pricingMode === 'per_m2' && (
            <div className="bg-romero-gray text-[14px]">
              <div className="flex justify-between px-4 py-2"><span className="text-romero-gray-3">Superficie</span><b>{formatNumber(budget.squareMeters)} m²</b></div>
              <div className="flex justify-between px-4 py-2 border-t border-romero-gray-2"><span className="text-romero-gray-3">Precio por m²</span><b>{formatMoney(budget.pricePerM2)}</b></div>
              <div className="flex justify-between px-4 py-2 border-t border-romero-gray-2"><span className="text-romero-gray-3">Subtotal</span><b>{formatMoney(t.subtotal)}</b></div>
            </div>
          )}
          {budget.pricingMode === 'fixed' && (
            <div className="flex justify-between px-4 py-2 bg-romero-gray text-[14px]"><span className="text-romero-gray-3">Precio del trabajo</span><b>{formatMoney(t.subtotal)}</b></div>
          )}
          {pending && budget.squareMeters > 0 && (
            <div className="flex justify-between px-4 py-2 bg-romero-gray text-[14px]"><span className="text-romero-gray-3">Superficie</span><b>{formatNumber(budget.squareMeters)} m²</b></div>
          )}
          {!pending && budget.applyVat && (
            <div className="flex justify-between px-4 py-2 border-t border-romero-gray-2 text-[14px]"><span className="text-romero-gray-3">IVA ({budget.vatPct}%)</span><b>{formatMoney(t.vat)}</b></div>
          )}

          <div className="px-4 py-4" style={{ background: INK, color: 'white' }}>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: YELLOW }}>
              {pending ? 'Presupuesto económico' : 'Presupuesto final'}
            </div>
            <div
              className="font-display font-bold leading-none mt-2 whitespace-nowrap"
              style={{ fontSize: 'clamp(22px, 8.5vw, 32px)', color: pending ? YELLOW : 'white' }}
            >
              {pending ? 'A confirmar' : formatMoney(t.total)}
            </div>
            <div className="text-[12px] text-white/60 mt-1.5">
              {pending ? 'Importe a confirmar antes del inicio de obra' : budget.applyVat ? `Incluye IVA ${budget.vatPct}%` : 'No incluye IVA'}
            </div>
          </div>

          {!pending && (
            <div>
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <Label>Anticipo</Label>
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: INK }}>{budget.advancePct}%</span>
                </div>
                <div className="font-display text-[20px] font-bold mt-1">{formatMoney(t.advance)}</div>
                <div className="text-[12px] text-romero-gray-3">Con fecha de inicio a coordinar.</div>
              </div>
              <div className="px-4 py-3 border-t border-romero-gray-2" style={{ background: 'rgba(255,214,10,0.15)' }}>
                <div className="flex items-center justify-between">
                  <Label>Finalización</Label>
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: YELLOW, color: INK }}>{budget.finalPct}%</span>
                </div>
                <div className="font-display text-[20px] font-bold mt-1">{formatMoney(t.final)}</div>
                <div className="text-[12px] text-black/55">Contra entrega de obra terminada.</div>
              </div>
            </div>
          )}
        </div>
      </Block>

      <Block n="05" title="Condiciones comerciales">
        <ul className="space-y-2.5">
          {budget.conditions.map((c, i) => (
            <li key={i} className="flex gap-2.5 text-[13.5px] leading-snug">
              <span className="font-display shrink-0 w-6 text-[12px] font-bold" style={{ color: '#E6BE00' }}>{String(i + 1).padStart(2, '0')}</span>
              <span className="text-black/85">{c}</span>
            </li>
          ))}
        </ul>
      </Block>

      {photos.length > 0 && (
        <Block n="06" title="Registro fotográfico">
          <div className="grid grid-cols-2 gap-2">
            {photos.map((photo, i) => (
              <img key={`${photo.slice(0, 24)}-${i}`} src={photo} alt={`Foto ${i + 1} de la obra`} className="w-full h-28 object-cover rounded-lg border border-romero-gray-2" />
            ))}
          </div>
        </Block>
      )}

      <footer className="rounded-2xl px-5 py-4" style={{ background: INK, color: 'white' }}>
        <div className="flex items-center gap-2.5">
          <span className="h-1.5 w-7 rounded-full" style={{ background: '#F5C800' }} />
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: '#F5C800' }}>Lucas Gallastagui Impermeabilizaciones</span>
        </div>
        <div className="text-[13px] font-semibold mt-2">Tandil · +54 9 2494 60-1118</div>
        <div className="text-[10px] uppercase tracking-wider text-white/45 mt-1.5">Revestech · Aplicador homologado CE</div>
      </footer>
    </article>
  )
}

export function ReceiptMobile({ receipt: r }: { receipt: Receipt }) {
  return (
    <article className="space-y-3 pb-4" style={{ overflowWrap: 'break-word' }}>
      <header className="rounded-2xl overflow-hidden relative px-5 py-4" style={{ background: INK, color: 'white' }}>
        <div aria-hidden className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: YELLOW }} />
        <div className="flex items-center justify-between gap-3">
          <div className="bg-white rounded-lg px-2 py-1.5 shrink-0"><BrandLogo variant="compact" /></div>
          <div className="text-right">
            <div className="text-[24px] font-extrabold uppercase tracking-[0.16em] leading-none whitespace-nowrap" style={{ color: '#F5C800' }}>RECIBO</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] mt-1 text-white/50">de pago</div>
          </div>
        </div>
        <div className="flex items-end justify-between gap-3 mt-4 pt-3 border-t border-white/15">
          <div>
            <Label dark>N° de recibo</Label>
            <div className="text-[28px] font-extrabold tabular-nums leading-none mt-1" style={{ color: '#F5C800' }}>{r.number || '—'}</div>
          </div>
          <div className="text-right">
            <Label dark>Fecha</Label>
            <div className="text-[13px] font-semibold mt-1">{formatLongDate(r.date)}</div>
          </div>
        </div>
      </header>

      <section className="rounded-2xl px-5 py-5" style={{ background: INK, color: 'white' }}>
        <Label dark>Importe recibido</Label>
        <div
          className="font-extrabold tabular-nums leading-none mt-2 whitespace-nowrap"
          style={{ fontSize: 'clamp(24px, 9vw, 34px)', color: '#F5C800' }}
        >
          {formatMoney(r.amount)}
        </div>
        <div className="mt-3 inline-block rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider" style={{ background: '#F5C800', color: INK }}>
          {PAYMENT_LABELS[r.paymentMethod] ?? r.paymentMethod}
        </div>
      </section>

      <Block title="Datos del pagador">
        <dl className="text-[14px] space-y-2.5">
          <div><dt><Label>Recibí de</Label></dt><dd className="font-bold text-[16px] mt-0.5">{r.client || '—'}</dd></div>
          {r.address && <div><dt><Label>Domicilio</Label></dt><dd className="mt-0.5">{r.address}</dd></div>}
        </dl>
      </Block>

      <Block title="Concepto">
        <dl className="text-[14px] space-y-2.5">
          <div><dt><Label>En concepto de</Label></dt><dd className="font-bold text-[15px] mt-0.5">{r.concept || '—'}</dd></div>
          {r.budgetNumber && <div><dt><Label>Presupuesto</Label></dt><dd className="mt-0.5">N° {r.budgetNumber}</dd></div>}
          {r.notes && <div><dt><Label>Observaciones</Label></dt><dd className="mt-0.5">{r.notes}</dd></div>}
        </dl>
      </Block>

      <footer className="rounded-2xl px-5 py-4" style={{ background: INK, color: 'white' }}>
        <div className="flex items-center gap-2.5">
          <span className="h-1.5 w-7 rounded-full" style={{ background: '#F5C800' }} />
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: '#F5C800' }}>Lucas Gallastagui Impermeabilizaciones</span>
        </div>
        <div className="text-[13px] font-semibold mt-2">Tandil · +54 9 2494 60-1118</div>
      </footer>
    </article>
  )
}
