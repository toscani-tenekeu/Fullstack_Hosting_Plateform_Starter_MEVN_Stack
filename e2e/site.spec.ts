import { expect, test } from '@playwright/test'

const offers = [
  {
    _id: '6844b232f7a6f0c7ab111111',
    type: 'vps',
    plan: 'Go',
    slug: 'vps/go',
    pricePerYear: 72000,
    currency: 'XAF',
    features: ['4 vCPU AMD EPYC', '8 GB RAM DDR4'],
  },
  {
    _id: '6844b232f7a6f0c7ab111112',
    type: 'vps',
    plan: 'Plus',
    slug: 'vps/plus',
    pricePerYear: 102000,
    currency: 'XAF',
    features: ['6 vCPU AMD EPYC', '12 GB RAM DDR4'],
  },
  {
    _id: '6844b232f7a6f0c7ab111113',
    type: 'shared_hosting',
    plan: 'Go',
    slug: 'shared-hosting/go',
    pricePerYear: 18000,
    currency: 'XAF',
    features: ['30 GB SSD Storage', 'Unlimited Websites'],
  },
  {
    _id: '6844b232f7a6f0c7ab111114',
    type: 'shared_hosting',
    plan: 'Plus',
    slug: 'shared-hosting/plus',
    pricePerYear: 20000,
    currency: 'XAF',
    features: ['80 GB SSD Storage', 'Priority Support'],
  },
]

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('hosting-starter-force-mock-auth', '1')
  })

  await page.route('**/api/offers?limit=100', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: offers, meta: { page: 1, limit: 100, total: offers.length } }),
    })
  })
})

test('home page and pricing slug route are visible', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Starter kit for VPS and shared hosting platforms' })).toBeVisible()
  await expect(page.getByText('Why choose us')).toBeVisible()
  await expect(page.getByText('Step 1')).toBeVisible()

  await page.goto('/pricing/vps/go', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Linux VPS and Shared Hosting plans.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'VPS', exact: true })).toBeVisible()
  const orderDialog = page.getByRole('dialog', { name: 'Order Go' })
  await expect(orderDialog.getByText('72,000 XAF')).toBeVisible()
  await expect(orderDialog.getByLabel('Domain name')).toBeVisible()
  await expect(orderDialog.getByLabel('Root username')).toBeVisible()
})

test('shared hosting and vps forms differ correctly', async ({ page }) => {
  await page.goto('/pricing/shared-hosting/plus', { waitUntil: 'domcontentloaded' })

  const orderDialog = page.getByRole('dialog', { name: 'Order Plus' })
  await expect(orderDialog.getByText('20,000 XAF')).toBeVisible()
  await expect(orderDialog.getByLabel('Domain name')).toBeVisible()
  await expect(orderDialog.getByLabel('Root username')).toHaveCount(0)
  await expect(orderDialog.getByLabel('Operating system')).toHaveCount(0)
  await expect(orderDialog.getByLabel('Datacenter')).toHaveCount(0)
})

test('order submission redirects to sign in and succeeds after mock sign in', async ({ page }) => {
  await page.route('**/api/me/order-requests', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          request: {
            _id: '6844b232f7a6f0c7ab999999',
            orderNumber: 'KR-20260608-ABC123',
            offerSlug: 'vps/go',
            status: 'submitted',
            domainName: 'example.com',
          },
          orderNumber: 'KR-20260608-ABC123',
          message:
            'We will contact you shortly. If not, email support@example.com or WhatsApp +000 000 000 000 with your order number.',
          support: {
            email: 'support@example.com',
            whatsapp: '+000 000 000 000',
          },
        },
      }),
    })
  })

  await page.goto('/pricing/vps/go', { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Domain name').fill('example.com')
  await page.getByRole('button', { name: 'Sign in to order' }).click()

  await expect(page).toHaveURL(/\/sign-in/)
  await page.getByRole('button', { name: 'Continue as test user' }).click()
  await expect(page).toHaveURL(/\/pricing\/vps\/go$/)

  await page.getByLabel('Domain name').fill('example.com')
  await page.getByRole('button', { name: 'Submit order' }).click()
  await expect(page.getByText('Order number: KR-20260608-ABC123')).toBeVisible()
  await expect(
    page.getByText(
      'We will contact you shortly. If not, email support@example.com or WhatsApp +000 000 000 000 with this order number.',
    ),
  ).toBeVisible()
})

test('footer links exist', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy-policy')
  await expect(page.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms-of-service')
  await expect(page.getByRole('link', { name: 'YouTube' })).toHaveAttribute('href', 'https://www.youtube.com/@toscani_tenekeu_fr')
  await expect(page.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://linkedin.com/in/toscani-tenekeu')
  await expect(page.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/toscani-tenekeu')
})
