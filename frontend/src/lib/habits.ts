// lib/habits.ts
// All habits-domain API calls. Used by React Query hooks.

import {
  CompleteHabitPayload,
  CreateHabitPayload,
  Habit,
  HabitCategory,
  HabitCompletion,
  HabitStreak,
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

export const analyticsApi = {
  dashboard: () =>
    apiGet<{
      total_habits: number;
      active_streaks: number;
      longest_streak: number;
      total_completions: number;
      completions_this_week: number;
      total_xp: number;
      current_level: string;
    }>("/analytics/dashboard/"),

  heatmap: (year: number) =>
    apiGet<Array<{ date: string; count: number }>>("/analytics/heatmap/", {
      year,
    }),

  weekly: () =>
    apiGet<
      Array<{
        habit_id: string;
        habit_name: string;
        completions: number[];
      }>
    >("/analytics/weekly/"),

  insights: () =>
    apiGet<
      Array<{
        id: string;
        title: string;
        body: string;
        insight_type: string;
      }>
    >("/analytics/insights/"),
};

// ─── Gamification ──────────────────────────────────────────────────────────────

export const gamificationApi = {
  badges: () =>
    apiGet<
      Array<{
        id: string;
        name: string;
        description: string;
        icon: string;
        condition_type: string;
        condition_value: number;
        xp_reward: number;
        earned: boolean;
        earned_at?: string;
      }>
    >("/gamification/badges/"),

  myBadges: () =>
    apiGet<
      Array<{
        id: string;
        name: string;
        icon: string;
        earned_at: string;
      }>
    >("/gamification/badges/mine/"),

  xp: () =>
    apiGet<{
      total_xp: number;
      current_level: number;
      level_title: string;
      xp_for_next_level: number;
      xp_progress: number;
    }>("/gamification/xp/"),

  leaderboard: (period: "weekly" | "monthly" | "all_time" = "weekly") =>
    apiGet<
      Array<{
        rank: number;
        user_id: string;
        username: string;
        avatar: string | null;
        score: number;
        level_title: string;
      }>
    >("/gamification/leaderboard/", { period }),
};

export type { CreateHabitPayload };
