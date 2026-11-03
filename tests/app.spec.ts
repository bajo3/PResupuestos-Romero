import { test, expect, Page } from '@playwright/test'
import { mergeWithRemote } from '../src/utils/syncMerge'

// Datos de prueba: se cargan en localStorage antes de abrir la app (sin Supabase).
async function seed(page: Page, data: Record<string, unknown>) {
  await page.addInitScript((d) => {
    for (const [k, v] of Object.entries(d)) localStorage.setItem(k, JSON.stringify(v))
  }, data)
}

const now = Date.now()
const today = (() => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
})()

const budget = {
  id: 'b1', number: '010', date: today, client: 'Consorcio Paz', address: 'Paz 1333', propertyType: 'Vivienda',
  validityDays: 15, deliveryTime: 'A definir', workTitle: 'Impermeabilización de techo', description: 'Trabajo de prueba.',
  pricingMode: 'per_m2', squareMeters: 100, pricePerM2: 50000, fixedPrice: 0, advancePct: 50, finalPct: 50,
  vatIncluded: false, applyVat: false, vatPct: 21,
  stages: ['Limpieza.', 'Membrana.'], materials: ['Membrana ECO DRY.'], conditions: ['Condición uno.', 'Condición dos.'],
  createdAt: now, updatedAt: now,
}

const base = { createdAt: now, updatedAt: now }

// ─── Presupuestos ─────────────────────────────────────────────────────────────

test.describe('Presupuestos', () => {
  test('lista, abre la vista y ocupa exactamente 2 hojas', async ({ page }) => {
    await seed(page, { 'romero.budgets.v1': [budget] })
    await page.goto('/#/presupuestos')
    await expect(page.getByText('Consorcio Paz')).toBeVisible()
    await page.getByText('👁 Ver').click()
    await expect(page.locator('.budget-page')).toHaveCount(2)
    await expect(page.getByText('$ 5.000.000,00').first()).toBeVisible()
    await expect(page.getByText('no entra en 2 hojas')).toHaveCount(0)
  })

  test('el PDF impreso tiene 2 páginas', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium')
    await seed(page, { 'romero.budgets.v1': [budget] })
    await page.goto('/#/presupuestos')
    await page.getByText('👁 Ver').click()
    await expect(page.locator('.budget-page')).toHaveCount(2)
    await page.waitForTimeout(500)
    const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true })
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length
    expect(pages).toBe(2)
  })

  test('avisa si el contenido no entra en 2 hojas', async ({ page }) => {
    const long = { ...budget, stages: Array.from({ length: 24 }, (_, i) => `Etapa ${i + 1} con bastante texto descriptivo para ocupar espacio en la primera hoja del presupuesto.`) }
    await seed(page, { 'romero.budgets.v1': [long] })
    await page.goto('/#/presupuestos')
    await page.getByText('👁 Ver').click()
    await expect(page.getByText('no entra en 2 hojas')).toBeVisible()
  })

  test('formulario: calcula el total, valida y guarda', async ({ page }) => {
    await page.goto('/#/presupuestos')
    await page.getByText('+ Nuevo presupuesto').click()
    await expect(page.getByText('1. Cliente')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Guardar' }).first()).toBeDisabled()

    await page.getByPlaceholder('Consorcio Castagnino').fill('Cliente Test')
    await page.getByPlaceholder('Paz 1333').fill('Calle 123')
    await page.getByPlaceholder('200').fill('100')
    await page.getByPlaceholder('69.000').fill('50000')
    await expect(page.getByText('$ 5.000.000,00').locator('visible=true').first()).toBeVisible()

    await page.getByRole('button', { name: '30% / 70%' }).click()
    await expect(page.getByText('$ 1.500.000,00').first()).toBeVisible()

    await page.getByRole('button', { name: 'Guardar' }).first().click()
    await expect(page.locator('.budget-page')).toHaveCount(2)
  })
})

// ─── Caja ─────────────────────────────────────────────────────────────────────

