import { useState } from 'react'
import { useReceipts } from '../hooks/useReceipts'
import { ReceiptTable } from '../components/receipts/ReceiptTable'
import { RejectModal } from '../components/receipts/RejectModal'
import { Search, X } from 'lucide-react'
import type { Receipt } from '../types/receipt'

export function Receipts() {
  const {
    receipts,
    error,
    pendingCount,
    filters,
    setSearch,
    setStatus,
    setPage,
    approveReceipt,
    rejectReceipt,
    requestClarification,
  } = useReceipts()

  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)

  const handleApprove = async (receipt: Receipt) => {
    try {
      await approveReceipt(receipt)
    } catch (err) {
      console.error('Error approving receipt:', err)
    }
  }

  const handleReject = async (reason: string) => {
    if (!selectedReceipt) return
    try {
      await rejectReceipt(selectedReceipt.id, reason)
      setShowRejectModal(false)
      setSelectedReceipt(null)
    } catch (err) {
      console.error('Error rejecting receipt:', err)
    }
  }

  const handleClarification = async (receipt: Receipt) => {
    try {
      await requestClarification(receipt)
    } catch (err) {
      console.error('Error requesting clarification:', err)
    }
  }

  const receiptData = receipts?.data || []
  const totalPages = receipts?.totalPages || 1

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Comprobantes</h1>
<p className="text-sm text-gray-500 mt-0.5">
           {receipts?.total || 0} comprobantes recibidos
          {pendingCount > 0 && (
            <span className="ml-2 text-amber-500 font-medium">{pendingCount} pendientes</span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente o monto..."
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
            />
            {filters.search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>
          <select
            value={filters.status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white appearance-none cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="approved">Aprobado</option>
            <option value="rejected">Rechazado</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Table */}
      <ReceiptTable
        receipts={receiptData}
        onApprove={handleApprove}
        onReject={(receipt) => {
          setSelectedReceipt(receipt)
          setShowRejectModal(true)
        }}
        onClarification={handleClarification}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
<p className="text-sm text-gray-500">
             Pagina {filters.page} de {totalPages}
           </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(filters.page - 1)}
              disabled={filters.page <= 1}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(filters.page + 1)}
              disabled={filters.page >= totalPages}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      <RejectModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false)
          setSelectedReceipt(null)
        }}
        onConfirm={handleReject}
      />
    </div>
  )
}
