/**
 * Frontend API client — eliminates repeated fetch() boilerplate.
 *
 * Usage:
 *   const data = await api.get('/api/client/dashboard')
 *   const data = await api.post('/api/orders', { clientId, items })
 *   const data = await api.patch('/api/client/items', { id, active: false })
 *   const data = await api.delete('/api/client/items?id=123')
 *   const data = await api.post('/api/client/menu-scan', formData)  // FormData auto-detected
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ApiResponse {
  success: boolean
  data?: any
  error?: string
  [key: string]: any
}

interface FetchOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

async function apiFetch(url: string, options?: FetchOptions): Promise<ApiResponse> {
  const isFormData = typeof FormData !== 'undefined' && options?.body instanceof FormData

  const response = await fetch(url, {
    method: options?.method,
    headers: isFormData
      ? options?.headers
      : { 'Content-Type': 'application/json', ...options?.headers },
    body: isFormData
      ? (options.body as FormData)
      : options?.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
  })

  return response.json()
}

export const api = {
  get: (url: string) => apiFetch(url),
  post: (url: string, body?: unknown) => apiFetch(url, { method: 'POST', body }),
  patch: (url: string, body?: unknown) => apiFetch(url, { method: 'PATCH', body }),
  delete: (url: string, body?: unknown) => apiFetch(url, { method: 'DELETE', body }),
}
