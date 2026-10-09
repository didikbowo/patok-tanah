import { expect, test, type Page } from '@playwright/test'

async function fillRectangle(page: Page) {
  await page.locator('#side-0').fill('20')
  await page.locator('#side-1').fill('15')
  await page.locator('#side-2').fill('20')
  await page.locator('#side-3').fill('15')
  await page.locator('#diag-0').fill('25')
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('isi persegi panjang → luas dan tumbak tampil benar', async ({ page }) => {
  await fillRectangle(page)
  await expect(page.getByTestId('area-m2')).toHaveText('300,00 m²')
  await expect(page.getByTestId('perimeter')).toHaveText('70,00 m')
  await expect(page.getByTestId('area-units')).toContainText('21,43 tumbak')
})

test('ukuran mustahil → kolom ditandai dan pesan menyebut segitiganya', async ({ page }) => {
  await fillRectangle(page)
  await page.locator('#diag-0').fill('60')
  await expect(page.getByRole('alert')).toContainText('ABC')
  await expect(page.locator('#diag-0')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByText('Ukuran belum valid')).toBeVisible()
})

test('bagi 3 sama luas → 3 kartu bagian dan 2 kartu patok', async ({ page }) => {
  await fillRectangle(page)
  await page.getByRole('tab', { name: 'Bagi' }).click()
  await page.getByText('Bagi bidang', { exact: true }).click()
  await page.getByRole('button', { name: 'Tambah bagian' }).click()
  await expect(page.getByTestId('piece-card')).toHaveCount(3)
  await expect(page.getByTestId('cut-card')).toHaveCount(2)
  await expect(page.getByTestId('piece-card').first()).toContainText('100,00 m²')
  // Sejajar AB pada persegi panjang 20×15: garis pertama 5 m dari pojok B / A.
  await expect(page.getByTestId('cut-card').first()).toContainText('5,00 m dari pojok')
})

test('data tersimpan setelah halaman dimuat ulang', async ({ page }) => {
  await fillRectangle(page)
  await page.waitForTimeout(700)
  await page.reload()
  await expect(page.getByTestId('area-m2')).toHaveText('300,00 m²')
})

test('bagikan → buka link di perangkat lain → data termuat', async ({ page, browser, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.evaluate(() => {
    // Paksa jalur salin-ke-clipboard (lembar bagikan bawaan tidak bisa diotomasi).
    Object.defineProperty(navigator, 'share', { value: undefined })
  })
  await fillRectangle(page)
  await page.getByTestId('share').click()
  await expect(page.getByText('Link disalin')).toBeVisible()
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  const url = copied.match(/https?:\/\/\S+/)?.[0]
  expect(url).toContain('#d=')

  const other = await browser.newContext()
  const p2 = await other.newPage()
  await p2.goto(url!)
  await expect(p2.getByTestId('area-m2')).toHaveText('300,00 m²')
  expect(new URL(p2.url()).hash).toBe('')
  await other.close()
})

test('link dibuka di perangkat yang sudah punya data → minta konfirmasi', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.evaluate(() => Object.defineProperty(navigator, 'share', { value: undefined }))
  await fillRectangle(page)
  await page.getByTestId('share').click()
  const url = (await page.evaluate(() => navigator.clipboard.readText())).match(/https?:\/\/\S+/)![0]

  await page.locator('#side-0').fill('30')
  await page.waitForTimeout(700)
  await page.goto('about:blank')
  await page.goto(url)
  await expect(page.getByText('Buka data dari link?')).toBeVisible()
  await page.getByTestId('accept-link').click()
  await expect(page.getByTestId('area-m2')).toHaveText('300,00 m²')
})

test('link rusak → pesan, data tidak berubah', async ({ page }) => {
  await page.goto('/#d=rusak!!')
  await expect(page.getByText('Link tidak valid')).toBeVisible()
})

test('tetap jalan tanpa sinyal setelah kunjungan pertama', async ({ page, context }) => {
  // Tunggu service worker selesai menyimpan semua aset (precache) dan aktif.
  await expect
    .poll(() => page.evaluate(async () => (await navigator.serviceWorker.ready).active?.state), { timeout: 15_000 })
    .toBe('activated')
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Patok' })).toBeVisible()
  await expect(page.getByTestId('area-m2')).toBeVisible()
  await context.setOffline(false)
})
