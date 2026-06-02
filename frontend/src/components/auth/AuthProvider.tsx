'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { authApi } from '@/lib/auth'
import { tokenStorage } from '@/lib/api'

/**
 * Runs once on app load.
 * If an access token exists in localStorage, fetch the current user
 * and hydrate the auth store. If token is invalid, clear everything.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, logout } = useAuthStore()

  useEffect(() => {
    const hydrate = async () => {
      const token = tokenStorage.getAccess()
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const user = await authApi.getMe()
        setUser(user)
      } catch {
        logout()
      }
    }
    hydrate()
  }, [setUser, setLoading, logout])

  return <>{children}</>
}
