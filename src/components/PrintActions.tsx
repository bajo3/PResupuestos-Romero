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

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = pdf.internal.pageSize.getWidth()   // 210mm
    const pageH = pdf.internal.pageSize.getHeight()  // 297mm
    const marginY = 8                                 // mm — margen superior/inferior
    const usableH = pageH - marginY * 2

    const blocks = Array.from(sheet.children) as HTMLElement[]
    let cursorY = marginY
    let isFirst = true

    for (const block of blocks) {
      const canvas = await html2canvas(block, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })
      const blockH = (canvas.height * pageW) / canvas.width

      // Caso 1: bloque más alto que una página entera → cortarlo manualmente
      if (blockH > usableH) {
        if (!isFirst) {
          pdf.addPage()
        }
        let remaining = blockH
        let offsetY = 0
        let firstSlice = true
        while (remaining > 0) {
          if (!firstSlice) pdf.addPage()
          pdf.addImage(canvas, 'PNG', 0, marginY - offsetY, pageW, blockH)
          offsetY += usableH
          remaining -= usableH
          firstSlice = false
        }
        cursorY = pageH // forzar nueva página para el siguiente bloque
        isFirst = false
        continue
      }

      // Caso 2: no entra en lo que queda de la página actual → nueva página
      if (cursorY + blockH > pageH - marginY) {
        pdf.addPage()
        cursorY = marginY
      }

      pdf.addImage(canvas, 'PNG', 0, cursorY, pageW, blockH)
      cursorY += blockH
      isFirst = false
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
