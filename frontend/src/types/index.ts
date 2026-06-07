// types/index.ts
// Field names match Django API exactly.

// ─── API Envelope ──────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: { message?: string };
  pagination?: {
    count: number;
    next: string | null;
    previous: string | null;
  };
}

export interface ApiError {
  success: false;
  error: { detail: string };
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  tokens: TokenPair;
}

// ─── User ──────────────────────────────────────────────────────────────────────

export interface UserProfile {
  avatar: string | null;
  bio: string;
  first_name: string; // اضافه شد
  last_name:  string; // اضافه شد
  timezone: string;
  locale: string;
  onboarding_complete: boolean;
}

export interface User {
  id: string;
  email: string;
  username: string;
  is_verified: boolean;
  mfa_enabled: boolean;
  profile: UserProfile;
  date_joined: string;
}

// ─── Habits ────────────────────────────────────────────────────────────────────

// MUST be uppercase — matches Django TextChoices exactly
export type HabitType = "BINARY" | "MEASURABLE" | "TIME_BASED";
export type HabitFrequency = "daily" | "weekly" | "custom";

export interface HabitCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface HabitStreak {
  id: string;
  habit: string;
  current_streak: number;
  longest_streak: number;
  last_completed: string | null;
}

export interface HabitReminder {
  id: string;
  habit: string;
  time: string;
  days_of_week: number[];
  is_active: boolean;
}

export interface Habit {
  id: string;
  title: string;
  name?: string;
  description: string;
  habit_type: HabitType;
  frequency_type: string;      // backend field (daily/weekly/custom)
  frequency?: string;          // alias
  target_value: number | null;
  target_unit: string | null;
  unit?: string | null;
  xp_reward?: number;          // not in list serializer, only detail
  xp_per_completion?: number;  // detail serializer field
  color: string;
  icon: string;
  difficulty?: string;
  is_public?: boolean;
  is_archived?: boolean;
  category: HabitCategory | null;
  category_name?: string | null;
  is_active?: boolean;
  created_at: string;
  deleted_at?: string | null;
  streak?: HabitStreak;
  completed_today?: boolean;
}

export interface HabitCompletion {
  id: string;
  habit: string;
  completed_at: string;
  value: number | null;
  notes: string;
  xp_earned: number;
}

// These field names MUST match the Django CreateHabitSerializer exactly
export interface CreateHabitPayload {
  title: string;           // NOT "name"
  description?: string;
  habit_type: HabitType;   // "BINARY" | "MEASURABLE" | "TIME_BASED"
  frequency: HabitFrequency;
  target_value?: number;
  target_unit?: string;    // NOT "unit"
  xp_reward?: number;
  color?: string;
  icon?: string;
  category?: string;
}

export interface CompleteHabitPayload {
  value?: number;
  notes?: string;
}

// ─── Analytics ─────────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  total_habits: number;
  active_streaks: number;
  longest_streak: number;
  total_completions: number;
  completions_this_week: number;
  total_xp: number;
  current_level: string;
}

export interface HeatmapEntry {
  date: string;
  count: number;
}

export interface WeeklyBreakdown {
  habit_id: string;
  habit_name: string;
  completions: number[];
}

export interface Insight {
  id: string;
  title: string;
  body: string;
  insight_type: "streak" | "completion" | "suggestion" | "warning";
}

// ─── Gamification ──────────────────────────────────────────────────────────────

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition_type: "streak_days" | "total_completions" | "habits_created" | "challenge_won";
  condition_value: number;
  xp_reward: number;
  earned: boolean;
  earned_at?: string;
}

export interface XPStatus {
  total_xp: number;
  current_level: number;
  level_title: string;
  xp_for_next_level: number;
  xp_progress: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar: string | null;
  score: number;
  level_title: string;
}

// ─── Social ────────────────────────────────────────────────────────────────────

export type FriendshipStatus = "pending" | "accepted" | "declined";
export type FeedEventType =
  | "habit_completed"
  | "streak_reached"
  | "challenge_joined"
  | "challenge_won"
  | "badge_earned";

export interface Friend {
  id: string;
  username: string;
  avatar: string | null;
  total_xp: number;
  level_title: string;
}

export interface FriendRequest {
  id: string;
  from_user: Friend;
  created_at: string;
  status: FriendshipStatus;
}

export interface GroupChallenge {
  id: string;
  name: string;
  description: string;
  creator: Friend;
  start_date: string;
  end_date: string;
  max_participants: number;
  participant_count: number;
  is_joined: boolean;
  habit_type?: HabitType;
}

export interface FeedItem {
  id: string;
  user: Friend;
  event_type: FeedEventType;
  payload: Record<string, unknown>;
  is_public: boolean;
  created_at: string;
}
