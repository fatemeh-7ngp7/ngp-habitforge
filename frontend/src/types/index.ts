// ─── API Response envelope ────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: Record<string, unknown>
  pagination?: {
    count: number
    next: string | null
    previous: string | null
  }
}

export interface ApiError {
  success: false
  error: {
    detail: string | Record<string, string[]>
    status_code?: number
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  username: string
  first_name: string
  last_name: string
  full_name: string
  is_verified: boolean
  mfa_enabled: boolean
  date_joined: string
}

export interface TokenPair {
  access: string
  refresh: string
  token_type: string
}

export interface AuthResponse {
  user: User
  tokens: TokenPair
  mfa_required?: boolean
}

export interface RegisterPayload {
  email: string
  username: string
  first_name?: string
  last_name?: string
  password: string
  password_confirm: string
}

export interface LoginPayload {
  email: string
  password: string
}

// ─── Habits ───────────────────────────────────────────────────────────────────
export type HabitType = 'BINARY' | 'MEASURABLE' | 'TIME_BASED'
export type FrequencyType = 'DAILY' | 'WEEKLY' | 'CUSTOM'
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD'

export interface HabitStreak {
  current_streak: number
  longest_streak: number
  last_completion_date: string | null
  streak_start_date: string | null
  total_completions: number
  updated_at: string
}

export interface Habit {
  id: string
  title: string
  description: string
  icon: string
  color: string
  habit_type: HabitType
  target_value: string | null
  target_unit: string
  frequency_type: FrequencyType
  difficulty: DifficultyLevel
  is_public: boolean
  is_archived: boolean
  order: number
  streak: HabitStreak
  category_name: string | null
  completed_today: boolean
  xp_per_completion: number
  created_at: string
  updated_at: string
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export interface DashboardMetrics {
  active_habits: number
  completed_today: number
  remaining_today: number
  completions_this_week: number
  completion_rate_7d: number
  week_delta_pct: number
  total_completions: number
  total_xp: number
  best_streak: {
    current: number
    longest: number
    habit: string
  } | null
  as_of: string
}

// ─── Gamification ─────────────────────────────────────────────────────────────
export interface XPLevel {
  level: number
  xp_required: number
  title: string
  icon: string
  color: string
}

export interface UserXP {
  total_xp: number
  current_level: XPLevel | null
  xp_to_next_level: number
  level_progress_pct: number
  badges_earned: number
  updated_at: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  condition_type: string
  condition_value: number
  xp_reward: number
  earned: boolean
  earned_at: string | null
}
