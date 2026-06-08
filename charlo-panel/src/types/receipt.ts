export interface Receipt {
  id: string
  client_id: string
  debt_id?: string
  file_url: string
  file_type: string
  amount?: number
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  reviewed_at?: string
  reviewed_by?: string
  created_at: string
  // Joined data
  client?: {
    id: string
    name: string
    phone: string
  }
  debt?: {
    id: string
    description: string
    amount: number
    status: string
  }
}

export interface ReceiptFilters {
  search: string
  status: 'all' | 'pending' | 'approved' | 'rejected'
  clientId: string
  dateFrom: string
  dateTo: string
  page: number
  limit: number
}

export interface PaginatedReceipts {
  data: Receipt[]
  total: number
  page: number
  limit: number
  totalPages: number
}
