// hooks/use-habits.ts
// React Query hooks for habits domain + analytics + gamification.
// Pages import these — never call the API directly from components.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { analyticsApi, gamificationApi, habitsApi } from "@/lib/habits";
import { CompleteHabitPayload, CreateHabitPayload } from "@/types";
import { toast } from "./use-toast";
import { extractErrorMessage } from "@/lib/api";

// ─── Query keys ────────────────────────────────────────────────────────────────
// Centralised so invalidations are never mistyped.

export const qk = {
  habits: ["habits"] as const,
  habit: (id: string) => ["habits", id] as const,
  habitStreak: (id: string) => ["habits", id, "streak"] as const,
  categories: ["habits", "categories"] as const,
  dashboard: ["analytics", "dashboard"] as const,
  heatmap: (year: number) => ["analytics", "heatmap", year] as const,
  weekly: ["analytics", "weekly"] as const,
  insights: ["analytics", "insights"] as const,
  badges: ["gamification", "badges"] as const,
  myBadges: ["gamification", "my-badges"] as const,
  xp: ["gamification", "xp"] as const,
  leaderboard: (period: string) => ["gamification", "leaderboard", period] as const,
};

// ─── Habits ────────────────────────────────────────────────────────────────────

export function useHabits() {
  return useQuery({
    queryKey: qk.habits,
    queryFn: habitsApi.list,
    staleTime: 30_000,
  });
}

export function useHabit(id: string) {
  return useQuery({
    queryKey: qk.habit(id),
    queryFn: () => habitsApi.get(id),
    enabled: Boolean(id),
  });
}

export function useHabitStreak(id: string) {
  return useQuery({
    queryKey: qk.habitStreak(id),
    queryFn: () => habitsApi.streak(id),
    enabled: Boolean(id),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: qk.categories,
    queryFn: habitsApi.categories,
    staleTime: Infinity, // categories change very rarely
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateHabitPayload) => habitsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.habits });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      toast.success("Habit created", "Your new habit is live.");
    },
    onError: (err) => {
      toast.error("Failed to create habit", extractErrorMessage(err));
    },
  });
}

export function useUpdateHabit(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CreateHabitPayload>) =>
      habitsApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.habit(id) });
      qc.invalidateQueries({ queryKey: qk.habits });
      toast.success("Habit updated");
    },
    onError: (err) => {
      toast.error("Update failed", extractErrorMessage(err));
    },
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => habitsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.habits });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      toast.success("Habit deleted");
    },
    onError: (err) => {
      toast.error("Delete failed", extractErrorMessage(err));
    },
  });
}

export function useCompleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload?: CompleteHabitPayload;
    }) => habitsApi.complete(id, payload),
    onSuccess: (completion, { id }) => {
      qc.invalidateQueries({ queryKey: qk.habits });
      qc.invalidateQueries({ queryKey: qk.habitStreak(id) });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      qc.invalidateQueries({ queryKey: qk.xp });
      toast.success(
        `+${completion.xp_earned} XP`,
        "Great job! Streak updated."
      );
    },
    onError: (err) => {
      toast.error("Could not log completion", extractErrorMessage(err));
    },
  });
}

// ─── Analytics ─────────────────────────────────────────────────────────────────

export function useDashboard() {
  return useQuery({
    queryKey: qk.dashboard,
    queryFn: analyticsApi.dashboard,
    staleTime: 60_000,
  });
}

export function useHeatmap(year = new Date().getFullYear()) {
  return useQuery({
    queryKey: qk.heatmap(year),
    queryFn: () => analyticsApi.heatmap(year),
    staleTime: 5 * 60_000,
  });
}

export function useWeeklyBreakdown() {
  return useQuery({
    queryKey: qk.weekly,
    queryFn: analyticsApi.weekly,
    staleTime: 60_000,
  });
}

export function useInsights() {
  return useQuery({
    queryKey: qk.insights,
    queryFn: analyticsApi.insights,
    staleTime: 10 * 60_000,
  });
}

// ─── Gamification ──────────────────────────────────────────────────────────────

export function useBadges() {
  return useQuery({
    queryKey: qk.badges,
    queryFn: gamificationApi.badges,
    staleTime: 5 * 60_000,
  });
}

export function useMyBadges() {
  return useQuery({
    queryKey: qk.myBadges,
    queryFn: gamificationApi.myBadges,
    staleTime: 60_000,
  });
}

export function useXP() {
  return useQuery({
    queryKey: qk.xp,
    queryFn: gamificationApi.xp,
    staleTime: 30_000,
  });
}

export function useLeaderboard(period: "weekly" | "monthly" | "all_time" = "weekly") {
  return useQuery({
    queryKey: qk.leaderboard(period),
    queryFn: () => gamificationApi.leaderboard(period),
    staleTime: 5 * 60_000,
  });
}