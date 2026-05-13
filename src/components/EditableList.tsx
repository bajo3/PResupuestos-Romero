interface Props {
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  addLabel?: string
}

export function EditableList({ items, onChange, placeholder, addLabel = 'Agregar ítem' }: Props) {
  const update = (i: number, v: string) => {
    const next = [...items]
    next[i] = v
    onChange(next)
  }
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  const add = () => onChange([...items, ''])

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-romero-gray-2 bg-white overflow-hidden">
          {/* Barra de controles arriba */}
          <div className="flex items-center gap-1 px-2 py-1.5 bg-romero-gray border-b border-romero-gray-2">
            <span className="text-[11px] font-bold text-romero-gray-3 px-1">
              #{String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="h-7 w-7 rounded-md text-romero-gray-3 hover:bg-white hover:text-romero-ink disabled:opacity-30 text-sm"
              aria-label="Subir"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === items.length - 1}
              className="h-7 w-7 rounded-md text-romero-gray-3 hover:bg-white hover:text-romero-ink disabled:opacity-30 text-sm"
              aria-label="Bajar"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => remove(i)}
              className="h-7 w-7 rounded-md text-red-500 hover:bg-red-50 text-sm ml-1"
              aria-label="Eliminar"
            >
              ✕
            </button>
          </div>
          {/* Textarea grande */}
          <textarea
            value={item}
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3.5 py-3 text-[15px] outline-none resize-y min-h-[80px] bg-white placeholder:text-romero-gray-3 leading-relaxed"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="btn-ghost w-full py-3.5 text-[14px]"
      >
        + {addLabel}
      </button>
    </div>
  )
}
