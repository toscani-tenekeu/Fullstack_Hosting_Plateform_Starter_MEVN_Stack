<template>
  <main class="mx-auto max-w-4xl px-4 py-16 sm:px-6">
    <div class="mx-auto max-w-xl">
      <p class="text-xs tracking-[0.22em] text-neutral-500">{{ authLabel }}</p>
      <h1 class="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">{{ authTitle }}</h1>

      <p v-if="!isAuthLoaded" class="mt-8 text-sm text-neutral-500">Loading session...</p>

      <p v-else-if="isSignedIn" class="mt-8 text-sm text-neutral-500">Redirecting...</p>

      <div v-else-if="mockAuthEnabled && isSignInView" class="mt-8">
        <p class="text-sm leading-6 text-neutral-600">
          Demo login is enabled for end-to-end runs.
        </p>
        <div class="mt-6 flex flex-col gap-3 sm:flex-row">
          <button class="pill-button" type="button" @click="continueWithMockAuth">
            Continue as demo user
          </button>
          <button class="pill-button pill-button-secondary" type="button" @click="continueWithMockAuth">
            Continue as test user
          </button>
        </div>
      </div>

      <div v-else-if="!clerkConfigured" class="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
        Clerk is not configured. Set <code>VITE_CLERK_PUBLISHABLE_KEY</code> in the client environment, then restart Vite.
      </div>

      <div v-else class="mt-8">
        <SignIn
          v-if="isSignInView"
          path="/sign-in"
          routing="path"
          :appearance="appearance"
          :sign-up-url="`/sign-up?redirect=${encodeURIComponent(redirectTo)}`"
          :force-redirect-url="redirectTo"
          :fallback-redirect-url="redirectTo"
        />

        <SignUp
          v-else
          path="/sign-up"
          routing="path"
          :appearance="appearance"
          :sign-in-url="`/sign-in?redirect=${encodeURIComponent(redirectTo)}`"
          :force-redirect-url="redirectTo"
          :fallback-redirect-url="redirectTo"
        />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { SignIn, SignUp } from '@clerk/vue'
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { cleanRedirectTarget } from '@/lib/auth-redirect'
import { clerkConfigured, useAppAuth } from '@/lib/auth'
import { initializeMockAuth, mockAuthEnabled, signInMock } from '@/lib/mock-auth'

const route = useRoute()
const router = useRouter()
const { isLoaded: isAuthLoaded, isSignedIn } = useAppAuth()

const isSignUpView = computed(() => route.path.startsWith('/sign-up'))
const isSignInView = computed(() => !isSignUpView.value)
const authLabel = computed(() => (isSignInView.value ? 'Sign In' : 'Sign Up'))
const authTitle = computed(() => (isSignInView.value ? 'Sign in to continue.' : 'Create your account.'))
const appearance = {
  elements: {
    card: 'shadow-none border-0 bg-transparent p-0',
    rootBox: 'w-full',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    socialButtonsBlockButton:
      'rounded-2xl border border-black/10 bg-white text-black shadow-none hover:bg-neutral-50',
    formButtonPrimary: 'rounded-2xl bg-black text-white shadow-none hover:bg-neutral-900',
    formFieldInput: 'rounded-2xl border border-black/10 bg-white shadow-none',
    footerActionLink: 'text-black',
    dividerLine: 'bg-black/10',
    dividerText: 'text-neutral-400',
  },
}
const redirectTo = computed(() =>
  typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
    ? cleanRedirectTarget(route.query.redirect)
    : '/user/dashboard/overview',
)

watch([isAuthLoaded, isSignedIn], () => {
  initializeMockAuth()

  if (isAuthLoaded.value && isSignedIn.value) {
    void router.replace(redirectTo.value)
  }
}, { immediate: true })

function continueWithMockAuth() {
  signInMock()
  void router.replace(redirectTo.value)
}
</script>
