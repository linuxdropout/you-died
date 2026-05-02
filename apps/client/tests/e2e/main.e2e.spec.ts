import { expect, test } from '@playwright/test'

test('loads the client shell', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'You Died' })).toBeVisible()
})
