import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type {
  DebtFilters,
  PaginatedDebts,
  DebtImportRow,
  DebtImportResult,
} from '../types/debt'

const DEFAULT_LIMIT = 10

export function useDebts() {
  const [debts, setDebts] = useState<PaginatedDebts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<DebtFilters>({
    search: '',
    status: 'all',
    clientId: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    page: 1,
    limit: DEFAULT_LIMIT,
  })

  const fetchDebts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('debts')
        .select('*, client:clients(id, name, phone)', { count: 'exact' })

      // Search by client name or phone
      if (filters.search) {
        // First get matching client IDs
        const { data: matchingClients } = await supabase
          .from('clients')
          .select('id')
          .or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)

        const clientIds = matchingClients?.map(c => c.id) || []
        if (clientIds.length > 0) {
          query = query.or(`description.ilike.%${filters.search}%,client_id.in.(${clientIds.join(',')})`)
        } else {
          query = query.ilike('description', `%${filters.search}%`)
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
        query = query.gte('due_date', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('due_date', filters.dateTo)
      }

      // Filter by amount range
      if (filters.amountMin) {
        query = query.gte('amount', parseFloat(filters.amountMin))
      }
      if (filters.amountMax) {
        query = query.lte('amount', parseFloat(filters.amountMax))
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

      setDebts({
        data: data || [],
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar deudas')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchDebts()
  }, [fetchDebts])

  const setSearch = (search: string) => setFilters(prev => ({ ...prev, search, page: 1 }))
  const setStatus = (status: DebtFilters['status']) => setFilters(prev => ({ ...prev, status, page: 1 }))
  const setClientId = (clientId: string) => setFilters(prev => ({ ...prev, clientId, page: 1 }))
  const setDateFrom = (dateFrom: string) => setFilters(prev => ({ ...prev, dateFrom, page: 1 }))
  const setDateTo = (dateTo: string) => setFilters(prev => ({ ...prev, dateTo, page: 1 }))
  const setAmountMin = (amountMin: string) => setFilters(prev => ({ ...prev, amountMin, page: 1 }))
  const setAmountMax = (amountMax: string) => setFilters(prev => ({ ...prev, amountMax, page: 1 }))
  const setPage = (page: number) => setFilters(prev => ({ ...prev, page }))

  const createDebt = async (data: { client_id: string; description: string; amount: number; due_date: string }) => {
    const { error: insertError } = await supabase
      .from('debts')
      .insert(data)

    if (insertError) throw insertError
    await fetchDebts()
  }

  const markAsPaid = async (id: string) => {
    const { error: updateError } = await supabase
      .from('debts')
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateError) throw updateError
    await fetchDebts()
  }

  const deleteDebt = async (id: string) => {
    const { error: deleteError } = await supabase
      .from('debts')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError
    await fetchDebts()
  }

  const importDebts = async (rows: DebtImportRow[]): Promise<DebtImportResult> => {
    let created = 0
    let errors = 0
    const details: { row: number; error: string }[] = []

    // Get all clients for phone lookup
    const { data: clients } = await supabase
      .from('clients')
      .select('id, phone')

    const clientMap = new Map(clients?.map(c => [c.phone, c.id]) || [])

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        // Find client by phone
        const clientId = row.client_id || clientMap.get(row.client_phone)

        if (!clientId) {
          throw new Error(`No se encontró cliente con teléfono ${row.client_phone}`)
        }

        const { error: insertError } = await supabase
          .from('debts')
          .insert({
            client_id: clientId,
            description: row.description,
            amount: row.amount,
            due_date: row.due_date,
            status: 'pending',
          })

        if (insertError) throw insertError
        created++
      } catch (err) {
        errors++
        details.push({
          row: i + 1,
          error: err instanceof Error ? err.message : 'Error desconocido',
        })
      }
    }

    await fetchDebts()
    return { created, errors, details }
  }

  return {
    debts,
    loading,
    error,
    filters,
    setSearch,
    setStatus,
    setClientId,
    setDateFrom,
    setDateTo,
    setAmountMin,
    setAmountMax,
    setPage,
    createDebt,
    markAsPaid,
    deleteDebt,
    importDebts,
    refetch: fetchDebts,
  }
}


