<template>
  <main class="mx-auto max-w-6xl px-4 py-12 sm:px-6">
    <header class="flex flex-col gap-5 border-b border-black/10 pb-8 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="text-sm text-neutral-500">{{ profileEmail }}</p>
        <h1 class="mt-2 text-4xl font-medium tracking-normal">{{ dashboardGreeting }}</h1>
        <p class="mt-3 text-sm leading-6 text-neutral-600">Manage your subscriptions, invoices, and profile.</p>
      </div>

      <nav class="flex flex-wrap gap-2">
        <a v-for="section in sections" :key="section.id" :href="`#${section.id}`" class="pill-button pill-button-secondary">
          {{ section.label }}
        </a>
      </nav>
    </header>

    <p v-if="isLoading" class="py-8 text-sm text-neutral-500">Loading dashboard...</p>
    <p v-else-if="loadError" class="py-8 text-sm text-red-600">{{ loadError }}</p>

    <template v-else>
      <section id="overview" class="border-b border-black/10 py-8">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article v-for="item in overview" :key="item.label" class="border-y border-black/10 py-5">
            <p class="text-sm text-neutral-500">{{ item.label }}</p>
            <p class="mt-3 text-2xl font-medium">{{ item.value }}</p>
          </article>
        </div>
      </section>

      <section id="subscriptions" class="border-b border-black/10 py-8">
        <div class="flex items-end justify-between gap-4">
          <div>
            <h2 class="text-2xl font-medium tracking-normal">My subscriptions</h2>
            <p class="mt-2 text-sm text-neutral-600">Services, domains, billing, renewals, and credentials.</p>
          </div>
          <span class="text-sm text-neutral-500">{{ subscriptions.length }} services</span>
        </div>

        <div v-if="subscriptions.length === 0" class="mt-6 border-y border-black/10 py-8 text-sm text-neutral-500">
          No subscriptions yet.
        </div>

        <div v-else class="mt-6 grid gap-4 lg:grid-cols-2">
          <article v-for="service in subscriptions" :key="service._id" class="rounded-lg border border-black/10 bg-white p-6">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-sm text-neutral-500">{{ getSubscriptionTypeLabel(service.type) }}</p>
                <h3 class="mt-1 text-xl font-medium tracking-normal">{{ service.name }}</h3>
              </div>
              <span class="rounded-full border border-black/10 px-3 py-1 text-xs text-neutral-600">{{ service.status }}</span>
            </div>

            <div class="mt-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="text-2xl font-medium">{{ formatSubscriptionBilling(service) }}</p>
                <p class="mt-1 text-sm text-neutral-500">Renews {{ formatDate(service.endDate) }}</p>
              </div>
              <a
                v-if="webPanelUrl(service)"
                class="pill-button"
                :href="webPanelUrl(service)"
                target="_blank"
                rel="noreferrer"
              >
                Web Panel
              </a>
            </div>

            <dl class="mt-6 divide-y divide-black/10 border-y border-black/10 text-sm">
              <div v-for="item in subscriptionSummary(service)" :key="item.label" class="flex items-center justify-between gap-4 py-3">
                <dt class="text-neutral-500">{{ item.label }}</dt>
                <dd class="font-medium text-right">{{ item.value }}</dd>
              </div>
            </dl>

            <div v-if="service.features.length > 0" class="mt-5 text-sm">
              <p class="text-neutral-500">Included features</p>
              <ul class="mt-2 grid gap-2 sm:grid-cols-2">
                <li v-for="feature in service.features.slice(0, 6)" :key="feature" class="flex gap-2">
                  <span aria-hidden="true">✓</span>
                  <span>{{ feature }}</span>
                </li>
              </ul>
              <p v-if="service.features.length > 6" class="mt-2 text-neutral-500">+{{ service.features.length - 6 }} more</p>
            </div>

            <div class="mt-5 flex flex-wrap gap-2">
              <button class="pill-button pill-button-secondary" type="button" :disabled="loadingSubscriptionId === service._id" @click="openSubscriptionDetails(service)">
                {{ loadingSubscriptionId === service._id ? 'Loading...' : 'View details' }}
              </button>
              <button
                v-if="hasCredentials(service)"
                class="pill-button pill-button-secondary"
                type="button"
                :disabled="loadingSubscriptionId === service._id"
                @click="openSubscriptionCredentials(service)"
              >
                Credentials
              </button>
            </div>
          </article>
        </div>
      </section>

      <section id="invoices" class="border-b border-black/10 py-8">
        <div>
          <h2 class="text-2xl font-medium tracking-normal">My invoices</h2>
          <p class="mt-2 text-sm text-neutral-600">Billing records loaded from your account API.</p>
        </div>

        <div v-if="invoices.length === 0" class="mt-6 border-y border-black/10 py-8 text-sm text-neutral-500">
          No invoices yet.
        </div>

        <div v-else class="mt-6 divide-y divide-black/10 border-y border-black/10">
          <div v-for="invoice in invoices" :key="invoice._id" class="grid gap-3 py-4 text-sm md:grid-cols-[1fr_1.2fr_1fr_0.8fr_auto] md:items-center">
            <p class="font-medium">{{ invoice.invoiceNumber }}</p>
            <p class="text-neutral-600">{{ invoice.orderNumber }}</p>
            <p class="text-neutral-500">{{ formatDate(invoice.date) }}</p>
            <p class="font-medium md:text-right">{{ formatXafAmount(invoice.amount) }}</p>
            <button class="pill-button pill-button-secondary" type="button" :disabled="loadingInvoiceId === invoice._id" @click="openInvoiceDetails(invoice)">
              {{ loadingInvoiceId === invoice._id ? 'Loading...' : 'View' }}
            </button>
          </div>
        </div>
      </section>

      <section id="profile" class="py-8">
        <div class="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 class="text-2xl font-medium tracking-normal">My profile</h2>
            <p class="mt-2 text-sm text-neutral-600">Update the fields allowed by the API.</p>
          </div>

          <form class="w-full max-w-md space-y-4" @submit.prevent="saveProfile">
            <label class="block text-sm">
              <span class="text-neutral-600">Company</span>
              <input v-model="profileForm.companyName" class="mt-2 w-full rounded-full border border-black/10 px-4 py-2 outline-none" type="text">
            </label>
            <label class="block text-sm">
              <span class="text-neutral-600">Phone</span>
              <input v-model="profileForm.phone" class="mt-2 w-full rounded-full border border-black/10 px-4 py-2 outline-none" type="text">
            </label>
            <label class="block text-sm">
              <span class="text-neutral-600">Address</span>
              <input v-model="profileForm.line1" class="mt-2 w-full rounded-full border border-black/10 px-4 py-2 outline-none" type="text">
            </label>
            <div class="grid gap-3 sm:grid-cols-3">
              <label class="block text-sm">
                <span class="text-neutral-600">City</span>
                <input v-model="profileForm.city" class="mt-2 w-full rounded-full border border-black/10 px-4 py-2 text-sm outline-none" type="text">
              </label>
              <label class="block text-sm">
                <span class="text-neutral-600">Zip code</span>
                <input v-model="profileForm.zipCode" class="mt-2 w-full rounded-full border border-black/10 px-4 py-2 text-sm outline-none" type="text">
              </label>
              <label class="block text-sm">
                <span class="text-neutral-600">Country</span>
                <input v-model="profileForm.country" class="mt-2 w-full rounded-full border border-black/10 px-4 py-2 text-sm outline-none" type="text">
              </label>
            </div>

            <p v-if="profileMessage" class="text-sm text-neutral-500">{{ profileMessage }}</p>
            <button class="pill-button" type="submit">{{ isSavingProfile ? 'Saving...' : 'Save profile' }}</button>
          </form>
        </div>
      </section>
    </template>

    <div
      v-if="selectedSubscription"
      role="dialog"
      aria-modal="true"
      :aria-label="`${selectedSubscription.name} details`"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      @click.self="selectedSubscription = null"
    >
      <div class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-black/10 bg-white p-6 shadow-[0_32px_90px_rgba(0,0,0,0.18)]">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm text-neutral-500">{{ getSubscriptionTypeLabel(selectedSubscription.type) }}</p>
            <h2 class="mt-1 text-2xl font-medium">{{ selectedSubscription.name }}</h2>
          </div>
          <button class="rounded-full border border-black/10 px-3 py-1 text-sm" type="button" @click="selectedSubscription = null">
            Close
          </button>
        </div>

        <div class="mt-6 grid gap-4 sm:grid-cols-3">
          <article v-for="item in subscriptionDetailStats(selectedSubscription)" :key="item.label" class="border-y border-black/10 py-4">
            <p class="text-sm text-neutral-500">{{ item.label }}</p>
            <p class="mt-2 font-medium">{{ item.value }}</p>
          </article>
        </div>

        <div class="mt-6 flex flex-wrap gap-2">
          <a
            v-if="webPanelUrl(selectedSubscription)"
            class="pill-button"
            :href="webPanelUrl(selectedSubscription)"
            target="_blank"
            rel="noreferrer"
          >
            Web Panel
          </a>
        </div>

        <section class="mt-6">
          <h3 class="font-medium">Domains</h3>
          <div class="mt-3 divide-y divide-black/10 border-y border-black/10">
            <div v-for="domain in selectedSubscription.domains" :key="`${domain.name}-${domain.startDate}`" class="grid gap-3 py-4 text-sm md:grid-cols-[1fr_0.7fr_0.7fr_0.8fr] md:items-center">
              <p class="font-medium">{{ domain.name }}</p>
              <p class="text-neutral-500">{{ domain.type }} · {{ domain.status }}</p>
              <p>{{ formatXafAmount(domain.price) }}</p>
              <p class="md:text-right">{{ formatDate(domain.startDate) }} to {{ formatDate(domain.endDate) }}</p>
            </div>
          </div>
        </section>

        <section v-if="selectedSubscription.features.length > 0" class="mt-6">
          <h3 class="font-medium">Plan features</h3>
          <ul class="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <li v-for="feature in selectedSubscription.features" :key="feature" class="flex gap-2">
              <span aria-hidden="true">✓</span>
              <span>{{ feature }}</span>
            </li>
          </ul>
        </section>
      </div>
    </div>

    <div
      v-if="selectedInvoice"
      role="dialog"
      aria-modal="true"
      :aria-label="`${selectedInvoice.invoiceNumber} invoice`"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      @click.self="selectedInvoice = null"
    >
      <div class="w-full max-w-lg rounded-lg border border-black/10 bg-white p-6 shadow-[0_32px_90px_rgba(0,0,0,0.18)]">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm text-neutral-500">Invoice</p>
            <h2 class="mt-1 text-2xl font-medium">{{ selectedInvoice.invoiceNumber }}</h2>
          </div>
          <button class="rounded-full border border-black/10 px-3 py-1 text-sm" type="button" @click="selectedInvoice = null">
            Close
          </button>
        </div>

        <dl class="mt-6 divide-y divide-black/10 border-y border-black/10 text-sm">
          <div v-for="item in invoiceRows(selectedInvoice)" :key="item.label" class="flex items-center justify-between gap-4 py-3">
            <dt class="text-neutral-500">{{ item.label }}</dt>
            <dd class="font-medium text-right">{{ item.value }}</dd>
          </div>
        </dl>

        <section class="mt-6">
          <h3 class="font-medium">Customer snapshot</h3>
          <dl class="mt-3 divide-y divide-black/10 border-y border-black/10 text-sm">
            <div v-for="item in invoiceCustomerRows(selectedInvoice)" :key="item.label" class="flex items-center justify-between gap-4 py-3">
              <dt class="text-neutral-500">{{ item.label }}</dt>
              <dd class="font-medium text-right">{{ item.value }}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>

    <div
      v-if="selectedCredentialsSubscription"
      role="dialog"
      aria-modal="true"
      :aria-label="`${selectedCredentialsSubscription.name} credentials`"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      @click.self="selectedCredentialsSubscription = null"
    >
      <div class="w-full max-w-lg rounded-lg border border-black/10 bg-white p-6 shadow-[0_32px_90px_rgba(0,0,0,0.18)]">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm text-neutral-500">{{ selectedCredentialsSubscription.name }}</p>
            <h2 class="mt-1 text-2xl font-medium">Credentials</h2>
          </div>
          <button class="rounded-full border border-black/10 px-3 py-1 text-sm" type="button" @click="selectedCredentialsSubscription = null">
            Close
          </button>
        </div>

        <div class="mt-6 divide-y divide-black/10 border-y border-black/10">
          <div v-for="field in credentialRows(selectedCredentialsSubscription)" :key="`${field.label}-${field.value}`" class="grid gap-2 py-4 text-sm sm:grid-cols-[0.8fr_1fr_auto] sm:items-center">
            <p class="text-neutral-500">{{ formatCredentialLabel(field.label) }}</p>
            <p class="font-medium break-all">{{ field.value }}</p>
            <button class="pill-button pill-button-secondary" type="button" @click="copyValue(field.value)">Copy</button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  fetchSelfInvoice,
  fetchSelfInvoices,
  fetchSelfProfile,
  fetchSelfSubscription,
  fetchSelfSubscriptions,
  formatDate,
  formatSubscriptionBilling,
  formatXafAmount,
  getSubscriptionTypeLabel,
  updateSelfProfile,
  type Invoice,
  type Subscription,
  type UserProfile,
} from '@/lib/api'
import { cleanRedirectTarget } from '@/lib/auth-redirect'
import { useAppAuth } from '@/lib/auth'
import { initializeMockAuth } from '@/lib/mock-auth'

