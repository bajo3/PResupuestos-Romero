const nf = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatMoney(value: number): string {
  if (!isFinite(value)) return '$ 0,00'
  return '$ ' + nf.format(value || 0)
}

export function formatNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value || 0)
}

export function parseNumber(input: string): number {
  if (!input) return 0
  // acepta "13.800.000,00" o "13800000.00"
  const cleaned = input.replace(/\s/g, '').replace(/\$/g, '')
  // si tiene coma → formato AR
  if (cleaned.includes(',')) {
    return Number(cleaned.replace(/\./g, '').replace(',', '.')) || 0
  }
  return Number(cleaned) || 0
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

export function formatLongDate(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${d} de ${MESES[m - 1]?.replace(/^\w/, c => c.toUpperCase())} de ${y}`
}
