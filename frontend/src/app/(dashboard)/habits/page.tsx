'use client'

import { useMemo, useState } from 'react'
import { Habit, HabitType, CreateHabitPayload } from '@/types'
import { useHabits, useCompleteHabit, useDeleteHabit } from '@/hooks/use-habits'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/api'
import { Plus, Flame, CheckCircle2, Circle, Trash2, Zap, X, Search } from 'lucide-react'

// ─── HabitCard ────────────────────────────────────────────────────────────────

function HabitCard({
  habit,
  onComplete,
  onDelete,
}: {
  habit: Habit
  onComplete: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [completing, setCompleting] = useState(false)

  const handleComplete = async () => {
    if (habit.completed_today || completing) return
    setCompleting(true)
    try {
      onComplete(habit.id)
    } finally {
      setCompleting(false)
    }
  }

  const displayName = habit.title || habit.name || ''

  return (
    <Card className={`transition-all duration-200 ${
      habit.completed_today ? 'opacity-60' : 'hover:border-primary/40'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={handleComplete}
            disabled={habit.completed_today || completing}
            className="mt-0.5 shrink-0 transition-transform hover:scale-110 disabled:cursor-default"
          >
            {habit.completed_today
              ? <CheckCircle2 className="w-5 h-5 text-green-400" />
              : <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
            }
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {habit.icon && <span className="text-base">{habit.icon}</span>}
              <span className={`font-semibold text-sm ${
                habit.completed_today
                  ? 'line-through text-muted-foreground'
                  : 'text-foreground'
              }`}>
                {displayName}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5">
                {habit.habit_type}
              </Badge>
            </div>

            <div className="flex items-center gap-3 mt-1.5">
              {(habit.streak?.current_streak ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-xs text-orange-400">
                  <Flame className="w-3 h-3" />
                  {habit.streak!.current_streak}d streak
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Zap className="w-3 h-3" />
                {habit.xp_reward ?? 0} XP
              </span>
              {habit.target_value && (
                <span className="text-xs text-muted-foreground">
                  Target: {habit.target_value} {habit.target_unit ?? habit.unit ?? ''}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => onDelete(habit.id)}
            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── CreateHabitForm ──────────────────────────────────────────────────────────

function CreateHabitForm({
  onCreated,
  onClose,
}: {
  onCreated: () => void
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<CreateHabitPayload>({
    title: '',
    description: '',
    habit_type: 'BINARY',
    frequency: 'daily',
  })

  const set = (k: keyof CreateHabitPayload, v: string) =>
    setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    try {
      const { habitsApi } = await import('@/lib/habits')
      await habitsApi.create(form)
      toast.success(`Habit "${form.title}" created! 🎯`)
      onCreated()
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground">New Habit</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="title" className="text-xs">Title</Label>
            <Input
              id="title"
              placeholder="e.g. Morning Run"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              className="mt-1"
              autoFocus
              required
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-xs">
              Description (optional)
            </Label>
            <Input
              id="description"
              placeholder="Why this habit matters..."
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Type</Label>
              <select
                className="w-full mt-1 bg-background border border-input rounded-md px-2 py-1.5 text-sm text-foreground"
                value={form.habit_type}
                onChange={(e) => set('habit_type', e.target.value)}
              >
                <option value="BINARY">Binary</option>
                <option value="MEASURABLE">Measurable</option>
                <option value="TIME_BASED">Time-based</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Frequency</Label>
              <select
                className="w-full mt-1 bg-background border border-input rounded-md px-2 py-1.5 text-sm text-foreground"
                value={form.frequency}
                onChange={(e) => set('frequency', e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          {/* Show target fields only for non-binary types */}
          {form.habit_type !== 'BINARY' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="target_value" className="text-xs">
                  Target value
                </Label>
                <Input
                  id="target_value"
                  type="number"
                  min={1}
                  placeholder={form.habit_type === 'TIME_BASED' ? '30' : '5'}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      target_value: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="target_unit" className="text-xs">Unit</Label>
                <Input
                  id="target_unit"
                  placeholder={form.habit_type === 'TIME_BASED' ? 'min' : 'km'}
                  onChange={(e) => set('target_unit', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Habit'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ─── CreateHabitDialog ────────────────────────────────────────────────────────

function CreateHabitDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Habit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Habit</DialogTitle>
        </DialogHeader>
        <CreateHabitForm
          onCreated={() => { onCreated(); setOpen(false) }}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FilterType = "all" | HabitType
type SortKey = "title" | "streak" | "created" | "xp"

export default function HabitsPage() {
  const { data: habits = [], isLoading, refetch } = useHabits()
  const completeHabit = useCompleteHabit()
  const deleteHabit   = useDeleteHabit()

  const [search,     setSearch]     = useState("")
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [sortKey,    setSortKey]    = useState<SortKey>("streak")

  const totalStreak    = habits.reduce((acc, h) => acc + (h.streak?.current_streak ?? 0), 0)
  const completedToday = habits.filter((h) => h.completed_today).length
  const completePct    = habits.length > 0
    ? Math.round((completedToday / habits.length) * 100) : 0

  const remaining = habits.filter((h) => !h.completed_today)
  const completed  = habits.filter((h) => h.completed_today)

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

  const handleComplete = (id: string) => {
    completeHabit.mutate({ id, payload: {} })
  }

  const handleDelete = (id: string) => {
    if (confirm("Delete this habit?")) {
      deleteHabit.mutate(id)
    }
  }

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
        <CreateHabitDialog onCreated={() => refetch()} />
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
                  <HabitCard
                    key={h.id}
                    habit={h}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                  />
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
                  <HabitCard
                    key={h.id}
                    habit={h}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
