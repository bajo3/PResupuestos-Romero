import { Receipt } from '../types/receipt'
import { formatMoney, formatLongDate } from '../utils/money'
import { BrandLogo } from './BrandLogo'

interface Props {
  receipt: Receipt
}

const PAYMENT_LABELS: Record<string, string> = {
  Efectivo: 'EFECTIVO',
  Transferencia: 'TRANSFERENCIA BANCARIA',
  Cheque: 'CHEQUE',
}

function Row({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <div className="flex gap-4 px-5 py-3.5 border-b border-romero-gray-2 last:border-0">
      <span
        className="shrink-0 text-[10px] font-extrabold uppercase tracking-[0.2em] text-romero-gray-3 pt-0.5"
        style={{ width: '110px' }}
      >
        {label}
      </span>
      <span className={`flex-1 leading-snug ${large ? 'font-bold text-[15px]' : 'text-[14px] font-medium'}`}>
        {value || '—'}
      </span>
    </div>
  )
}

export function ReceiptPreview({ receipt: r }: Props) {
  return (
    <div
      className="sheet bg-white rounded-2xl shadow-lg print:shadow-none print:rounded-none overflow-hidden font-sans"
      style={{ maxWidth: '680px', margin: '0 auto' }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#0B0B0B' }} className="px-8 pt-7 pb-6">
        <div className="flex items-center justify-between gap-6">
          {/* Logo */}
          <div
            className="rounded-xl px-3 py-2 shrink-0"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <BrandLogo variant="document" />
          </div>

          {/* Título */}
          <div className="text-right">
            <div
              className="font-extrabold uppercase tracking-[0.22em]"
              style={{ fontSize: '26px', color: '#F5C800', lineHeight: 1 }}
            >
              RECIBO
            </div>
            <div
              className="font-semibold uppercase tracking-[0.16em] mt-1"
              style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}
            >
              de pago
            </div>
          </div>
        </div>

        {/* Número y fecha */}
        <div className="flex items-end justify-between mt-6 gap-3">
          <div>
            <div
              className="font-semibold uppercase tracking-widest mb-1"
              style={{ fontSize: '9px', color: 'rgba(255,255,255,0.45)' }}
            >
              Número de recibo
            </div>
            <div
              className="font-extrabold tabular-nums"
              style={{ fontSize: '32px', color: '#F5C800', lineHeight: 1 }}
            >
              {r.number || '—'}
            </div>
          </div>
          <div className="text-right">
            <div
              className="font-semibold uppercase tracking-widest mb-1"
              style={{ fontSize: '9px', color: 'rgba(255,255,255,0.45)' }}
            >
              Fecha de emisión
            </div>
            <div
              className="font-semibold"
              style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}
            >
              {formatLongDate(r.date)}
            </div>
          </div>
        </div>
      </div>

      {/* Franja amarilla fina */}
      <div style={{ height: '4px', backgroundColor: '#F5C800' }} />

      {/* ── Cuerpo ─────────────────────────────────────────────── */}
      <div className="px-8 py-7">

        {/* Datos del destinatario */}
        <div className="mb-6">
          <div
            className="font-extrabold uppercase tracking-[0.22em] mb-3"
            style={{ fontSize: '9px', color: '#888' }}
          >
            Datos del pagador
          </div>
          <div className="rounded-xl border border-romero-gray-2 overflow-hidden">
            <Row label="Recibí de" value={r.client} large />
            {r.address && <Row label="Domicilio" value={r.address} />}
          </div>
        </div>

        {/* Monto */}
        <div className="mb-6">
          <div
            className="font-extrabold uppercase tracking-[0.22em] mb-3"
            style={{ fontSize: '9px', color: '#888' }}
          >
            Importe recibido
          </div>
          <div
            style={{
              backgroundColor: '#0B0B0B',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              padding: '20px 24px',
            }}
          >
            <div
              style={{ fontSize: '34px', color: '#F5C800', lineHeight: 1, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}
            >
              {formatMoney(r.amount)}
            </div>
            <div
              style={{
                flexShrink: 0,
                backgroundColor: '#F5C800',
                color: '#0B0B0B',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap',
                lineHeight: 1.4,
              }}
            >
              {PAYMENT_LABELS[r.paymentMethod] ?? r.paymentMethod}
            </div>
          </div>
        </div>

        {/* Concepto */}
        <div className="mb-6">
          <div
            className="font-extrabold uppercase tracking-[0.22em] mb-3"
            style={{ fontSize: '9px', color: '#888' }}
          >
            Concepto
          </div>
          <div className="rounded-xl border border-romero-gray-2 overflow-hidden">
            <Row label="En concepto de" value={r.concept} large />
            {r.budgetNumber && (
              <Row label="Presupuesto" value={`N° ${r.budgetNumber}`} />
            )}
            {r.notes && <Row label="Observaciones" value={r.notes} />}
          </div>
        </div>

        {/* Firmas */}
        <div className="grid grid-cols-2 gap-8 pt-2">
          {[
            { title: 'Firma y aclaración', sub: 'Quien entrega' },
            { title: 'Firma y sello', sub: 'Lucas Gallastagui Impermeabilizaciones' },
          ].map((s) => (
            <div key={s.title} className="text-center">
              {/* Espacio para firmar */}
              <div style={{ height: '52px' }} />
              <div
                className="border-t-2 pt-3"
                style={{ borderColor: '#0B0B0B' }}
              >
                <div
                  className="font-bold uppercase tracking-wider"
                  style={{ fontSize: '9px', color: '#0B0B0B' }}
                >
                  {s.title}
                </div>
                <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                  {s.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer
        className="px-8 py-5"
        style={{ backgroundColor: '#0B0B0B' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="rounded-full"
            style={{ height: '6px', width: '32px', backgroundColor: '#F5C800' }}
          />
          <div
            className="font-extrabold uppercase tracking-[0.26em]"
            style={{ fontSize: '9px', color: '#F5C800' }}
          >
            Lucas Gallastagui Impermeabilizaciones
          </div>
        </div>
        <div
          className="flex gap-8"
          style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}
        >
          <div>
            <div style={{ fontWeight: 700, color: 'white', marginBottom: '2px' }}>Tandil</div>
            <div>+54 9 2494 60-1118</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