const route = useRoute()
const router = useRouter()
const { isLoaded: isAuthLoaded, isSignedIn, user, getAccessToken } = useAppAuth()

const isLoading = ref(true)
const loadError = ref('')
const isSavingProfile = ref(false)
const loadingSubscriptionId = ref('')
const loadingInvoiceId = ref('')
const profileMessage = ref('')
const profile = ref<UserProfile | null>(null)
const subscriptions = ref<Subscription[]>([])
const invoices = ref<Invoice[]>([])
const selectedSubscription = ref<Subscription | null>(null)
const selectedCredentialsSubscription = ref<Subscription | null>(null)
const selectedInvoice = ref<Invoice | null>(null)
const profileForm = reactive({
  companyName: '',
  phone: '',
  line1: '',
  city: '',
  zipCode: '',
  country: '',
})

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'subscriptions', label: 'My subscriptions' },
  { id: 'invoices', label: 'My invoices' },
  { id: 'profile', label: 'My profile' },
]

const overview = computed(() => [
  { label: 'Active subscriptions', value: String(subscriptions.value.filter((item) => item.status === 'active').length) },
  { label: 'Invoices', value: String(invoices.value.length) },
  { label: 'Credit', value: formatXafAmount(profile.value?.credit?.amount ?? 0) },
  { label: 'Debt', value: formatDebt(profile.value) },
])
const profileName = computed(() => {
  const fromApi = [profile.value?.firstName, profile.value?.lastName].filter(Boolean).join(' ').trim()
  return fromApi || user.value?.fullName || user.value?.firstName || 'Customer account'
})
const dashboardGreeting = computed(() => `Hello, ${profileName.value}`)
const profileEmail = computed(() => profile.value?.email || user.value?.primaryEmailAddress?.emailAddress || 'your-account@example.com')

