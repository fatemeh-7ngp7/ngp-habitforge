'use client'

import { useEffect, useState, useCallback } from 'react'
import { habitsApi, CreateHabitPayload } from '@/lib/habits'
import { Habit } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/api'
import {
  Plus, Flame, CheckCircle2, Circle,
  Trash2, Zap, X,
} from 'lucide-react'

const DIFFICULTY_COLOR: Record<string, string> = {
  EASY:   'text-green-400',
  MEDIUM: 'text-yellow-400',
  HARD:   'text-orange-400',
}

const DIFFICULTY_XP: Record<string, number> = {
  EASY: 10, MEDIUM: 25, HARD: 50,
}

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
    await onComplete(habit.id)
    setCompleting(false)
  }

  return (
    <Card className={`transition-all duration-200 ${habit.completed_today ? 'opacity-60' : 'hover:border-primary/40'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">

          {/* Complete button */}
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

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {habit.icon && <span className="text-base">{habit.icon}</span>}
              <span className={`font-semibold text-sm ${habit.completed_today ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {habit.title}
              </span>
              <Badge variant="outline" className={`text-[10px] px-1.5 ${DIFFICULTY_COLOR[habit.difficulty]}`}>
                {habit.difficulty}
              </Badge>
            </div>

            {/* Streak + XP */}
            <div className="flex items-center gap-3 mt-1.5">
              {habit.streak.current_streak > 0 && (
                <span className="flex items-center gap-1 text-xs text-orange-400">
                  <Flame className="w-3 h-3" />
                  {habit.streak.current_streak}d streak
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Zap className="w-3 h-3" />
                {DIFFICULTY_XP[habit.difficulty]} XP
              </span>
              {habit.target_value && (
                <span className="text-xs text-muted-foreground">
                  Target: {habit.target_value} {habit.target_unit}
                </span>
              )}
            </div>
          </div>

          {/* Delete */}
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

function CreateHabitForm({ onCreated, onClose }: { onCreated: () => void; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<CreateHabitPayload>({
    title:          '',
    habit_type:     'BINARY',
    frequency_type: 'DAILY',
    difficulty:     'MEDIUM',
  })

  const set = (k: keyof CreateHabitPayload, v: string) =>
    setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    try {
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
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
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
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
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
                value={form.frequency_type}
                onChange={(e) => set('frequency_type', e.target.value)}
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Difficulty</Label>
              <select
                className="w-full mt-1 bg-background border border-input rounded-md px-2 py-1.5 text-sm text-foreground"
                value={form.difficulty}
                onChange={(e) => set('difficulty', e.target.value)}
              >
                <option value="EASY">Easy (10 XP)</option>
                <option value="MEDIUM">Medium (25 XP)</option>
                <option value="HARD">Hard (50 XP)</option>
              </select>
            </div>
          </div>
          {form.habit_type === 'MEASURABLE' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Target value</Label>
                <Input
                  placeholder="e.g. 5"
                  value={form.target_value ?? ''}
                  onChange={(e) => set('target_value', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Unit</Label>
                <Input
                  placeholder="e.g. km"
                  value={form.target_unit ?? ''}
                  onChange={(e) => set('target_unit', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <Button type="submit" size="sm" disabled={loading || !form.title.trim()}>
              {loading ? 'Creating...' : 'Create habit'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function HabitsPage() {
  const [habits, setHabits]       = useState<Habit[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await habitsApi.list()
      setHabits(data)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleComplete = async (id: string) => {
    try {
      const result = await habitsApi.complete(id)
      toast.success(`🔥 ${result.streak.current_streak}-day streak! +${result.xp_earned} XP`)
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await habitsApi.delete(id)
      toast.success('Habit deleted')
      setHabits((h) => h.filter((x) => x.id !== id))
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const completed  = habits.filter((h) => h.completed_today)
  const remaining  = habits.filter((h) => !h.completed_today)
  const completePct = habits.length > 0
    ? Math.round((completed.length / habits.length) * 100)
    : 0

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Habits</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {loading ? 'Loading...' : `${habits.length} habit${habits.length !== 1 ? 's' : ''} · ${completed.length} done today`}
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          New habit
        </Button>
      </div>

      {/* Daily progress bar */}
      {!loading && habits.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Today's progress</span>
              <span>{completed.length}/{habits.length} completed</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
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

      {/* Create form */}
      {showForm && (
        <CreateHabitForm
          onCreated={load}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Habit list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : habits.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">No habits yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Create your first habit to start building streaks.</p>
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="w-4 h-4 mr-1.5" /> Create habit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {remaining.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Remaining ({remaining.length})
              </h2>
              {remaining.map((h) => (
                <HabitCard key={h.id} habit={h} onComplete={handleComplete} onDelete={handleDelete} />
              ))}
            </div>
          )}
          {completed.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Completed ({completed.length})
              </h2>
              {completed.map((h) => (
                <HabitCard key={h.id} habit={h} onComplete={handleComplete} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
