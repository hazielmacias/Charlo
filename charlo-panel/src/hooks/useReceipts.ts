import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Receipt, ReceiptFilters, PaginatedReceipts } from '../types/receipt'

const DEFAULT_LIMIT = 10

export function useReceipts() {
  const [receipts, setReceipts] = useState<PaginatedReceipts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [filters, setFilters] = useState<ReceiptFilters>({
    search: '',
    status: 'all',
    clientId: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: DEFAULT_LIMIT,
  })

  const fetchReceipts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('receipts')
        .select('*, client:clients(id, name, phone), debt:debts(id, description, amount)', { count: 'exact' })

      // Search by client name or phone
      if (filters.search) {
        const { data: matchingClients } = await supabase
          .from('clients')
          .select('id')
          .or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)

        const clientIds = matchingClients?.map(c => c.id) || []
        if (clientIds.length > 0) {
          query = query.in('client_id', clientIds)
        } else {
          // No matching clients, return empty
          setReceipts({ data: [], total: 0, page: 1, limit: filters.limit, totalPages: 0 })
          setLoading(false)
          return
        }
      }

      // Filter by status
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      // Filter by client
      if (filters.clientId) {
        query = query.eq('client_id', filters.clientId)
      }

      // Filter by date range
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo)
        endDate.setDate(endDate.getDate() + 1)
        query = query.lt('created_at', endDate.toISOString())
      }

      // Pagination
      const from = (filters.page - 1) * filters.limit
      const to = from + filters.limit - 1

      const { data, count, error: fetchError } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (fetchError) throw fetchError

      const total = count || 0
      const totalPages = Math.ceil(total / filters.limit)

      setReceipts({
        data: data || [],
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar comprobantes')
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchPendingCount = async () => {
    const { count } = await supabase
      .from('receipts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    setPendingCount(count || 0)
  }

  useEffect(() => {
    fetchReceipts()
    fetchPendingCount()

    const channel = supabase
      .channel('receipts-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'receipts' },
        () => {
          fetchReceipts()
          fetchPendingCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchReceipts])

  const setSearch = (search: string) => setFilters(prev => ({ ...prev, search, page: 1 }))
  const setStatus = (status: ReceiptFilters['status']) => setFilters(prev => ({ ...prev, status, page: 1 }))
  const setClientId = (clientId: string) => setFilters(prev => ({ ...prev, clientId, page: 1 }))
  const setDateFrom = (dateFrom: string) => setFilters(prev => ({ ...prev, dateFrom, page: 1 }))
  const setDateTo = (dateTo: string) => setFilters(prev => ({ ...prev, dateTo, page: 1 }))
  const setPage = (page: number) => setFilters(prev => ({ ...prev, page }))

  const approveReceipt = async (receipt: Receipt) => {
    // Update receipt status
    const { error: updateError } = await supabase
      .from('receipts')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', receipt.id)

    if (updateError) throw updateError

    // Mark associated debt as paid
    if (receipt.debt_id) {
      const { error: debtError } = await supabase
        .from('debts')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', receipt.debt_id)

      if (debtError) console.error('Error marking debt as paid:', debtError)
    }

    // Update client debt total
    if (receipt.client_id) {
      await updateClientDebtTotal(receipt.client_id)
    }

    await fetchReceipts()
    await fetchPendingCount()
  }

  const rejectReceipt = async (id: string, notes: string) => {
    const { error: updateError } = await supabase
      .from('receipts')
      .update({
        status: 'rejected',
        notes,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) throw updateError
    await fetchReceipts()
    await fetchPendingCount()
  }

  const requestClarification = async (receipt: Receipt) => {
    // Send WhatsApp message to client
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const response = await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: receipt.client?.phone,
        type: 'text',
        content: {
          text: `Hola ${receipt.client?.name}, recibimos tu comprobante pero necesitamos verificar algunos datos. ¿Podrías enviarnos el comprobante de pago nuevamente, por favor? Asegúrate de que se lean bien los datos.`,
        },
      }),
    })

    if (!response.ok) {
      throw new Error('Error al enviar mensaje de aclaración')
    }
  }

  const updateClientDebtTotal = async (clientId: string) => {
    const { data: pendingDebts } = await supabase
      .from('debts')
      .select('amount')
      .eq('client_id', clientId)
      .in('status', ['pending', 'overdue'])

    const total = pendingDebts?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0

    await supabase
      .from('clients')
      .update({ debt_total: total })
      .eq('id', clientId)
  }

  return {
    receipts,
    loading,
    error,
    pendingCount,
    filters,
    setSearch,
    setStatus,
    setClientId,
    setDateFrom,
    setDateTo,
    setPage,
    approveReceipt,
    rejectReceipt,
    requestClarification,
    refetch: fetchReceipts,
    refetchPendingCount: fetchPendingCount,
  }
}
