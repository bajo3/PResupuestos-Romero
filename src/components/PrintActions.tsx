interface Props {
  onBack: () => void
  onEdit: () => void
}

function openPrintWindow() {
  // Abre una ventana limpia solo con la hoja y dispara el diálogo de impresión/descarga
  const sheet = document.querySelector('.sheet') as HTMLElement | null
  if (!sheet) { window.print(); return }

  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join('\n')

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { window.print(); return }

  win.document.write(`<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  ${styles}
  <style>
    body { background:#fff; margin:0; padding:0; }
    @page { size: A4; margin: 12mm 10mm; }
    .no-print { display:none!important; }
    .sheet { box-shadow:none!important; border:none!important; border-radius:0!important; max-width:none!important; }
    * { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  </style>
</head>
<body>
  ${sheet.outerHTML}
  <script>
    window.onload = function() {
      setTimeout(function(){ window.print(); }, 400);
    }
  <\/script>
</body>
</html>`)
  win.document.close()
}

export function PrintActions({ onBack, onEdit }: Props) {
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
          title="Imprime en la ventana actual"
        >
          <span className="hidden sm:inline">🖨 </span>Imprimir
        </button>
        <button
          onClick={openPrintWindow}
          className="btn-yellow py-2 text-[13px]"
          title="Abre una ventana limpia y te permite guardar como PDF"
        >
          <span className="hidden sm:inline">⬇ </span>Guardar PDF
        </button>
      </div>
      {/* Ayuda sutil */}
      <div className="hidden sm:block bg-romero-gray border-t border-romero-gray-2 px-6 py-1.5 text-[11px] text-romero-gray-3 text-center">
        En el diálogo de impresión elegí <strong>Guardar como PDF</strong> para descargar el archivo
      </div>
    </div>
  )
}
