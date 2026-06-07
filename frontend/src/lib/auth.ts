import { apiPost, apiGet, tokenStorage } from './api'
import { AuthResponse, LoginPayload, RegisterPayload, User } from '@/types'

export const authApi = {

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const result = await apiPost<AuthResponse>('/auth/register/', payload)
    tokenStorage.set({ access: result.tokens.access, refresh: result.tokens.refresh })
    return result
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const result = await apiPost<AuthResponse>('/auth/login/', payload)
    tokenStorage.set({ access: result.tokens.access, refresh: result.tokens.refresh })
    return result
  },

  logout: async (): Promise<void> => {
    const refresh = tokenStorage.getRefresh()
    if (refresh) {
      try {
        await apiPost('/auth/logout/', { refresh })
      } catch {
        // Ignore errors — clear tokens regardless
      }
    }
    tokenStorage.clear()
  },

  getMe: async (): Promise<User> => {
    return await apiGet<User>('/auth/me/')
  },

}
