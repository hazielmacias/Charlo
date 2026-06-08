import { useState } from 'react'
import { useDebts } from '../hooks/useDebts'
import { DebtTable } from '../components/debts/DebtTable'
import { DebtModal } from '../components/debts/DebtModal'
import { DebtImport } from '../components/debts/DebtImport'
import { Plus, Search, X, Upload } from 'lucide-react'

export function Debts() {
  const {
    debts,
    error,
    filters,
    setSearch,
    setStatus,
    setPage,
    createDebt,
    markAsPaid,
    deleteDebt,
    importDebts,
  } = useDebts()

  const [showModal, setShowModal] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const handleCreate = async (data: { client_id: string; description: string; amount: number; due_date: string }) => {
    await createDebt(data)
    setShowModal(false)
  }

  const debtData = debts?.data || []
  const total = debts?.total || 0
  const totalPages = debts?.totalPages || 1

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Cobros</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {total} cobros registrados
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importar
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 active:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cobro
          </button>
        </div>
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
              placeholder="Buscar por cliente o descripcion..."
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
            <option value="overdue">Vencida</option>
            <option value="paid">Pagada</option>
            <option value="cancelled">Cancelada</option>
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
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <DebtTable
          debts={debtData}
          onMarkPaid={(debt) => markAsPaid(debt.id)}
          onDelete={(debt) => deleteDebt(debt.id)}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
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

      {/* Modals */}
      <DebtModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreate}
      />
      <DebtImport
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={importDebts}
      />
    </div>
  )
}