function syncProfileForm(nextProfile: UserProfile | null) {
  profileForm.companyName = nextProfile?.company?.name ?? ''
  profileForm.phone = nextProfile?.contact?.phone ?? ''
  profileForm.line1 = nextProfile?.address?.line1 ?? ''
  profileForm.city = nextProfile?.address?.city ?? ''
  profileForm.zipCode = nextProfile?.address?.zipCode ?? ''
  profileForm.country = nextProfile?.address?.country ?? ''
}

function formatDebt(nextProfile: UserProfile | null) {
  const amount = nextProfile?.debt?.amount ?? 0
  if (amount === 0) return formatXafAmount(0)
  const borrowedAt = nextProfile?.debt?.borrowedAt ? ` since ${formatDate(nextProfile.debt.borrowedAt)}` : ''
  return `${formatXafAmount(amount)}${borrowedAt}`
}

function webPanelUrl(subscription: Subscription) {
  if (subscription.type === 'shared_hosting') return 'https://example-hosting.app/panel'
  if (subscription.type === 'vps') return 'https://panel.example.com'
  return ''
}

function subscriptionSummary(subscription: Subscription) {
  const primaryDomain = subscription.domains[0]
  return [
    { label: 'Primary domain', value: primaryDomain?.name ?? 'Not set' },
    { label: 'Domains', value: String(subscription.domains.length) },
    { label: 'Invoice', value: subscription.invoiceNumber || 'Not set' },
    { label: 'Period', value: `${formatDate(subscription.startDate)} to ${formatDate(subscription.endDate)}` },
  ]
}

