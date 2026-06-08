export type ConversationState =
  | 'menu'
  | 'viewing_debt'
  | 'awaiting_payment'
  | 'sent_bank_details'
  | 'receipt_received'
  | 'human_agent'
  | 'closed'

export type MessageDirection = 'inbound' | 'outbound'
export type MessageType = 'text' | 'image' | 'document' | 'interactive' | 'template'
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'received'

export interface Conversation {
  id: string
  client_id: string
  phone: string
  state: ConversationState
  context?: Record<string, unknown>
  created_at: string
  updated_at: string
  last_message_at: string
}

export interface Message {
  id: string
  conversation_id: string
  direction: MessageDirection
  type: MessageType
  content: string
  media_url?: string
  status: MessageStatus
  metadata?: Record<string, unknown>
  created_at: string
}

export interface ConversationClient {
  id: string
  name: string
  phone: string
  debt_total: number
}

export interface ConversationListItem {
  id: string
  client_id: string
  phone: string
  state: ConversationState
  last_message_at: string
  client: ConversationClient
  lastMessage?: {
    content: string
    direction: MessageDirection
    type: MessageType
  }
  unreadCount: number
}

export interface ConversationDetail {
  id: string
  client_id: string
  phone: string
  state: ConversationState
  context?: Record<string, unknown>
  created_at: string
  updated_at: string
  last_message_at: string
  client: ConversationClient
  messages: Message[]
}

export type ConversationFilterState = 'all' | ConversationState

export interface ConversationFilters {
  search: string
  state: ConversationFilterState
}

export const CONVERSATION_STATE_LABELS: Record<ConversationState, string> = {
  menu: 'Menu',
  viewing_debt: 'Viendo deuda',
  awaiting_payment: 'Esperando pago',
  sent_bank_details: 'Datos bancarios',
  receipt_received: 'Comprobante recibido',
  human_agent: 'Agente humano',
  closed: 'Cerrada',
}

export const CONVERSATION_STATE_COLORS: Record<ConversationState, string> = {
  menu: 'bg-blue-100 text-blue-700',
  viewing_debt: 'bg-yellow-100 text-yellow-700',
  awaiting_payment: 'bg-orange-100 text-orange-700',
  sent_bank_details: 'bg-purple-100 text-purple-700',
  receipt_received: 'bg-green-100 text-green-700',
  human_agent: 'bg-red-100 text-red-700',
  closed: 'bg-gray-100 text-gray-500',
}
