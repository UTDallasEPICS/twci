import { test, expect } from '@playwright/test'

test('app loads and redirects to auth', async ({ page }) => {
  await page.goto('/')
  // Unauthenticated users should be redirected to /auth
  await expect(page).toHaveURL(/\/auth/)
})