test.describe('Caja', () => {
  test('registrar salida y entrada actualiza el saldo; anular lo revierte', async ({ page }) => {
    await page.goto('/#/caja')
    await expect(page.getByText('Plata en caja')).toBeVisible()

    await page.getByRole('button', { name: '+ Entró plata' }).click()
    await page.keyboard.type('1000000')
    await page.getByPlaceholder('Ej: seña obra Castagnino').fill('Seña')
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText('$ 1.000.000,00').first()).toBeVisible()

    await page.getByRole('button', { name: '− Salió plata' }).click()
    await page.keyboard.type('250000')
    await page.getByPlaceholder('Ej: 10 rollos de membrana').fill('Combustible')
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText('$ 750.000,00').first()).toBeVisible()

    page.once('dialog', (d) => d.accept('error de carga'))
    await page.getByText('Combustible').click()
    await page.getByRole('button', { name: 'Anular' }).click()
    await expect(page.getByText('$ 1.000.000,00').first()).toBeVisible()
    await expect(page.getByText('anulado: error de carga')).toBeVisible()
  })
})

// ─── Obras, recibos y stock ───────────────────────────────────────────────────

test.describe('Obras', () => {
  test('el recibo suma cobrado y los gastos restan ganancia', async ({ page }) => {
    await seed(page, {
      'lg.crm.obras.v1': [{ id: 'o1', name: 'Reforma', client: 'Lucas', address: 'Paz 1', amount: 5000000, status: 'en_ejecucion', startDate: today, endDate: '', notes: '', ...base }],
      'romero.receipts.v1': [{ id: 'r1', number: '001', date: today, obraId: 'o1', client: 'Lucas', address: '', amount: 3000000, paymentMethod: 'Transferencia', concept: 'Seña', ...base }],
      'lg.crm.movements.v1': [{ id: 'e1', date: today, type: 'egreso', category: 'Mano de obra', amount: 2200000, method: 'Efectivo', description: 'Cuadrilla', obraId: 'o1', ...base }],
    })
    await page.goto('/#/obras/o1')
    await expect(page.getByText('Reforma').first()).toBeVisible()
    await expect(page.getByText('60%')).toBeVisible()
    await expect(page.getByText('$ 2.800.000,00').first()).toBeVisible() // ganancia estimada
    await expect(page.getByText('$ 800.000,00').first()).toBeVisible() // ganancia real
  })

  test('el stock usado en una obra cuenta como gasto y no mueve la caja', async ({ page }) => {
    await seed(page, {
      'lg.crm.obras.v1': [{ id: 'o1', name: 'Reforma', client: 'Lucas', address: '', amount: 1000000, status: 'en_ejecucion', startDate: today, endDate: '', notes: '', ...base }],
      'lg.crm.stock_items.v1': [{ id: 's1', name: 'Membrana', unit: 'rollo', minStock: 0, unitCost: 100000, ...base }],
      'lg.crm.stock_moves.v1': [
        { id: 'm1', itemId: 's1', date: today, qty: 10, unitCost: 100000, note: 'Compra', ...base },
        { id: 'm2', itemId: 's1', date: today, qty: -4, unitCost: 100000, obraId: 'o1', note: '', ...base },
      ],
      'lg.crm.movements.v1': [{ id: 'e0', date: today, type: 'egreso', category: 'Materiales', amount: 1000000, method: 'Efectivo', description: 'Compra stock', stockMoveId: 'm1', ...base }],
    })
    await page.goto('/#/obras/o1')
    await expect(page.getByText('$ 400.000,00').first()).toBeVisible() // 4 rollos x 100.000
    await page.goto('/#/caja')
    await expect(page.getByText('− $ 1.000.000,00')).toBeVisible()
    await expect(page.getByText('$ -1.000.000,00').first()).toBeVisible()
  })
})

// ─── Deudas ───────────────────────────────────────────────────────────────────

