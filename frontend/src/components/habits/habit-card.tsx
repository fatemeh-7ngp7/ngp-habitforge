"use client";

// components/habits/habit-card.tsx

import {
  CheckCircle2,
  Circle,
  Flame,
  MoreHorizontal,
  Target,
  Timer,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCompleteHabit, useDeleteHabit } from "@/hooks/use-habits";
import { Habit } from "@/types";
import { cn } from "@/lib/utils";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_ICONS = {
  binary: Circle,
  measurable: Target,
  time_based: Timer,
};

const LEVEL_COLOR: Record<string, string> = {
  Bronze: "text-amber-600",
  Silver: "text-zinc-400",
  Gold: "text-yellow-400",
  Platinum: "text-cyan-400",
  Diamond: "text-blue-400",
  Legend: "text-forge",
};

function StreakPip({ filled }: { filled: boolean }) {
  return (
    <span
      className={cn(
        "inline-block h-1.5 w-1.5 rounded-full transition-colors",
        filled ? "bg-forge" : "bg-border-dark2"
      )}
    />
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface HabitCardProps {
  habit: Habit;
  /** If true, renders as a compact table row instead of a card */
  compact?: boolean;
}

export function HabitCard({ habit, compact = false }: HabitCardProps) {
  const [justCompleted, setJustCompleted] = useState(false);
  const completeHabit = useCompleteHabit();
  const deleteHabit = useDeleteHabit();

  const Icon = TYPE_ICONS[habit.habit_type];
  const streak = habit.streak?.current_streak ?? 0;
  const isCompletedToday = habit.completed_today || justCompleted;

  const handleComplete = async () => {
    if (isCompletedToday) return;
    setJustCompleted(true);
    try {
      await completeHabit.mutateAsync({ id: habit.id });
    } catch {
      setJustCompleted(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${habit.name}"? This cannot be undone.`)) return;
    await deleteHabit.mutateAsync(habit.id);
  };

  // ── Compact (table row) variant ────────────────────────────────────────────
  if (compact) {
    return (
      <div
        className="group flex items-center gap-4 px-4 py-3 border-b border-border-dark last:border-0
          hover:bg-forge/[0.03] transition-colors"
      >
        {/* Colour dot + icon */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: `${habit.color}22`,
            border: `1.5px solid ${habit.color}55`,
          }}
        >
          <Icon className="h-4 w-4" style={{ color: habit.color }} />
        </div>

        {/* Name + meta */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ngp-text">
            {habit.name}
          </p>
          <p className="text-[11px] text-ngp-muted">
            {habit.habit_type === "binary"
              ? "Binary"
              : `Target: ${habit.target_value} ${habit.unit ?? ""}`}
            {habit.category && ` · ${habit.category.name}`}
          </p>
        </div>

        {/* Streak */}
        <div className="hidden sm:flex items-center gap-1">
          <Flame
            className={cn(
              "h-3.5 w-3.5",
              streak > 0 ? "text-forge" : "text-ngp-muted/40"
            )}
          />
          <span
            className={cn(
              "font-mono text-xs font-bold",
              streak > 0 ? "text-forge" : "text-ngp-muted/40"
            )}
          >
            {streak}d
          </span>
        </div>

        {/* Complete button */}
        <button
          onClick={handleComplete}
          disabled={isCompletedToday || completeHabit.isPending}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all",
            isCompletedToday
              ? "bg-green-500/20 text-green-400 cursor-default"
              : "border border-border-dark2 text-ngp-muted hover:border-forge/60 hover:text-forge hover:bg-forge/10"
          )}
        >
          {isCompletedToday ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
        </button>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 text-ngp-muted hover:text-ngp-text transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-card-dark border-border-dark text-ngp-text"
          >
            <DropdownMenuItem className="text-xs cursor-pointer">
              <TrendingUp className="mr-2 h-3.5 w-3.5 text-ngp-muted" />
              View Streak History
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border-dark" />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-xs cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-400/10"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete Habit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // ── Card variant ───────────────────────────────────────────────────────────
  return (
    <div
      className="group relative rounded-xl border border-border-dark bg-card-dark p-4
        transition-all hover:border-forge/30 hover:shadow-[0_0_20px_rgba(232,64,12,0.07)]"
    >
      {/* Completed today indicator */}
      {isCompletedToday && (
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl bg-gradient-to-r from-green-500/0 via-green-500 to-green-500/0" />
      )}

      <div className="flex items-start justify-between gap-3">
        {/* Left: icon + name */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: `${habit.color}22`,
              border: `1.5px solid ${habit.color}55`,
            }}
          >
            <Icon className="h-5 w-5" style={{ color: habit.color }} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-ngp-text truncate">{habit.name}</p>
            {habit.description && (
              <p className="text-[11px] text-ngp-muted mt-0.5 line-clamp-1">
                {habit.description}
              </p>
            )}
          </div>
        </div>

        {/* Right: menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 text-ngp-muted hover:text-ngp-text transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-card-dark border-border-dark text-ngp-text"
          >
            <DropdownMenuItem className="text-xs cursor-pointer">
              <TrendingUp className="mr-2 h-3.5 w-3.5 text-ngp-muted" />
              View History
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border-dark" />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-xs cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-400/10"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Streak pips (last 7 days) */}
      <div className="mt-3 flex items-center gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <StreakPip key={i} filled={i < Math.min(streak, 7)} />
        ))}
        <span className="ml-2 font-mono text-[11px] text-ngp-muted">
          {streak}d streak
        </span>
        {habit.streak?.longest_streak !== undefined && (
          <span className="ml-1 text-[11px] text-ngp-muted/50">
            · best {habit.streak.longest_streak}d
          </span>
        )}
      </div>

      {/* Footer: meta + complete button */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {habit.category && (
            <Badge
              variant="outline"
              className="border-border-dark text-ngp-muted text-[10px] h-5 px-1.5"
            >
              {habit.category.name}
            </Badge>
          )}
          <span className="text-[10px] font-mono text-ngp-muted/60 uppercase tracking-wide">
            {habit.frequency}
          </span>
          <span className="text-[10px] text-forge/80 font-semibold">
            +{habit.xp_reward} XP
          </span>
        </div>

        <button
          onClick={handleComplete}
          disabled={isCompletedToday || completeHabit.isPending}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
            isCompletedToday
              ? "bg-green-500/15 text-green-400 cursor-default"
              : "bg-forge/10 text-forge border border-forge/30 hover:bg-forge hover:text-white hover:border-forge"
          )}
        >
          {completeHabit.isPending ? (
            <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
          ) : isCompletedToday ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Circle className="h-3.5 w-3.5" />
          )}
          {isCompletedToday ? "Done" : "Complete"}
        </button>
      </div>
    </div>
  );
}