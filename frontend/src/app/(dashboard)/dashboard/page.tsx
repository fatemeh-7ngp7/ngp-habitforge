'use client'

import { useDashboard, useXP } from '@/hooks/use-habits'
import { useAuthStore } from '@/store/auth.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Zap, Flame, Trophy, Star, TrendingUp, CheckCircle2 } from 'lucide-react'

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, icon: Icon, color = 'text-primary', loading,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color?: string
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user                              = useAuthStore((s) => s.user)
  const { data: metrics, isLoading: ml } = useDashboard()
  const { data: userXp,  isLoading: xl } = useXP()

  const loading = ml || xl

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  // Derive values — handle both backend shapes safely
  const activeHabits     = metrics?.active_habits     ?? metrics?.total_habits     ?? 0
  const bestStreakDays   = metrics?.best_streak?.current ?? metrics?.longest_streak  ?? 0
  const bestStreakHabit  = metrics?.best_streak?.habit   ?? '—'
  const completionRate   = metrics?.completion_rate_7d   ?? 0
  const totalXp          = userXp?.total_xp              ?? metrics?.total_xp        ?? 0
  const remainingToday   = metrics?.remaining_today      ?? 0
  const completedToday   = metrics?.completed_today      ?? 0
  const levelTitle       = userXp?.current_level?.title  ?? 'Beginner'
  const levelIcon        = userXp?.current_level?.icon   ?? '🌱'
  const levelColor       = userXp?.current_level?.color  ?? '#E8400C'
  const progressPct      = userXp?.level_progress_pct    ?? 0
  const xpToNext         = userXp?.xp_to_next_level      ?? 0

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">
            {greeting()}, {user?.username} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here's what's happening with your habits today.
          </p>
        </div>
        {userXp?.current_level && (
          <Badge
            className="text-xs px-3 py-1"
            style={{
              background: `${levelColor}22`,
              color: levelColor,
              border: `1px solid ${levelColor}44`,
            }}
          >
            {levelIcon} {levelTitle}
          </Badge>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Active Habits"
          value={activeHabits}
          sub={`${remainingToday} remaining today`}
          icon={Zap}
          loading={loading}
        />
        <MetricCard
          label="Best Streak"
          value={`${bestStreakDays}d`}
          sub={bestStreakHabit}
          icon={Flame}
          color="text-orange-400"
          loading={loading}
        />
        <MetricCard
          label="Completion Rate"
          value={`${completionRate}%`}
          sub="last 7 days"
          icon={TrendingUp}
          color="text-green-400"
          loading={loading}
        />
        <MetricCard
          label="Total XP"
          value={totalXp.toLocaleString()}
          sub="all time"
          icon={Star}
          color="text-yellow-400"
          loading={loading}
        />
      </div>

      {/* XP Level Progress */}
      {(xl || userXp) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Level Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {xl ? (
              <Skeleton className="h-16 w-full" />
            ) : userXp ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{levelIcon}</span>
                    <span className="font-bold text-foreground">{levelTitle}</span>
                  </div>
                  <span className="text-sm text-muted-foreground font-mono">
                    {userXp.total_xp.toLocaleString()} XP
                  </span>
                </div>
                <Progress value={progressPct} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{progressPct.toFixed(0)}% to next level</span>
                  <span>+{xpToNext.toLocaleString()} XP needed</span>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Today summary */}
      {(ml || metrics) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ml ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-foreground font-semibold">
                    {completedToday} completed
                  </span>
                </div>
                <div className="text-muted-foreground text-sm">
                  {remainingToday > 0
                    ? `${remainingToday} habit${remainingToday > 1 ? 's' : ''} remaining`
                    : '🎉 All done for today!'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  )
}
