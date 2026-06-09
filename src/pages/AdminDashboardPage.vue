<template>
  <main class="mx-auto max-w-7xl px-4 py-12 sm:px-6">
    <header class="flex flex-col gap-5 border-b border-black/10 pb-8 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="text-sm text-neutral-500">Internal control surface</p>
        <h1 class="mt-2 text-4xl font-medium tracking-normal">Admin dashboard</h1>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
          Operate users, requests, subscriptions, offers, and billing from the backend APIs.
        </p>
      </div>

      <nav class="flex flex-wrap gap-2">
        <a v-for="section in sections" :key="section.id" :href="`#${section.id}`" class="pill-button pill-button-secondary">
          {{ section.label }}
        </a>
      </nav>
    </header>

    <p v-if="isLoading" class="py-8 text-sm text-neutral-500">Loading admin data...</p>
    <p v-else-if="loadError" class="py-8 text-sm text-red-600">{{ loadError }}</p>

    <template v-else>
      <section id="overview" class="border-b border-black/10 py-8">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <article v-for="item in overview" :key="item.label" class="border-y border-black/10 py-5">
            <p class="text-sm text-neutral-500">{{ item.label }}</p>
            <p class="mt-3 text-3xl font-medium">{{ item.value }}</p>
          </article>
        </div>
      </section>

      <section id="requests" class="border-b border-black/10 py-8">
        <SectionHeader title="User requests" :count="userRequests.length" />

        <div class="mt-6 divide-y divide-black/10 border-y border-black/10">
          <article v-for="request in userRequests" :key="request._id" class="grid gap-5 py-5 lg:grid-cols-[1.2fr_1fr_1fr]">
            <div>
              <p class="font-medium">{{ request.orderNumber }}</p>
              <p class="mt-1 text-sm text-neutral-500">{{ request.domainName }}</p>
              <p class="mt-3 text-sm">{{ getOfferTypeLabel(request.offerType) }} {{ request.offerPlan }}</p>
              <p class="mt-1 text-sm text-neutral-500">{{ formatXafAmount(request.pricePerYear) }}</p>
            </div>

            <dl class="space-y-3 text-sm">
              <div class="flex justify-between gap-4">
                <dt class="text-neutral-500">Customer</dt>
                <dd class="font-medium break-all">{{ request.clerkUserId }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-neutral-500">Created</dt>
                <dd>{{ formatDate(request.createdAt) }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-neutral-500">Status</dt>
                <dd>{{ request.status }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-neutral-500">Offer slug</dt>
                <dd class="break-all">{{ request.offerSlug }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-neutral-500">Updated</dt>
                <dd>{{ formatDate(request.updatedAt) }}</dd>
              </div>
              <div v-if="request.offerType === 'vps'" class="flex justify-between gap-4">
                <dt class="text-neutral-500">VPS</dt>
                <dd>{{ request.rootUsername || 'root' }} · {{ request.operatingSystem || 'Not set' }} · {{ request.datacenter || 'Not set' }}</dd>
              </div>
            </dl>

            <div class="space-y-3">
              <select
                v-model="requestDraft(request).status"
                class="w-full rounded-full border border-black/10 bg-white px-4 py-2 text-sm outline-none"
                :disabled="isRequestBusy(request._id)"
              >
                <option v-for="status in requestStatuses" :key="status" :value="status">{{ status }}</option>
              </select>

              <textarea
                v-model="requestDraft(request).adminNotes"
                class="min-h-24 w-full rounded-lg border border-black/10 px-4 py-3 text-sm outline-none"
                placeholder="Admin notes"
                :disabled="isRequestBusy(request._id)"
              />

              <button class="pill-button" type="button" :disabled="isRequestBusy(request._id)" @click="saveRequest(request._id)">
                {{ isRequestBusy(request._id) ? 'Saving...' : 'Save request' }}
              </button>
              <button class="pill-button pill-button-secondary" type="button" :disabled="isRequestBusy(request._id)" @click="refreshRequest(request._id)">
                Refresh details
              </button>
            </div>
          </article>
          <p v-if="userRequests.length === 0" class="py-8 text-sm text-neutral-500">No user requests.</p>
        </div>
      </section>

      <section id="users" class="border-b border-black/10 py-8">
        <SectionHeader title="Users" :count="users.length" />

        <div class="mt-6 divide-y divide-black/10 border-y border-black/10">
          <article v-for="user in users" :key="user._id" class="grid gap-5 py-5 lg:grid-cols-[1.1fr_1fr_1fr]">
            <div>
              <p class="font-medium">{{ userName(user) }}</p>
              <p class="mt-1 text-sm text-neutral-500">{{ user.email || 'No email' }}</p>
              <p class="mt-3 text-xs text-neutral-500 break-all">{{ user.clerkUserId }}</p>
            </div>

            <dl class="space-y-3 text-sm">
              <div class="flex justify-between gap-4">
                <dt class="text-neutral-500">Role</dt>
                <dd class="font-medium">{{ user.role }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-neutral-500">Credit</dt>
                <dd class="font-medium">{{ formatXafAmount(user.credit?.amount ?? 0) }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-neutral-500">Debt</dt>
                <dd class="font-medium text-right">{{ formatDebt(user) }}</dd>
              </div>
            </dl>

            <div class="space-y-3">
              <div class="grid grid-cols-[1fr_auto] gap-2">
                <select
                  v-model="userDraft(user).role"
                  class="rounded-full border border-black/10 bg-white px-4 py-2 text-sm outline-none"
                  :disabled="isUserBusy(user.clerkUserId)"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
                <button class="pill-button pill-button-secondary" type="button" :disabled="isUserBusy(user.clerkUserId)" @click="saveUserRole(user.clerkUserId)">Save</button>
              </div>

              <div class="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
                <input
                  v-model.number="userDraft(user).creditAmount"
                  class="rounded-full border border-black/10 px-4 py-2 text-sm outline-none"
                  min="0"
                  type="number"
                  placeholder="Credit XAF"
                >
                <button class="pill-button pill-button-secondary" type="button" :disabled="isUserBusy(user.clerkUserId)" @click="setUserCredit(user.clerkUserId)">Set</button>
                <button class="pill-button pill-button-secondary" type="button" :disabled="isUserBusy(user.clerkUserId)" @click="adjustUserCredit(user.clerkUserId, 'add')">Add</button>
                <button class="pill-button pill-button-secondary" type="button" :disabled="isUserBusy(user.clerkUserId)" @click="adjustUserCredit(user.clerkUserId, 'subtract')">Subtract</button>
              </div>

              <div class="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  v-model.number="userDraft(user).debtAmount"
                  class="rounded-full border border-black/10 px-4 py-2 text-sm outline-none"
                  min="0"
                  type="number"
                  placeholder="Debt XAF"
                >
                <input
                  v-model="userDraft(user).borrowedAt"
                  class="rounded-full border border-black/10 px-4 py-2 text-sm outline-none"
                  type="date"
                >
                <button class="pill-button pill-button-secondary" type="button" :disabled="isUserBusy(user.clerkUserId)" @click="setUserDebt(user.clerkUserId)">
                  Set debt
                </button>
              </div>

              <button class="pill-button" type="button" :disabled="isUserBusy(user.clerkUserId)" @click="resyncUser(user.clerkUserId)">
                {{ isUserBusy(user.clerkUserId) ? 'Working...' : 'Resync from Clerk' }}
              </button>
              <button class="pill-button pill-button-secondary" type="button" :disabled="isUserBusy(user.clerkUserId)" @click="openUserProfileEditor(user)">
                Edit profile fields
              </button>
            </div>
          </article>
          <p v-if="users.length === 0" class="py-8 text-sm text-neutral-500">No users.</p>
        </div>
      </section>

      <section id="offers" class="border-b border-black/10 py-8">
        <SectionHeader title="Offers" :count="offers.length">
          <button class="pill-button" type="button" @click="openOfferCreate">New offer</button>
        </SectionHeader>

        <div class="mt-6 grid gap-4 md:grid-cols-2">
          <article v-for="offer in offers" :key="offer._id" class="border-y border-black/10 py-5">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-medium">{{ getOfferTypeLabel(offer.type) }} {{ offer.plan }}</p>
                <p class="mt-1 text-sm text-neutral-500">{{ offer.slug }}</p>
              </div>
              <p class="text-sm font-medium">{{ formatOfferPrice(offer) }}</p>
            </div>
            <div class="mt-4 flex flex-wrap gap-2">
              <button class="pill-button pill-button-secondary" type="button" @click="openOfferEditor(offer)">Edit</button>
              <button class="pill-button pill-button-secondary" type="button" @click="deleteOffer(offer._id)">Delete</button>
            </div>
          </article>
        </div>
      </section>

      <section id="subscriptions" class="border-b border-black/10 py-8">
        <SectionHeader title="Subscriptions" :count="subscriptions.length">
          <button class="pill-button" type="button" @click="openSubscriptionCreate">New subscription</button>
        </SectionHeader>

        <div class="mt-6 divide-y divide-black/10 border-y border-black/10">
          <div v-for="subscription in subscriptions" :key="subscription._id" class="grid gap-3 py-4 text-sm md:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_auto] md:items-center">
            <div>
              <p class="font-medium">{{ subscription.name }}</p>
              <p class="mt-1 text-neutral-500">{{ subscription.invoiceNumber }}</p>
            </div>
            <p class="text-neutral-600">{{ getSubscriptionTypeLabel(subscription.type) }} · {{ subscription.domains.length }} domains</p>
            <p>{{ subscription.status }}</p>
            <p class="font-medium md:text-right">{{ formatSubscriptionBilling(subscription) }}</p>
            <div class="flex flex-wrap gap-2 md:justify-end">
              <button class="pill-button pill-button-secondary" type="button" @click="openSubscriptionEditor(subscription)">Edit</button>
              <button class="pill-button pill-button-secondary" type="button" @click="deleteSubscription(subscription._id)">Delete</button>
            </div>
          </div>
          <p v-if="subscriptions.length === 0" class="py-8 text-sm text-neutral-500">No subscriptions.</p>
        </div>
      </section>

      <section id="invoices" class="py-8">
        <SectionHeader title="Invoices" :count="invoices.length">
          <button class="pill-button" type="button" @click="openInvoiceCreate">New invoice</button>
        </SectionHeader>

        <div class="mt-6 divide-y divide-black/10 border-y border-black/10">
          <div v-for="invoice in invoices" :key="invoice._id" class="grid gap-3 py-4 text-sm md:grid-cols-[1fr_1fr_1fr_0.8fr_auto] md:items-center">
            <div>
              <p class="font-medium">{{ invoice.invoiceNumber }}</p>
              <p class="mt-1 text-neutral-500">{{ invoice.userInfo?.fullName || invoice.userInfo?.email || invoice.clerkUserId }}</p>
            </div>
            <p class="text-neutral-600">{{ invoice.orderNumber }}</p>
            <p class="text-neutral-500">{{ formatDate(invoice.date) }}</p>
            <p class="font-medium md:text-right">{{ formatXafAmount(invoice.amount) }}</p>
            <div class="flex flex-wrap gap-2 md:justify-end">
              <button class="pill-button pill-button-secondary" type="button" @click="openInvoiceEditor(invoice)">Edit</button>
              <button class="pill-button pill-button-secondary" type="button" @click="deleteInvoice(invoice._id)">Delete</button>
            </div>
          </div>
          <p v-if="invoices.length === 0" class="py-8 text-sm text-neutral-500">No invoices.</p>
        </div>
      </section>
    </template>

    <div
      v-if="editor"
      role="dialog"
      aria-modal="true"
      :aria-label="editor.title"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      @click.self="closeEditor"
    >
      <form class="w-full max-w-2xl rounded-lg bg-white p-6 shadow-[0_32px_90px_rgba(0,0,0,0.18)]" @submit.prevent="saveEditor">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm text-neutral-500">{{ editor.kind }}</p>
            <h2 class="mt-1 text-2xl font-medium">{{ editor.title }}</h2>
          </div>
          <button class="rounded-full border border-black/10 px-3 py-1 text-sm" type="button" @click="closeEditor">Close</button>
        </div>

        <textarea
          v-model="editor.json"
          class="mt-6 min-h-96 w-full rounded-lg border border-black/10 bg-neutral-50 p-4 font-mono text-xs leading-5 outline-none"
          spellcheck="false"
        />

        <p v-if="editor.error" class="mt-3 text-sm text-red-600">{{ editor.error }}</p>
        <div class="mt-5 flex flex-wrap gap-2">
          <button class="pill-button" type="submit" :disabled="isSavingEditor">{{ isSavingEditor ? 'Saving...' : 'Save' }}</button>
          <button class="pill-button pill-button-secondary" type="button" @click="closeEditor">Cancel</button>
        </div>
      </form>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  addAdminUserCredit,
  createAdminInvoice,
  createAdminOffer,
  createAdminSubscription,
  deleteAdminInvoice,
  deleteAdminOffer,
  deleteAdminSubscription,
  fetchAdminInvoice,
  fetchAdminInvoices,
  fetchAdminOffer,
  fetchAdminOffers,
  fetchAdminSubscription,
  fetchAdminSubscriptions,
  fetchAdminUser,
  fetchAdminUserRequest,
  fetchAdminUserRequests,
  fetchAdminUsers,
  formatDate,
  formatOfferPrice,
  formatSubscriptionBilling,
  formatXafAmount,
  getOfferTypeLabel,
  getSubscriptionTypeLabel,
  resyncAdminUser,
  setAdminUserCredit,
  setAdminUserDebt,
  subtractAdminUserCredit,
  updateAdminInvoice,
  updateAdminOffer,
  updateAdminSubscription,
  updateAdminUserProfile,
  updateAdminUserRequest,
  updateAdminUserRole,
  type AdminProfileUpdateInput,
  type Invoice,
  type InvoiceInput,
  type Offer,
  type OfferInput,
  type Subscription,
  type SubscriptionInput,
  type UserProfile,
  type UserRequest,
  type UserRequestStatus,
} from '@/lib/api'
import { cleanRedirectTarget } from '@/lib/auth-redirect'
import { useAppAuth } from '@/lib/auth'
import { initializeMockAuth } from '@/lib/mock-auth'

const SectionHeader = defineComponent({
  props: {
    title: { type: String, required: true },
    count: { type: Number, required: true },
  },
  setup(props, { slots }) {
    return () =>
      h('div', { class: 'flex items-end justify-between gap-4' }, [
        h('div', [
          h('h2', { class: 'text-2xl font-medium tracking-normal' }, props.title),
          h('p', { class: 'mt-1 text-sm text-neutral-500' }, `${props.count} items`),
        ]),
        slots.default ? h('div', { class: 'flex flex-wrap gap-2' }, slots.default()) : null,
      ])
  },
})

type UserDraft = {
  role: UserProfile['role']
  creditAmount: number
  debtAmount: number
  borrowedAt: string
}

type RequestDraft = {
  status: UserRequestStatus
  adminNotes: string
}

type EditorKind = 'userProfile' | 'offer' | 'subscription' | 'invoice'

type ResourceEditor = {
  kind: EditorKind
  mode: 'create' | 'update'
  id?: string
  userId?: string
  title: string
  json: string
  error: string
}

const route = useRoute()
const router = useRouter()
const { isLoaded: isAuthLoaded, isSignedIn, getAccessToken } = useAppAuth()

const isLoading = ref(true)
const loadError = ref('')
const updatingRequestId = ref('')
const updatingUserId = ref('')
const isSavingEditor = ref(false)
const users = ref<UserProfile[]>([])
const offers = ref<Offer[]>([])
const subscriptions = ref<Subscription[]>([])
const invoices = ref<Invoice[]>([])
const userRequests = ref<UserRequest[]>([])
const editor = ref<ResourceEditor | null>(null)
const userDrafts = reactive<Record<string, UserDraft>>({})
const requestDrafts = reactive<Record<string, RequestDraft>>({})

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'requests', label: 'Requests' },
  { id: 'users', label: 'Users' },
  { id: 'offers', label: 'Offers' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'invoices', label: 'Invoices' },
]
const requestStatuses: UserRequestStatus[] = ['submitted', 'contacted', 'provisioning', 'completed', 'cancelled']

const overview = computed(() => [
  { label: 'Requests', value: String(userRequests.value.length) },
  { label: 'Users', value: String(users.value.length) },
  { label: 'Offers', value: String(offers.value.length) },
  { label: 'Subscriptions', value: String(subscriptions.value.length) },
  { label: 'Invoices', value: String(invoices.value.length) },
])

function userName(user: UserProfile) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email || user.clerkUserId
}

function dateInputValue(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function formatDebt(user: UserProfile) {
  const amount = user.debt?.amount ?? 0
  const borrowedAt = user.debt?.borrowedAt ? ` · ${formatDate(user.debt.borrowedAt)}` : ''
  return `${formatXafAmount(amount)}${borrowedAt}`
}

function prettyJson(value: unknown) {
  return JSON.stringify(value, null, 2)
}

function oneYearFromNow() {
  const date = new Date()
  date.setUTCFullYear(date.getUTCFullYear() + 1)
  return date.toISOString()
}

function offerInput(offer: Offer): OfferInput {
  return {
    type: offer.type,
    plan: offer.plan,
    slug: offer.slug,
    pricePerYear: offer.pricePerYear,
    features: offer.features,
  }
}

function subscriptionInput(subscription: Subscription): SubscriptionInput {
  return {
    clerkUserId: subscription.clerkUserId,
    invoiceNumber: subscription.invoiceNumber,
    name: subscription.name,
    type: subscription.type,
    status: subscription.status,
    features: subscription.features,
    billing: subscription.billing,
    startDate: subscription.startDate,
    endDate: subscription.endDate,
    domains: subscription.domains,
    credentials: subscription.credentials ?? {},
    ...(subscription.vpsCredentials ? { vpsCredentials: subscription.vpsCredentials } : {}),
  }
}

function invoiceInput(invoice: Invoice): InvoiceInput {
  return {
    clerkUserId: invoice.clerkUserId,
    orderNumber: invoice.orderNumber,
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.amount,
    date: invoice.date,
  }
}

function closeEditor() {
  editor.value = null
}

async function openUserProfileEditor(user: UserProfile) {
  const token = await getAccessToken()
  if (!token) return

  let detailed = user
  try {
    detailed = await fetchAdminUser(user.clerkUserId, token)
    replaceUser(detailed)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unable to load user details.'
  }

  editor.value = {
    kind: 'userProfile',
    mode: 'update',
    userId: detailed.clerkUserId,
    title: `Edit ${userName(detailed)}`,
    json: prettyJson({
      address: detailed.address ?? {},
      company: detailed.company ?? {},
      contact: detailed.contact ?? {},
    }),
    error: '',
  }
}

function openOfferCreate() {
  editor.value = {
    kind: 'offer',
    mode: 'create',
    title: 'Create offer',
    json: prettyJson({
      type: 'shared_hosting',
      plan: 'Go',
      slug: 'shared-hosting/go',
      pricePerYear: 18000,
      features: [],
    }),
    error: '',
  }
}

async function openOfferEditor(offer: Offer) {
  const token = await getAccessToken()
  if (!token) return

  let detailed = offer
  try {
    detailed = await fetchAdminOffer(offer._id, token)
    offers.value = offers.value.map((item) => (item._id === detailed._id ? detailed : item))
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unable to load offer details.'
  }

  editor.value = {
    kind: 'offer',
    mode: 'update',
    id: detailed._id,
    title: `Edit ${getOfferTypeLabel(detailed.type)} ${detailed.plan}`,
    json: prettyJson(offerInput(detailed)),
    error: '',
  }
}

function openSubscriptionCreate() {
  const now = new Date().toISOString()
  const endDate = oneYearFromNow()

  editor.value = {
    kind: 'subscription',
    mode: 'create',
    title: 'Create subscription',
    json: prettyJson({
      clerkUserId: users.value[0]?.clerkUserId ?? '',
      invoiceNumber: '',
      name: 'Shared Hosting Plus',
      type: 'shared_hosting',
      status: 'active',
      features: [],
      billing: { amount: 0, interval: 'year' },
      startDate: now,
      endDate,
      domains: [
        {
          name: 'example.com',
          type: 'included',
          price: 0,
          startDate: now,
          endDate,
          status: 'active',
        },
      ],
      credentials: {},
    }),
    error: '',
  }
}

async function openSubscriptionEditor(subscription: Subscription) {
  const token = await getAccessToken()
  if (!token) return

  let detailed = subscription
  try {
    detailed = await fetchAdminSubscription(subscription._id, token)
    subscriptions.value = subscriptions.value.map((item) => (item._id === detailed._id ? detailed : item))
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unable to load subscription details.'
  }

  editor.value = {
    kind: 'subscription',
    mode: 'update',
    id: detailed._id,
    title: `Edit ${detailed.name}`,
    json: prettyJson(subscriptionInput(detailed)),
    error: '',
  }
}

function openInvoiceCreate() {
  editor.value = {
    kind: 'invoice',
    mode: 'create',
    title: 'Create invoice',
    json: prettyJson({
      clerkUserId: users.value[0]?.clerkUserId ?? '',
      orderNumber: '',
      invoiceNumber: '',
      amount: 0,
      date: new Date().toISOString(),
    }),
    error: '',
  }
}

async function openInvoiceEditor(invoice: Invoice) {
  const token = await getAccessToken()
  if (!token) return

  let detailed = invoice
  try {
    detailed = await fetchAdminInvoice(invoice._id, token)
    invoices.value = invoices.value.map((item) => (item._id === detailed._id ? detailed : item))
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unable to load invoice details.'
  }

  editor.value = {
    kind: 'invoice',
    mode: 'update',
    id: detailed._id,
    title: `Edit ${detailed.invoiceNumber}`,
    json: prettyJson(invoiceInput(detailed)),
    error: '',
  }
}

function syncUserDrafts(items: UserProfile[]) {
  for (const user of items) {
    userDrafts[user.clerkUserId] = {
      role: user.role,
      creditAmount: user.credit?.amount ?? 0,
      debtAmount: user.debt?.amount ?? 0,
      borrowedAt: dateInputValue(user.debt?.borrowedAt),
    }
  }
}

function syncRequestDrafts(items: UserRequest[]) {
  for (const request of items) {
    requestDrafts[request._id] = {
      status: request.status,
      adminNotes: request.adminNotes ?? '',
    }
  }
}

function userDraft(user: UserProfile) {
  const existing = userDrafts[user.clerkUserId]
  if (existing) return existing

  const draft = {
    role: user.role,
    creditAmount: user.credit?.amount ?? 0,
    debtAmount: user.debt?.amount ?? 0,
    borrowedAt: dateInputValue(user.debt?.borrowedAt),
  }
  userDrafts[user.clerkUserId] = draft
  return draft
}

function requestDraft(request: UserRequest) {
  const existing = requestDrafts[request._id]
  if (existing) return existing

  const draft = {
    status: request.status,
    adminNotes: request.adminNotes ?? '',
  }
  requestDrafts[request._id] = draft
  return draft
}

function replaceUser(updated: UserProfile) {
  users.value = users.value.map((item) => (item.clerkUserId === updated.clerkUserId ? updated : item))
  syncUserDrafts([updated])
}

function replaceRequest(updated: UserRequest) {
  userRequests.value = userRequests.value.map((item) => (item._id === updated._id ? updated : item))
  syncRequestDrafts([updated])
}

function isRequestBusy(id: string) {
  return updatingRequestId.value === id
}

function isUserBusy(clerkUserId: string) {
  return updatingUserId.value === clerkUserId
}

async function loadAdminDashboard() {
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
    const [usersList, offersList, subscriptionsList, invoicesList, requestsList] = await Promise.all([
      fetchAdminUsers(token),
      fetchAdminOffers(token),
      fetchAdminSubscriptions(token),
      fetchAdminInvoices(token),
      fetchAdminUserRequests(token),
    ])

    users.value = usersList.data
    offers.value = offersList.data
    subscriptions.value = subscriptionsList.data
    invoices.value = invoicesList.data
    userRequests.value = requestsList.data
    syncUserDrafts(usersList.data)
    syncRequestDrafts(requestsList.data)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unable to load admin dashboard.'
  } finally {
    isLoading.value = false
  }
}

async function saveRequest(id: string) {
  const draft = requestDrafts[id]
  if (!draft) return

  const token = await getAccessToken()
  if (!token) {
    loadError.value = 'Unable to authenticate your session.'
    return
  }

  updatingRequestId.value = id

  try {
    replaceRequest(await updateAdminUserRequest(id, draft, token))
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unable to update request.'
  } finally {
    updatingRequestId.value = ''
  }
}

async function refreshRequest(id: string) {
  const token = await getAccessToken()
  if (!token) {
    loadError.value = 'Unable to authenticate your session.'
    return
  }

  updatingRequestId.value = id

  try {
    replaceRequest(await fetchAdminUserRequest(id, token))
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unable to load request details.'
  } finally {
    updatingRequestId.value = ''
  }
}

async function saveUserRole(clerkUserId: string) {
  const draft = userDrafts[clerkUserId]
  if (!draft) return
  await runUserAction(clerkUserId, async (token) => updateAdminUserRole(clerkUserId, draft.role, token))
}

async function setUserCredit(clerkUserId: string) {
  const draft = userDrafts[clerkUserId]
  if (!draft) return
  await runUserAction(clerkUserId, async (token) => setAdminUserCredit(clerkUserId, Number(draft.creditAmount || 0), token))
}

async function adjustUserCredit(clerkUserId: string, mode: 'add' | 'subtract') {
  const draft = userDrafts[clerkUserId]
  if (!draft) return

  const amount = Number(draft.creditAmount || 0)
  const action = mode === 'add' ? addAdminUserCredit : subtractAdminUserCredit
  await runUserAction(clerkUserId, async (token) => action(clerkUserId, amount, token))
}

async function setUserDebt(clerkUserId: string) {
  const draft = userDrafts[clerkUserId]
  if (!draft) return

  await runUserAction(clerkUserId, async (token) =>
    setAdminUserDebt(
      clerkUserId,
      {
        amount: Number(draft.debtAmount || 0),
        borrowedAt: draft.borrowedAt || null,
      },
      token,
    ),
  )
}

async function resyncUser(clerkUserId: string) {
  await runUserAction(clerkUserId, async (token) => resyncAdminUser(clerkUserId, token))
}

async function runUserAction(clerkUserId: string, action: (token: string) => Promise<UserProfile>) {
  const token = await getAccessToken()
  if (!token) {
    loadError.value = 'Unable to authenticate your session.'
    return
  }

  updatingUserId.value = clerkUserId

  try {
    replaceUser(await action(token))
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unable to update user.'
  } finally {
    updatingUserId.value = ''
  }
}

async function saveEditor() {
  const activeEditor = editor.value
  if (!activeEditor) return

  let payload: unknown
  try {
    payload = JSON.parse(activeEditor.json)
  } catch {
    activeEditor.error = 'Invalid JSON.'
    return
  }

  const token = await getAccessToken()
  if (!token) {
    activeEditor.error = 'Unable to authenticate your session.'
    return
  }

  isSavingEditor.value = true
  activeEditor.error = ''

  try {
    if (activeEditor.kind === 'userProfile') {
      if (!activeEditor.userId) throw new Error('Missing user id.')
      replaceUser(await updateAdminUserProfile(activeEditor.userId, payload as AdminProfileUpdateInput, token))
    }

    if (activeEditor.kind === 'offer') {
      if (activeEditor.mode === 'create') {
        offers.value = [await createAdminOffer(payload as OfferInput, token), ...offers.value]
      } else {
        if (!activeEditor.id) throw new Error('Missing offer id.')
        const updated = await updateAdminOffer(activeEditor.id, payload as Partial<OfferInput>, token)
        offers.value = offers.value.map((item) => (item._id === updated._id ? updated : item))
      }
    }

    if (activeEditor.kind === 'subscription') {
      if (activeEditor.mode === 'create') {
        subscriptions.value = [await createAdminSubscription(payload as SubscriptionInput, token), ...subscriptions.value]
      } else {
        if (!activeEditor.id) throw new Error('Missing subscription id.')
        const updated = await updateAdminSubscription(activeEditor.id, payload as Partial<SubscriptionInput>, token)
        subscriptions.value = subscriptions.value.map((item) => (item._id === updated._id ? updated : item))
      }
    }

    if (activeEditor.kind === 'invoice') {
      if (activeEditor.mode === 'create') {
        invoices.value = [await createAdminInvoice(payload as InvoiceInput, token), ...invoices.value]
      } else {
        if (!activeEditor.id) throw new Error('Missing invoice id.')
        const updated = await updateAdminInvoice(activeEditor.id, payload as Partial<InvoiceInput>, token)
        invoices.value = invoices.value.map((item) => (item._id === updated._id ? updated : item))
      }
    }

    closeEditor()
  } catch (error) {
    activeEditor.error = error instanceof Error ? error.message : 'Unable to save.'
  } finally {
    isSavingEditor.value = false
  }
}

async function deleteOffer(id: string) {
  if (!window.confirm('Delete this offer?')) return
  const token = await getAccessToken()
  if (!token) return

  try {
    await deleteAdminOffer(id, token)
    offers.value = offers.value.filter((item) => item._id !== id)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unable to delete offer.'
  }
}

async function deleteSubscription(id: string) {
  if (!window.confirm('Delete this subscription?')) return
  const token = await getAccessToken()
  if (!token) return

  try {
    await deleteAdminSubscription(id, token)
    subscriptions.value = subscriptions.value.filter((item) => item._id !== id)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unable to delete subscription.'
  }
}

async function deleteInvoice(id: string) {
  if (!window.confirm('Delete this invoice?')) return
  const token = await getAccessToken()
  if (!token) return

  try {
    await deleteAdminInvoice(id, token)
    invoices.value = invoices.value.filter((item) => item._id !== id)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unable to delete invoice.'
  }
}

watch([isAuthLoaded, isSignedIn], () => {
  void loadAdminDashboard()
}, { immediate: true })
</script>
