import { Budget, computeTotals } from '../types/budget'
import { formatMoney, formatNumber, formatLongDate } from '../utils/money'

interface Props {
  budget: Budget
}

function RomeroLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 880 185"
      role="img"
      aria-label="ROMERO Impermeabilizaciones"
      className={className}
      preserveAspectRatio="xMinYMid meet"
    >
      <rect x="10" y="26" width="98" height="19" rx="2.5" fill="#0B0B0B" />
      <rect x="10" y="74" width="98" height="19" rx="2.5" fill="#0B0B0B" />
      <rect x="10" y="122" width="98" height="19" rx="2.5" fill="#0B0B0B" />
      <path
        fill="#0B0B0B"
        fillRule="evenodd"
        d="M84 16 H136 C162 16 182 34 182 58 C182 82 162 100 136 100 L160 158 H132 L110 104 V158 H84 Z M110 40 H135 C146 40 154 48 154 58 C154 68 146 76 135 76 H110 Z"
      />
      <text
        x="200"
        y="120"
        fontFamily="'Arial Black', 'Inter', sans-serif"
        fontWeight={900}
        fontSize={94}
        letterSpacing={-1}
        fill="#0B0B0B"
      >
        ROMERO
      </text>
      <text
        x="202"
        y="154"
        fontFamily="'Arial', 'Inter', sans-serif"
        fontWeight={700}
        fontSize={21}
        letterSpacing={4.5}
        fill="#0B0B0B"
      >
        IMPERMEABILIZACIONES
      </text>
    </svg>
  )
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
          ROMERO Impermeabilizaciones
        </div>
      </div>

      {/* Contactos — siempre 3 columnas (PDF-safe) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', fontSize: '12px', lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' }}>
        <div>
          <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Web</div>
          <div style={{ fontWeight: 600, color: 'white' }}>impermeabilizacionesromero.com</div>
          <div>+54 9 2494 60-1118</div>
        </div>
        <div>
          <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Buenos Aires</div>
          <div style={{ fontWeight: 600, color: 'white' }}>Colectora Macaya 1253</div>
          <div>+54 9 11 3065-7729</div>
        </div>
        <div>
          <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Tandil</div>
          <div style={{ fontWeight: 600, color: 'white' }}>Tandil</div>
          <div>+54 9 2494 60-1118</div>
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
            <div className="bg-romero-yellow rounded-xl px-3 py-2.5 shadow-lg shadow-black/20">
              <RomeroLogo className="h-9 sm:h-12 w-auto" />
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
      <section className="avoid-break px-5 sm:px-10 pt-7">
        <div className="grid sm:grid-cols-[1.4fr_1fr] gap-4">
          {/* Nombre + datos */}
          <div className="relative pl-4 sm:pl-5">
            <span className="absolute left-0 top-1 bottom-1 w-1.5 rounded-full bg-romero-yellow" />
            <div className="text-[10px] font-extrabold uppercase tracking-[0.26em] text-romero-gray-3">
              Presentado a
            </div>
            <div className="font-display text-2xl sm:text-[34px] font-bold tracking-tight leading-tight mt-1 break-words">
              {budget.client || '—'}
            </div>
            <div className="mt-2.5 flex flex-col sm:flex-row flex-wrap gap-y-1 gap-x-5 text-[13px]">
              <div>
                <span className="text-romero-gray-3">Dirección · </span>
                <span className="font-semibold">{budget.address || '—'}</span>
              </div>
              <div>
                <span className="text-romero-gray-3">Inmueble · </span>
                <span className="font-semibold">{budget.propertyType || '—'}</span>
              </div>
            </div>
          </div>

          {/* Resumen rápido */}
          <div className="card p-4 bg-romero-gray border-romero-gray-2">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-romero-gray-3 mb-2">
              Resumen de obra
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-[13px]">
              <span className="text-romero-gray-3">Superficie</span>
              <span className="text-right font-bold">{formatNumber(budget.squareMeters)} m²</span>
              <span className="text-romero-gray-3">Precio / m²</span>
              <span className="text-right font-bold text-[12px]">{formatMoney(budget.pricePerM2)}</span>
              <span className="font-semibold">Total</span>
              <span className="text-right font-extrabold text-[12px]">{formatMoney(t.total)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TIPO DE TRABAJO ============ */}
      <section className="avoid-break px-5 sm:px-10 pt-9">
        <SectionTitle n="01" label="Tipo de trabajo" />
        <h2 className="font-display text-xl sm:text-[26px] font-bold tracking-tight leading-tight mb-3">
          {budget.workTitle}
        </h2>
        <p className="text-[13.5px] leading-relaxed text-romero-ink/80 whitespace-pre-line">
          {budget.description}
        </p>
      </section>

      {/* ============ ETAPAS + MATERIALES ============ */}
      <section className="avoid-break px-5 sm:px-10 pt-9">
        <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
          <div>
            <SectionTitle n="02" label="Etapas de obra" />
            <ol className="space-y-2.5 text-[13px] sm:text-[13.5px] leading-snug">
              {budget.stages.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 mt-0.5 h-6 w-6 grid place-items-center rounded-md bg-romero-ink text-white text-[11px] font-bold tabular-nums" style={{ lineHeight: 1 }}>
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
      <section className="avoid-break px-5 sm:px-10 pt-9">
        <SectionTitle n="04" label="Resumen económico" />

        <div className="rounded-2xl border border-romero-gray-2 overflow-hidden bg-white">

          {/* m² / precio / subtotal — en mobile se convierte en tabla vertical */}
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

          {/* Mobile: lista compacta */}
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
                <span className="shrink-0 inline-flex items-center justify-center h-5 min-w-[2rem] px-2 text-[11px] font-bold bg-romero-ink text-white rounded-full tabular-nums">
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
                <span className="shrink-0 inline-flex items-center justify-center h-5 min-w-[2rem] px-2 text-[11px] font-bold bg-romero-yellow text-romero-ink rounded-full tabular-nums">
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

      <Footer budget={budget} />
    </article>
  )
}
