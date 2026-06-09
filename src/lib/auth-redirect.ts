export function cleanRedirectTarget(path: string) {
  const [pathname = '/', query = ''] = path.split('?')
  const params = new URLSearchParams(query)

  for (const key of Array.from(params.keys())) {
    if (key.startsWith('__clerk')) {
      params.delete(key)
    }
  }

  const cleanedQuery = params.toString()
  return cleanedQuery ? `${pathname}?${cleanedQuery}` : pathname
}
