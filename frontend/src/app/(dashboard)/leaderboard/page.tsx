'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Trophy, Zap, CheckCircle2, Medal } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  rank:        number
  username:    string
  first_name:  string
  score:       number
  completions: number
}

interface LeaderboardData {
  id:         string
  period:     string
  started_at: string
  ended_at:   string
  entries:    LeaderboardEntry[]
}

type Period = 'WEEKLY' | 'MONTHLY' | 'ALL_TIME'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PERIODS: { value: Period; label: string }[] = [
  { value: 'WEEKLY',    label: 'This Week'  },
  { value: 'MONTHLY',   label: 'This Month' },
  { value: 'ALL_TIME',  label: 'All Time'   },
]

function rankStyle(rank: number) {
  if (rank === 1) return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: '🥇' }
  if (rank === 2) return { bg: 'bg-zinc-400/10',   border: 'border-zinc-400/30',   text: 'text-zinc-400',   icon: '🥈' }
  if (rank === 3) return { bg: 'bg-amber-600/10',  border: 'border-amber-600/30',  text: 'text-amber-600',  icon: '🥉' }
  return { bg: '', border: 'border-border', text: 'text-muted-foreground', icon: `#${rank}` }
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function LeaderboardRow({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardEntry
  isCurrentUser: boolean
}) {
  const style = rankStyle(entry.rank)

  return (
    <div className={cn(
      'flex items-center gap-4 px-4 py-3 rounded-xl border transition-all',
      style.bg, style.border,
      isCurrentUser && 'ring-1 ring-primary/40'
    )}>
      {/* Rank */}
      <div className={cn('w-8 text-center font-mono text-sm font-bold shrink-0', style.text)}>
        {style.icon}
      </div>

      {/* Avatar placeholder */}
      <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-primary uppercase">
          {entry.username.slice(0, 1)}
        </span>
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-semibold truncate',
          isCurrentUser ? 'text-primary' : 'text-foreground'
        )}>
          {entry.username}
          {isCurrentUser && (
            <span className="ml-2 text-[10px] text-primary/60 font-normal">you</span>
          )}
        </p>
        {entry.first_name && (
          <p className="text-[11px] text-muted-foreground">{entry.first_name}</p>
        )}
      </div>

      {/* Completions */}
      <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
        <CheckCircle2 className="w-3 h-3 text-green-400" />
        <span>{entry.completions}</span>
      </div>

      {/* Score */}
      <div className="flex items-center gap-1">
        <Zap className="w-3.5 h-3.5 text-yellow-400" />
        <span className="font-mono text-sm font-bold text-foreground">
          {entry.score.toLocaleString()}
        </span>
        <span className="text-[10px] text-muted-foreground">XP</span>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>('WEEKLY')
  const user = useAuthStore((s) => s.user)

  const { data, isLoading, error } = useQuery({
    queryKey: ['gamification', 'leaderboard', period],
    queryFn:  () => apiGet<LeaderboardData>(`/gamification/leaderboard/?period=${period}`),
    staleTime: 5 * 60_000,
  })

  const entries    = data?.entries ?? []
  const currentPos = entries.findIndex((e) => e.username === user?.username)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {entries.length} player{entries.length !== 1 ? 's' : ''} ranked
            {currentPos >= 0 && (
              <span className="text-primary ml-1">
                · You are #{currentPos + 1}
              </span>
            )}
          </p>
        </div>

        {/* Period selector */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          {PERIODS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={cn(
                'px-4 py-2 text-xs font-semibold transition-colors border-r border-border last:border-0',
                period === value
                  ? 'bg-primary/10 text-primary'
                  : 'bg-card text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Date range */}
      {data && (
        <p className="text-[11px] text-muted-foreground">
          {new Date(data.started_at).getFullYear() > 2000 ? new Date(data.started_at).toLocaleDateString() : ""} {data.ended_at && new Date(data.ended_at).getFullYear() > 2000 ? `— ${new Date(data.ended_at).toLocaleDateString()}` : ""}
        </p>
      )}

      {/* Top 3 podium */}
      {!isLoading && entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[entries[1], entries[0], entries[2]].map((entry, i) => {
            if (!entry) return null
            const heights = ['h-20', 'h-28', 'h-16']
            const labels  = ['2nd', '1st', '3rd']
            const colors  = ['text-zinc-400', 'text-yellow-400', 'text-amber-600']
            return (
              <div key={entry.username} className="flex flex-col items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary uppercase">
                    {entry.username.slice(0, 1)}
                  </span>
                </div>
                <p className="text-xs font-semibold text-foreground truncate max-w-[80px] text-center">
                  {entry.username}
                </p>
                <div className={cn(
                  'w-full rounded-t-lg flex flex-col items-center justify-end pb-2 gap-1',
                  heights[i],
                  i === 1 ? 'bg-yellow-500/20' : i === 0 ? 'bg-zinc-400/10' : 'bg-amber-600/10'
                )}>
                  <span className={cn('text-lg font-black', colors[i])}>
                    {['🥈','🥇','🥉'][i]}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {entry.score.toLocaleString()} XP
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Medal className="w-4 h-4" />
            Rankings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))
          ) : error || entries.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground mb-1">No rankings yet</p>
              <p className="text-xs text-muted-foreground">Complete habits to appear on the leaderboard.</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground mb-1">
                No rankings yet
              </p>
              <p className="text-xs text-muted-foreground">
                Complete habits to appear on the leaderboard.
              </p>
            </div>
          ) : (
            entries.map((entry) => (
              <LeaderboardRow
                key={entry.username}
                entry={entry}
                isCurrentUser={entry.username === user?.username}
              />
            ))
          )}
        </CardContent>
      </Card>

    </div>
  )
}
