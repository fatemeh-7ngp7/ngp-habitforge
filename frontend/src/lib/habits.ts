// lib/habits.ts
// All habits-domain API calls. Used by React Query hooks.

import {
  CompleteHabitPayload,
  CreateHabitPayload,
  DashboardMetrics,
  Habit,
  HabitCategory,
  HabitCompletion,
  HabitStreak,
  XPStatus,
} from "@/types";
import { apiDelete, apiGet, apiPatch, apiPost } from "./api";

// ─── Habits ────────────────────────────────────────────────────────────────────

export const habitsApi = {
  list: () => apiGet<Habit[]>("/habits/"),

  get: (id: string) => apiGet<Habit>(`/habits/${id}/`),

  create: (payload: CreateHabitPayload) =>
    apiPost<Habit>("/habits/", payload),

  update: (id: string, payload: Partial<CreateHabitPayload>) =>
    apiPatch<Habit>(`/habits/${id}/`, payload),

  delete: (id: string) => apiDelete(`/habits/${id}/`),

  complete: (id: string, payload?: CompleteHabitPayload) =>
    apiPost<HabitCompletion>(`/habits/${id}/complete/`, payload ?? {}),

  streak: (id: string) => apiGet<HabitStreak>(`/habits/${id}/streak/`),

  categories: () => apiGet<HabitCategory[]>("/habits/categories/"),
};

// ─── Analytics ─────────────────────────────────────────────────────────────────

// Backend returns { year, heatmap: {"YYYY-MM-DD": count, ...}, total } —
// NOT a flat array. Consumers must unwrap the `heatmap` dict themselves.
interface HeatmapResponse {
  year: number;
  heatmap: Record<string, number>;
  total: number;
}

interface WeeklyBreakdownEntry {
  habit_id: string;
  habit_name: string;
  completions: number[];
}

interface InsightEntry {
  id: string;
  title: string;
  body: string;
  insight_type: string;
}

export const analyticsApi = {
  dashboard: () => apiGet<DashboardMetrics>("/analytics/dashboard/"),

  heatmap: (year: number) =>
    apiGet<HeatmapResponse>("/analytics/heatmap/", { year }),

  weekly: () => apiGet<WeeklyBreakdownEntry[]>("/analytics/weekly/"),

  insights: () => apiGet<InsightEntry[]>("/analytics/insights/"),
};

// ─── Gamification ──────────────────────────────────────────────────────────────

interface BadgeEntry {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition_type: string;
  condition_value: number;
  xp_reward: number;
  earned: boolean;
  earned_at?: string;
}

interface MyBadgeEntry {
  id: string;
  name: string;
  icon: string;
  earned_at: string;
}

interface LeaderboardEntryRaw {
  rank: number;
  user_id: string;
  username: string;
  avatar: string | null;
  score: number;
  level_title: string;
}

export const gamificationApi = {
  badges: () => apiGet<BadgeEntry[]>("/gamification/badges/"),

  myBadges: () => apiGet<MyBadgeEntry[]>("/gamification/badges/mine/"),

  xp: () => apiGet<XPStatus>("/gamification/xp/"),

  leaderboard: (period: "weekly" | "monthly" | "all_time" = "weekly") =>
    apiGet<LeaderboardEntryRaw[]>("/gamification/leaderboard/", { period }),
};

export type { CreateHabitPayload };