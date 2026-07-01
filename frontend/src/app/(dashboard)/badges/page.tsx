'use client'

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Award, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Badge {
  id:              string
  name:            string
  description:     string
  icon:            string
  color:           string
  condition_type:  string
  condition_value: number
  xp_reward:       number
  earned:          boolean
  earned_at:       string | null
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <Card
      className={cn(
        'transition-all',
        badge.earned
          ? 'border-primary/30 bg-primary/5'
          : 'opacity-60 grayscale'
      )}
    >
      <CardContent className="flex flex-col items-center text-center gap-2 py-6">
        <div
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0 border',
            badge.earned
              ? 'border-primary/30'
              : 'border-border bg-muted/40'
          )}
          style={badge.earned ? { backgroundColor: `${badge.color}22`, borderColor: `${badge.color}55` } : undefined}
        >
          {badge.earned ? badge.icon || '🏅' : <Lock className="w-5 h-5 text-muted-foreground" />}
        </div>

        <p className="text-sm font-semibold text-foreground">{badge.name}</p>
        <p className="text-[11px] text-muted-foreground leading-snug">
          {badge.description}
        </p>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-mono text-muted-foreground">
            +{badge.xp_reward} XP
          </span>
          {badge.earned && badge.earned_at && (
            <span className="text-[10px] text-primary">
              · {new Date(badge.earned_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BadgesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['gamification', 'badges'],
    queryFn:  () => apiGet<Badge[]>('/gamification/badges/'),
    staleTime: 60_000,
  })

  const badges = data ?? []
  const earnedCount = badges.filter((b) => b.earned).length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
          <Award className="w-6 h-6 text-primary" />
          Badges
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isLoading ? 'Loading…' : `${earnedCount} of ${badges.length} earned`}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            All Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                Couldn't load badges. Try refreshing the page.
              </p>
            </div>
          ) : badges.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No badges available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {badges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}