function subscriptionDetailStats(subscription: Subscription) {
  return [
    { label: 'Status', value: subscription.status },
    { label: 'Billing', value: formatSubscriptionBilling(subscription) },
    { label: 'Renewal', value: formatDate(subscription.endDate) },
    { label: 'Invoice number', value: subscription.invoiceNumber || 'Not set' },
    { label: 'Created', value: formatDate(subscription.createdAt) },
    { label: 'Updated', value: formatDate(subscription.updatedAt) },
  ]
}

function invoiceRows(invoice: Invoice) {
  return [
    { label: 'Invoice number', value: invoice.invoiceNumber },
    { label: 'Order number', value: invoice.orderNumber },
    { label: 'Amount', value: formatXafAmount(invoice.amount) },
    { label: 'Date', value: formatDate(invoice.date) },
    { label: 'Created', value: formatDate(invoice.createdAt) },
    { label: 'Updated', value: formatDate(invoice.updatedAt) },
  ]
}

function invoiceCustomerRows(invoice: Invoice) {
  return [
    { label: 'Name', value: invoice.userInfo?.fullName || 'Not set' },
    { label: 'Email', value: invoice.userInfo?.email || profileEmail.value },
    { label: 'Company', value: invoice.userInfo?.companyName || 'Not set' },
    { label: 'Phone', value: invoice.userInfo?.phone || 'Not set' },
    { label: 'Address', value: formatAddress(invoice.userInfo?.address) },
  ]
}

