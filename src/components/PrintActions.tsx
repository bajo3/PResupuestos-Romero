import { useState } from 'react'
import { useCrm } from '../crm/CrmContext'

interface Props {
  onBack: () => void
  onEdit: () => void
  clientName?: string
  docType?: 'presupuesto' | 'recibo' | 'garantia'
}

const DOC_LABEL: Record<string, string> = { presupuesto: 'presupuesto', recibo: 'recibo', garantia: 'garantía' }

function safeName(clientName: string): string {
  return (clientName || 'cliente').replace(/[^a-zA-Z0-9\s\-áéíóúüñÁÉÍÓÚÜÑ]/g, '').trim() || 'lucas-gallastagui'
}

/** Genera el PDF del documento que se está viendo. */
async function buildPdf(clientName: string, docType: string): Promise<{ pdf: import('jspdf').jsPDF; filename: string } | null> {
  const sheet = document.querySelector('.sheet, .budget-sheet') as HTMLElement | null
  if (!sheet) return null
  const filename = `${docType}-${safeName(clientName)}.pdf`

  // El presupuesto se muestra reducido con transform: se captura a tamaño real.
  const scaled = sheet.closest('.budget-scale-inner') as HTMLElement | null
  const prevTransform = scaled?.style.transform ?? ''
  if (scaled) scaled.style.transform = 'none'

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
      return { pdf, filename }
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

    return { pdf, filename }
  } finally {
    if (scaled) scaled.style.transform = prevTransform
  }
}

export function PrintActions({ onBack, onEdit, clientName = '', docType = 'presupuesto' }: Props) {
  const { clients } = useCrm()
  const [busy, setBusy] = useState<'pdf' | 'share' | null>(null)

  const download = async () => {
    setBusy('pdf')
    try {
      const built = await buildPdf(clientName, docType)
      built?.pdf.save(built.filename)
    } finally {
      setBusy(null)
    }
  }

  /** Abre el menú de compartir del teléfono (WhatsApp, etc.) con el PDF adjunto. */
  const shareWhatsApp = async () => {
    setBusy('share')
    try {
      const built = await buildPdf(clientName, docType)
      if (!built) return
      const text = `Hola${clientName ? ' ' + clientName : ''}, te paso el ${DOC_LABEL[docType]} de Lucas Gallastagui Impermeabilizaciones.`
      const file = new File([built.pdf.output('blob')], built.filename, { type: 'application/pdf' })

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: built.filename, text })
        } catch { /* el usuario cerró el menú */ }
        return
      }

      // Sin menú de compartir (computadora): se descarga el PDF y se abre el chat para adjuntarlo
      built.pdf.save(built.filename)
      const key = clientName.trim().toLowerCase()
      const phone = (clients.find((c) => c.name.trim().toLowerCase() === key)?.phone ?? '').replace(/\D/g, '')
      const number = phone ? (phone.startsWith('54') ? phone : '54' + phone) : ''
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(text + ' (adjuntá el PDF que se acaba de descargar)')}`, '_blank', 'noopener')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="no-print sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-romero-gray-2">
      <div className="mx-auto max-w-5xl px-3 sm:px-6 py-2.5 flex items-center gap-1.5 sm:gap-2">
        <button onClick={onBack} className="btn-ghost py-2 px-3 text-[13px] whitespace-nowrap">
          <span aria-hidden>←</span><span className="hidden xs:inline">&nbsp;Volver</span><span className="xs:hidden sr-only">Volver</span>
        </button>
        <button onClick={onEdit} className="btn-ghost py-2 px-3 text-[13px] whitespace-nowrap">
          <span aria-hidden>✏</span><span className="hidden xs:inline">&nbsp;Editar</span><span className="xs:hidden sr-only">Editar</span>
        </button>
        <div className="flex-1" />
        <button
          onClick={() => window.print()}
          aria-label="Imprimir"
          className="btn-ghost py-2 px-3 text-[13px] whitespace-nowrap hidden xs:inline-flex"
        >
          <span aria-hidden>🖨</span><span className="hidden sm:inline">&nbsp;Imprimir</span>
        </button>
        <button
          onClick={shareWhatsApp}
          disabled={busy !== null}
          aria-label="Enviar por WhatsApp"
          className="py-2 px-3 text-[13px] rounded-xl font-semibold whitespace-nowrap text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
        >
          {busy === 'share' ? (
            <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <><span aria-hidden>↗</span><span className="hidden xs:inline">&nbsp;WhatsApp</span></>
          )}
        </button>
        <button
          onClick={download}
          disabled={busy !== null}
          aria-label="Descargar PDF"
          className="btn-yellow py-2 px-3 text-[13px] sm:min-w-[110px] flex items-center justify-center gap-1.5 whitespace-nowrap"
        >
          {busy === 'pdf' ? (
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
