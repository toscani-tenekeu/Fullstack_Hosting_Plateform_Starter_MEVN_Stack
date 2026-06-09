export type OfferType = 'vps' | 'shared_hosting'
export type OfferPlan = 'Go' | 'Plus' | 'Pro' | 'Max'

export type Offer = {
  _id: string
  type: OfferType
  plan: OfferPlan
  slug: string
  pricePerYear: number
  currency: 'XAF'
  features: string[]
}

export type OfferInput = {
  type: OfferType
  plan: OfferPlan
  slug?: string
  pricePerYear: number
  features: string[]
}

export type ListMeta = {
  page: number
  limit: number
  total: number
}

export type ListResponse<T> = {
  data: T[]
  meta: ListMeta
}

export type DataResponse<T> = {
  data: T
}

export type UserProfile = {
  _id: string
  clerkUserId: string
  email: string
  firstName: string
  lastName: string
  imageUrl?: string
  role: 'admin' | 'user'
  credit?: {
    amount: number
    currency: 'XAF'
  }
  debt?: {
    amount: number
    borrowedAt: string | null
    currency: 'XAF'
  }
  address?: {
    line1?: string
    city?: string
    zipCode?: string
    country?: string
  }
  company?: {
    name?: string
  }
  contact?: {
    phone?: string
    whatsappNumber?: string
    reachableEmail?: string
  }
  createdAt?: string
  updatedAt?: string
}

export type AdminProfileUpdateInput = {
  address?: Partial<{
    line1: string
    city: string
    zipCode: string
    country: string
  }>
  company?: Partial<{
    name: string
  }>
  contact?: Partial<{
    phone: string
    whatsappNumber: string
    reachableEmail: string
  }>
}

export type Subscription = {
  _id: string
  userProfileId?: string
  clerkUserId: string
  invoiceNumber: string
  name: string
  type: OfferType | 'custom'
  status: 'active' | 'suspended' | 'expired'
  features: string[]
  billing: {
    amount: number
    interval: 'year' | 'month' | 'custom'
    label?: string
  }
  startDate: string
  endDate: string
  domains: Array<{
    name: string
    type: 'included' | 'purchased'
    price: number
    startDate: string
    endDate: string
    status: 'active' | 'suspended' | 'expired'
  }>
  credentials?: Record<string, string | number | boolean | null>
  vpsCredentials?: {
    rootUsername: string
    rootPassword?: string
  }
  createdAt?: string
  updatedAt?: string
}

export type SubscriptionInput = Omit<Subscription, '_id'>

export type Invoice = {
  _id: string
  userProfileId?: string
  clerkUserId: string
  orderNumber: string
  invoiceNumber: string
  amount: number
  date: string
  userInfo?: {
    clerkUserId?: string
    email?: string
    fullName?: string
    companyName?: string
    phone?: string
    whatsappNumber?: string
    reachableEmail?: string
    address?: {
      line1?: string
      city?: string
      zipCode?: string
      country?: string
    }
  }
  createdAt?: string
  updatedAt?: string
}

export type InvoiceInput = Pick<Invoice, 'clerkUserId' | 'orderNumber' | 'invoiceNumber' | 'amount' | 'date'>

export type UserRequestStatus = 'submitted' | 'contacted' | 'provisioning' | 'completed' | 'cancelled'

export type UserRequest = {
  _id: string
  orderNumber: string
  clerkUserId: string
  offerSlug: string
  offerType: OfferType
  offerPlan: OfferPlan
  pricePerYear: number
  currency: 'XAF'
  domainName: string
  rootUsername?: string
  operatingSystem?: string
  datacenter?: string
  status: UserRequestStatus
  adminNotes: string
  createdAt?: string
  updatedAt?: string
}

export type CreateOrderRequestInput = {
  offerId: string
  offerSlug: string
  domainName: string
  rootUsername?: string
  operatingSystem?: string
  datacenter?: string
}

export type CreateOrderRequestResponse = {
  data: {
    request: {
      _id: string
      orderNumber: string
      offerSlug: string
      status: string
      domainName: string
    }
    orderNumber: string
    message: string
    support: {
      email: string
      whatsapp: string
    }
  }
}

const defaultApiBaseUrl = import.meta.env.DEV && import.meta.env.VITE_E2E_MOCK_AUTH !== '1' ? 'http://localhost:3000' : ''
const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? defaultApiBaseUrl).replace(/\/$/, '')
const apiBaseUrl = configuredApiBaseUrl.endsWith('/api') ? configuredApiBaseUrl.slice(0, -4) : configuredApiBaseUrl

async function parseJson(response: Response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch (error) {
    if (!response.ok) {
      return {
        error: {
          message: `${response.status} ${response.statusText || 'Request failed'}`,
        },
      }
    }

    throw error
  }
}

async function requestJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: 'include',
    ...init,
  })
  const json = await parseJson(response)

  if (!response.ok) {
    throw new Error(json?.error?.message ?? 'Request failed')
  }

  return json as T
}

