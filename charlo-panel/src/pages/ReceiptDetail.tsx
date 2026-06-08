import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, CheckCircle, XCircle, MessageSquare, Download, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { RejectModal } from '../components/receipts/RejectModal'
import type { Receipt } from '../types/receipt'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
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
  pending: 'bg-amber-50 text-amber-600',
  approved: 'bg-emerald-50 text-emerald-600',
  rejected: 'bg-red-50 text-red-600',
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
}

export function ReceiptDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [loading, setLoading] = useState(true)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)

  useEffect(() => {
    const fetchReceipt = async () => {
      if (!id) return

      const { data, error } = await supabase
        .from('receipts')
        .select('*, client:clients(id, name, phone), debt:debts(id, description, amount, status)')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching receipt:', error)
      } else {
        setReceipt(data)
      }
      setLoading(false)
    }

    fetchReceipt()
  }, [id])

  const handleApprove = async () => {
    if (!receipt) return

    await supabase
      .from('receipts')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', receipt.id)

    if (receipt.debt_id) {
      await supabase
        .from('debts')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', receipt.debt_id)
    }

    if (receipt.client_id) {
      const { data: pendingDebts } = await supabase
        .from('debts')
        .select('amount')
        .eq('client_id', receipt.client_id)
        .in('status', ['pending', 'overdue'])

      const total = pendingDebts?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0
      await supabase
        .from('clients')
        .update({ debt_total: total })
        .eq('id', receipt.client_id)
    }

    const { data } = await supabase
      .from('receipts')
      .select('*, client:clients(id, name, phone), debt:debts(id, description, amount, status)')
      .eq('id', receipt.id)
      .single()

    setReceipt(data)
  }

  const handleReject = async (notes: string) => {
    if (!receipt) return

    await supabase
      .from('receipts')
      .update({
        status: 'rejected',
        notes,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', receipt.id)

    const { data } = await supabase
      .from('receipts')
      .select('*, client:clients(id, name, phone), debt:debts(id, description, amount, status)')
      .eq('id', receipt.id)
      .single()

    setReceipt(data)
  }

  const handleRequestClarification = async () => {
    if (!receipt?.client?.phone) return

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: receipt.client.phone,
          type: 'text',
          content: {
            text: `Hola ${receipt.client.name}, recibimos tu comprobante pero necesitamos verificar algunos datos. Podrias enviarnos el comprobante de pago nuevamente, por favor? Asegurate de que se lean bien los datos.`,
          },
        }),
      })
      alert('Mensaje de aclaracion enviado')
    } catch (err) {
      alert('Error al enviar mensaje')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-xl w-48"></div>
        <div className="h-64 bg-gray-200 rounded-2xl"></div>
      </div>
    )
  }

  if (!receipt) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Comprobante no encontrado</p>
        <button
          onClick={() => navigate('/receipts')}
          className="mt-4 text-blue-500 hover:text-blue-600 text-sm font-medium"
        >
          Volver a comprobantes
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/receipts')}
            className="p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Detalle del Comprobante</h1>
            <p className="text-sm text-gray-400">Comprobante de pago</p>
          </div>
        </div>
        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${statusStyles[receipt.status]}`}>
          {statusLabels[receipt.status]}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Preview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Comprobante</h3>
          </div>
          <div className="p-4">
            {receipt.file_type?.startsWith('image/') ? (
              <img
                src={receipt.file_url}
                alt="Comprobante de pago"
                className="w-full rounded-xl object-contain max-h-[500px]"
              />
            ) : receipt.file_type === 'application/pdf' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-red-500">PDF</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">Documento PDF</p>
                <a
                  href={receipt.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Abrir PDF
                </a>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">Tipo de archivo no soportado para vista previa</p>
                <a
                  href={receipt.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-4">
          {/* Client info */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Datos del Cliente</h3>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <p className="text-[11px] text-gray-400">Nombre</p>
                <p className="text-[13px] font-medium text-gray-900">{receipt.client?.name || '--'}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Telefono</p>
                <p className="text-[13px] font-medium text-gray-900">{receipt.client?.phone || '--'}</p>
              </div>
              {receipt.client && (
                <button
                  onClick={() => navigate(`/clients/${receipt.client?.id}`)}
                  className="inline-flex items-center gap-1 text-[13px] text-blue-500 hover:text-blue-600"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ver cliente
                </button>
              )}
            </div>
          </div>

          {/* Debt info */}
          {receipt.debt && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Deuda Asociada</h3>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <p className="text-[11px] text-gray-400">Descripcion</p>
                  <p className="text-[13px] font-medium text-gray-900">{receipt.debt.description}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">Monto</p>
                  <p className="text-[13px] font-medium text-gray-900">{formatCurrency(receipt.debt.amount)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">Estado</p>
                  <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${statusStyles[receipt.debt.status]}`}>
                    {receipt.debt.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Receipt details */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Detalles</h3>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <p className="text-[11px] text-gray-400">Fecha de envio</p>
                <p className="text-[13px] font-medium text-gray-900">{formatDate(receipt.created_at)}</p>
              </div>
              {receipt.reviewed_at && (
                <div>
                  <p className="text-[11px] text-gray-400">Revisado el</p>
                  <p className="text-[13px] font-medium text-gray-900">{formatDate(receipt.reviewed_at)}</p>
                </div>
              )}
              {receipt.notes && (
                <div>
                  <p className="text-[11px] text-gray-400">Notas</p>
                  <p className="text-[13px] text-gray-600">{receipt.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {receipt.status === 'pending' && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Acciones</h3>
              </div>
              <div className="p-4 space-y-2">
                <button
                  onClick={handleApprove}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aprobar y Marcar Deuda como Pagada
                </button>
                <button
                  onClick={() => setRejectModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Rechazar
                </button>
                <button
                  onClick={handleRequestClarification}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Pedir Aclaracion por WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      <RejectModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleReject}
      />
    </div>
  )
}
