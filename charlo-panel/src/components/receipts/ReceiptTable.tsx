import { useState } from 'react'
import { Eye, CheckCircle, XCircle, MessageSquare, MoreVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Receipt } from '../../types/receipt'

interface ReceiptTableProps {
  receipts: Receipt[]
  onApprove: (receipt: Receipt) => void
  onReject: (receipt: Receipt) => void
  onClarification: (receipt: Receipt) => void
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
}

export function ReceiptTable({ receipts, onApprove, onReject, onClarification }: ReceiptTableProps) {
  const navigate = useNavigate()
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  if (receipts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
        <p className="text-gray-500 text-sm">No se encontraron comprobantes</p>
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
                Deuda
              </th>
              <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                Monto
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                Fecha
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
            {receipts.map((receipt) => (
              <tr key={receipt.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700">
                        {receipt.client?.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {receipt.client?.name || 'Desconocido'}
                      </p>
                      <p className="text-xs text-gray-500">{receipt.client?.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">
                  {receipt.debt?.description || '--'}
                </td>
                <td className="px-5 py-3 text-sm font-medium text-gray-900 text-right">
                  {receipt.amount ? formatCurrency(receipt.amount) : receipt.debt ? formatCurrency(receipt.debt.amount) : '--'}
                </td>
                <td className="px-5 py-3 text-sm text-gray-500">
                  {formatDate(receipt.created_at)}
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusStyles[receipt.status]}`}>
                    {statusLabels[receipt.status]}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => navigate(`/receipts/${receipt.id}`)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Ver detalle"
                    >
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                    {receipt.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onApprove(receipt)}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                          title="Aprobar"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        </button>
                        <button
                          onClick={() => onReject(receipt)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="Rechazar"
                        >
                          <XCircle className="w-4 h-4 text-red-500" />
                        </button>
                        <button
                          onClick={() => onClarification(receipt)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Pedir aclaración"
                        >
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {receipts.map((receipt) => (
          <div key={receipt.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-700">
                    {receipt.client?.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {receipt.client?.name || 'Desconocido'}
                  </p>
                  <p className="text-xs text-gray-500">{receipt.debt?.description || 'Sin deuda asociada'}</p>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === receipt.id ? null : receipt.id)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
                {openMenu === receipt.id && (
                  <div className="absolute right-0 top-8 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => {
                        navigate(`/receipts/${receipt.id}`)
                        setOpenMenu(null)
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" /> Ver detalle
                    </button>
                    {receipt.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            onApprove(receipt)
                            setOpenMenu(null)
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-emerald-50 text-emerald-600 flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" /> Aprobar
                        </button>
                        <button
                          onClick={() => {
                            onReject(receipt)
                            setOpenMenu(null)
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" /> Rechazar
                        </button>
                        <button
                          onClick={() => {
                            onClarification(receipt)
                            setOpenMenu(null)
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 text-blue-600 flex items-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" /> Pedir aclaración
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusStyles[receipt.status]}`}>
                  {statusLabels[receipt.status]}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(receipt.created_at)}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {receipt.amount ? formatCurrency(receipt.amount) : receipt.debt ? formatCurrency(receipt.debt.amount) : '--'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