function formatAddress(address?: NonNullable<Invoice['userInfo']>['address']) {
  if (!address) return 'Not set'
  return [address.line1, address.city, address.zipCode, address.country].filter(Boolean).join(', ') || 'Not set'
}

function hasCredentials(subscription: Subscription) {
  return credentialRows(subscription).length > 0
}

function formatCredentialLabel(value: string) {
  const label = value.replace(/([A-Z])/g, ' $1').replace(/[_-]+/g, ' ').trim().toLowerCase()
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function credentialRows(subscription: Subscription) {
  const rows = Object.entries(subscription.credentials ?? {}).map(([label, value]) => ({
    label,
    value: String(value ?? ''),
  }))

  if (subscription.vpsCredentials?.rootUsername) {
    rows.push({ label: 'rootUsername', value: subscription.vpsCredentials.rootUsername })
  }

  if (subscription.vpsCredentials?.rootPassword) {
    rows.push({ label: 'rootPassword', value: subscription.vpsCredentials.rootPassword })
  }

  return rows
}

function replaceSubscription(nextSubscription: Subscription) {
  subscriptions.value = subscriptions.value.map((item) => (item._id === nextSubscription._id ? nextSubscription : item))
}

function replaceInvoice(nextInvoice: Invoice) {
  invoices.value = invoices.value.map((item) => (item._id === nextInvoice._id ? nextInvoice : item))
}

async function copyValue(value: string) {
  await navigator.clipboard.writeText(value)
}

async function openSubscriptionDetails(subscription: Subscription) {
  const token = await getAccessToken()
  if (!token) {
    loadError.value = 'Unable to authenticate your session.'
    return
  }

  loadingSubscriptionId.value = subscription._id

  try {
    const detailed = await fetchSelfSubscription(subscription._id, token)
    replaceSubscription(detailed)
    selectedSubscription.value = detailed
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unable to load subscription details.'
  } finally {
    loadingSubscriptionId.value = ''
  }
}

async function openSubscriptionCredentials(subscription: Subscription) {
  const token = await getAccessToken()
  if (!token) {
    loadError.value = 'Unable to authenticate your session.'
    return
  }

  loadingSubscriptionId.value = subscription._id

  try {
    const detailed = await fetchSelfSubscription(subscription._id, token)
    replaceSubscription(detailed)
    selectedCredentialsSubscription.value = detailed
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unable to load credentials.'
  } finally {
    loadingSubscriptionId.value = ''
  }
}

async function openInvoiceDetails(invoice: Invoice) {
  const token = await getAccessToken()
  if (!token) {
    loadError.value = 'Unable to authenticate your session.'
    return
  }

  loadingInvoiceId.value = invoice._id

  try {
    const detailed = await fetchSelfInvoice(invoice._id, token)
    replaceInvoice(detailed)
    selectedInvoice.value = detailed
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unable to load invoice details.'
  } finally {
    loadingInvoiceId.value = ''
  }
}

async function loadDashboard() {
  initializeMockAuth()

  if (!isAuthLoaded.value) {
    isLoading.value = true
    return
  }

  if (!isSignedIn.value) {
    await router.push({ path: '/sign-in', query: { redirect: cleanRedirectTarget(route.fullPath) } })
    return
  }

  const token = await getAccessToken()
  if (!token) {
    loadError.value = 'Unable to authenticate your session.'
    isLoading.value = false
    return
  }

  isLoading.value = true
  loadError.value = ''

  try {
    const [profileData, subscriptionList, invoiceList] = await Promise.all([
      fetchSelfProfile(token),
      fetchSelfSubscriptions(token),
      fetchSelfInvoices(token),
    ])

    profile.value = profileData
    syncProfileForm(profileData)
    subscriptions.value = subscriptionList.data
    invoices.value = invoiceList.data
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unable to load dashboard.'
  } finally {
    isLoading.value = false
  }
}

async function saveProfile() {
  const token = await getAccessToken()
  if (!token) return

  isSavingProfile.value = true
  profileMessage.value = ''

  try {
    profile.value = await updateSelfProfile(
      {
        company: { name: profileForm.companyName },
        contact: { phone: profileForm.phone },
        address: {
          line1: profileForm.line1,
          city: profileForm.city,
          zipCode: profileForm.zipCode,
          country: profileForm.country,
        },
      },
      token,
    )
    profileMessage.value = 'Profile updated.'
  } catch (error) {
    profileMessage.value = error instanceof Error ? error.message : 'Unable to update profile.'
  } finally {
    isSavingProfile.value = false
  }
}

watch([isAuthLoaded, isSignedIn], () => {
  void loadDashboard()
}, { immediate: true })
</script>
