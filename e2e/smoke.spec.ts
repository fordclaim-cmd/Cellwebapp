import { expect, test } from '@playwright/test';

test('home renders offer and pricing', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Your whole online presence');
  await expect(page.locator('#pricing')).toContainText('$1,500');
  await expect(page.locator('#pricing')).toContainText('$397');
});

test('work page renders case studies', async ({ page }) => {
  await page.goto('/work');
  await expect(page.locator('#dolphin')).toContainText('Dolphin Claims');
  await expect(page.locator('#pools')).toContainText("Florida's Best Pools");
});

test('about page renders founder story', async ({ page }) => {
  await page.goto('/about');
  await expect(page.locator('h1')).toContainText('operator');
});

test('bookkeeper pages still served', async ({ page }) => {
  // astro preview does not serve directory index files at the trailing-slash
  // path (only at the explicit /index.html); production Vercel cleanUrls
  // serves both. Preview-only adjustment per task brief.
  const resp = await page.goto('/bookkeeper/index.html');
  expect(resp!.status()).toBe(200);
});

test('quote form submits to /api/lead and shows success', async ({ page }) => {
  // astro preview has no /api — stub the endpoint at the network layer
  await page.route('**/api/lead', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }),
  );
  await page.goto('/contact');
  await page.fill('input[name="name"]', 'Mike Rowe');
  await page.fill('input[name="trade"]', 'Plumbing');
  await page.fill('input[name="phone"]', '(561) 555-0100');
  await page.fill('input[name="city"]', 'West Palm Beach');
  await page.click('button[type="submit"]');
  await expect(page.locator('[data-status]')).toContainText("we'll call you");
});

test('quote form shows failure message on API error', async ({ page }) => {
  await page.route('**/api/lead', (route) => route.fulfill({ status: 500, body: '{}' }));
  await page.goto('/contact');
  await page.fill('input[name="name"]', 'Mike Rowe');
  await page.fill('input[name="trade"]', 'Plumbing');
  await page.fill('input[name="phone"]', '(561) 555-0100');
  await page.fill('input[name="city"]', 'West Palm Beach');
  await page.click('button[type="submit"]');
  await expect(page.locator('[data-status]')).toContainText('Something went wrong');
});
