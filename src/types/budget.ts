export interface Budget {
  id: string
  number: string
  date: string // ISO yyyy-mm-dd
  client: string
  address: string
  propertyType: string
  validityDays: number
  deliveryTime: string
  workTitle: string
  description: string
  pricingMode: 'per_m2' | 'fixed'
  squareMeters: number
  pricePerM2: number
  fixedPrice: number
  advancePct: number
  finalPct: number
  vatIncluded: boolean
  applyVat: boolean
  vatPct: number
  stages: string[]
  materials: string[]
  conditions: string[]
  notes?: string
  createdAt: number
  updatedAt: number
  archived?: boolean
}

export const DEFAULT_STAGES: string[] = [
  'Limpieza y preparación de superficies.',
  'Colocación de membrana ECO DRY.',
  'Tratamiento integral de uniones y solapes.',
  'Refuerzo en encuentros críticos y zonas de desagüe.',
  'Fijación mediante anclaje químico en canaletas y puntos de encuentro con chapa existente.',
  'Sellado técnico de terminaciones.',
]

export const DEFAULT_MATERIALS: string[] = [
  'Membrana ECO DRY calidad profesional.',
  'Anclajes químicos de alta resistencia.',
  'Selladores y accesorios de terminación.',
]

export const DEFAULT_CONDITIONS: string[] = [
  'El precio informado corresponde al valor por m².',
  'En caso de que la superficie final ejecutada supere los metros presupuestados inicialmente, la diferencia será ajustada y adicionada al momento final de la obra.',
  'Los precios no incluyen IVA, salvo aclaración expresa.',
  'El trabajo es llave en mano.',
  'No incluye alquiler de volquetes ni baño químico.',
  'La medición se realizará junto con la dirección de obra para corroborar los metros ejecutados.',
  'Todas las soluciones deberán ser acompañadas por un mantenimiento periódico por parte del propietario.',
  'Materiales aplicados de la marca Revestech.',
  'Aplicador homologado por la Comunidad Europea.',
]

export function makeEmptyBudget(): Budget {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    number: '',
    date: new Date().toISOString().slice(0, 10),
    client: '',
    address: '',
    propertyType: 'Vivienda',
    validityDays: 15,
    deliveryTime: 'A definir',
    workTitle: 'Sistema de Impermeabilización Profesional',
    description:
      'Provisión y ejecución de sistema de impermeabilización profesional, mediante colocación de membrana ECO DRY Revestech aplicada sobre la superficie indicada.',
    pricingMode: 'per_m2',
    squareMeters: 0,
    pricePerM2: 0,
    fixedPrice: 0,
    advancePct: 70,
    finalPct: 30,
    vatIncluded: false,
    applyVat: false,
    vatPct: 21,
    stages: [...DEFAULT_STAGES],
    materials: [...DEFAULT_MATERIALS],
    conditions: [...DEFAULT_CONDITIONS],
    notes: '',
    createdAt: now,
    updatedAt: now,
  }
}

export function makeDemoBudget(): Budget {
  const b = makeEmptyBudget()
  return {
    ...b,
    number: '700 - 433',
    date: '2026-05-07',
    client: 'Consorcio Castagnino',
    address: 'Paz 1333',
    propertyType: 'Vivienda',
    validityDays: 15,
    deliveryTime: 'A definir',
    workTitle: 'Sistema de Impermeabilización Profesional de Canaletas y Encuentros de Techo',
    description:
      'Provisión y ejecución de sistema de impermeabilización profesional en encuentros de canaletas de techo principal, mediante colocación de membrana ECO DRY Revestech, aplicada sobre la totalidad de la canaleta de desagüe y puntos de encuentro con chapa existente.',
    squareMeters: 200,
    pricePerM2: 69000,
    advancePct: 70,
    finalPct: 30,
  }
}

export interface Totals {
  subtotal: number
  vat: number
  total: number
  advance: number
  final: number
}

export function computeTotals(b: Budget): Totals {
  const subtotal =
    b.pricingMode === 'fixed'
      ? b.fixedPrice || 0
      : (b.squareMeters || 0) * (b.pricePerM2 || 0)
  let vat = 0
  let total = subtotal
  if (b.applyVat) {
    if (b.vatIncluded) {
      // precio ya incluye IVA → desagregar
      vat = subtotal - subtotal / (1 + b.vatPct / 100)
      total = subtotal
    } else {
      vat = subtotal * (b.vatPct / 100)
      total = subtotal + vat
    }
  }
  const advance = total * (b.advancePct / 100)
  const final = total * (b.finalPct / 100)
  return { subtotal, vat, total, advance, final }
}
