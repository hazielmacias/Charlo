export interface Client {
  id: string
  name: string
  phone: string
  email?: string
  debt_total: number
  status: 'active' | 'inactive' | 'contacted'
  last_contact_at?: string
  created_at: string
  updated_at: string
}

export interface Debt {
  id: string
  client_id: string
  description: string
  amount: number
  status: 'pending' | 'overdue' | 'paid' | 'cancelled'
  due_date: string
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  client_id: string
  phone: string
  state: string
  context?: Record<string, unknown>
  created_at: string
  updated_at: string
  last_message_at: string
}

export interface Message {
  id: string
  conversation_id: string
  direction: 'inbound' | 'outbound'
  type: 'text' | 'image' | 'document' | 'interactive'
  content: string
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'received'
  created_at: string
}

export interface Receipt {
  id: string
  client_id: string
  debt_id?: string
  file_url: string
  file_type: string
  amount?: number
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  created_at: string
}

export interface ClientDetail extends Client {
  debts: Debt[]
  conversations: Conversation[]
  receipts: Receipt[]
}

export type ClientStatus = 'all' | 'active' | 'inactive' | 'contacted'

export interface ClientFilters {
  search: string
  status: ClientStatus
  page: number
  limit: number
}

export interface PaginatedClients {
  data: Client[]
  total: number
  page: number
  limit: number
  totalPages: number
}
