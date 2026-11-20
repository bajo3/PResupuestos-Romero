import { today } from './crm'

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
  pricingMode: 'per_m2' | 'fixed' | 'pending'
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
  /** Fotos comprimidas como data URLs para que el documento sea autocontenido. */
  photos?: string[]
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
    date: today(),
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
    advancePct: 50,
    finalPct: 50,
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
    advancePct: 50,
    finalPct: 50,
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
    b.pricingMode === 'pending'
      ? 0
      : b.pricingMode === 'fixed'
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

/** Sistemas predefinidos: un toque carga título, descripción, etapas y materiales. */
export interface BudgetSystem {
  id: string
  label: string
  workTitle: string
  description: string
  stages: string[]
  materials: string[]
}

export const BUDGET_SYSTEMS: BudgetSystem[] = [
  {
    id: 'mapelastic',
    label: 'Mapelastic + geotextil',
    workTitle: 'Sistema de Impermeabilización Profesional',
    description:
      'Sistema de impermeabilización con manto geotextil y Mapelastic. Preparación y acondicionamiento del soporte, limpieza de la superficie y tratamiento de juntas, fisuras y puntos críticos. Aplicación de sistema impermeabilizante mediante Mapelastic, incorporando manto geotextil como refuerzo, logrando una membrana continua, flexible y de alta adherencia. Finalización con las capas correspondientes del sistema, garantizando una adecuada protección frente a filtraciones y movimientos del soporte.',
    stages: [
      'Preparación del soporte: limpieza profunda de la superficie, eliminación de material suelto y acondicionamiento de la base.',
      'Tratamiento de puntos críticos: sellado y refuerzo de juntas, fisuras, encuentros y desagües.',
      'Primera capa de Mapelastic: aplicación del revestimiento impermeabilizante sobre el soporte preparado.',
      'Colocación del manto geotextil: incorporación del refuerzo sobre la primera capa fresca, asegurando su correcta integración y continuidad.',
      'Segunda capa de Mapelastic: recubrimiento del geotextil hasta lograr su completa saturación y cobertura.',
      'Terminación: aplicación de las capas finales correspondientes al sistema, conformando una protección impermeable, flexible y continua.',
    ],
    materials: [
      'Mapelastic calidad profesional.',
      'Manto geotextil de refuerzo.',
      'Selladores y accesorios de terminación.',
    ],
  },
  {
    id: 'ecodry',
    label: 'Membrana ECO DRY',
    workTitle: 'Sistema de Impermeabilización Profesional',
    description:
      'Provisión y ejecución de sistema de impermeabilización profesional, mediante colocación de membrana ECO DRY Revestech aplicada sobre la superficie indicada. (Este precio incluye la retirada de toda la membrana colocada y toda la suciedad que haya en la terraza).',
    stages: [
      'Limpieza y preparación de superficies.',
      'Colocación de membrana ECO DRY.',
      'Tratamiento integral de uniones y solapes.',
      'Refuerzo en encuentros críticos y zonas de desagüe.',
      'Fijación mediante anclaje químico en canaletas y puntos de encuentro con chapa existente.',
      'Sellado técnico de terminaciones.',
    ],
    materials: ['Membrana ECO DRY calidad profesional.'],
  },
  {
    id: 'poliuretano',
    label: 'Poliuretano + geotextil',
    workTitle: 'Sistema de Impermeabilización Profesional',
    description:
      'Sistema de impermeabilización con poliuretano y geotextil. Mantenimiento de terraza. (Este presupuesto incluye el retiro de la membrana existente y la extracción de los restos anteriores, plantas, desperdicios, etc.).',
    stages: [
      'Preparación del soporte: limpieza profunda de la superficie y eliminación de material flojo, suciedad y restos de impermeabilizaciones deterioradas.',
      'Reparación de sectores deteriorados: tratamiento y sellado de fisuras y grietas, y reparación de zonas degradadas con materiales compatibles.',
      'Refuerzo de encuentros, desagües y puntos críticos.',
      'Imprimación: aplicación de primer compatible con el sistema de poliuretano para favorecer la adherencia sobre el soporte existente, respetando los tiempos de secado indicados por el fabricante.',
      'Aplicación de capas de poliuretano: manos sucesivas de PU hasta cubrir completamente el geotextil, formando una membrana impermeabilizante continua, flexible y adherida al soporte.',
      'Terminación y protección: mano final de poliuretano según las especificaciones del sistema y verificación de continuidad, adherencia y correcta cobertura de toda la superficie intervenida.',
    ],
    materials: [
      'Poliuretano impermeabilizante calidad profesional.',
      'Manto geotextil de refuerzo.',
      'Primer compatible con el sistema.',
    ],
  },
]
