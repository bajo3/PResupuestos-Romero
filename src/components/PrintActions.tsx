interface Props {
  onBack: () => void
  onEdit: () => void
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
        <button onClick={() => window.print()} className="btn-yellow py-2 text-[13px] sm:text-sm">
          <span className="hidden sm:inline">Imprimir / </span>PDF
        </button>
      </div>
    </div>
  )
}
