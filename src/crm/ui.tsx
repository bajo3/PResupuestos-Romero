import { ReactNode, useEffect } from 'react'
import { useCrm } from './CrmContext'
import { OBRA_STATUS_LABEL } from '../types/crm'

export function Page({ title, subtitle, action, children }: {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-5 pb-28">
      <div className="flex items-end justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h1 className="text-[22px] font-extrabold leading-tight">{title}</h1>
          {subtitle && <p className="text-[13px] text-romero-gray-3 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0 flex gap-2">{action}</div>}
      </div>
      {children}
    </div>
  )
}

export function Stat({ label, value, hint, tone = 'default' }: {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'good' | 'bad' | 'warn'
}) {
  const color =
    tone === 'good' ? 'text-emerald-700' : tone === 'bad' ? 'text-red-700' : tone === 'warn' ? 'text-amber-700' : ''
  return (
    <div className="card p-4 min-w-0">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-romero-gray-3">{label}</div>
      <div className={`text-[16px] sm:text-[18px] font-extrabold mt-1 tabular-nums break-words ${color}`}>{value}</div>
      {hint && <div className="text-[12px] text-romero-gray-3 mt-0.5">{hint}</div>}
    </div>
  )
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'good' | 'bad' | 'warn' | 'info' }) {
  const cls = {
    default: 'bg-romero-gray text-romero-ink',
    good: 'bg-emerald-50 text-emerald-700',
    bad: 'bg-red-50 text-red-700',
    warn: 'bg-amber-50 text-amber-700',
    info: 'bg-sky-50 text-sky-700',
  }[tone]
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{children}</span>
}

export const STATUS_TONE = {
  presupuestada: 'info',
  en_ejecucion: 'warn',
  finalizada: 'good',
  cancelada: 'default',
} as const

export function StatusBadge({ status }: { status: keyof typeof OBRA_STATUS_LABEL }) {
  return <Badge tone={STATUS_TONE[status]}>{OBRA_STATUS_LABEL[status]}</Badge>
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card p-8 text-center text-romero-gray-3">
      <div className="font-semibold">{title}</div>
      {hint && <div className="text-sm mt-1">{hint}</div>}
    </div>
  )
}

export function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

export function Modal({ title, onClose, children, footer }: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40" onMouseDown={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-romero-gray-2">
          <div className="font-bold text-[16px]">{title}</div>
          <button onClick={onClose} className="text-romero-gray-3 hover:text-romero-ink text-lg" aria-label="Cerrar">✕</button>
        </div>
        <div className="px-5 py-4 overflow-y-auto space-y-3">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-romero-gray-2 flex gap-2">{footer}</div>}
      </div>
    </div>
  )
}

/** Selector de obra reutilizable. */
export function ObraSelect({ value, onChange, emptyLabel = '— Sin obra —' }: {
  value?: string
  onChange: (id: string | undefined) => void
  emptyLabel?: string
}) {
  const { data } = useCrm()
  const obras = [...data.obras].sort((a, b) => a.name.localeCompare(b.name))
  return (
    <select className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value || undefined)}>
      <option value="">{emptyLabel}</option>
      {obras.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}{o.client ? ` · ${o.client}` : ''}
        </option>
      ))}
    </select>
  )
}

export function Segmented<T extends string>({ value, options, onChange }: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`py-2.5 rounded-xl text-[13px] font-semibold border transition-all ${
            value === o.value
              ? 'bg-romero-ink text-white border-romero-ink'
              : 'bg-white text-romero-gray-3 border-romero-gray-2 hover:border-romero-ink/40'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 rounded-full bg-romero-gray overflow-hidden">
      <div className="h-full bg-romero-yellow" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  )
}
