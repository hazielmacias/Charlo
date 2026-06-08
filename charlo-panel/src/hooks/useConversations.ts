import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type {
  Conversation,
  ConversationListItem,
  ConversationDetail,
  ConversationFilters,
  Message,
} from '../types/conversation'

export function useConversations(filters: ConversationFilters) {
  const [conversations, setConversations] = useState<ConversationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('conversations')
        .select(`
          id,
          client_id,
          phone,
          state,
          last_message_at,
          created_at,
          client:clients(id, name, phone, debt_total)
        `)
        .neq('state', 'closed')

      if (filters.search) {
        query = query.or(`phone.ilike.%${filters.search}%`)
      }

      if (filters.state !== 'all') {
        query = query.eq('state', filters.state)
      }

      const { data: convData, error: convError } = await query
        .order('last_message_at', { ascending: false })
        .limit(50)

      if (convError) throw convError

      const enriched = await Promise.all(
        (convData || []).map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, direction, type')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          const client = Array.isArray(conv.client) ? conv.client[0] : conv.client

          return {
            ...conv,
            client: client || { id: conv.client_id, name: 'Desconocido', phone: conv.phone, debt_total: 0 },
            lastMessage: lastMsg || undefined,
            unreadCount: 0,
          }
        })
      )

      setConversations(enriched)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar conversaciones')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    const channel = supabase
      .channel('conversations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchConversations()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchConversations])

  return { conversations, loading, error, refetch: fetchConversations }
}

export function useConversation(conversationId: string | null) {
  const [conversation, setConversation] = useState<ConversationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConversation = useCallback(async () => {
    if (!conversationId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (convError) throw convError

      const { data: client } = await supabase
        .from('clients')
        .select('id, name, phone, debt_total')
        .eq('id', conv.client_id)
        .single()

      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      setConversation({
        ...conv,
        client: client || { id: conv.client_id, name: 'Desconocido', phone: conv.phone, debt_total: 0 },
        messages: messages || [],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar conversación')
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    fetchConversation()
  }, [fetchConversation])

  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        setConversation((prev) => {
          if (!prev) return prev
          const newMsg = payload.new as Message
          if (prev.messages.some((m) => m.id === newMsg.id)) return prev
          return { ...prev, messages: [...prev.messages, newMsg] }
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `id=eq.${conversationId}` }, (payload) => {
        setConversation((prev) => {
          if (!prev) return prev
          const updated = payload.new as Conversation
          return { ...prev, state: updated.state, last_message_at: updated.last_message_at }
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  return { conversation, loading, error, refetch: fetchConversation }
}

export function useSendMessage() {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (
    conversationId: string,
    phone: string,
    text: string
  ) => {
    setSending(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phone,
          type: 'text',
          conversation_id: conversationId,
          content: { text },
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al enviar mensaje')
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar mensaje')
      return false
    } finally {
      setSending(false)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { sendMessage, sending, error, clearError }
}
