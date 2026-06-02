/**
 * Global auth state — user, tokens, login/logout actions.
 * Persisted to localStorage via tokenStorage.
 */
import { create } from 'zustand'
import { User } from '@/types'
import { tokenStorage } from '@/lib/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user:            null,
  isAuthenticated: false,
  isLoading:       true,  // true until we've checked localStorage

  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
    isLoading: false,
  }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () => {
    tokenStorage.clearTokens()
    set({ user: null, isAuthenticated: false, isLoading: false })
  },
}))
