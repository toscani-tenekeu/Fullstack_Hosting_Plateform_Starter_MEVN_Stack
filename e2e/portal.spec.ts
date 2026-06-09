import { expect, type Page, test } from '@playwright/test'

const demoProfile = {
  _id: 'profile_1',
  clerkUserId: 'user_demo',
  email: 'demo.customer@example.test',
  firstName: 'Demo',
  lastName: 'Customer',
  imageUrl: '',
  role: 'user',
  credit: { amount: 5000, currency: 'XAF' },
  debt: { amount: 0, borrowedAt: null, currency: 'XAF' },
  address: { line1: '12 Demo Street', city: 'Douala', zipCode: '00000', country: 'CM' },
  company: { name: 'Demo Company' },
  contact: { phone: '+000600000000' },
}

const demoSubscription = {
  _id: 'sub_1',
  userProfileId: 'profile_1',
  clerkUserId: 'user_demo',
  invoiceNumber: 'INV-2026-0001',
  name: 'Starter Hosting',
  type: 'shared_hosting',
  status: 'active',
  features: ['10 GB SSD', 'Daily backups'],
  billing: { amount: 25000, interval: 'year', label: 'yearly' },
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2027-01-01T00:00:00.000Z',
  domains: [
    {
      name: 'demo-customer.cm',
      type: 'included',
      price: 0,
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2027-01-01T00:00:00.000Z',
      status: 'active',
    },
  ],
  credentials: { username: 'demo' },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

const demoInvoice = {
  _id: 'invoice_1',
  userProfileId: 'profile_1',
  clerkUserId: 'user_demo',
  orderNumber: 'ORD-2026-0001',
  invoiceNumber: 'INV-2026-0001',
  amount: 25000,
  date: '2026-01-01T00:00:00.000Z',
  userInfo: {
    clerkUserId: 'user_demo',
    email: 'demo.customer@example.test',
    fullName: 'Demo Customer',
    companyName: 'Demo Company',
    phone: '+000600000000',
    whatsappNumber: '+000699999999',
    reachableEmail: 'private@example.test',
    address: { line1: '12 Demo Street', city: 'Douala', zipCode: '00000', country: 'CM' },
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

async function mockPortalApi(page: Page, onProfilePatch?: (body: unknown) => void) {
  await page.route('**/api/me/profile', async (route) => {
    onProfilePatch?.(JSON.parse(route.request().postData() || '{}'))
    await route.fulfill({ json: { data: demoProfile } })
  })

  await page.route('**/api/me/subscriptions/sub_1', async (route) => {
    await route.fulfill({ json: { data: demoSubscription } })
  })

  await page.route('**/api/me/subscriptions?**', async (route) => {
    await route.fulfill({ json: { data: [demoSubscription], meta: { page: 1, limit: 100, total: 1 } } })
  })

  await page.route('**/api/me/invoices/invoice_1', async (route) => {
    await route.fulfill({ json: { data: demoInvoice } })
  })

  await page.route('**/api/me/invoices?**', async (route) => {
    await route.fulfill({ json: { data: [demoInvoice], meta: { page: 1, limit: 100, total: 1 } } })
  })

  await page.route('**/api/me', async (route) => {
    await route.fulfill({ json: { data: demoProfile } })
  })
}

async function signIn(page: Page, onProfilePatch?: (body: unknown) => void) {
  await mockPortalApi(page, onProfilePatch)
  await page.goto('/sign-in')
  await page.getByRole('button', { name: 'Continue as demo user' }).click()
  await expect(page).toHaveURL(/\/user\/dashboard\/overview/)
  await expect(page.getByRole('heading', { name: /Hello, Demo Customer/i })).toBeVisible()
}

test('redirects protected routes to sign-in and opens the overview after login', async ({ page }) => {
  await mockPortalApi(page)
  await page.goto('/user/dashboard/overview')
  await expect(page).toHaveURL(/\/sign-in/)
  await page.getByRole('button', { name: 'Continue as demo user' }).click()
  await expect(page.getByRole('heading', { name: /Hello, Demo Customer/i })).toBeVisible()
})

test('saves profile updates without admin-only fields', async ({ page }) => {
  let patchBody: unknown = null
  await signIn(page, (body) => {
    patchBody = body
  })

  await page.getByLabel('Company').fill('Updated Company')
  await page.getByLabel('Phone').fill('+000611111111')
  await page.getByLabel('Address').fill('99 Updated Street')
  await page.getByRole('button', { name: 'Save profile' }).click()

  await expect(page.getByText('Profile updated.')).toBeVisible()
  expect(patchBody).toEqual({
    company: { name: 'Updated Company' },
    contact: { phone: '+000611111111' },
    address: {
      line1: '99 Updated Street',
      city: 'Douala',
      zipCode: '00000',
      country: 'CM',
    },
  })
})

test('shows subscription list and detail views', async ({ page }) => {
  await signIn(page)

  await expect(page.getByRole('heading', { name: 'Starter Hosting' })).toBeVisible()
  await page.getByRole('button', { name: 'View details' }).click()
  const subscriptionDialog = page.getByRole('dialog', { name: /Starter Hosting details/i })
  await expect(subscriptionDialog).toBeVisible()
  await expect(subscriptionDialog.getByText('demo-customer.cm', { exact: true })).toBeVisible()
})

test('shows invoice snapshots without hidden admin-only contact fields', async ({ page }) => {
  await signIn(page)

  await page.getByRole('button', { name: 'View', exact: true }).click()
  const invoiceDialog = page.getByRole('dialog', { name: /INV-2026-0001 invoice/i })
  await expect(invoiceDialog).toBeVisible()
  await expect(invoiceDialog.getByText('Demo Customer', { exact: true })).toBeVisible()
  await expect(page.getByText('private@example.test')).toHaveCount(0)
  await expect(page.getByText('+000699999999')).toHaveCount(0)
  await expect(page.getByText('user_demo')).toHaveCount(0)
  await expect(page.getByText('profile_1')).toHaveCount(0)
})