test.describe('Deudas', () => {
  test('un pago parcial baja lo pendiente y sale de caja', async ({ page }) => {
    await seed(page, {
      'lg.crm.debts.v1': [{ id: 'd1', creditor: 'Corralón', description: '', amount: 500000, dueDate: today, ...base }],
    })
    await page.goto('/#/deudas')
    await page.getByRole('button', { name: 'Pagar' }).click()
    await page.getByRole('dialog').locator('input[inputmode="numeric"]').first().fill('200000')
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText('$ 300.000,00').first()).toBeVisible()
    await expect(page.getByText('Pagos (1)')).toBeVisible()
    await page.goto('/#/caja')
    await expect(page.getByText('Pago a Corralón')).toBeVisible()
  })
})

// ─── Uso rápido (celular y escritorio) ────────────────────────────────────────

test.describe('Carga rápida', () => {
  test('el botón "+" carga un gasto en 4 toques y baja la caja', async ({ page }) => {
    await page.goto('/#/panel')
    await page.getByRole('button', { name: 'Cargar rápido' }).locator('visible=true').first().click()
    await page.getByRole('dialog', { name: 'Cargar rápido' }).getByText('Salió plata').click()
    await page.keyboard.type('85000')
    await page.getByRole('button', { name: 'Guardar' }).click()
    await page.goto('/#/caja')
    await expect(page.getByText('− $ 85.000,00')).toBeVisible()
  })

  test('en el celular la barra de abajo navega entre secciones', async ({ page, isMobile }) => {
    test.skip(!isMobile)
    await page.goto('/#/panel')
    const nav = page.locator('nav').last()
    await nav.getByRole('button', { name: 'Caja' }).click()
    await expect(page.getByText('Plata en caja')).toBeVisible()
    await nav.getByRole('button', { name: 'Más' }).click()
    await page.getByRole('dialog', { name: 'Más secciones' }).getByText('Deudas').click()
    await expect(page.getByText('Deudas de la empresa')).toBeVisible()
  })

  test('ninguna pantalla se sale del ancho del celular', async ({ page, isMobile }) => {
    test.skip(!isMobile)
    for (const r of ['panel', 'caja', 'obras', 'clientes', 'presupuestos', 'recibos', 'stock', 'deudas', 'garantias', 'reportes', 'config']) {
      await page.goto('/#/' + r)
      await page.waitForTimeout(150)
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(over, r).toBeLessThanOrEqual(0)
    }
  })
})

// ─── Textos largos: nada debe salirse del ancho del celular ───────────────────

const LONG = 'Sistema de Impermeabilización Profesional de Canaletas y Encuentros de Techo Principal del Consorcio'
const WORD = 'Supercalifragilisticoespialidosoimpermeabilizacion1234567890'

function longData() {
  return {
        'romero.budgets.v1': [{ ...budget, client: LONG, address: WORD, workTitle: LONG }],
        'romero.receipts.v1': [{ id: 'r1', number: '001', date: today, obraId: 'o1', client: LONG, address: WORD, amount: 123456789, paymentMethod: 'Transferencia', concept: LONG, ...base }],
        'lg.crm.obras.v1': [{ id: 'o1', name: LONG, client: LONG, address: WORD, amount: 987654321, status: 'en_ejecucion', startDate: today, endDate: '', notes: LONG, ...base }],
        'lg.crm.movements.v1': [
          { id: 'e1', date: today, type: 'egreso', category: 'Mano de obra', amount: 123456789, method: 'Efectivo', description: LONG, obraId: 'o1', ...base },
          { id: 'e2', date: today, type: 'egreso', category: 'Materiales', amount: 5000, method: 'Efectivo', description: WORD, ...base },
        ],
        'lg.crm.debts.v1': [{ id: 'd1', creditor: LONG, description: WORD, amount: 987654321, dueDate: today, obraId: 'o1', ...base }],
        'lg.crm.stock_items.v1': [{ id: 's1', name: LONG, unit: 'rollo', minStock: 1, unitCost: 100000, ...base }],
        'lg.crm.stock_moves.v1': [{ id: 'm1', itemId: 's1', date: today, qty: 3, unitCost: 100000, note: WORD, ...base }],
        'lg.crm.warranties.v1': [{ id: 'w1', number: '001', obraId: 'o1', client: LONG, address: WORD, work: LONG, startDate: today, months: 24, coverage: LONG, exclusions: WORD, ...base }],
        'lg.clients.v1': [],
        'romero.clients.v1': [{ id: 'c1', name: LONG, address: WORD, property_type: 'Vivienda', phone: '2494601118', notes: LONG, updated_at: now }],
  }
}

