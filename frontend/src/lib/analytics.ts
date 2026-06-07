import { api } from './api'
import { ApiResponse, DashboardMetrics, Badge } from '@/types'

export const analyticsApi = {

  dashboard: async (): Promise<DashboardMetrics> => {
    const { data } = await api.get<ApiResponse<DashboardMetrics>>('/analytics/dashboard/')
    return data.data
  },

  heatmap: async (year?: number): Promise<{ year: number; heatmap: Record<string, number>; total: number }> => {
    const { data } = await api.get('/analytics/heatmap/', { params: { year } })
    return data.data
  },
}

export const gamificationApi = {

  xp: async (): Promise<any> => {
    const { data } = await api.get<ApiResponse<any>>('/gamification/xp/')
    return data.data
  },

  badges: async (): Promise<Badge[]> => {
    const { data } = await api.get<ApiResponse<Badge[]>>('/gamification/badges/')
    return data.data
  },
}
