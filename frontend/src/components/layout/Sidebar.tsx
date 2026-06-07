'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Zap,
  BarChart2,
  Users,
  Trophy,
  Settings,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { authApi } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const NAV = [
  { label: 'Dashboard',    href: '/dashboard',    icon: LayoutDashboard },
  { label: 'Habits',       href: '/habits',        icon: Zap },
  { label: 'Analytics',    href: '/analytics',     icon: BarChart2 },
  { label: 'Social',       href: '/social',        icon: Users },
  { label: 'Leaderboard',  href: '/leaderboard',   icon: Trophy },
  { label: 'Settings',     href: '/settings',      icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const user     = useAuthStore((s) => s.user)
  const logout   = useAuthStore((s) => s.logout)

  const handleLogout = async () => {
    await authApi.logout()
    logout()
    toast.success('Logged out successfully')
    router.replace('/login')
  }

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-card border-r border-border px-3 py-4 shrink-0">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-black text-sm">
          🔥
        </div>
        <div>
          <div className="text-sm font-black tracking-tight text-foreground">HabitForge</div>
          <div className="text-[10px] text-primary font-mono font-semibold tracking-widest">NGP v5.0</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="border-t border-border pt-3 mt-3">
        <div className="px-3 py-2 mb-1">
          <div className="text-sm font-semibold text-foreground truncate">
            {user?.username}
          </div>
          <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