async function overflowOf(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
}

test.describe('Textos largos', () => {
  for (const width of [320, 375]) {
    test(`ninguna pantalla se desborda con textos largos (${width}px)`, async ({ page, isMobile }) => {
      test.skip(!isMobile)
      await page.setViewportSize({ width, height: 800 })
      await seed(page, longData())
      const routes = ['panel', 'caja', 'obras', 'obras/o1', 'clientes', 'presupuestos', 'recibos', 'stock', 'deudas', 'garantias', 'reportes', 'config']
      const bad: string[] = []
      for (const r of routes) {
        await page.goto('/#/' + r)
        await page.reload()
        await page.waitForTimeout(250)
        const out = await page.evaluate(() => {
          const vw = document.documentElement.clientWidth
          const over = document.documentElement.scrollWidth - vw
          const culprits = [...document.querySelectorAll('main *, body > div *')]
            .filter((e) => {
              const r = e.getBoundingClientRect()
              return r.width > 0 && r.right > vw + 1 && getComputedStyle(e).position !== 'fixed' && !e.closest('.budget-scaler, .overflow-x-auto, nav, [role=dialog]')
            })
            .slice(0, 4)
            .map((e) => `${e.tagName.toLowerCase()}.${String(e.className).slice(0, 45)}«${(e.textContent ?? '').slice(0, 18)}»`)
          return { over, culprits }
        })
        if (out.over > 0) bad.push(`${r}: +${out.over}px ${out.culprits.join(' | ')}`)
      }
      expect(bad, bad.join('\n')).toEqual([])
    })
  }
})

test.describe('Formularios con textos largos', () => {
  test('formularios y vistas no se desbordan en 320px', async ({ page, isMobile }) => {
    test.skip(!isMobile)
    await page.setViewportSize({ width: 320, height: 800 })
    await seed(page, longData())
    const bad: string[] = []
    const check = async (name: string) => {
      await page.waitForTimeout(250)
      const o = await overflowOf(page)
      if (o > 0) bad.push(`${name}: +${o}px`)
    }

    await page.goto('/#/obras/o1')
    await page.getByRole('button', { name: 'Editar' }).click()
    await check('editar obra')
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: '+ Gasto' }).click()
    await check('nuevo gasto')
    await page.keyboard.press('Escape')

    await page.goto('/#/presupuestos')
    await page.getByText('👁 Ver').click()
    await check('presupuesto vista')
    await page.getByRole('button', { name: /Editar/ }).first().click()
    await check('presupuesto formulario')

    await page.goto('/#/recibos')
    await page.getByText('👁 Ver').first().click()
    await check('recibo vista')

    await page.goto('/#/garantias')
    await page.getByText('N° 001').first().click()
    await check('garantía vista')

    expect(bad, bad.join(', ')).toEqual([])
  })
})

