'use client'

import { useEffect, useState } from 'react'
import { analyticsApi, gamificationApi } from '@/lib/analytics'
import { DashboardMetrics, UserXP } from '@/types'
import { useAuthStore } from '@/store/auth.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Zap, Flame, Trophy, Star, TrendingUp, CheckCircle2 } from 'lucide-react'

function MetricCard({
  label, value, sub, icon: Icon, color = 'text-primary',
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color?: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
              {label}
            </p>
            <p className="text-2xl font-black text-foreground font-mono">{value}</p>
            {sub && <p className={`text-xs mt-1 ${color}`}>{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg bg-primary/10 ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const user                          = useAuthStore((s) => s.user)
  const [metrics, setMetrics]         = useState<DashboardMetrics | null>(null)
  const [userXp, setUserXp]           = useState<UserXP | null>(null)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [m, xp] = await Promise.all([
          analyticsApi.dashboard(),
          gamificationApi.xp(),
        ])
        setMetrics(m)
        setUserXp(xp)
      } catch {
        // silently fail — metrics are non-critical
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">
            {greeting()}, {user?.first_name || user?.username} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here's what's happening with your habits today.
          </p>
        </div>
        {userXp?.current_level && (
          <Badge
            className="text-xs px-3 py-1"
            style={{ background: userXp.current_level.color + '22', color: userXp.current_level.color, border: `1px solid ${userXp.current_level.color}44` }}
          >
            {userXp.current_level.icon} {userXp.current_level.title}
          </Badge>
        )}
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Active Habits"   value={metrics.active_habits}        sub={`${metrics.remaining_today} remaining today`} icon={Zap} />
          <MetricCard label="Best Streak"     value={`${metrics.best_streak?.current ?? 0}d`} sub={metrics.best_streak?.habit ?? '—'} icon={Flame} color="text-orange-400" />
          <MetricCard label="Completion Rate" value={`${metrics.completion_rate_7d}%`}         sub="last 7 days"                      icon={TrendingUp} color="text-green-400" />
          <MetricCard label="Total XP"        value={metrics.total_xp.toLocaleString()}         sub="all time"                         icon={Star} color="text-yellow-400" />
        </div>
      ) : null}

      {/* XP Level Progress */}
      {userXp && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Level Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{userXp.current_level?.icon ?? '🌱'}</span>
                <span className="font-bold text-foreground">
                  {userXp.current_level?.title ?? 'Beginner'}
                </span>
              </div>
              <span className="text-sm text-muted-foreground font-mono">
                {userXp.total_xp.toLocaleString()} XP
              </span>
            </div>
            <Progress value={userXp.level_progress_pct} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{userXp.level_progress_pct.toFixed(0)}% to next level</span>
              <span>{userXp.xp_to_next_level.toLocaleString()} XP needed</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today summary */}
      {metrics && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="text-foreground font-semibold">
                  {metrics.completed_today} completed
                </span>
              </div>
              <div className="text-muted-foreground text-sm">
                {metrics.remaining_today > 0
                  ? `${metrics.remaining_today} habit${metrics.remaining_today > 1 ? 's' : ''} remaining`
                  : '🎉 All done for today!'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
