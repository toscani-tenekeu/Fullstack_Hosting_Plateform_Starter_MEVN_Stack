import { useAuth, useClerk, useUser } from '@clerk/vue'
import { computed, type ComputedRef } from 'vue'

import { mockAuthEnabled, mockSignedIn } from './mock-auth'

export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? ''
export const clerkConfigured = clerkPublishableKey.length > 0

const defaultApiBaseUrl = import.meta.env.DEV && import.meta.env.VITE_E2E_MOCK_AUTH !== '1' ? 'http://localhost:3000' : ''
const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? defaultApiBaseUrl).replace(/\/$/, '')
const apiBaseUrl = configuredApiBaseUrl.endsWith('/api') ? configuredApiBaseUrl.slice(0, -4) : configuredApiBaseUrl

let cachedDevToken: string | null = null
let cachedDevTokenExpiresAt = 0
let pendingDevToken: Promise<string | null> | null = null

type PublicUser = {
  fullName?: string | null
  firstName?: string | null
  primaryEmailAddress?: {
    emailAddress?: string | null
  } | null
}

const emptyUser = computed<PublicUser | null>(() => null)

function getClerkBrowserSessionToken() {
  const clerkInstance = typeof window !== 'undefined' ? (window as typeof window & { Clerk?: any }).Clerk : undefined
  return clerkInstance?.session?.getToken ? clerkInstance.session.getToken({ skipCache: true }) : null
}

async function fetchDevToken(browserToken: string | null) {
  const response = await fetch(`${apiBaseUrl}/api/dev/token?expiresInSeconds=1800`, {
    credentials: 'include',
    headers: browserToken ? { Authorization: `Bearer ${browserToken}` } : undefined,
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    return null
  }

  const token = typeof body?.data?.token === 'string' ? body.data.token : ''
  if (!token) {
    return null
  }

  const expiresAt = typeof body?.data?.expiresAt === 'string' ? Date.parse(body.data.expiresAt) : Number.NaN
  cachedDevToken = token
  cachedDevTokenExpiresAt = Number.isFinite(expiresAt)
    ? expiresAt
    : Date.now() + ((Number(body?.data?.expiresInSeconds) || 1800) * 1000)
  return cachedDevToken
}

async function getDevAccessToken() {
  if (!import.meta.env.DEV || import.meta.env.VITE_E2E_MOCK_AUTH === '1') {
    return null
  }

  if (cachedDevToken && cachedDevTokenExpiresAt - Date.now() > 30_000) {
    return cachedDevToken
  }

  if (!pendingDevToken) {
    pendingDevToken = Promise.resolve(getClerkBrowserSessionToken())
      .then((browserToken) => fetchDevToken(browserToken))
      .finally(() => {
        pendingDevToken = null
      })
  }

  return pendingDevToken
}

export function useAppAuth() {
  const auth = clerkConfigured ? useAuth() : null
  const clerk = clerkConfigured ? useClerk() : null
  const clerkUser = clerkConfigured ? useUser().user : emptyUser

  const isLoaded = computed(() => {
    if (mockAuthEnabled.value) {
      return true
    }

    if (!clerkConfigured) {
      return true
    }

    return Boolean(auth?.isLoaded.value)
  })

  const isSignedIn = computed(() => {
    if (mockAuthEnabled.value) {
      return mockSignedIn.value
    }

    if (!clerkConfigured) {
      return false
    }

    return Boolean(auth?.isSignedIn.value)
  })

  async function getAccessToken() {
    if (mockAuthEnabled.value) {
      return mockSignedIn.value ? 'user-token' : null
    }

    if (!clerkConfigured) {
      return null
    }

    const devToken = await getDevAccessToken()
    if (devToken) {
      return devToken
    }

    const browserToken = await getClerkBrowserSessionToken()
    if (browserToken) {
      return browserToken
    }

    const token = typeof auth?.getToken.value === 'function' ? await auth.getToken.value({ skipCache: true }) : null
    if (token) {
      return token
    }

    return clerk?.value?.session ? clerk.value.session.getToken({ skipCache: true }) : null
  }

  return {
    clerkConfigured,
    isLoaded,
    isSignedIn,
    user: clerkUser as ComputedRef<PublicUser | null>,
    getAccessToken,
  }
}
