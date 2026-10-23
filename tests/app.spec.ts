import { test, expect, Page } from '@playwright/test'

async function goHome(page: Page) {
  await page.goto('/#/presupuestos')
  await expect(page.getByText('+ Nuevo presupuesto')).toBeVisible({ timeout: 10_000 })
}

async function openDemo(page: Page) {
  await goHome(page)
  await page.getByText('👁 Ver').first().click()
  // Usar el h1 exacto para evitar strict-mode con "Presupuesto final" y "N° de presupuesto"
  await expect(page.getByRole('heading', { name: 'PRESUPUESTO', exact: true })).toBeVisible({ timeout: 8_000 })
}

async function openNewForm(page: Page) {
  await goHome(page)
  await page.getByText('+ Nuevo presupuesto').click()
  await expect(page.getByText('Datos del presupuesto')).toBeVisible({ timeout: 8_000 })
}

async function openNewReceiptForm(page: Page) {
  await goHome(page)
  await page.getByRole('button', { name: 'Recibos' }).click()
  await page.getByText('+ Nuevo recibo').click()
  await expect(page.getByText('Datos del recibo')).toBeVisible({ timeout: 8_000 })
}

// ──────────────────────────────────────────────
// HOME
// ──────────────────────────────────────────────
test.describe('Home', () => {
  test('muestra el botón Nuevo presupuesto', async ({ page }) => {
    await goHome(page)
    await expect(page.getByText('+ Nuevo presupuesto')).toBeVisible()
  })

  test('seed demo: aparece Consorcio Castagnino', async ({ page }) => {
    await goHome(page)
    await expect(page.getByText('Consorcio Castagnino')).toBeVisible()
  })

  test('buscador filtra por cliente', async ({ page }) => {
    await goHome(page)
    await page.getByPlaceholder('Buscar por cliente, dirección o N°').fill('castagnino')
    await expect(page.getByText('Consorcio Castagnino')).toBeVisible()
  })

  test('buscador sin resultados muestra mensaje', async ({ page }) => {
    await goHome(page)
    await page.getByPlaceholder('Buscar por cliente, dirección o N°').fill('xxxxxx_no_existe')
    await expect(page.getByText('Sin resultados')).toBeVisible()
  })

  test('limpiar búsqueda muestra el demo de nuevo', async ({ page }) => {
    await goHome(page)
    const searchInput = page.getByPlaceholder('Buscar por cliente, dirección o N°')
    await searchInput.fill('algo')
    await page.locator('button[aria-label="Limpiar búsqueda"]').click()
    await expect(page.getByText('Consorcio Castagnino')).toBeVisible()
  })
})

// ──────────────────────────────────────────────
// VISTA PREVIA
// ──────────────────────────────────────────────
test.describe('Vista previa del presupuesto demo', () => {
  test('se abre al hacer click en Ver', async ({ page }) => {
    await openDemo(page)
    await expect(page.getByRole('heading', { name: 'PRESUPUESTO', exact: true })).toBeVisible()
  })

  test('muestra nombre del cliente', async ({ page }) => {
    await openDemo(page)
    await expect(page.getByText('Consorcio Castagnino').first()).toBeVisible()
  })

  test('muestra dirección', async ({ page }) => {
    await openDemo(page)
    await expect(page.getByText('Paz 1333').first()).toBeVisible()
  })

  test('muestra número de presupuesto 700 - 433', async ({ page }) => {
    await openDemo(page)
    await expect(page.getByText('700 - 433').first()).toBeVisible()
  })

  test('total $13.800.000 visible', async ({ page }) => {
    await openDemo(page)
    await expect(page.getByText(/13\.800\.000/).first()).toBeVisible()
  })

  test('anticipo $9.660.000 visible', async ({ page }) => {
    await openDemo(page)
    await expect(page.getByText(/9\.660\.000/).first()).toBeVisible()
  })

  test('finalización $4.140.000 visible', async ({ page }) => {
    await openDemo(page)
    await expect(page.getByText(/4\.140\.000/).first()).toBeVisible()
  })

  test('footer: teléfono +54 9 2284 59-7150', async ({ page }) => {
    await openDemo(page)
    await expect(page.getByText('+54 9 2284 59-7150').first()).toBeVisible()
  })

  test('barra de acciones: Volver, Editar, Imprimir, Descargar PDF', async ({ page }) => {
    await openDemo(page)
    await expect(page.getByText('← Volver')).toBeVisible()
    await expect(page.getByText(/Editar/).first()).toBeVisible()
    await expect(page.getByText(/Imprimir/)).toBeVisible()
    await expect(page.getByText(/Descargar PDF/)).toBeVisible()
  })

  test('Volver regresa al home', async ({ page }) => {
    await openDemo(page)
    await page.getByText('← Volver').click()
    await expect(page.getByText('+ Nuevo presupuesto')).toBeVisible()
  })

  test('Editar abre el formulario con los datos del presupuesto', async ({ page }) => {
    await openDemo(page)
    // El botón Editar en la barra de acciones
    await page.locator('.no-print').getByText(/Editar/).click()
    await expect(page.getByText('Datos del presupuesto')).toBeVisible({ timeout: 5_000 })
    // Verificar que los datos están precargados
    await expect(page.locator('input[placeholder="Consorcio Castagnino"]')).toHaveValue('Consorcio Castagnino')
  })
})

