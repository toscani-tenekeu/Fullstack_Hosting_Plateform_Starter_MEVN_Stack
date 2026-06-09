import { clerkPlugin } from '@clerk/vue'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import App from './App.vue'
import './styles.css'
import AdminDashboardPage from './pages/AdminDashboardPage.vue'
import DashboardPage from './pages/DashboardPage.vue'
import DocsPage from './pages/DocsPage.vue'
import HomePage from './pages/HomePage.vue'
import LoginPage from './pages/LoginPage.vue'
import PricingPage from './pages/PricingPage.vue'
import PrivacyPage from './pages/PrivacyPage.vue'
import TermsPage from './pages/TermsPage.vue'
import { cleanRedirectTarget } from './lib/auth-redirect'
import { clerkConfigured, clerkPublishableKey } from './lib/auth'
import { initializeMockAuth, mockAuthEnabled, mockSignedIn } from './lib/mock-auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/pricing', component: PricingPage },
    { path: '/pricing/:typeSlug/:planSlug', component: PricingPage },
    { path: '/docs', component: DocsPage },
    { path: '/user/dashboard', redirect: '/user/dashboard/overview' },
    { path: '/user/dashboard/:pathMatch(.*)*', component: DashboardPage, meta: { requiresAuth: true } },
    { path: '/dashboard', redirect: '/user/dashboard/overview' },
    { path: '/admin', redirect: '/admin/dashboard' },
    { path: '/admin/dashboard', component: AdminDashboardPage, meta: { requiresAuth: true } },
    { path: '/admin/dashboard/:pathMatch(.*)*', component: AdminDashboardPage, meta: { requiresAuth: true } },
    { path: '/admin/dashbaord', redirect: '/admin/dashboard' },
    { path: '/privacy-policy', component: PrivacyPage },
    { path: '/terms-of-service', component: TermsPage },
    { path: '/privacy', redirect: '/privacy-policy' },
    { path: '/terms', redirect: '/terms-of-service' },
    { path: '/sign-in', component: LoginPage },
    { path: '/sign-in/:pathMatch(.*)*', component: LoginPage },
    { path: '/sign-up', component: LoginPage },
    { path: '/sign-up/:pathMatch(.*)*', component: LoginPage },
    { path: '/login', redirect: '/sign-in' },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

initializeMockAuth()

router.beforeEach((to) => {
  initializeMockAuth()

  if (!mockAuthEnabled.value) {
    return true
  }

  if (to.meta.requiresAuth && !mockSignedIn.value) {
    return {
      path: '/sign-in',
      query: { redirect: cleanRedirectTarget(to.fullPath) },
    }
  }

  if ((to.path.startsWith('/sign-in') || to.path.startsWith('/sign-up')) && mockSignedIn.value) {
    const redirect = typeof to.query.redirect === 'string' && to.query.redirect.startsWith('/') ? to.query.redirect : '/user/dashboard/overview'
    return cleanRedirectTarget(redirect)
  }

  return true
})

const app = createApp(App)

if (clerkConfigured) {
  app.use(clerkPlugin, {
    publishableKey: clerkPublishableKey,
    signInUrl: '/sign-in',
    signUpUrl: '/sign-up',
  })
}

app.use(router).mount('#app')
