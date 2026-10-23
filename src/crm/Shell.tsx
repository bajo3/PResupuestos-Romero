import { ReactNode, useState } from 'react'
import { BrandLogo } from '../components/BrandLogo'

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

function NavList({ section, onGo }: { section: string; onGo: (id: string) => void }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((n) => (
        <button
          key={n.id}
          onClick={() => onGo(n.id)}
          className={`text-left px-3 py-2 rounded-lg text-[14px] font-semibold transition ${
            section === n.id ? 'bg-romero-ink text-white' : 'text-romero-ink/70 hover:bg-romero-gray hover:text-romero-ink'
          }`}
        >
          {n.label}
        </button>
      ))}
    </nav>
  )
}

export function Shell({ section, onGo, children }: { section: string; onGo: (id: string) => void; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const current = NAV.find((n) => n.id === section)?.label ?? ''
  const go = (id: string) => { setOpen(false); onGo(id) }

  return (
    <div className="min-h-screen lg:pl-60">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col gap-5 border-r border-romero-gray-2 bg-white px-3 py-4 overflow-y-auto">
        <div className="px-1"><Brand /></div>
        <NavList section={section} onGo={go} />
      </aside>

      {/* Top bar mobile */}
      <header className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-romero-gray-2">
        <div className="flex items-center gap-3 px-4 py-2">
          <button onClick={() => setOpen(true)} className="btn-ghost px-3 py-2 text-[18px] leading-none" aria-label="Abrir menú">☰</button>
          <div className="font-bold text-[15px] truncate">{current}</div>
        </div>
      </header>

      {/* Drawer mobile */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)}>
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white px-3 py-4 flex flex-col gap-5 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-1"><Brand /></div>
            <NavList section={section} onGo={go} />
          </aside>
        </div>
      )}

      <main>{children}</main>
    </div>
  )
}
