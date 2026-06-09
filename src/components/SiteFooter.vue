<template>
  <footer class="border-t border-black/10">
    <div class="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 text-sm text-neutral-500 sm:px-6 md:flex-row md:items-center md:justify-between">
      <div class="max-w-sm">
        <div class="flex items-center gap-3">
          <img :src="logoUrl" alt="Project logo" class="h-16 w-16 bg-white md:h-20 md:w-20">
          <p class="font-medium text-black">Hosting Starter</p>
        </div>
        <p class="mt-2">
          Free starter template for building a hosting platform.
          Main contribution by
          <a href="https://toscani-tenekeu.com" target="_blank" rel="noreferrer" class="text-black hover:underline">
            Toscani TENEKEU
          </a>.
        </p>
        <p class="mt-2">
          Website:
          <a href="https://toscani-tenekeu.com" target="_blank" rel="noreferrer" class="text-black hover:underline">
            toscani-tenekeu.com
          </a>
        </p>
        <p class="mt-2">Copyright {{ currentYear }}. All rights reserved.</p>
      </div>
      <div class="flex flex-col gap-4 md:items-end">
        <div class="flex flex-wrap items-center gap-2">
          <a href="https://www.youtube.com/@toscani_tenekeu_fr" target="_blank" rel="noreferrer" aria-label="YouTube" class="social-icon">
            <Icon icon="simple-icons:youtube" class="h-4 w-4" />
          </a>
          <a href="https://linkedin.com/in/toscani-tenekeu" target="_blank" rel="noreferrer" aria-label="LinkedIn" class="social-icon">
            <Icon icon="simple-icons:linkedin" class="h-4 w-4" />
          </a>
          <a href="https://github.com/toscani-tenekeu" target="_blank" rel="noreferrer" aria-label="GitHub" class="social-icon">
            <Icon icon="simple-icons:github" class="h-4 w-4" />
          </a>
        </div>
        <div class="flex flex-wrap items-center gap-4">
          <RouterLink to="/privacy-policy" class="hover:text-black">Privacy</RouterLink>
          <RouterLink to="/terms-of-service" class="hover:text-black">Terms</RouterLink>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

// Replace with your logo URL here.
const logoUrl = 'https://vuejs.org/images/logo.png'
const currentYear = new Date().getFullYear()
</script>
