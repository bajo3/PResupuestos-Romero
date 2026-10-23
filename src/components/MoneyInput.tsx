import { useEffect, useState } from 'react'
import { formatNumber, parseNumber } from '../utils/money'

interface Props {
  value: number
  onChange: (n: number) => void
  placeholder?: string
  prefix?: string
  className?: string
  id?: string
  autoFocus?: boolean
}

export function MoneyInput({ value, onChange, placeholder, prefix = '$', className, id, autoFocus }: Props) {
  const [text, setText] = useState<string>(value === 0 ? '' : formatNumber(value, 0))

  useEffect(() => {
    const parsedCurrent = parseNumber(text)
    if (parsedCurrent !== value) {
      setText(value === 0 ? '' : formatNumber(value, 0))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div
      className={
        'flex items-center rounded-xl border border-romero-gray-2 bg-white ' +
        'transition focus-within:border-romero-ink focus-within:ring-4 focus-within:ring-romero-yellow/40 ' +
        (className ?? '')
      }
    >
      <span className="pl-3.5 pr-1.5 text-[15px] font-semibold text-romero-gray-3 select-none shrink-0">
        {prefix}
      </span>
      <input
        id={id}
        autoFocus={autoFocus}
        inputMode="numeric"
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          const raw = e.target.value
          setText(raw)
          onChange(parseNumber(raw))
        }}
        onBlur={() => {
          const n = parseNumber(text)
          setText(text.trim() === '' ? '' : formatNumber(n, 0))
          onChange(n)
        }}
        className="flex-1 py-3 pr-3.5 text-[15px] outline-none bg-transparent min-w-0"
      />
    </div>
  )
}