// ──────────────────────────────────────────────
// FORMULARIO
// ──────────────────────────────────────────────
test.describe('Formulario de presupuesto', () => {
  test('se abre al hacer click en Nuevo', async ({ page }) => {
    await openNewForm(page)
    await expect(page.getByText('Datos del presupuesto')).toBeVisible()
  })

  test('secciones abiertas por defecto tienen sus inputs visibles', async ({ page }) => {
    await openNewForm(page)
    // Cliente section es defaultOpen=true → inputs visibles sin click
    await expect(page.getByPlaceholder('Consorcio Castagnino')).toBeVisible()
    await expect(page.getByPlaceholder('Paz 1333')).toBeVisible()
  })

  test('botón Guardar deshabilitado con form vacío', async ({ page }) => {
    await openNewForm(page)
    // Hay dos botones "Guardar" (top bar desktop + sticky mobile) — ambos deben estar disabled
    const buttons = page.getByRole('button', { name: 'Guardar' })
    const count = await buttons.count()
    for (let i = 0; i < count; i++) {
      await expect(buttons.nth(i)).toBeDisabled()
    }
  })

  test('MoneyInput: $ y número no se solapan', async ({ page }) => {
    await openNewForm(page)
    // El MoneyInput es un flex container: span$ + input
    // Buscamos el span del $ dentro del flex container del precio
    const moneyContainer = page.locator('div.flex.items-center').filter({
      has: page.locator('span', { hasText: /^\$$/ }),
    }).first()
    await expect(moneyContainer).toBeVisible()

    const span = moneyContainer.locator('span').first()
    const input = moneyContainer.locator('input').first()

    const spanBox = await span.boundingBox()
    const inputBox = await input.boundingBox()

    expect(spanBox).not.toBeNull()
    expect(inputBox).not.toBeNull()
    if (spanBox && inputBox) {
      // El borde derecho del $ (spanRight) debe estar a la IZQUIERDA del inicio del input (inputLeft)
      const spanRight = spanBox.x + spanBox.width
      const inputLeft = inputBox.x
      // Permitimos máximo 5px de overlap (font rendering puede variar)
      expect(spanRight).toBeLessThanOrEqual(inputLeft + 5)
    }
  })

  test('llenar formulario completo y guardar navega a preview', async ({ page }) => {
    await openNewForm(page)

    // Sección Cliente (ya abierta por defecto)
    await page.getByPlaceholder('Consorcio Castagnino').fill('Cliente Test')
    await page.getByPlaceholder('Paz 1333').fill('Dirección 456')

    // Sección Cálculo económico (ya abierta por defecto)
    await page.getByPlaceholder('200').fill('100')

    // MoneyInput para precio/m²
    const moneyInput = page.locator('div.flex.items-center').filter({
      has: page.locator('span', { hasText: /^\$$/ }),
    }).first().locator('input')
    await moneyInput.fill('50000')
    await moneyInput.blur()

    // Guardar (primer botón "Guardar" visible y habilitado)
    const guardar = page.getByRole('button', { name: 'Guardar' }).first()
    await expect(guardar).toBeEnabled({ timeout: 5_000 })
    await guardar.click()

    await expect(page.getByRole('heading', { name: 'PRESUPUESTO', exact: true })).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('Cliente Test').first()).toBeVisible()
  })

  test('permite guardar presupuesto con total $0', async ({ page }) => {
    await openNewForm(page)

    await page.getByPlaceholder('Consorcio Castagnino').fill('Cliente Cero')
    await page.getByPlaceholder('Paz 1333').fill('Direccion 0')
    await page.getByPlaceholder('200').fill('100')

    const moneyInput = page.locator('div.flex.items-center').filter({
      has: page.locator('span', { hasText: /^\$$/ }),
    }).first().locator('input')
    await moneyInput.fill('0')
    await moneyInput.blur()
    await expect(moneyInput).toHaveValue('0')

    const guardar = page.getByRole('button', { name: 'Guardar' }).first()
    await expect(guardar).toBeEnabled({ timeout: 5_000 })
    await guardar.click()

    await expect(page.getByRole('heading', { name: 'PRESUPUESTO', exact: true })).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('Cliente Cero').first()).toBeVisible()
    await expect(page.getByText('$ 0,00').first()).toBeVisible()
  })

  test('cálculo automático: 100 m² x $50.000 = $5.000.000', async ({ page }) => {
    await openNewForm(page)

    await page.getByPlaceholder('Consorcio Castagnino').fill('X')
    await page.getByPlaceholder('Paz 1333').fill('X')
    await page.getByPlaceholder('200').fill('100')

    const moneyInput = page.locator('div.flex.items-center').filter({
      has: page.locator('span', { hasText: /^\$$/ }),
    }).first().locator('input')
    await moneyInput.fill('50000')
    await moneyInput.blur()

    // El resumen automático dentro del formulario
    await expect(page.getByText(/5\.000\.000/).first()).toBeVisible({ timeout: 5_000 })
  })

  test('anticipo cambia y finalización se ajusta a 100%', async ({ page }) => {
    await openNewForm(page)

    // Orden real: nth(0)=validityDays, nth(1)=squareMeters, nth(2)=advancePct, nth(3)=finalPct
    const anticipoInput = page.locator('input[type="number"]').nth(2)
    await anticipoInput.fill('60')
    await anticipoInput.blur()

    const finInput = page.locator('input[type="number"]').nth(3)
    await expect(finInput).toHaveValue('40')
  })

  test('validación: muestra error si cliente vacío', async ({ page }) => {
    await openNewForm(page)
    // El formulario vacío debe mostrar la sección de errores (al intentar guardar no hace nada)
    // Verificar que el panel de errores existe cuando hay campos vacíos
    await expect(page.getByText('Cliente es obligatorio')).toBeVisible()
  })
})

