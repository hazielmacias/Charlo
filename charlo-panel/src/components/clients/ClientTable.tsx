import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2, Eye, MoreVertical } from 'lucide-react'
import { useState } from 'react'
import type { Client } from '../../types/client'

interface ClientTableProps {
  clients: Client[]
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '--'
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-600',
  blocked: 'bg-red-50 text-red-700',
}

const statusLabels: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  blocked: 'Bloqueado',
}

export function ClientTable({ clients, onEdit, onDelete }: ClientTableProps) {
  const navigate = useNavigate()
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
        <p className="text-gray-500 text-sm">No se encontraron clientes</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                Nombre
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                Teléfono
              </th>
              <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                Deuda Total
              </th>
              <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                Último Contacto
              </th>
              <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700">
                        {client.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {client.name}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">
                  {client.phone}
                </td>
                <td className="px-5 py-3 text-sm font-medium text-gray-900 text-right">
                  {formatCurrency(client.debt_total)}
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusStyles[client.status]}`}>
                    {statusLabels[client.status]}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-gray-500">
                  {formatDate(client.last_contact)}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => navigate(`/clients/${client.id}`)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Ver detalle"
                    >
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => onEdit(client)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => onDelete(client)}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {clients.map((client) => (
          <div key={client.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-700">
                    {client.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{client.name}</p>
                  <p className="text-xs text-gray-500">{client.phone}</p>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === client.id ? null : client.id)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
                {openMenu === client.id && (
                  <div className="absolute right-0 top-8 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => {
                        navigate(`/clients/${client.id}`)
                        setOpenMenu(null)
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" /> Ver
                    </button>
                    <button
                      onClick={() => {
                        onEdit(client)
                        setOpenMenu(null)
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Pencil className="w-4 h-4" /> Editar
                    </button>
                    <button
                      onClick={() => {
                        onDelete(client)
                        setOpenMenu(null)
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusStyles[client.status]}`}>
                {statusLabels[client.status]}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(client.debt_total)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