function authHeader(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  }
}

export async function fetchOffers() {
  const response = await requestJson<ListResponse<Offer>>('/api/offers?limit=100')
  return response.data
}

export async function createOrderRequest(payload: CreateOrderRequestInput, token: string) {
  return requestJson<CreateOrderRequestResponse>('/api/me/order-requests', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export async function fetchSelfProfile(token: string) {
  const response = await requestJson<DataResponse<UserProfile>>('/api/me', {
    headers: authHeader(token),
  })
  return response.data
}

export async function updateSelfProfile(
  payload: {
    address?: Partial<{
      line1: string
      city: string
      zipCode: string
      country: string
    }>
    company?: Partial<{
      name: string
    }>
    contact?: Partial<{
      phone: string
    }>
  },
  token: string,
) {
  const response = await requestJson<DataResponse<UserProfile>>('/api/me/profile', {
    method: 'PATCH',
    headers: {
      ...authHeader(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return response.data
}

export async function fetchSelfSubscriptions(token: string) {
  return requestJson<ListResponse<Subscription>>('/api/me/subscriptions?limit=100', {
    headers: authHeader(token),
  })
}

export async function fetchSelfSubscription(id: string, token: string) {
  const response = await requestJson<DataResponse<Subscription>>(`/api/me/subscriptions/${id}`, {
    headers: authHeader(token),
  })
  return response.data
}

export async function fetchSelfInvoices(token: string) {
  return requestJson<ListResponse<Invoice>>('/api/me/invoices?limit=100', {
    headers: authHeader(token),
  })
}

export async function fetchSelfInvoice(id: string, token: string) {
  const response = await requestJson<DataResponse<Invoice>>(`/api/me/invoices/${id}`, {
    headers: authHeader(token),
  })
  return response.data
}

export async function fetchAdminUsers(token: string) {
  return requestJson<ListResponse<UserProfile>>('/api/admin/users?limit=100', {
    headers: authHeader(token),
  })
}

export async function fetchAdminUser(clerkUserId: string, token: string) {
  const response = await requestJson<DataResponse<UserProfile>>(`/api/admin/users/${clerkUserId}`, {
    headers: authHeader(token),
  })
  return response.data
}

export async function fetchAdminOffers(token: string) {
  return requestJson<ListResponse<Offer>>('/api/admin/offers?limit=100', {
    headers: authHeader(token),
  })
}

export async function fetchAdminOffer(id: string, token: string) {
  const response = await requestJson<DataResponse<Offer>>(`/api/admin/offers/${id}`, {
    headers: authHeader(token),
  })
  return response.data
}

export async function fetchAdminSubscriptions(token: string) {
  return requestJson<ListResponse<Subscription>>('/api/admin/subscriptions?limit=100', {
    headers: authHeader(token),
  })
}

export async function fetchAdminSubscription(id: string, token: string) {
  const response = await requestJson<DataResponse<Subscription>>(`/api/admin/subscriptions/${id}`, {
    headers: authHeader(token),
  })
  return response.data
}

export async function fetchAdminInvoices(token: string) {
  return requestJson<ListResponse<Invoice>>('/api/admin/invoices?limit=100', {
    headers: authHeader(token),
  })
}

export async function fetchAdminInvoice(id: string, token: string) {
  const response = await requestJson<DataResponse<Invoice>>(`/api/admin/invoices/${id}`, {
    headers: authHeader(token),
  })
  return response.data
}

export async function fetchAdminUserRequests(token: string) {
  return requestJson<ListResponse<UserRequest>>('/api/admin/user-requests?limit=100', {
    headers: authHeader(token),
  })
}

export async function fetchAdminUserRequest(id: string, token: string) {
  const response = await requestJson<DataResponse<UserRequest>>(`/api/admin/user-requests/${id}`, {
    headers: authHeader(token),
  })
  return response.data
}

export async function updateAdminUserProfile(clerkUserId: string, payload: AdminProfileUpdateInput, token: string) {
  const response = await requestJson<DataResponse<UserProfile>>(`/api/admin/users/${clerkUserId}/profile`, {
    method: 'PATCH',
    headers: {
      ...authHeader(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return response.data
}

export async function updateAdminUserRole(clerkUserId: string, role: UserProfile['role'], token: string) {
  const response = await requestJson<DataResponse<UserProfile>>(`/api/admin/users/${clerkUserId}/role`, {
    method: 'PATCH',
    headers: {
      ...authHeader(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role }),
  })
  return response.data
}

export async function setAdminUserCredit(clerkUserId: string, amount: number, token: string) {
  const response = await requestJson<DataResponse<UserProfile>>(`/api/admin/users/${clerkUserId}/credit`, {
    method: 'PATCH',
    headers: {
      ...authHeader(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  })
  return response.data
}

export async function addAdminUserCredit(clerkUserId: string, amount: number, token: string) {
  const response = await requestJson<DataResponse<UserProfile>>(`/api/admin/users/${clerkUserId}/credit/add`, {
    method: 'POST',
    headers: {
      ...authHeader(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  })
  return response.data
}

export async function subtractAdminUserCredit(clerkUserId: string, amount: number, token: string) {
  const response = await requestJson<DataResponse<UserProfile>>(`/api/admin/users/${clerkUserId}/credit/subtract`, {
    method: 'POST',
    headers: {
      ...authHeader(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  })
  return response.data
}

export async function setAdminUserDebt(
  clerkUserId: string,
  payload: { amount: number; borrowedAt?: string | null },
  token: string,
) {
  const response = await requestJson<DataResponse<UserProfile>>(`/api/admin/users/${clerkUserId}/debt`, {
    method: 'PATCH',
    headers: {
      ...authHeader(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return response.data
}

export async function resyncAdminUser(clerkUserId: string, token: string) {
  const response = await requestJson<DataResponse<UserProfile>>(`/api/admin/users/${clerkUserId}/resync`, {
    method: 'POST',
    headers: authHeader(token),
  })
  return response.data
}

export async function createAdminOffer(payload: OfferInput, token: string) {
  const response = await requestJson<DataResponse<Offer>>('/api/admin/offers', {
    method: 'POST',
    headers: {
      ...authHeader(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return response.data
}

export async function updateAdminOffer(id: string, payload: Partial<OfferInput>, token: string) {
  const response = await requestJson<DataResponse<Offer>>(`/api/admin/offers/${id}`, {
    method: 'PATCH',
    headers: {
      ...authHeader(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return response.data
}

export async function deleteAdminOffer(id: string, token: string) {
  await requestJson<DataResponse<{ deleted: boolean; resource: Offer }>>(`/api/admin/offers/${id}`, {
    method: 'DELETE',
    headers: authHeader(token),
  })
}

export async function createAdminSubscription(payload: SubscriptionInput, token: string) {
  const response = await requestJson<DataResponse<Subscription>>('/api/admin/subscriptions', {
    method: 'POST',
    headers: {
      ...authHeader(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return response.data
}

export async function updateAdminSubscription(id: string, payload: Partial<SubscriptionInput>, token: string) {
  const response = await requestJson<DataResponse<Subscription>>(`/api/admin/subscriptions/${id}`, {
    method: 'PATCH',
    headers: {
      ...authHeader(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return response.data
}

export async function deleteAdminSubscription(id: string, token: string) {
  await requestJson<DataResponse<{ deleted: boolean; resource: Subscription }>>(`/api/admin/subscriptions/${id}`, {
    method: 'DELETE',
    headers: authHeader(token),
  })
}

export async function createAdminInvoice(payload: InvoiceInput, token: string) {
  const response = await requestJson<DataResponse<Invoice>>('/api/admin/invoices', {
    method: 'POST',
    headers: {
      ...authHeader(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return response.data
}

export async function updateAdminInvoice(id: string, payload: Partial<InvoiceInput>, token: string) {
  const response = await requestJson<DataResponse<Invoice>>(`/api/admin/invoices/${id}`, {
    method: 'PATCH',
    headers: {
      ...authHeader(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return response.data
}

export async function deleteAdminInvoice(id: string, token: string) {
  await requestJson<DataResponse<{ deleted: boolean; resource: Invoice }>>(`/api/admin/invoices/${id}`, {
    method: 'DELETE',
    headers: authHeader(token),
  })
}

export async function updateAdminUserRequest(
  id: string,
  payload: Partial<Pick<UserRequest, 'status' | 'adminNotes'>>,
  token: string,
) {
  const response = await requestJson<DataResponse<UserRequest>>(`/api/admin/user-requests/${id}`, {
    method: 'PATCH',
    headers: {
      ...authHeader(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return response.data
}

export function offerSlugToPricingPath(slug: string) {
  return `/pricing/${slug}`
}

export function formatXafAmount(value: number) {
  return `${value.toLocaleString('en-US')} XAF`
}

export function formatOfferPrice(offer: Offer) {
  if (offer.type === 'vps') {
    return `${(offer.pricePerYear / 12).toLocaleString('en-US')} x 12 XAF`
  }

  return formatXafAmount(offer.pricePerYear)
}

export function getOfferTypeLabel(type: OfferType) {
  return type === 'shared_hosting' ? 'Shared Hosting' : 'VPS'
}

export function formatDate(value?: string) {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not set'
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatSubscriptionBilling(subscription: Subscription) {
  if (subscription.billing.interval === 'custom') {
    return subscription.billing.label || formatXafAmount(subscription.billing.amount)
  }

  return `${formatXafAmount(subscription.billing.amount)} / ${subscription.billing.interval}`
}

export function getSubscriptionTypeLabel(type: Subscription['type']) {
  if (type === 'shared_hosting') return 'Shared Hosting'
  if (type === 'vps') return 'VPS'
  return 'Custom'
}
