<template>
  <main class="mx-auto max-w-7xl px-4 py-16 sm:px-6">
    <div class="max-w-3xl">
      <p class="text-xs tracking-[0.3em] text-neutral-500">Pricing</p>
      <h1 class="mt-3 text-4xl font-medium tracking-tight sm:text-5xl md:text-6xl">Linux VPS and Shared Hosting plans.</h1>
      <p class="mt-5 text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8">
        Order from the plan page directly. Billing stays annual, with the exact due today amount shown before submission.
      </p>
    </div>

    <p v-if="loadError" class="mt-8 text-sm text-red-600">{{ loadError }}</p>
    <p v-else-if="isLoading" class="mt-8 text-sm text-neutral-500">Loading offers...</p>

    <div v-else class="mt-12 space-y-12 sm:space-y-14">
      <section v-for="group in groupedOffers" :key="group.type">
        <h2 class="text-2xl font-medium sm:text-3xl">{{ group.label }}</h2>
        <p class="mt-2 text-sm text-neutral-500">Billed yearly in XAF</p>

        <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="offer in group.offers"
            :key="offer.slug"
            :ref="(element) => setOfferRef(offer.slug, element)"
            class="relative rounded-2xl border border-black/10 p-5"
          >
            <span
              v-if="offer.plan === 'Plus'"
              class="absolute right-4 top-4 rounded-full border border-black bg-black px-3 py-1 text-[11px] tracking-[0.18em] text-white"
            >
              Popular
            </span>
            <RouterLink :to="offerSlugToPricingPath(offer.slug)">
              <p class="text-xl font-medium">{{ offer.plan }}</p>
            </RouterLink>
            <p class="mt-3 text-2xl font-medium sm:text-3xl">{{ formatOfferPrice(offer) }}</p>
            <p class="mt-1 text-sm text-neutral-500">{{ offer.type === 'vps' ? 'per year, billed as x12' : 'per year' }}</p>

            <ul class="mt-5 space-y-3 text-sm leading-6 text-neutral-700">
              <li v-for="feature in offer.features" :key="feature" class="flex items-start gap-3">
                <Icon icon="mdi:check" class="mt-0.5 h-4 w-4 shrink-0 text-black" />
                <span>{{ feature }}</span>
              </li>
            </ul>

            <RouterLink
              :to="offerSlugToPricingPath(offer.slug)"
              class="mt-6 inline-flex w-full justify-center pill-button"
              :class="{ 'pill-button-secondary': offer.plan !== 'Max' }"
            >
              Order {{ offer.plan }}
            </RouterLink>
          </article>
        </div>
      </section>
    </div>

    <div
      v-if="selectedOffer && selectedForm"
      role="dialog"
      aria-modal="true"
      :aria-label="`Order ${selectedOffer.plan}`"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      @click.self="closeOrderModal"
    >
      <div class="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_32px_90px_rgba(0,0,0,0.18)] sm:p-8">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm text-neutral-500">{{ getOfferTypeLabel(selectedOffer.type) }}</p>
            <h2 class="mt-2 text-2xl font-medium">Order {{ selectedOffer.plan }}</h2>
          </div>

          <button
            aria-label="Close order form"
            class="rounded-full border border-black/10 p-2 text-sm leading-none"
            type="button"
            @click="closeOrderModal"
          >
            ×
          </button>
        </div>

        <div class="mt-6 rounded-2xl border border-black/10 p-4">
          <p class="text-sm font-medium">Due today</p>
          <p class="mt-2 text-2xl font-medium">{{ formatXafAmount(selectedOffer.pricePerYear) }}</p>
          <p class="mt-2 text-sm text-neutral-500">Renews on {{ renewOnLabel }}</p>
        </div>

        <div class="mt-6 space-y-4">
          <label class="block">
            <span class="mb-1 block text-sm font-medium">Domain name</span>
            <input v-model="selectedForm.domainName" class="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none" placeholder="example.com" type="text">
          </label>

          <template v-if="selectedOffer.type === 'vps'">
            <label class="block">
              <span class="mb-1 block text-sm font-medium">Root username</span>
              <input v-model="selectedForm.rootUsername" readonly class="w-full rounded-2xl border border-black/10 bg-neutral-50 px-4 py-3 text-neutral-500 outline-none" placeholder="root" type="text">
            </label>

            <label class="block">
              <span class="mb-1 block text-sm font-medium">Operating system</span>
              <select v-model="selectedForm.operatingSystem" class="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none">
                <option v-for="os in operatingSystems" :key="os" :value="os">{{ os }}</option>
              </select>
            </label>

            <label class="block">
              <span class="mb-1 block text-sm font-medium">Datacenter</span>
              <select v-model="selectedForm.datacenter" class="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none">
                <option v-for="location in datacenters" :key="location" :value="location">{{ location }}</option>
              </select>
            </label>
          </template>
        </div>

        <p v-if="selectedSubmitError" class="mt-4 text-sm text-red-600">{{ selectedSubmitError }}</p>

        <div v-if="selectedSubmitSuccess" class="mt-4 rounded-2xl border border-black/10 p-4 text-sm leading-6 text-neutral-700">
          <p class="font-medium">Thank you, your order has been received.</p>
          <p class="mt-2">Order number: {{ selectedSubmitSuccess.orderNumber }}</p>
          <p class="mt-2">{{ selectedSubmitSuccess.message }}</p>
        </div>

        <div class="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            v-if="!selectedSubmitSuccess"
            class="pill-button"
            type="button"
            @click="submitOrder(selectedOffer)"
          >
            {{ submittingSlug === selectedOffer.slug ? 'Submitting...' : isSignedIn ? 'Submit order' : 'Sign in to order' }}
          </button>

          <button
            class="pill-button pill-button-secondary"
            type="button"
            @click="closeOrderModal"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  createOrderRequest,
  fetchOffers,
  formatOfferPrice,
  formatXafAmount,
  getOfferTypeLabel,
  offerSlugToPricingPath,
  type CreateOrderRequestResponse,
  type Offer,
} from '@/lib/api'
import { cleanRedirectTarget } from '@/lib/auth-redirect'
import { useAppAuth } from '@/lib/auth'
import { initializeMockAuth } from '@/lib/mock-auth'

