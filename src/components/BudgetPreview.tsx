import { Budget, computeTotals } from '../types/budget'
import { formatMoney, formatNumber, formatLongDate } from '../utils/money'

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
    <footer className="avoid-break -mx-6 sm:-mx-10 print:mx-0 mt-10 bg-romero-ink text-white px-5 sm:px-10 py-6 rounded-b-2xl print:rounded-none">
      {/* Marca */}
      <div className="flex items-center gap-3 mb-5">
        <div className="h-1.5 w-8 bg-romero-yellow rounded-full" />
        <div className="text-[10px] font-extrabold uppercase tracking-[0.26em] text-romero-yellow">
          ROMERO Impermeabilizaciones
        </div>
      </div>

      {/* Contactos — 2 columnas en mobile, 3 en sm */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-[12px] leading-relaxed">
        {/* Contacto principal */}
        <div className="col-span-2 sm:col-span-1">
          <div className="text-[9px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Web</div>
          <div className="font-semibold text-[11px] sm:text-[12px]">impermeabilizacionesromero.com</div>
          <div className="text-white/70 mt-1">+54 9 2284 59-7150</div>
        </div>

        {/* Buenos Aires */}
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Buenos Aires</div>
          <div className="font-semibold">Emilio Frers 1126</div>
          <div className="text-white/70">Martínez, B.A.</div>
          <div className="text-white/70 mt-0.5">+54 9 2284 59-7150</div>
        </div>

        {/* Tandil */}
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Tandil</div>
          <div className="font-semibold">Colectora Macaya 1253</div>
          <div className="text-white/70">Tandil, B.A.</div>
          <div className="text-white/70 mt-0.5">+54 9 2284 59-7150</div>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-[0.18em] text-white/40">
          Pres. N° {budget.number || '—'}
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-white/40">
          Aplicador homologado · CE · Revestech
        </span>
      </div>
    </footer>
  )
}

export function BudgetPreview({ budget }: Props) {
  const t = computeTotals(budget)

  return (
    <article className="sheet overflow-hidden print:overflow-visible">

      {/* ============ HERO ============ */}
      <header className="avoid-break relative bg-romero-ink text-white">
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
            <div className="bg-white rounded-xl px-3 py-2.5 shadow-lg shadow-black/20">
              <img
                src="/logo-romero.svg"
                alt="ROMERO Impermeabilizaciones"
                className="h-10 sm:h-13 w-auto max-w-[160px] sm:max-w-none object-contain"
              />
            </div>
            <div className="text-right relative z-10 min-w-0">
              <div className="inline-flex items-center gap-1.5 bg-romero-ink/70 rounded-full px-2.5 py-1 mb-1.5 border border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-romero-yellow shrink-0" />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/80 truncate">
                  N° de presupuesto
                </span>
              </div>
              <div className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-sm break-all">
                {budget.number || '—'}
              </div>
            </div>
          </div>

          {/* Tagline + título */}
          <div className="mt-6 relative z-10">
            <div className="text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.28em] text-romero-yellow">
              Especialistas en Impermeabilización
            </div>
            <h1 className="font-display mt-1.5 text-[34px] sm:text-[56px] font-bold leading-[0.95] tracking-tight">
              PRESUPUESTO
            </h1>
            <div className="mt-1.5 text-[11px] text-white/55">
              Soluciones profesionales · Sistema integral llave en mano
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
                className="bg-white/10 rounded-lg sm:rounded-xl px-2 sm:px-3 py-2 sm:py-2.5 border border-white/10"
              >
                <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.15em] text-white/50">
                  {label}
                </div>
                <div className="text-[11px] sm:text-[13px] font-bold leading-tight mt-0.5 break-words">
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
                  <span className="shrink-0 mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md bg-romero-ink text-white text-[11px] font-bold font-display">
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
                  <span className="shrink-0 mt-1 inline-flex h-5 w-5 items-center justify-center rounded-md bg-romero-yellow text-romero-ink text-[12px] font-bold">
                    ✓
                  </span>
                  <span className="pt-0.5">{m}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-romero-gray border border-romero-gray-2 px-3 py-2.5">
              <div className="h-8 w-8 shrink-0 rounded-md bg-romero-ink text-romero-yellow grid place-items-center text-[10px] font-extrabold tracking-wider">
                CE
              </div>
              <div className="text-[12px] leading-tight">
                <div className="font-bold">Aplicador homologado</div>
                <div className="text-romero-gray-3">por la Comunidad Europea · Revestech</div>
              </div>
            </div>
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
              <div className="flex items-center justify-between mb-1">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-romero-gray-3">Anticipo</div>
                <span className="text-[11px] font-bold bg-romero-ink text-white rounded-full px-2 py-0.5">
                  {budget.advancePct}%
                </span>
              </div>
              <div className="font-display font-bold text-[22px] sm:text-2xl">{formatMoney(t.advance)}</div>
              <div className="mt-2.5 h-1.5 rounded-full bg-romero-gray-2 overflow-hidden">
                <div className="h-full bg-romero-ink" style={{ width: `${budget.advancePct}%` }} />
              </div>
              <div className="text-[11px] text-romero-gray-3 mt-1.5">Con fecha de inicio a coordinar.</div>
            </div>
            <div className="p-4 sm:p-5 bg-romero-yellow/15">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-romero-ink/70">Finalización</div>
                <span className="text-[11px] font-bold bg-romero-yellow text-romero-ink rounded-full px-2 py-0.5">
                  {budget.finalPct}%
                </span>
              </div>
              <div className="font-display font-bold text-[22px] sm:text-2xl">{formatMoney(t.final)}</div>
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
