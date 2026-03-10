import { clearAllAuthCookies } from '@/lib/auth'
import { apiSuccess, apiServerError } from '@/lib/api'

export async function POST() {
  try {
    await clearAllAuthCookies()
    return apiSuccess()
  } catch (error) {
    return apiServerError('Logout error', error)
  }
}