test.describe('Empezar de cero', () => {
  test('el botón de Configuración deja el CRM vacío', async ({ page }) => {
    await page.goto('/#/caja')
    // Se carga una sola vez (addInitScript volvería a cargarlo después del reinicio)
    await page.evaluate(([mov, bud]) => {
      localStorage.setItem('lg.crm.movements.v1', JSON.stringify([mov]))
      localStorage.setItem('romero.budgets.v1', JSON.stringify([bud]))
    }, [{ id: 'e1', date: today, type: 'egreso', category: 'Materiales', amount: 5000, method: 'Efectivo', description: 'Algo', ...base }, budget])
    await page.reload()
    await expect(page.getByText('Algo')).toBeVisible()
    await page.goto('/#/config')
    page.on('dialog', (d) => (d.type() === 'prompt' ? d.accept('BORRAR') : d.accept()))
    await page.getByRole('button', { name: 'Borrar todos los datos' }).click()
    await page.waitForURL('**/#/panel')
    await page.goto('/#/caja')
    await expect(page.getByText('Sin movimientos')).toBeVisible()
    await page.goto('/#/presupuestos')
    await expect(page.getByText('Aún no hay presupuestos')).toBeVisible()
  })
})

test.describe('Stock editable', () => {
  const stockSeed = {
    'lg.crm.stock_items.v1': [{ id: 's1', name: 'Membrana', unit: 'rollo', minStock: 0, unitCost: 100000, ...base }],
    'lg.crm.stock_moves.v1': [{ id: 'm1', itemId: 's1', date: today, qty: 10, unitCost: 100000, note: 'Compra', ...base }],
    'lg.crm.movements.v1': [{ id: 'e0', date: today, type: 'egreso', category: 'Materiales', amount: 1000000, method: 'Efectivo', description: 'Compra stock', stockMoveId: 'm1', ...base }],
  }

  test('ajustar la cantidad registra la diferencia y no mueve la caja', async ({ page }) => {
    await seed(page, stockSeed)
    await page.goto('/#/stock')
    await page.getByRole('button', { name: 'Ajustar' }).click()
    await page.getByRole('dialog').locator('input').first().fill('8')
    await expect(page.getByText('-2,00 rollo')).toBeVisible()
    await page.getByRole('button', { name: 'Guardar ajuste' }).click()
    await expect(page.getByText('8,00 rollo').first()).toBeVisible()
    await page.goto('/#/caja')
    await expect(page.getByText('$ -1.000.000,00').first()).toBeVisible()
  })

  test('editar una compra corrige también el egreso de caja', async ({ page }) => {
    await seed(page, stockSeed)
    await page.goto('/#/stock')
    await page.getByText('Membrana').first().click()
    await page.getByRole('button', { name: 'Editar' }).last().click()
    await page.getByRole('dialog').locator('input').first().fill('12')
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText('12,00 rollo').first()).toBeVisible()
    await page.goto('/#/caja')
    await expect(page.getByText('− $ 1.200.000,00')).toBeVisible()
  })
})

test.describe('Deudas en dólares', () => {
  test('una deuda en US$ se paga con la cotización y baja el pendiente en dólares', async ({ page }) => {
    await page.route('**/dolarapi.com/**', (r) => r.fulfill({ json: { moneda: 'USD', casa: 'blue', nombre: 'Blue', compra: 1500, venta: 1600, fechaActualizacion: new Date().toISOString() } }))
    await seed(page, {
      'lg.crm.debts.v1': [{ id: 'd1', creditor: 'Proveedor USA', description: '', amount: 1000, currency: 'USD', dueDate: today, ...base }],
    })
    await page.goto('/#/deudas')
    await expect(page.getByText('US$ 1.000,00').first()).toBeVisible()
    await expect(page.getByText('≈ $ 1.600.000,00')).toBeVisible()
    await page.getByRole('button', { name: 'Pagar' }).click()
    const dlg = page.getByRole('dialog')
    await dlg.locator('input[inputmode="numeric"]').first().fill('400')
    await expect(dlg.getByText('$ 640.000,00')).toBeVisible()
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText('US$ 600,00').first()).toBeVisible()
    await expect(page.getByText('Pagos (1)')).toBeVisible()
    await page.goto('/#/caja')
    await expect(page.getByText('− $ 640.000,00')).toBeVisible()
  })
})

