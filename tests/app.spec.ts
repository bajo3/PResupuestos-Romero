import { test, expect, Page } from '@playwright/test'

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
