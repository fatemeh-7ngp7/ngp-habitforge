'use client'

import { useMemo, useState } from 'react'
import { Habit, HabitType } from '@/types'
import { useHabits } from '@/hooks/use-habits'
import { CreateHabitDialog } from '@/components/habits/create-habit-dialog'
import { HabitCard } from '@/components/habits/habit-card'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Flame, Search } from 'lucide-react'

// ─── Page ─────────────────────────────────────────────────────────────────────

type FilterType = "all" | HabitType
type SortKey = "title" | "streak" | "created" | "xp"

export default function HabitsPage() {
  const { data: habits = [], isLoading } = useHabits()

  const [search,     setSearch]     = useState("")
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [sortKey,    setSortKey]    = useState<SortKey>("streak")

  const totalStreak    = habits.reduce((acc, h) => acc + (h.streak?.current_streak ?? 0), 0)
  const completedToday = habits.filter((h) => h.completed_today).length
  const completePct    = habits.length > 0
    ? Math.round((completedToday / habits.length) * 100) : 0

  // filtered MUST be defined before remaining/completed
  const filtered = useMemo(() => {
    let result = habits.filter((h) => {
      const name = (h.title || h.name || '').toLowerCase()
      const matchSearch = search === '' || name.includes(search.toLowerCase())
      const matchType   = filterType === "all" || h.habit_type === filterType
      return matchSearch && matchType
    })

    result.sort((a, b) => {
      switch (sortKey) {
        case "title":
          return (a.title || a.name || '').localeCompare(b.title || b.name || '')
        case "streak":
          return (b.streak?.current_streak ?? 0) - (a.streak?.current_streak ?? 0)
        case "xp":
          return (b.xp_per_completion ?? b.xp_reward ?? 0) - (a.xp_per_completion ?? a.xp_reward ?? 0)
        case "created":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })

    return result
  }, [habits, search, filterType, sortKey])

  // derived from filtered — search/filter/sort all work correctly
  const remaining = filtered.filter((h) => !h.completed_today)
  const completed  = filtered.filter((h) => h.completed_today)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">My Habits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {habits.length} habit{habits.length !== 1 ? "s" : ""} ·{" "}
            <span className="text-green-400">{completedToday} done today</span>{" "}
            · <span className="text-orange-400">{totalStreak} total streak days</span>
          </p>
        </div>
        <CreateHabitDialog />
      </div>

      {/* Progress bar */}
      {habits.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Today's progress</span>
              <span>{completedToday}/{habits.length} completed</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all duration-300"
                style={{ width: `${completePct}%` }}
              />
            </div>
            {completePct === 100 && (
              <p className="text-xs text-green-400 mt-2 text-center font-semibold">
                🎉 All habits completed today!
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search habits…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <select
          className="px-3 py-1.5 border border-input rounded-md bg-background text-sm text-foreground"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as FilterType)}
        >
          <option value="all">All Types</option>
          <option value="BINARY">Binary</option>
          <option value="MEASURABLE">Measurable</option>
          <option value="TIME_BASED">Time-based</option>
        </select>
        <select
          className="px-3 py-1.5 border border-input rounded-md bg-background text-sm text-foreground"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
        >
          <option value="streak">Sort by Streak</option>
          <option value="title">Sort by Name</option>
          <option value="xp">Sort by XP</option>
          <option value="created">Sort by Created</option>
        </select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : habits.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Flame className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">No habits yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create your first habit to start building streaks.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {remaining.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Remaining ({remaining.length})
              </h2>
              <div className="space-y-2">
                {remaining.map((h) => (
                  <HabitCard key={h.id} habit={h} />
                ))}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Completed ({completed.length})
              </h2>
              <div className="space-y-2">
                {completed.map((h) => (
                  <HabitCard key={h.id} habit={h} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}