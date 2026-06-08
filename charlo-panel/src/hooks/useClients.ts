import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type {
  Client,
  ClientDetail,
  ClientFilters,
  PaginatedClients,
} from '../types/client'

const DEFAULT_LIMIT = 10

export function useClients() {
  const [clients, setClients] = useState<PaginatedClients | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ClientFilters>({
    search: '',
    status: 'all',
    page: 1,
    limit: DEFAULT_LIMIT,
  })

  const fetchClients = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('clients')
        .select('*', { count: 'exact' })

      // Apply search filter
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
      }

      // Apply status filter
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      // Apply pagination
      const from = (filters.page - 1) * filters.limit
      const to = from + filters.limit - 1

      const { data, count, error: fetchError } = await query
        .order('name', { ascending: true })
        .range(from, to)

      if (fetchError) throw fetchError

      const total = count || 0
      const totalPages = Math.ceil(total / filters.limit)

      setClients({
        data: data || [],
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const setSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }))
  }

  const setStatus = (status: ClientFilters['status']) => {
    setFilters(prev => ({ ...prev, status, page: 1 }))
  }

  const setPage = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const createClient = async (data: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'debt_total'>) => {
    const { error: insertError } = await supabase
      .from('clients')
      .insert({
        name: data.name,
        phone: data.phone,
        email: data.email,
        status: data.status || 'active',
      })

    if (insertError) throw insertError
    await fetchClients()
  }

  const updateClient = async (id: string, data: Partial<Client>) => {
    const { error: updateError } = await supabase
      .from('clients')
      .update(data)
      .eq('id', id)

    if (updateError) throw updateError
    await fetchClients()
  }

  const deleteClient = async (id: string) => {
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError
    await fetchClients()
  }

  return {
    clients,
    loading,
    error,
    filters,
    setSearch,
    setStatus,
    setPage,
    createClient,
    updateClient,
    deleteClient,
    refetch: fetchClients,
  }
}

export function useClient(clientId: string | null) {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!clientId) {
      setLoading(false)
      return
    }

    const fetchClient = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single()

        if (fetchError) throw fetchError
        setClient(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar cliente')
      } finally {
        setLoading(false)
      }
    }

    fetchClient()
  }, [clientId])

  return { client, loading, error }
}

export function useClientDetail(clientId: string | null) {
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!clientId) {
      setLoading(false)
      return
    }

    const fetchClientDetail = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch client
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single()

        if (clientError) throw clientError

        // Fetch debts
        const { data: debts } = await supabase
          .from('debts')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })

        // Fetch conversations
        const { data: conversations } = await supabase
          .from('conversations')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })

        // Fetch receipts
        const { data: receipts } = await supabase
          .from('receipts')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })

        setClient({
          ...clientData,
          debts: debts || [],
          conversations: conversations || [],
          receipts: receipts || [],
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar cliente')
      } finally {
        setLoading(false)
      }
    }

    fetchClientDetail()
  }, [clientId])

  return { client, loading, error }
}

export function useClientMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!conversationId) {
      setLoading(false)
      return
    }

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      setMessages(data || [])
      setLoading(false)
    }

    fetchMessages()
  }, [conversationId])

  return { messages, loading }
}
