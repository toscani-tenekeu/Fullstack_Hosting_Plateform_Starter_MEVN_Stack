import { describe, expect, it } from 'vitest'

import { cleanRedirectTarget } from '@/lib/auth-redirect'

describe('cleanRedirectTarget', () => {
  it('removes Clerk internal query parameters and keeps the target path', () => {
    expect(cleanRedirectTarget('/user/dashboard/overview?__clerk_db_jwt=abc&tab=billing')).toBe('/user/dashboard/overview?tab=billing')
  })

  it('keeps clean paths unchanged', () => {
    expect(cleanRedirectTarget('/pricing/vps/pro')).toBe('/pricing/vps/pro')
  })
})
