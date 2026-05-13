import { useState } from 'react'

interface Props {
  onBack: () => void
  onEdit: () => void
  clientName?: string
}

async function downloadPDF(clientName: string, setLoading: (v: boolean) => void) {
  const sheet = document.querySelector('.sheet') as HTMLElement | null
  if (!sheet) return

  setLoading(true)
  try {
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])

    const canvas = await html2canvas(sheet, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = pdf.internal.pageSize.getWidth()   // 210mm
    const pageH = pdf.internal.pageSize.getHeight()  // 297mm

    // Scale canvas to fit page width
    const imgH = (canvas.height * pageW) / canvas.width
    let remaining = imgH
    let offsetY = 0

    while (remaining > 0) {
      if (offsetY > 0) pdf.addPage()
      pdf.addImage(canvas, 'PNG', 0, -offsetY, pageW, imgH)
      offsetY += pageH
      remaining -= pageH
    }

    const safe = (clientName || 'presupuesto').replace(/[^a-zA-Z0-9\s\-áéíóúüñÁÉÍÓÚÜÑ]/g, '').trim()
    pdf.save(`presupuesto-${safe || 'romero'}.pdf`)
  } finally {
    setLoading(false)
  }
}

export function PrintActions({ onBack, onEdit, clientName = '' }: Props) {
  const [loading, setLoading] = useState(false)

  return (
    <div className="no-print sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-romero-gray-2">
      <div className="mx-auto max-w-5xl px-3 sm:px-6 py-2.5 flex items-center gap-2">
        <button onClick={onBack} className="btn-ghost py-2 text-[13px]">
          ← Volver
        </button>
        <button onClick={onEdit} className="btn-ghost py-2 text-[13px]">
          ✏ Editar
        </button>
        <div className="flex-1" />
        <button
          onClick={() => window.print()}
          className="btn-ghost py-2 text-[13px]"
        >
          <span className="hidden sm:inline">🖨 </span>Imprimir
        </button>
        <button
          onClick={() => downloadPDF(clientName, setLoading)}
          disabled={loading}
          className="btn-yellow py-2 text-[13px] min-w-[110px] flex items-center justify-center gap-1.5"
        >
          {loading ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-romero-ink/30 border-t-romero-ink rounded-full animate-spin" />
              Generando…
            </>
          ) : (
            <>⬇ Descargar PDF</>
          )}
        </button>
      </div>
    </div>
  )
}
