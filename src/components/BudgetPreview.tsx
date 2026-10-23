import { Budget, computeTotals } from '../types/budget'
import { formatMoney, formatNumber, formatLongDate } from '../utils/money'
import { BrandLogo } from './BrandLogo'

interface Props {
  budget: Budget
}

function SectionTitle({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-end gap-3 mb-4">
      <span className="font-display text-[36px] leading-none font-bold text-romero-yellow-deep tracking-tight">
        {n}
      </span>
      <span className="block h-px flex-1 bg-romero-ink/15 mb-2" />
      <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-romero-ink/70 mb-1.5">
        {label}
      </span>
    </div>
  )
}

function Footer({ budget }: { budget: Budget }) {
  return (
    <footer
      className="avoid-break mt-10 text-white rounded-b-2xl print:rounded-none"
      style={{ backgroundColor: '#0B0B0B', padding: '24px 40px' }}
    >
      {/* Marca */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ height: '6px', width: '32px', backgroundColor: '#F5C800', borderRadius: '999px' }} />
        <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.26em', color: '#F5C800' }}>
          Lucas Gallastagui Impermeabilizaciones
        </div>
      </div>

      {/* Contactos */}
      <div style={{ display: 'flex', gap: '40px', fontSize: '12px', lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' }}>
        <div>
          <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Web</div>
          <div style={{ fontWeight: 600, color: 'white' }}>Lucas Gallastagui</div>
        </div>
        <div>
          <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Tandil</div>
          <div style={{ fontWeight: 600, color: 'white' }}>+54 9 2494 60-1118</div>
        </div>
      </div>

      {/* Barra inferior */}
      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
          Pres. N° {budget.number || '—'} &nbsp;·&nbsp; Revestech &nbsp;·&nbsp; Aplicador homologado CE
        </p>
      </div>
    </footer>
  )
}

export function BudgetPreview({ budget }: Props) {
  const t = computeTotals(budget)
  const hasPhotos = (budget.photos?.length ?? 0) > 0

  return (
    <article className="sheet print:overflow-visible">

      {/* ============ HERO ============ */}
      <header className="avoid-break relative bg-romero-ink text-white overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(120% 80% at 110% -20%, rgba(255,214,10,0.18) 0%, rgba(255,214,10,0) 55%)' }}
        />
        {/* Franja diagonal — oculta en xs para no romper layout */}
        <div
          aria-hidden
          className="hidden xs:block absolute -right-24 top-0 h-full w-[55%]"
          style={{
            background: 'linear-gradient(120deg, transparent 35%, #FFD60A 35%, #FFD60A 100%)',
            clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%)',
            opacity: 0.95,
          }}
        />
        <div aria-hidden className="absolute left-0 top-0 h-full w-1.5 bg-romero-yellow" />

        <div className="relative px-5 sm:px-10 pt-7 pb-8">
          {/* Logo + número */}
          <div className="flex items-start justify-between gap-3">
            <div className="bg-white rounded-xl px-3 py-1.5 shadow-lg shadow-black/20">
              <BrandLogo variant="document" />
            </div>
            <div
              className="relative z-10 rounded-2xl px-4 py-3 text-right shadow-xl shadow-black/40"
              style={{ backgroundColor: '#0B0B0B', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <div className="flex items-center justify-end gap-1.5 mb-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-romero-yellow shrink-0" />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  N° de presupuesto
                </span>
              </div>
              <div
                className="font-display text-2xl sm:text-4xl font-bold tracking-tight leading-none"
                style={{ color: '#ffffff' }}
              >
                {budget.number || '—'}
              </div>
            </div>
          </div>

          {/* Título + tagline */}
          <div className="mt-6 relative z-10">
            <h1 className="font-display text-[34px] sm:text-[56px] font-bold leading-[0.95] tracking-tight">
              PRESUPUESTO
            </h1>
            <div className="mt-2 text-[11px] sm:text-[13px] font-bold uppercase tracking-[0.28em] text-romero-yellow">
              Especialistas en impermeabilización
            </div>
          </div>

          {/* Chips fecha / validez / entrega */}
          <div className="mt-5 grid grid-cols-3 gap-1.5 sm:gap-2 relative z-10">
            {[
              { label: 'Fecha', value: formatLongDate(budget.date) },
              { label: 'Validez', value: `${budget.validityDays} días` },
              { label: 'Entrega', value: budget.deliveryTime || '—' },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-romero-ink rounded-lg sm:rounded-xl px-2 sm:px-3 py-2 sm:py-2.5 border border-white/15 shadow-md shadow-black/30"
              >
                <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.15em] text-romero-yellow">
                  {label}
                </div>
                <div className="text-[11px] sm:text-[13px] font-bold leading-tight mt-0.5 text-white break-words">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ============ CLIENTE ============ */}
      <section style={{ padding: '28px 40px 16px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          {/* Nombre + datos */}
          <div style={{ position: 'relative', paddingLeft: '20px', width: '58%', flexShrink: 0 }}>
            <span style={{ position: 'absolute', left: 0, top: '4px', bottom: '4px', width: '6px', borderRadius: '999px', backgroundColor: '#FFD60A' }} />
            <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.26em', color: '#9CA3AF' }}>
              Presentado a
            </div>
            <div style={{ fontSize: '30px', fontWeight: 700, lineHeight: 1.1, marginTop: '4px', wordBreak: 'break-word' }}>
              {budget.client || '—'}
            </div>
            <div style={{ marginTop: '10px', fontSize: '13px' }}>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ color: '#9CA3AF' }}>Dirección · </span>
                <span style={{ fontWeight: 600 }}>{budget.address || '—'}</span>
              </div>
              <div>
                <span style={{ color: '#9CA3AF' }}>Inmueble · </span>
                <span style={{ fontWeight: 600 }}>{budget.propertyType || '—'}</span>
              </div>
            </div>
          </div>

          {/* Resumen rápido */}
          <div className="card p-4 bg-romero-gray border-romero-gray-2" style={{ width: '42%' }}>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-romero-gray-3 mb-2">
              Resumen de obra
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-[13px]">
              {budget.squareMeters > 0 && (
                <>
                  <span className="text-romero-gray-3">Superficie</span>
                  <span className="text-right font-bold">{formatNumber(budget.squareMeters)} m²</span>
                  {budget.pricingMode === 'per_m2' ? (
                    <>
                      <span className="text-romero-gray-3">Precio / m²</span>
                      <span className="text-right font-bold text-[12px]">{formatMoney(budget.pricePerM2)}</span>
                    </>
                  ) : budget.pricingMode === 'pending' ? (
                    <>
                      <span className="text-romero-gray-3">Importe</span>
                      <span className="text-right font-bold text-[12px]">A confirmar</span>
                    </>
                  ) : null}
                </>
              )}
              {budget.pricingMode === 'pending' ? (
                <>
                  <span className="font-semibold">Presupuesto</span>
                  <span className="text-right font-extrabold text-[12px]">A confirmar</span>
                </>
              ) : (
                <>
                  <span className="font-semibold">Total</span>
                  <span className="text-right font-extrabold text-[12px]">{formatMoney(t.total)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============ TIPO DE TRABAJO ============ */}
      <section className="avoid-break px-5 sm:px-10 pt-9 pb-4">
        <SectionTitle n="01" label="Tipo de trabajo" />
        <h2 className="font-display text-xl sm:text-[26px] font-bold tracking-tight leading-tight mb-3">
          {budget.workTitle}
        </h2>
        <p className="text-[13.5px] leading-relaxed text-romero-ink/80 whitespace-pre-line">
          {budget.description}
        </p>
      </section>

      {/* ============ ETAPAS + MATERIALES ============ */}
      <section className="avoid-break px-5 sm:px-10 pt-9 pb-4">
        <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
          <div>
            <SectionTitle n="02" label="Etapas de obra" />
            <ol className="space-y-2.5 text-[13px] sm:text-[13.5px] leading-snug">
              {budget.stages.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span style={{ flexShrink: 0, display: 'inline-block', width: '24px', textAlign: 'center', padding: '4px 0', borderRadius: '6px', backgroundColor: '#0B0B0B', color: 'white', fontSize: '11px', fontWeight: 700, lineHeight: 1 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="pt-0.5">{s}</span>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <SectionTitle n="03" label="Materiales incluidos" />
            <ul className="space-y-2.5 text-[13px] sm:text-[13.5px] leading-snug">
              {budget.materials.map((m, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-romero-yellow text-romero-ink">
                    <svg
                      viewBox="0 0 16 16"
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <polyline points="3 8.5 6.5 12 13 4.5" />
                    </svg>
                  </span>
                  <span className="pt-0.5">{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ============ RESUMEN ECONÓMICO ============ */}
      <section className="avoid-break px-5 sm:px-10 pt-9 pb-4">
        <SectionTitle n="04" label="Resumen económico" />

        <div className="rounded-2xl border border-romero-gray-2 overflow-hidden bg-white">

          {/* m² / precio / subtotal — en mobile se convierte en tabla vertical */}
          {budget.pricingMode === 'pending' ? (
            <div className="bg-romero-gray px-4 sm:px-5 py-5">
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-romero-gray-3">Superficie</span>
                <span className="text-right font-display font-bold text-[15px]">{formatNumber(budget.squareMeters)} m²</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-romero-gray-3">Importe</span>
                <span className="text-right font-display font-bold text-[15px]">A confirmar</span>
              </div>
            </div>
          ) : budget.pricingMode === 'per_m2' ? (
            <>
              <div className="hidden sm:grid grid-cols-3 divide-x divide-romero-gray-2 bg-romero-gray">
                <div className="p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-romero-gray-3">Superficie</div>
                  <div className="font-display font-bold text-xl mt-0.5">
                    {formatNumber(budget.squareMeters)} <span className="text-sm text-romero-gray-3">m²</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-romero-gray-3">Precio / m²</div>
                  <div className="font-display font-bold text-xl mt-0.5">{formatMoney(budget.pricePerM2)}</div>
                </div>
                <div className="p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-romero-gray-3">Subtotal</div>
                  <div className="font-display font-bold text-xl mt-0.5">{formatMoney(t.subtotal)}</div>
                </div>
              </div>
              <div className="sm:hidden bg-romero-gray divide-y divide-romero-gray-2">
                {[
                  { label: 'Superficie', value: `${formatNumber(budget.squareMeters)} m²` },
                  { label: 'Precio / m²', value: formatMoney(budget.pricePerM2) },
                  { label: 'Subtotal', value: formatMoney(t.subtotal) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-romero-gray-3">{label}</span>
                    <span className="font-display font-bold text-[15px]">{value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-romero-gray">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-romero-gray-3">Precio total</span>
                <span className="font-display font-bold text-[15px]">{formatMoney(t.subtotal)}</span>
              </div>
            </div>
          )}

          {budget.pricingMode === 'pending' ? (
            <div className="relative bg-romero-ink text-white px-4 sm:px-6 py-5 sm:py-6 overflow-hidden">
              <div aria-hidden className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-romero-yellow/15" />
              <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.26em] text-romero-yellow">Presupuesto económico</div>
                  <div className="text-[11px] text-white/60 mt-0.5">Importe a confirmar antes del inicio de obra</div>
                </div>
                <div className="font-display text-[27px] sm:text-[38px] font-bold leading-none tracking-tight text-romero-yellow">
                  A confirmar
                </div>
              </div>
            </div>
          ) : (
            <>
              {budget.applyVat && (
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-romero-gray-2 text-sm">
                  <span className="text-romero-gray-3 font-semibold">IVA ({budget.vatPct}%)</span>
                  <span className="font-bold">{formatMoney(t.vat)}</span>
                </div>
              )}

              {/* TOTAL */}
              <div className="relative bg-romero-ink text-white px-4 sm:px-6 py-5 sm:py-6 overflow-hidden">
                <div aria-hidden className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-romero-yellow/15" />
                <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4">
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.26em] text-romero-yellow">
                      Presupuesto final
                    </div>
                    <div className="text-[11px] text-white/55 mt-0.5">
                      {budget.applyVat ? `Incluye IVA ${budget.vatPct}%` : 'No incluye IVA'}
                    </div>
                  </div>
                  <div className="font-display text-[28px] sm:text-[42px] font-bold leading-none tracking-tight text-white">
                    {formatMoney(t.total)}
                  </div>
                </div>
              </div>

              {/* Anticipo / Finalización */}
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-romero-gray-2">
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-romero-gray-3">Anticipo</div>
                    <span style={{ display: 'inline-block', minWidth: '2rem', padding: '2px 8px', fontSize: '11px', fontWeight: 700, backgroundColor: '#0B0B0B', color: 'white', borderRadius: '999px', textAlign: 'center', lineHeight: '20px' }}>
                      {budget.advancePct}%
                    </span>
                  </div>
                  <div className="font-display font-bold text-[22px] sm:text-2xl leading-none">{formatMoney(t.advance)}</div>
                  <div className="mt-2.5 h-1.5 rounded-full bg-romero-gray-2 overflow-hidden">
                    <div className="h-full bg-romero-ink" style={{ width: `${budget.advancePct}%` }} />
                  </div>
                  <div className="text-[11px] text-romero-gray-3 mt-1.5">Con fecha de inicio a coordinar.</div>
                </div>
                <div className="p-4 sm:p-5 bg-romero-yellow/15">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-romero-ink/70">Finalización</div>
                    <span style={{ display: 'inline-block', minWidth: '2rem', padding: '2px 8px', fontSize: '11px', fontWeight: 700, backgroundColor: '#FFD60A', color: '#0B0B0B', borderRadius: '999px', textAlign: 'center', lineHeight: '20px' }}>
                      {budget.finalPct}%
                    </span>
                  </div>
                  <div className="font-display font-bold text-[22px] sm:text-2xl leading-none">{formatMoney(t.final)}</div>
                  <div className="mt-2.5 h-1.5 rounded-full bg-romero-yellow-deep/30 overflow-hidden">
                    <div className="h-full bg-romero-yellow-deep" style={{ width: `${budget.finalPct}%` }} />
                  </div>
                  <div className="text-[11px] text-romero-ink/60 mt-1.5">Contra entrega de obra terminada.</div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ============ CONDICIONES ============ */}
      <section className="avoid-break px-5 sm:px-10 pt-9 pb-5">
        <SectionTitle n="05" label="Condiciones comerciales" />
        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5 text-[12.5px] leading-snug">
          {budget.conditions.map((c, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="shrink-0 mt-0.5 font-display text-[11px] font-bold text-romero-yellow-deep w-6">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-romero-ink/85">{c}</span>
            </li>
          ))}
        </ul>
      </section>

      {hasPhotos && (
        <section className="px-5 sm:px-10 pt-9 pb-5">
          <SectionTitle n="06" label="Registro fotográfico" />
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            {(budget.photos ?? []).map((photo, i) => (
              <figure key={`${photo.slice(0, 24)}-${i}`} className="overflow-hidden rounded-xl border border-romero-gray-2 bg-romero-gray">
                <img
                  src={photo}
                  alt={`Registro fotográfico de la obra ${i + 1}`}
                  className="h-44 sm:h-56 w-full object-cover"
                />
                <figcaption className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-romero-gray-3">
                  Estado actual · Foto {i + 1}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <Footer budget={budget} />
    </article>
  )
}
