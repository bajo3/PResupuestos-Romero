import { ReactNode, useState } from 'react'
import { BrandLogo } from '../components/BrandLogo'
import { useCrm } from './CrmContext'
import { MovementForm, makeMovement } from './MovementForm'
import { ObraForm, makeObra } from './pages/Obras'
import { Movement, Obra } from '../types/crm'

export const NAV: { id: string; label: string }[] = [
  { id: 'panel', label: 'Panel general' },
  { id: 'caja', label: 'Caja' },
  { id: 'obras', label: 'Obras' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'presupuestos', label: 'Presupuestos' },
  { id: 'recibos', label: 'Recibos' },
  { id: 'stock', label: 'Stock' },
  { id: 'deudas', label: 'Deudas' },
  { id: 'garantias', label: 'Garantías' },
  { id: 'reportes', label: 'Reportes' },
  { id: 'config', label: 'Configuración' },
]

/** Pestañas fijas abajo en el celular; el resto va en "Más". */
const TABS: { id: string; label: string; icon: string }[] = [
  { id: 'panel', label: 'Panel', icon: '◧' },
  { id: 'caja', label: 'Caja', icon: '＄' },
  { id: 'obras', label: 'Obras', icon: '⌂' },
  { id: 'clientes', label: 'Clientes', icon: '☺' },
]

function Brand() {
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="bg-white rounded-xl border-2 border-romero-yellow p-1 shadow-sm">
        <BrandLogo variant="nav" />
      </div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-romero-gray-3">CRM LG · Gestión de obras</div>
    </div>
  )
}

function NavList({ section, onGo, ids }: { section: string; onGo: (id: string) => void; ids?: string[] }) {
  const items = ids ? NAV.filter((n) => ids.includes(n.id)) : NAV
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((n) => (
        <button
          key={n.id}
          onClick={() => onGo(n.id)}
          className={`text-left px-3 py-3 lg:py-2 rounded-lg text-[15px] lg:text-[14px] font-semibold transition ${
            section === n.id ? 'bg-romero-ink text-white' : 'text-romero-ink/70 hover:bg-romero-gray hover:text-romero-ink'
          }`}
        >
          {n.label}
        </button>
      ))}
    </nav>
  )
}

type Sheet = null | 'quick' | 'more'

export function Shell({ section, onGo, children }: { section: string; onGo: (id: string) => void; children: ReactNode }) {
  const { docs, navigate } = useCrm()
  const [sheet, setSheet] = useState<Sheet>(null)
  const [movement, setMovement] = useState<Movement | null>(null)
  const [obra, setObra] = useState<Obra | null>(null)

  const go = (id: string) => { setSheet(null); onGo(id) }
  const quick = (fn: () => void) => () => { setSheet(null); fn() }
  const inMore = !TABS.some((t) => t.id === section)

  const quickActions: { label: string; hint: string; tone: string; run: () => void }[] = [
    { label: 'Entró plata', hint: 'Cobro, seña, aporte', tone: 'bg-emerald-600 text-white', run: () => setMovement(makeMovement({ type: 'ingreso', category: 'Cobro de obra' })) },
    { label: 'Salió plata', hint: 'Gasto, compra, pago', tone: 'bg-romero-yellow text-romero-ink', run: () => setMovement(makeMovement()) },
    { label: 'Nuevo recibo', hint: 'Comprobante de cobro', tone: 'bg-white border border-romero-gray-2', run: () => docs.newReceipt() },
    { label: 'Nuevo presupuesto', hint: 'Para un cliente', tone: 'bg-white border border-romero-gray-2', run: () => docs.newBudget() },
    { label: 'Nueva obra', hint: 'Desde un presupuesto', tone: 'bg-white border border-romero-gray-2', run: () => setObra(makeObra()) },
  ]

  return (
    <div className="min-h-screen lg:pl-60">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col gap-5 border-r border-romero-gray-2 bg-white px-3 py-4 overflow-y-auto">
        <div className="px-1"><Brand /></div>
        <button className="btn-yellow w-full" onClick={() => setSheet('quick')}>+ Cargar rápido</button>
        <NavList section={section} onGo={go} />
      </aside>

      <main className="pb-20 lg:pb-0">{children}</main>

      {/* Botón rápido (celular) */}
      <button
        onClick={() => setSheet('quick')}
        aria-label="Cargar rápido"
        className="lg:hidden fixed right-4 bottom-[76px] z-30 h-14 w-14 rounded-full bg-romero-yellow text-romero-ink text-[30px] font-light leading-none shadow-lg shadow-black/25 active:scale-95 transition"
      >
        +
      </button>

      {/* Barra inferior (celular) */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 grid grid-cols-5 border-t border-romero-gray-2 bg-white/95 backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => go(t.id)}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-[11px] font-semibold ${section === t.id ? 'text-romero-ink' : 'text-romero-gray-3'}`}
          >
            <span className={`text-[18px] leading-none rounded-full px-3 py-0.5 ${section === t.id ? 'bg-romero-yellow' : ''}`}>{t.icon}</span>
            {t.label}
          </button>
        ))}
        <button
          onClick={() => setSheet('more')}
          className={`flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-[11px] font-semibold ${inMore ? 'text-romero-ink' : 'text-romero-gray-3'}`}
        >
          <span className={`text-[18px] leading-none rounded-full px-3 py-0.5 ${inMore ? 'bg-romero-yellow' : ''}`}>☰</span>
          Más
        </button>
      </nav>

      {/* Hoja: cargar rápido */}
      {sheet === 'quick' && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-end lg:items-center justify-center" onClick={() => setSheet(null)}>
          <div
            className="bg-white w-full lg:max-w-sm rounded-t-2xl lg:rounded-2xl p-4 space-y-2"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Cargar rápido"
          >
            <div className="font-bold text-[16px] mb-1 px-1">¿Qué querés cargar?</div>
            {quickActions.map((a) => (
              <button key={a.label} onClick={quick(a.run)} className={`w-full rounded-xl px-4 py-3.5 text-left active:scale-[0.99] transition ${a.tone}`}>
                <div className="font-bold text-[16px]">{a.label}</div>
                <div className="text-[12px] opacity-70">{a.hint}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hoja: más secciones */}
      {sheet === 'more' && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40 flex items-end" onClick={() => setSheet(null)}>
          <div
            className="bg-white w-full rounded-t-2xl p-3"
            style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Más secciones"
          >
            <NavList section={section} onGo={go} ids={['presupuestos', 'recibos', 'stock', 'deudas', 'garantias', 'reportes', 'config']} />
          </div>
        </div>
      )}

      {movement && <MovementForm initial={movement} onClose={() => setMovement(null)} />}
      {obra && <ObraForm initial={obra} onClose={() => setObra(null)} onSaved={(o) => navigate('obras/' + o.id)} />}
    </div>
  )
}
