<template>
  <main>
    <section class="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <div class="max-w-3xl">
        <p class="mb-4 text-xs font-medium tracking-[0.22em] text-neutral-500">
          Free starter template for hosting platforms
        </p>
        <h1 class="text-4xl font-medium tracking-tight sm:text-5xl md:text-7xl">
          Starter kit for VPS and shared hosting platforms
        </h1>
        <p class="mt-6 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8">
          Use this project as a sample base for pricing pages, customer portals, admin operations,
          subscriptions, invoices, and authenticated order requests.
        </p>
        <div class="mt-8 flex flex-col gap-3 sm:flex-row">
          <RouterLink to="/pricing" class="pill-button">View pricing</RouterLink>
          <RouterLink to="/dashboard" class="pill-button pill-button-secondary">Open dashboard</RouterLink>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-6 sm:pb-32 sm:pt-12">
      <p class="text-xs tracking-[0.22em] text-neutral-500">Why choose us</p>
      <h2 class="mt-3 text-2xl font-medium sm:text-3xl">A hosting stack that stays simple.</h2>

      <div class="mt-8 grid gap-4 sm:grid-cols-3">
        <div v-for="item in features" :key="item.step" class="rounded-2xl border border-black/10 p-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
            <Icon icon="mdi:check" class="h-4 w-4" />
          </div>
          <p class="mt-4 text-sm font-medium text-neutral-500">Step {{ item.step }}</p>
          <h3 class="mt-1 text-base font-medium">{{ item.title }}</h3>
          <p class="mt-2 text-sm leading-6 text-neutral-600">{{ item.body }}</p>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
      <RouterLink to="/pricing" class="pill-button">View pricing</RouterLink>
    </section>
  </main>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

const features = [
  { step: '1', title: 'Launch faster', body: 'A clean setup that does not fight your content.' },
  { step: '2', title: 'Stay covered', body: 'SSL, domain, bandwidth, and subdomains included.' },
  { step: '3', title: 'Scale later', body: 'Move from shared hosting to VPS without changing style.' },
]
</script>
