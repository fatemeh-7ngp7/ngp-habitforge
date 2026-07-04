'use client'

import { useState } from 'react'
import {
  useDashboard, useWeeklyBreakdown,
  useInsights, useXP, useMyBadges,
} from '@/hooks/use-habits'
import { ActivityHeatmap } from '@/components/dashboard/activity-heatmap'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Flame, Zap, TrendingUp, Star,
  CheckCircle2, Lightbulb, AlertTriangle,
  ArrowUp, Calendar,
} from 'lucide-react'

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, icon: Icon, color = 'text-primary', loading,
}: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; color?: string; loading?: boolean
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

// ─── Weekly Bar Chart ─────────────────────────────────────────────────────────
// Backend returns: { breakdown: { Sun: 0, Mon: 3, ... }, best_day: "Mon" }

function WeeklyChart() {
  const { data: raw, isLoading } = useWeeklyBreakdown()

  if (isLoading) return <Skeleton className="h-40 w-full" />

  // Cast to the actual backend shape
  const weekly = raw as unknown as { breakdown: Record<string, number>; best_day: string | null } | null

  if (!weekly?.breakdown) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No data yet — complete some habits to see your weekly breakdown.
      </p>
    )
  }

  // Backend day order: Sun Mon Tue Wed Thu Fri Sat
  const backendDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const counts      = backendDays.map((d) => weekly.breakdown[d] ?? 0)
  const maxVal      = Math.max(...counts, 1)
  const todayIdx    = new Date().getDay() // 0=Sun

  const hasAny = counts.some((c) => c > 0)

  return (
    <div className="space-y-2">
      {weekly.best_day && (
        <p className="text-xs text-muted-foreground">
          Best day: <span className="text-primary font-semibold">{weekly.best_day}</span>
        </p>
      )}
      <div className="flex items-end gap-2 h-32">
        {backendDays.map((day, i) => {
          const pct     = (counts[i] / maxVal) * 100
          const isToday = i === todayIdx
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground font-mono">
                {counts[i] > 0 ? counts[i] : ""}
              </span>
              <div className="w-full flex items-end" style={{ height: "80px" }}>
                <div
                  className={`w-full rounded-t-sm transition-all ${
                    isToday ? "bg-primary" : "bg-primary/40"
                  }`}
                  style={{ height: `${hasAny ? Math.max(pct, 2) : 2}%` }}
                />
              </div>
              <span className={`text-[10px] ${
                isToday ? "text-primary font-bold" : "text-muted-foreground"
              }`}>
                {day}
              </span>
            </div>
          )
        })}
      </div>
      <p className="text-[10px] text-muted-foreground text-center">
        Completions per day of the week (all time)
      </p>
    </div>
  )
}

// ─── Insight Card ─────────────────────────────────────────────────────────────

function InsightCard({ insight }: {
  insight: { id: string; title: string; body: string; insight_type: string }
}) {
  const styles: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    streak:     { icon: Flame,         color: 'text-orange-400', bg: 'bg-orange-400/10' },
    completion: { icon: CheckCircle2,  color: 'text-green-400',  bg: 'bg-green-400/10'  },
    suggestion: { icon: Lightbulb,     color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    warning:    { icon: AlertTriangle, color: 'text-red-400',    bg: 'bg-red-400/10'    },
  }
  const s = styles[insight.insight_type] ?? styles.suggestion
  const Icon = s.icon

  return (
    <div className={`flex gap-3 rounded-xl border border-border p-4 ${s.bg}`}>
      <div className={`shrink-0 mt-0.5 ${s.color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className={`text-sm font-semibold ${s.color}`}>{insight.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{insight.body}</p>
      </div>
    </div>
  )
}

// ─── Badges Row ───────────────────────────────────────────────────────────────

function BadgesRow() {
  const { data: badges = [], isLoading } = useMyBadges()

  if (isLoading) return <Skeleton className="h-12 w-full" />

  if (badges.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No badges yet — keep completing habits to earn your first one.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b) => (
        <div
          key={b.id}
          title={`Earned ${new Date(b.earned_at).toLocaleDateString()}`}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5"
        >
          <span className="text-base">{b.icon}</span>
          <span className="text-xs font-semibold text-foreground">{b.name}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { data: metrics, isLoading: metricsLoading } = useDashboard()
  const { data: xp,      isLoading: xpLoading      } = useXP()
  const { data: insights = [], isLoading: insightsLoading } = useInsights()

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          Analytics
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your habit performance at a glance.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Habits"
          value={metrics?.active_habits ?? 0}
          sub={`${metrics?.remaining_today ?? 0} remaining today`}
          icon={Zap}
          loading={metricsLoading}
        />
        <MetricCard
          label="Best Streak"
          value={`${metrics?.best_streak?.current ?? 0}d`}
          sub="all time"
          icon={Flame}
          color="text-orange-400"
          loading={metricsLoading}
        />
        <MetricCard
          label="This Week"
          value={metrics?.completions_this_week ?? 0}
          sub="completions"
          icon={TrendingUp}
          color="text-green-400"
          loading={metricsLoading}
        />
        <MetricCard
          label="Total XP"
          value={(xp?.total_xp ?? metrics?.total_xp ?? 0).toLocaleString()}
          sub={xp?.current_level?.title ?? '—'}
          icon={Star}
          color="text-yellow-400"
          loading={metricsLoading || xpLoading}
        />
      </div>

      {/* XP Progress */}
      {(xpLoading || xp) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Level Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {xpLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : xp ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{xp.current_level?.title ?? '—'}</span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {xp.total_xp.toLocaleString()} XP
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(xp.level_progress_pct, 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {Math.round(xp.level_progress_pct)}% to next level
                  </span>
                  <span>{xp.xp_to_next_level.toLocaleString()} XP needed</span>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Activity Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap />
        </CardContent>
      </Card>

      {/* Weekly chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Weekly Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyChart />
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Star className="w-4 h-4" />
            Earned Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BadgesRow />
        </CardContent>
      </Card>

      {/* Insights */}
      {(insightsLoading || insights.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insightsLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))
            )}
          </CardContent>
        </Card>
      )}

    </div>
  )
}
