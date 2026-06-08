import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type {
  DashboardData,
  DashboardStats,
  AgingData,
  MonthlyCollection,
  StatusDistribution,
  RecentActivity,
} from '../types/dashboard'

async function fetchStats(): Promise<DashboardStats> {
  // Total collected (paid debts)
  const { data: paidDebts } = await supabase
    .from('debts')
    .select('amount')
    .eq('status', 'paid')

  const totalCollected = paidDebts?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0

  // Success rate
  const { count: totalDebts } = await supabase
    .from('debts')
    .select('*', { count: 'exact', head: true })

  const { count: paidCount } = await supabase
    .from('debts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'paid')

  const successRate = totalDebts && totalDebts > 0
    ? Math.round(((paidCount || 0) / totalDebts) * 100)
    : 0

  // Clients up to date (no pending/overdue debts)
  const { data: clientsWithDebt } = await supabase
    .from('debts')
    .select('client_id')
    .in('status', ['pending', 'overdue'])

  const uniqueClientsWithDebt = new Set(clientsWithDebt?.map(d => d.client_id) || []).size

  const { count: totalClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })

  const clientsUpToDate = (totalClients || 0) - uniqueClientsWithDebt

  // Pending review (receipts with status pending)
  const { count: pendingReview } = await supabase
    .from('receipts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  return {
    totalCollected,
    successRate,
    clientsUpToDate,
    pendingReview: pendingReview || 0,
  }
}

async function fetchAgingData(): Promise<AgingData[]> {
  const now = new Date()
  const ranges = [
    { label: '0-30 días', min: 0, max: 30 },
    { label: '31-60 días', min: 31, max: 60 },
    { label: '61-90 días', min: 61, max: 90 },
    { label: '90+ días', min: 91, max: 9999 },
  ]

  const results: AgingData[] = []

  for (const range of ranges) {
    const minDate = new Date(now)
    minDate.setDate(minDate.getDate() - range.max)
    const maxDate = new Date(now)
    maxDate.setDate(maxDate.getDate() - range.min)

    const { data } = await supabase
      .from('debts')
      .select('amount')
      .eq('status', 'overdue')
      .gte('due_date', minDate.toISOString())
      .lt('due_date', maxDate.toISOString())

    results.push({
      range: range.label,
      count: data?.length || 0,
      amount: data?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0,
    })
  }

  return results
}

async function fetchMonthlyCollections(): Promise<MonthlyCollection[]> {
  const months: MonthlyCollection[] = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const startDate = date.toISOString()
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString()

    const { data } = await supabase
      .from('receipts')
      .select('amount')
      .eq('status', 'approved')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    months.push({
      month: monthNames[date.getMonth()],
      amount: data?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0,
    })
  }

  return months
}

async function fetchStatusDistribution(): Promise<StatusDistribution[]> {
  const statuses = [
    { status: 'pending', name: 'Pendiente', color: '#f59e0b' },
    { status: 'paid', name: 'Pagado', color: '#22c55e' },
    { status: 'overdue', name: 'Vencido', color: '#ef4444' },
  ]

  const results: StatusDistribution[] = []

  for (const s of statuses) {
    const { count } = await supabase
      .from('debts')
      .select('*', { count: 'exact', head: true })
      .eq('status', s.status)

    results.push({
      name: s.name,
      value: count || 0,
      color: s.color,
    })
  }

  return results
}

async function fetchRecentActivities(): Promise<RecentActivity[]> {
  const activities: RecentActivity[] = []

  // Recent receipts
  const { data: receipts } = await supabase
    .from('receipts')
    .select('id, status, created_at, client_id')
    .order('created_at', { ascending: false })
    .limit(5)

  // Get client names for receipts
  const receiptClientIds = receipts?.map(r => r.client_id).filter(Boolean) || []
  const { data: receiptClients } = receiptClientIds.length > 0
    ? await supabase.from('clients').select('id, name').in('id', receiptClientIds)
    : { data: [] }
  const receiptClientMap = new Map(receiptClients?.map(c => [c.id, c.name]) || [])

  receipts?.forEach(r => {
    activities.push({
      id: r.id,
      type: 'receipt',
      client_name: receiptClientMap.get(r.client_id) || 'Desconocido',
      description: `Comprobante enviado`,
      status: r.status,
      created_at: r.created_at,
    })
  })

  // Recent conversations
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, state, created_at, client_id')
    .order('created_at', { ascending: false })
    .limit(5)

  // Get client names for conversations
  const convClientIds = conversations?.map(c => c.client_id).filter(Boolean) || []
  const { data: convClients } = convClientIds.length > 0
    ? await supabase.from('clients').select('id, name').in('id', convClientIds)
    : { data: [] }
  const convClientMap = new Map(convClients?.map(c => [c.id, c.name]) || [])

  conversations?.forEach(c => {
    activities.push({
      id: c.id,
      type: 'conversation',
      client_name: convClientMap.get(c.client_id) || 'Desconocido',
      description: `Conversación iniciada`,
      status: c.state,
      created_at: c.created_at,
    })
  })

  // Sort by date and take top 10
  return activities
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = async () => {
    setLoading(true)
    setError(null)

    try {
      const [stats, aging, monthly, distribution, activities] = await Promise.all([
        fetchStats(),
        fetchAgingData(),
        fetchMonthlyCollections(),
        fetchStatusDistribution(),
        fetchRecentActivities(),
      ])

      setData({ stats, aging, monthly, distribution, activities })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()

    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'debts' },
        () => fetchDashboard()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'receipts' },
        () => fetchDashboard()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => fetchDashboard()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { data, loading, error, refetch: fetchDashboard }
}
