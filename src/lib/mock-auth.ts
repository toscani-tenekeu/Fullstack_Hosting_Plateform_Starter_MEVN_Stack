import { ref } from 'vue'

const storageKey = 'hosting-starter-mock-auth'
const enableKey = 'hosting-starter-force-mock-auth'

export const mockAuthEnabled = ref(import.meta.env.VITE_E2E_MOCK_AUTH === '1')
export const mockSignedIn = ref(false)

export function initializeMockAuth() {
  if (typeof window === 'undefined') {
    return
  }

  if (window.localStorage.getItem(enableKey) === '1') {
    mockAuthEnabled.value = true
  }

  if (!mockAuthEnabled.value) {
    return
  }

  mockSignedIn.value = window.localStorage.getItem(storageKey) === '1'
}

export function enableMockAuth() {
  mockAuthEnabled.value = true
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(enableKey, '1')
  }
}

export function signInMock() {
  enableMockAuth()
  mockSignedIn.value = true
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(storageKey, '1')
  }
}

export function signOutMock() {
  mockSignedIn.value = false
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(storageKey)
  }
}