test.describe('Cheques con fecha', () => {
  const future = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 20)
    const p = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
  })()

  test('un cheque a futuro no suma a la caja hasta su fecha', async ({ page }) => {
    await seed(page, {
      'lg.crm.movements.v1': [
        { id: 'i1', date: today, type: 'ingreso', category: 'Cobro de obra', amount: 500000, method: 'Cheque', chequeDate: future, description: 'Cheque seña', ...base },
        { id: 'i2', date: today, type: 'ingreso', category: 'Cobro de obra', amount: 100000, method: 'Efectivo', description: 'Efectivo', ...base },
      ],
    })
    await page.goto('/#/caja')
    await expect(page.getByText('Plata en caja')).toBeVisible()
    await expect(page.getByText('Cheques pendientes: a cobrar $ 500.000,00')).toBeVisible()
    await expect(page.getByText('$ 100.000,00').first()).toBeVisible()
    await expect(page.getByText('$ 600.000,00')).toHaveCount(0)
  })

  test('un cheque que ya llegó a su fecha sí suma', async ({ page }) => {
    await seed(page, {
      'lg.crm.movements.v1': [{ id: 'i1', date: today, type: 'ingreso', category: 'Cobro de obra', amount: 500000, method: 'Cheque', chequeDate: today, description: 'Cheque seña', ...base }],
    })
    await page.goto('/#/caja')
    await expect(page.getByText('Cheques pendientes')).toHaveCount(0)
    await expect(page.getByText('$ 500.000,00').first()).toBeVisible()
  })
})

test.describe('Sobrecosto y cierre de caja', () => {
  test('avisa cuando los gastos de una obra pasan el 80% del presupuesto', async ({ page }) => {
    await seed(page, {
      'lg.crm.obras.v1': [{ id: 'o1', name: 'Reforma', client: 'Lucas', address: '', amount: 1000000, status: 'en_ejecucion', startDate: today, endDate: '', notes: '', ...base }],
      'lg.crm.movements.v1': [{ id: 'e1', date: today, type: 'egreso', category: 'Mano de obra', amount: 900000, method: 'Efectivo', description: 'Cuadrilla', obraId: 'o1', ...base }],
    })
    await page.goto('/#/panel')
    await expect(page.getByText('Reforma · gastos al 90% del presupuesto')).toBeVisible()
    await page.goto('/#/obras/o1')
    await expect(page.getByText('Los gastos pasaron el 80% del presupuesto.')).toBeVisible()
  })

  test('el cierre de caja registra el faltante como ajuste', async ({ page }) => {
    await seed(page, {
      'lg.crm.movements.v1': [{ id: 'i1', date: today, type: 'ingreso', category: 'Aporte de capital', amount: 100000, method: 'Efectivo', description: 'Capital', ...base }],
    })
    await page.goto('/#/caja')
    await page.getByRole('button', { name: 'Cerrar caja (contar efectivo)' }).click()
    await page.getByRole('dialog').locator('input').first().fill('90000')
    await expect(page.getByText('Faltante de $ 10.000,00')).toBeVisible()
    await page.getByRole('button', { name: 'Registrar diferencia' }).click()
    await expect(page.getByText('Diferencia de caja').first()).toBeVisible()
    await expect(page.getByText('$ 90.000,00').first()).toBeVisible()
  })
})

// PNG de 1x1 píxel
const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')

