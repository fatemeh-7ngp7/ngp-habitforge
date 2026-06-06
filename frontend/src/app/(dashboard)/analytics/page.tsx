'use client'

import { useState } from 'react'
import {
  useDashboard, useHeatmap, useWeeklyBreakdown,
  useInsights, useXP, useMyBadges,
} from '@/hooks/use-habits'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Flame, Zap, TrendingUp, Star,
  CheckCircle2, Lightbulb, AlertTriangle,
  ArrowUp, Calendar,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function heatColor(count: number) {
  if (count === 0) return 'bg-muted'
  if (count === 1) return 'bg-primary/25'
  if (count === 2) return 'bg-primary/50'
  if (count === 3) return 'bg-primary/75'
  return 'bg-primary'
}

function buildGrid(entries: Array<{ date: string; count: number }>, year: number) {
  const lookup: Record<string, number> = {}
  for (const e of entries) lookup[e.date] = e.count

  const jan1       = new Date(year, 0, 1)
  const startOffset = (jan1.getDay() + 6) % 7
  const isLeap     = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  const daysInYear  = isLeap ? 366 : 365

  const weeks: Array<Array<{ date: string; count: number; valid: boolean }>> = []
  let week: typeof weeks[0] = []

  for (let i = 0; i < startOffset; i++) {
    week.push({ date: '', count: 0, valid: false })
  }

  for (let d = 0; d < daysInYear; d++) {
    const date    = new Date(year, 0, d + 1)
    const dateStr = date.toISOString().slice(0, 10)
    week.push({ date: dateStr, count: lookup[dateStr] ?? 0, valid: true })
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push({ date: '', count: 0, valid: false })
    weeks.push(week)
  }
  return weeks
}

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

// ─── Heatmap ──────────────────────────────────────────────────────────────────

function Heatmap() {
  const year = new Date().getFullYear()
  const { data: raw, isLoading } = useHeatmap(year)

  // Backend returns { year, heatmap: {"2026-01-01": 3, ...}, total }
  const backend = raw as unknown as { year: number; heatmap: Record<string, number>; total: number } | null
  const entries = backend?.heatmap
    ? Object.entries(backend.heatmap).map(([date, count]) => ({ date, count }))
    : []

  const grid          = buildGrid(entries, year)
  const totalComplete = backend?.total ?? 0
  const activeDays    = entries.filter((e) => e.count > 0).length

  // Month label positions
  const monthLabels: Array<{ label: string; col: number }> = []
  let lastMonth = -1
  grid.forEach((_, wi) => {
    const d = new Date(year, 0, wi * 7 + 1)
    const m = d.getMonth()
    if (m !== lastMonth && d.getFullYear() === year) {
      monthLabels.push({ label: MONTHS[m], col: wi })
      lastMonth = m
    }
  })

  if (isLoading) {
    return <Skeleton className="h-[120px] w-full" />
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          <span className="font-mono font-bold text-foreground">{totalComplete}</span>{' '}
          completions · <span className="font-mono font-bold text-primary">{activeDays}</span>{' '}
          active days in {year}
        </span>
        <div className="flex items-center gap-1">
          <span className="mr-1">Less</span>
          {['bg-muted','bg-primary/25','bg-primary/50','bg-primary/75','bg-primary'].map((c, i) => (
            <span key={i} className={`h-2.5 w-2.5 rounded-sm ${c}`} />
          ))}
          <span className="ml-1">More</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-0 min-w-full">
          {/* Month labels */}
          <div className="flex ml-6 mb-1 relative h-4">
            {monthLabels.map(({ label, col }) => (
              <span
                key={label}
                className="absolute text-[10px] text-muted-foreground"
                style={{ left: col * 13 }}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1 shrink-0 justify-start">
              {DAYS.map((d, i) => (
                <div key={i} className="h-2.5 text-[9px] text-muted-foreground/60 flex items-center">
                  {i % 2 === 0 ? d.slice(0, 1) : ''}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {grid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((cell, di) => (
                  <div
                    key={di}
                    title={cell.valid ? `${cell.date}: ${cell.count} completion${cell.count !== 1 ? 's' : ''}` : undefined}
                    className={`h-2.5 w-2.5 rounded-sm transition-transform hover:scale-125 cursor-default ${
                      cell.valid ? heatColor(cell.count) : 'opacity-0'
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
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
          <Heatmap />
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
