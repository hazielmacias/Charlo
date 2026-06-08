import { useState } from 'react'
import { CheckCircle, Trash2, MoreVertical, ExternalLink, FileX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Debt } from '../../types/debt'

interface DebtTableProps {
  debts: Debt[]
  onMarkPaid: (debt: Debt) => void
  onDelete: (debt: Debt) => void
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  overdue: 'bg-red-50 text-red-700',
  paid: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-gray-100 text-gray-600',
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  overdue: 'Vencida',
  paid: 'Pagada',
  cancelled: 'Cancelada',
}

export function DebtTable({ debts, onMarkPaid, onDelete }: DebtTableProps) {
  const navigate = useNavigate()
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  if (debts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <FileX className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm">No se encontraron deudas</p>
        <p className="text-gray-400 text-xs mt-1">Crea una deuda para un cliente existente</p>
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
                Cliente
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                Descripción
              </th>
              <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                Monto
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                Vencimiento
              </th>
              <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {debts.map((debt) => (
              <tr key={debt.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700">
                        {debt.client?.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {debt.client?.name || 'Desconocido'}
                      </p>
                      <p className="text-xs text-gray-500">{debt.client?.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">
                  {debt.description}
                </td>
                <td className="px-5 py-3 text-sm font-medium text-gray-900 text-right">
                  {formatCurrency(debt.amount)}
                </td>
                <td className="px-5 py-3 text-sm text-gray-500">
                  {formatDate(debt.due_date)}
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusStyles[debt.status]}`}>
                    {statusLabels[debt.status]}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => navigate(`/clients/${debt.client_id}`)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Ver cliente"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                    </button>
                    {debt.status !== 'paid' && (
                      <button
                        onClick={() => onMarkPaid(debt)}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                        title="Marcar como pagada"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(debt)}
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
        {debts.map((debt) => (
          <div key={debt.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-700">
                    {debt.client?.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {debt.client?.name || 'Desconocido'}
                  </p>
                  <p className="text-xs text-gray-500">{debt.description}</p>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === debt.id ? null : debt.id)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
                {openMenu === debt.id && (
                  <div className="absolute right-0 top-8 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => {
                        navigate(`/clients/${debt.client_id}`)
                        setOpenMenu(null)
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" /> Ver cliente
                    </button>
                    {debt.status !== 'paid' && (
                      <button
                        onClick={() => {
                          onMarkPaid(debt)
                          setOpenMenu(null)
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-emerald-50 text-emerald-600 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Marcar pagada
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onDelete(debt)
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
              <div className="flex items-center gap-2">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusStyles[debt.status]}`}>
                  {statusLabels[debt.status]}
                </span>
                <span className="text-xs text-gray-500">
                  Vence: {formatDate(debt.due_date)}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(debt.amount)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
