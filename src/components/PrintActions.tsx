import { useState } from 'react'

interface Props {
  onBack: () => void
  onEdit: () => void
  clientName?: string
  docType?: 'presupuesto' | 'recibo' | 'garantia'
}

async function downloadPDF(clientName: string, docType: string, setLoading: (v: boolean) => void) {
  const sheet = document.querySelector('.sheet, .budget-sheet') as HTMLElement | null
  if (!sheet) return

  // El presupuesto se muestra reducido con transform: se captura a tamaño real.
  const scaled = sheet.closest('.budget-scale-inner') as HTMLElement | null
  const prevTransform = scaled?.style.transform ?? ''
  if (scaled) scaled.style.transform = 'none'

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

    // Hojas de tamaño fijo (presupuesto): una por página, ajustadas a la A4 completa
    if (blocks.length > 0 && blocks.every((b) => b.hasAttribute('data-page'))) {
      for (let i = 0; i < blocks.length; i++) {
        const canvas = await html2canvas(blocks[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
        if (i > 0) pdf.addPage()
        pdf.addImage(canvas, 'JPEG', 0, 0, pageW, pageH)
      }
      const name = (clientName || 'cliente').replace(/[^a-zA-Z0-9\s\-áéíóúüñÁÉÍÓÚÜÑ]/g, '').trim()
      pdf.save(`${docType}-${name || 'lucas-gallastagui'}.pdf`)
      return
    }

    for (const block of blocks) {
      const canvas = await html2canvas(block, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })
      const blockH = (canvas.height * pageW) / canvas.width

      // Bloque más alto que una página: cortarlo manualmente
      if (blockH > usableH) {
        if (cursorY > marginY) pdf.addPage()
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
        cursorY = pageH
        continue
      }

      // No entra en lo que queda: nueva página
      if (cursorY + blockH > pageH - marginY) {
        pdf.addPage()
        cursorY = marginY
      }

      pdf.addImage(canvas, 'PNG', 0, cursorY, pageW, blockH)
      cursorY += blockH
    }

    const safe = (clientName || 'cliente').replace(/[^a-zA-Z0-9\s\-áéíóúüñÁÉÍÓÚÜÑ]/g, '').trim()
    pdf.save(`${docType}-${safe || 'lucas-gallastagui'}.pdf`)
  } finally {
    if (scaled) scaled.style.transform = prevTransform
    setLoading(false)
  }
}

export function PrintActions({ onBack, onEdit, clientName = '', docType = 'presupuesto' }: Props) {
  const [loading, setLoading] = useState(false)

  return (
    <div className="no-print sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-romero-gray-2">
      <div className="mx-auto max-w-5xl px-3 sm:px-6 py-2.5 flex items-center gap-1.5 sm:gap-2">
        <button onClick={onBack} className="btn-ghost py-2 px-3 text-[13px] whitespace-nowrap">
          ← Volver
        </button>
        <button onClick={onEdit} className="btn-ghost py-2 px-3 text-[13px] whitespace-nowrap">
          <span aria-hidden>✏</span><span className="hidden xs:inline">&nbsp;Editar</span><span className="xs:hidden sr-only">Editar</span>
        </button>
        <div className="flex-1" />
        <button
          onClick={() => window.print()}
          aria-label="Imprimir"
          className="btn-ghost py-2 px-3 text-[13px] whitespace-nowrap"
        >
          <span aria-hidden>🖨</span><span className="hidden sm:inline">&nbsp;Imprimir</span>
        </button>
        <button
          onClick={() => downloadPDF(clientName, docType, setLoading)}
          disabled={loading}
          className="btn-yellow py-2 px-3 text-[13px] sm:min-w-[110px] flex items-center justify-center gap-1.5 whitespace-nowrap"
        >
          {loading ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-romero-ink/30 border-t-romero-ink rounded-full animate-spin" />
              Generando…
            </>
          ) : (
            <>⬇ <span className="hidden sm:inline">Descargar&nbsp;</span>PDF</>
          )}
        </button>
      </div>
    </div>
  )
}