// ──────────────────────────────────────────────
// ACCIONES DE LISTA
// ──────────────────────────────────────────────
test.describe('Formulario de recibo', () => {
  test('permite guardar recibo con monto $0', async ({ page }) => {
    await openNewReceiptForm(page)

    await page.getByPlaceholder('Consorcio Castagnino').fill('Cliente Recibo Cero')

    const moneyInput = page.locator('div.flex.items-center').filter({
      has: page.locator('span', { hasText: /^\$$/ }),
    }).first().locator('input')
    await moneyInput.fill('0')
    await moneyInput.blur()
    await expect(moneyInput).toHaveValue('0')

    await page.getByPlaceholder(/Anticipo presupuesto/).fill('Recibo sin cargo')

    const guardar = page.getByRole('button', { name: 'Guardar' }).first()
    await expect(guardar).toBeEnabled({ timeout: 5_000 })
    await guardar.click()

    await expect(page.getByText('RECIBO', { exact: true })).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('Cliente Recibo Cero').first()).toBeVisible()
    await expect(page.getByText('$ 0,00').first()).toBeVisible()
  })
})

test.describe('Acciones de lista', () => {
  test('Duplicar crea una segunda card', async ({ page }) => {
    await goHome(page)
    const before = await page.getByText('Consorcio Castagnino').count()
    await page.getByText('Duplicar').first().click()
    const after = await page.getByText('Consorcio Castagnino').count()
    expect(after).toBeGreaterThan(before)
  })

  test('Editar desde lista precarga datos del cliente', async ({ page }) => {
    await goHome(page)
    await page.getByText('✏ Editar').first().click()
    await expect(page.locator('input[placeholder="Consorcio Castagnino"]')).toHaveValue('Consorcio Castagnino', { timeout: 5_000 })
  })
})
