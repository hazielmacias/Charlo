export interface Debt {
  id: string
  client_id: string
  description: string
  amount: number
  status: 'pending' | 'overdue' | 'paid' | 'cancelled'
  due_date: string
  created_at: string
  updated_at: string
  // Joined data
  client?: {
    id: string
    name: string
    phone: string
  }
}

export interface DebtFilters {
  search: string
  status: 'all' | 'pending' | 'overdue' | 'paid' | 'cancelled'
  clientId: string
  dateFrom: string
  dateTo: string
  amountMin: string
  amountMax: string
  page: number
  limit: number
}

export interface PaginatedDebts {
  data: Debt[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface DebtImportRow {
  client_phone: string
  client_name?: string
  description: string
  amount: number
  due_date: string
  client_id?: string
  valid: boolean
  errors: string[]
}

export interface DebtImportResult {
  created: number
  errors: number
  details: { row: number; error: string }[]
}