type OfferFormState = {
  domainName: string
  rootUsername: string
  operatingSystem: string
  datacenter: string
}

const route = useRoute()
const router = useRouter()
const { isLoaded: isAuthLoaded, isSignedIn, getAccessToken } = useAppAuth()

const offers = ref<Offer[]>([])
const isLoading = ref(true)
const loadError = ref('')
const submitErrors = reactive<Record<string, string>>({})
const submitSuccess = reactive<Record<string, CreateOrderRequestResponse['data']>>({})
const forms = reactive<Record<string, OfferFormState>>({})
const submittingSlug = ref('')
const offerRefs = new Map<string, HTMLElement>()

const operatingSystems = ['Ubuntu 24.04 LTS', 'Debian 12', 'AlmaLinux 9']
const datacenters = ['Frankfurt', 'Paris', 'Montreal']

const selectedSlug = computed(() => {
  const typeSlug = typeof route.params.typeSlug === 'string' ? route.params.typeSlug : ''
  const planSlug = typeof route.params.planSlug === 'string' ? route.params.planSlug : ''
  return typeSlug && planSlug ? `${typeSlug}/${planSlug}` : ''
})
const selectedOffer = computed(() => offers.value.find((item) => item.slug === selectedSlug.value) ?? null)
const selectedForm = computed(() => (selectedOffer.value ? forms[selectedOffer.value.slug] ?? null : null))
const selectedSubmitError = computed(() => (selectedOffer.value ? submitErrors[selectedOffer.value.slug] ?? '' : ''))
const selectedSubmitSuccess = computed(() => (selectedOffer.value ? submitSuccess[selectedOffer.value.slug] ?? null : null))

const groupedOffers = computed(() =>
  ['vps', 'shared_hosting'].map((type) => ({
    type,
    label: getOfferTypeLabel(type as Offer['type']),
    offers: offers.value.filter((offer) => offer.type === type),
  })),
)

const renewOnLabel = computed(() => {
  const renewDate = new Date()
  renewDate.setFullYear(renewDate.getFullYear() + 1)
  return renewDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
})

function ensureForm(offer: Offer) {
  if (!forms[offer.slug]) {
    forms[offer.slug] = {
      domainName: '',
      rootUsername: 'root',
      operatingSystem: operatingSystems[0] ?? 'Ubuntu 24.04 LTS',
      datacenter: datacenters[0] ?? 'Frankfurt',
    }
  }
}

function setOfferRef(slug: string, element: Element | unknown) {
  if (element instanceof HTMLElement) {
    offerRefs.set(slug, element)
  }
}

async function loadOffers() {
  isLoading.value = true
  loadError.value = ''

  try {
    const data = await fetchOffers()
    offers.value = data
    data.forEach((offer) => ensureForm(offer))
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Failed to load offers'
  } finally {
    isLoading.value = false
  }
}

async function maybeScrollToSelectedOffer() {
  if (!selectedSlug.value) {
    return
  }

  const offer = selectedOffer.value
  if (!offer) {
    await router.replace('/pricing')
    return
  }

  ensureForm(offer)

  await nextTick()
  const element = offerRefs.get(selectedSlug.value)
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

async function closeOrderModal() {
  if (!selectedSlug.value) {
    return
  }

  await router.push('/pricing')
}

async function submitOrder(offer: Offer) {
  ensureForm(offer)
  submitErrors[offer.slug] = ''
  delete submitSuccess[offer.slug]

  if (!isAuthLoaded.value) {
    submitErrors[offer.slug] = 'Please wait while we verify your session.'
    return
  }

  if (!isSignedIn.value) {
    await router.push({ path: '/sign-in', query: { redirect: cleanRedirectTarget(route.fullPath) } })
    return
  }

  const token = await getAccessToken()
  if (!token) {
    submitErrors[offer.slug] = 'Unable to authenticate your session. Please sign in again.'
    return
  }

  const form = forms[offer.slug]!
  if (!form.domainName.trim()) {
    submitErrors[offer.slug] = 'Domain name is required.'
    return
  }

  if (offer.type === 'vps' && (!form.rootUsername.trim() || !form.operatingSystem || !form.datacenter)) {
    submitErrors[offer.slug] = 'Root username, operating system, and datacenter are required for VPS.'
    return
  }

  submittingSlug.value = offer.slug

  try {
    const response = await createOrderRequest(
      {
        offerId: offer._id,
        offerSlug: offer.slug,
        domainName: form.domainName.trim(),
        rootUsername: offer.type === 'vps' ? form.rootUsername.trim() : undefined,
        operatingSystem: offer.type === 'vps' ? form.operatingSystem : undefined,
        datacenter: offer.type === 'vps' ? form.datacenter : undefined,
      },
      token,
    )

    submitSuccess[offer.slug] = response.data
  } catch (error) {
    submitErrors[offer.slug] = error instanceof Error ? error.message : 'Unable to submit order'
  } finally {
    submittingSlug.value = ''
  }
}

watch(selectedSlug, async () => {
  await maybeScrollToSelectedOffer()
})

onMounted(async () => {
  initializeMockAuth()
  await loadOffers()
  await maybeScrollToSelectedOffer()
})
</script>
