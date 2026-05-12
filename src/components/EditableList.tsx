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
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex flex-col gap-1 pt-2">
            <button
              type="button"
              onClick={() => move(i, -1)}
              className="text-romero-gray-3 hover:text-romero-ink text-xs leading-none"
              aria-label="Subir"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              className="text-romero-gray-3 hover:text-romero-ink text-xs leading-none"
              aria-label="Bajar"
            >
              ▼
            </button>
          </div>
          <textarea
            value={item}
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholder}
            rows={1}
            className="input flex-1 resize-y min-h-[44px]"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="mt-1 h-9 w-9 shrink-0 rounded-lg text-red-600 hover:bg-red-50"
            aria-label="Eliminar"
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className="btn-ghost w-full">
        + {addLabel}
      </button>
    </div>
  )
}
