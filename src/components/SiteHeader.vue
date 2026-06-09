<template>
  <header class="sticky top-0 z-50 border-b border-black/10 bg-white/90 backdrop-blur">
    <div class="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
      <RouterLink to="/" class="flex items-center gap-3">
        <img :src="logoUrl" alt="Project logo" class="h-11 w-11 bg-white">
        <span class="text-sm font-medium tracking-tight text-black">Hosting Starter</span>
      </RouterLink>

      <nav class="flex flex-wrap items-center gap-2 md:justify-center">
        <RouterLink class="nav-link" to="/">Home</RouterLink>
        <RouterLink class="nav-link" to="/pricing">Pricing</RouterLink>
        <RouterLink class="nav-link" to="/docs">Docs</RouterLink>
      </nav>

      <div class="flex flex-wrap items-center gap-2 md:justify-end">
        <template v-if="isSignedIn">
          <RouterLink to="/user/dashboard" class="pill-button pill-button-secondary">Dashboard</RouterLink>

          <div v-if="mockAuthEnabled" class="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-black text-sm font-medium text-white">
            {{ mockInitial }}
          </div>

          <UserButton
            v-else-if="clerkConfigured"
            :appearance="{
              elements: {
                userButtonAvatarBox: 'h-11 w-11 border border-black/10',
                userButtonTrigger: 'rounded-full',
              },
            }"
            after-sign-out-url="/"
          />
        </template>

        <template v-else>
          <RouterLink to="/sign-in" class="pill-button pill-button-secondary">Sign In</RouterLink>
          <RouterLink to="/pricing" class="pill-button">Get started</RouterLink>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { UserButton } from '@clerk/vue'
import { computed } from 'vue'

import { clerkConfigured, useAppAuth } from '@/lib/auth'
import { mockAuthEnabled } from '@/lib/mock-auth'

const { isSignedIn, user } = useAppAuth()
// Replace with your logo URL here.
const logoUrl = 'https://vuejs.org/images/logo.png'

const mockInitial = computed(() => user.value?.firstName?.charAt(0).toUpperCase() || 'D')
</script>
