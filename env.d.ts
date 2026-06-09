/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string
  readonly VITE_E2E_MOCK_AUTH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
