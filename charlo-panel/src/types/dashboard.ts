export interface DashboardStats {
  totalCollected: number
  successRate: number
  clientsUpToDate: number
  pendingReview: number
}

export interface AgingData {
  range: string
  count: number
  amount: number
}

export interface MonthlyCollection {
  month: string
  amount: number
}

export interface StatusDistribution {
  name: string
  value: number
  color: string
}

export interface RecentActivity {
  id: string
  type: 'payment' | 'receipt' | 'reminder' | 'conversation'
  client_name: string
  description: string
  amount?: number
  status: string
  created_at: string
}

export interface DashboardData {
  stats: DashboardStats
  aging: AgingData[]
  monthly: MonthlyCollection[]
  distribution: StatusDistribution[]
  activities: RecentActivity[]
}
