import { useEffect, useState } from 'react'
import { formatNumber, parseNumber } from '../utils/money'

interface Props {
  value: number
  onChange: (n: number) => void
  placeholder?: string
  prefix?: string
  className?: string
  id?: string
}

export function MoneyInput({ value, onChange, placeholder, prefix = '$', className, id }: Props) {
  const [text, setText] = useState<string>(value ? formatNumber(value, 0) : '')

  useEffect(() => {
    const parsedCurrent = parseNumber(text)
    if (parsedCurrent !== value) {
      setText(value ? formatNumber(value, 0) : '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className={'relative ' + (className ?? '')}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-romero-gray-3 font-bold text-sm select-none">
        {prefix}
      </span>
      <input
        id={id}
        inputMode="numeric"
        className="input pl-7"
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          const raw = e.target.value
          setText(raw)
          onChange(parseNumber(raw))
        }}
        onBlur={() => {
          const n = parseNumber(text)
          setText(n ? formatNumber(n, 0) : '')
          onChange(n)
        }}
      />
    </div>
  )
}
