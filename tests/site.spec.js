import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const problems = [];
  page.on('pageerror', (e) => problems.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  page.problems = problems;
});

test('renders on brand with no errors or horizontal scroll', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/antinode/);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.site-header .logo svg')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  expect(page.problems).toEqual([]);
});

test('every link and asset on the page resolves', async ({ page, request }) => {
  await page.goto('/');
  const urls = await page.evaluate(() => [
    ...[...document.querySelectorAll('link[href], script[src], img[src]')].map((e) => e.href || e.src),
    ...[...document.querySelectorAll('a[href^="/"], a[href^="#"]')].map((a) => a.href),
  ]);
  const local = [...new Set(urls.filter((u) => u.startsWith('http://127.0.0.1')).map((u) => u.split('#')[0]))];
  for (const u of local) expect((await request.get(u)).status(), u).toBe(200);
});

test('contact form validates and posts', async ({ page }) => {
  await page.goto('/');
  const form = page.locator('[data-contact-form]');
  const endpoint = await form.getAttribute('action');
  let posted = null;
  await page.route(endpoint, async (route) => {
    posted = route.request().postData();
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  await page.getByRole('button', { name: 'Send message' }).click();
  expect(posted).toBeNull(); // required fields block an empty submit

  await page.getByLabel('Name').fill('Test Person');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Message').fill('Hello from the test suite.');
  await page.getByRole('button', { name: 'Send message' }).click();

  await expect(page.locator('[data-form-status]')).toHaveText(/message has been sent/);
  expect(posted).toContain('Hello from the test suite.');
});

test('contact form reports a failed send', async ({ page }) => {
  await page.goto('/');
  const endpoint = await page.locator('[data-contact-form]').getAttribute('action');
  await page.route(endpoint, (route) => route.fulfill({ status: 500, body: '' }));
  await page.getByLabel('Name').fill('Test Person');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Message').fill('Hello.');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.locator('[data-form-status]')).toHaveText(/could not be sent/);
  await expect(page.getByLabel('Message')).toHaveValue('Hello.');
});

test('unknown paths get the branded 404 page', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/does not exist/);
  expect(page.problems).toEqual([]);
});
