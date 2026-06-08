import { useState } from 'react'
import { useClients } from '../hooks/useClients'
import { ClientTable } from '../components/clients/ClientTable'
import { ClientModal } from '../components/clients/ClientModal'
import { Plus, Search, X } from 'lucide-react'
import type { Client } from '../types/client'

export function Clients() {
  const {
    clients,
    error,
    filters,
    setSearch,
    setPage,
    createClient,
    updateClient,
    deleteClient,
  } = useClients()

  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const handleCreate = () => {
    setEditingClient(null)
    setShowModal(true)
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setShowModal(true)
  }

  const handleSubmit = async (
    data: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'debt_total' | 'last_contact'>
  ) => {
    if (editingClient) {
      await updateClient(editingClient.id, data)
    } else {
      await createClient(data)
    }
    setShowModal(false)
    setEditingClient(null)
  }

  const clientData = clients?.data || []
  const total = clients?.total || 0
  const totalPages = clients?.totalPages || 1

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Clientes</h1>
<p className="text-sm text-gray-500 mt-0.5">
             {total} clientes registrados
           </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 active:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o telefono..."
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
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <ClientTable
          clients={clientData}
          onEdit={handleEdit}
          onDelete={(client) => deleteClient(client.id)}
        />
      </div>

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

      {/* Modal */}
      <ClientModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingClient(null)
        }}
        client={editingClient}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
