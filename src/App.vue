<template>
  <div class="min-h-screen bg-white text-black">
    <SiteHeader />
    <router-view />
    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import SiteFooter from '@/components/SiteFooter.vue'
import SiteHeader from '@/components/SiteHeader.vue'
</script>