test.describe('Fotos', () => {
  test('se pueden agregar y eliminar fotos de una obra', async ({ page }) => {
    await seed(page, {
      'lg.crm.obras.v1': [{ id: 'o1', name: 'Reforma', client: 'Lucas', address: '', amount: 1000000, status: 'en_ejecucion', startDate: today, endDate: '', notes: '', ...base }],
    })
    await page.goto('/#/obras/o1')
    await expect(page.getByText('Fotos de la obra (0)')).toBeVisible()
    await page.locator('input[type="file"]').setInputFiles({ name: 'avance.png', mimeType: 'image/png', buffer: PIXEL })
    await expect(page.getByText('Fotos de la obra (1)')).toBeVisible()
    await page.getByRole('button', { name: /Foto 1 de la obra/ }).click()
    page.once('dialog', (d) => d.accept())
    await page.getByRole('button', { name: 'Eliminar foto' }).click()
    await expect(page.getByText('Fotos de la obra (0)')).toBeVisible()
  })

  test('un gasto puede llevar la foto del ticket', async ({ page }) => {
    await page.goto('/#/caja')
    await page.getByRole('button', { name: '− Salió plata' }).click()
    await page.keyboard.type('5000')
    await page.getByRole('dialog').locator('input[type="file"]').setInputFiles({ name: 'ticket.png', mimeType: 'image/png', buffer: PIXEL })
    await expect(page.getByRole('img', { name: 'Ticket' })).toBeVisible()
    await page.getByRole('button', { name: 'Guardar' }).click()
    await page.getByText('Materiales').first().click()
    await expect(page.getByRole('img', { name: 'Ticket' })).toBeVisible()
  })
})

test.describe('Sin conexión', () => {
  test('la app abre sin internet después de la primera visita', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium')
    await page.goto('/')
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Panel general' })).toBeVisible()
    await context.setOffline(true)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Panel general' })).toBeVisible()
    await expect(page.getByText('Sin conexión')).toBeVisible()
  })
})

// ─── Mezcla con la nube: lo archivado no se resucita ──────────────────────────

test.describe('Mezcla con la nube', () => {
  type R = { id: string; updatedAt: number; name?: string }
  const row = (id: string, updated_at: number, archived: boolean, name = 'nube') => ({ id, archived, updated_at, data: { id, updatedAt: updated_at, name } })

  test('una copia local vieja de algo archivado en la nube se descarta', () => {
    const local: R[] = [{ id: 'd1', updatedAt: 100, name: 'vieja' }]
    const { list, toPush } = mergeWithRemote<R>(local, [row('d1', 500, true)])
    expect(list).toEqual([])
    expect(toPush).toEqual([])
  })

  test('si se editó después de archivarse, gana lo local', () => {
    const local: R[] = [{ id: 'd1', updatedAt: 900, name: 'editada' }]
    const { list, toPush } = mergeWithRemote<R>(local, [row('d1', 500, true)])
    expect(list.map((x) => x.name)).toEqual(['editada'])
    expect(toPush).toHaveLength(1)
  })

  test('lo nuevo creado sin conexión se conserva y se sube', () => {
    const { list, toPush } = mergeWithRemote<R>([{ id: 'n1', updatedAt: 10, name: 'nuevo' }], [row('x', 5, false)])
    expect(list.map((x) => x.id).sort()).toEqual(['n1', 'x'])
    expect(toPush.map((x) => x.id)).toEqual(['n1'])
  })

  test('gana lo más reciente entre local y nube', () => {
    const newerRemote = mergeWithRemote<R>([{ id: 'a', updatedAt: 100, name: 'local' }], [row('a', 200, false, 'nube')])
    expect(newerRemote.list[0].name).toBe('nube')
    expect(newerRemote.toPush).toEqual([])
    const newerLocal = mergeWithRemote<R>([{ id: 'a', updatedAt: 300, name: 'local' }], [row('a', 200, false, 'nube')])
    expect(newerLocal.list[0].name).toBe('local')
    expect(newerLocal.toPush).toHaveLength(1)
  })
})

test.describe('Versión de la app', () => {
  test('avisa cuando se publica una versión nueva', async ({ page }) => {
    await page.route('**/version.json*', (r) => r.fulfill({ json: { version: 'version-nueva-123' } }))
    await page.goto('/#/panel')
    await expect(page.getByText('Hay una versión nueva de la app.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Actualizar' })).toBeVisible()
  })

  test('no avisa si la versión es la misma y se ve en Configuración', async ({ page }) => {
    await page.goto('/#/config')
    await expect(page.getByText('Versión de la app')).toBeVisible()
    await expect(page.getByText('Hay una versión nueva de la app.')).toHaveCount(0)
  })
})
