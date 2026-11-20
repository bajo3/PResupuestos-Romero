import { test, expect } from '@playwright/test'
import * as fs from 'node:fs'

const BASE = 'https://crm-lg-impermeabilizacion.vercel.app'
const pages = (pdf: Buffer) => (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length

test('QA presupuestos y recibos en producción', async ({ page, browserName }) => {
  test.setTimeout(900000)
  fs.mkdirSync('pdfs/qa', { recursive: true })
  const report: string[] = []

  for (const kind of ['presupuestos', 'recibos'] as const) {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(`${BASE}/#/${kind}`)
    await page.getByText('👁 Ver').first().waitFor({ timeout: 20000 })
    await page.waitForTimeout(4000)
    const n = await page.getByText('👁 Ver').count()
    report.push(`${kind}: ${n}`)
    for (let i = 0; i < n; i++) {
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.goto(`${BASE}/#/${kind}`)
      await page.reload()
      await page.getByText('👁 Ver').nth(i).waitFor({ timeout: 20000 })
      await page.getByText('👁 Ver').nth(i).click()
      await page.locator(kind === 'presupuestos' ? '.doc-a4 .budget-page' : '.doc-a4 .sheet').first().waitFor({ state: 'attached', timeout: 40000 })
      await page.waitForTimeout(1500)
      const info = await page.evaluate(() => {
        const a4 = [...document.querySelectorAll('.doc-a4 .budget-page')] as HTMLElement[]
        const sheet = document.querySelector('.doc-a4 .sheet') as HTMLElement | null
        return {
          num: (document.body.innerText.match(/N° \d{3}/) ?? [''])[0],
          cliente: (document.querySelector('.doc-a4 h2, .doc-a4 .font-display')?.textContent ?? '').slice(0, 30),
          overflowPages: a4.map((p) => p.scrollHeight - p.clientHeight),
          sheetH: sheet ? Math.round(sheet.getBoundingClientRect().height) : 0,
        }
      })
      // impresión
      const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true })
      const printed = pages(pdf)
      // celular
      await page.setViewportSize({ width: 360, height: 780 })
      await page.waitForTimeout(500)
      const mob = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      const mobCards = await page.evaluate(() => {
        const m = document.querySelector('.doc-mobile') as HTMLElement | null
        return m ? m.scrollWidth - m.clientWidth : -1
      })
      report.push(`${kind}[${i}] ${JSON.stringify(info)} imprime=${printed} hojas, desborde-celular=${mob}/${mobCards}`)
      // PDF descargado
      await page.setViewportSize({ width: 1280, height: 900 })
      const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Descargar PDF' }).click()])
      const out = `pdfs/qa/${kind}-${i}-${dl.suggestedFilename()}`
      await dl.saveAs(out)
      report.push(`   pdf ${out} hojas=${pages(fs.readFileSync(out))}`)
    }
  }
  fs.writeFileSync('pdfs/qa/report.txt', report.join('\n'))
  console.log(report.join('\n'))
})
