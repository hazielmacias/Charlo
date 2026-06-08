import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Phone,
  Mail,
  Clock,
  FileText,
  MessageSquare,
  Receipt,
} from 'lucide-react'
import { useClientDetail, useClientMessages } from '../hooks/useClients'

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
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-600',
  inactive: 'bg-gray-100 text-gray-500',
  blocked: 'bg-red-50 text-red-600',
  pending: 'bg-amber-50 text-amber-600',
  overdue: 'bg-red-50 text-red-600',
  paid: 'bg-emerald-50 text-emerald-600',
  cancelled: 'bg-gray-100 text-gray-500',
}

const statusLabels: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  blocked: 'Bloqueado',
  pending: 'Pendiente',
  overdue: 'Vencida',
  paid: 'Pagada',
  cancelled: 'Cancelada',
}

export function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { client, loading, error } = useClientDetail(id || null)

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-xl w-48"></div>
        <div className="h-64 bg-gray-200 rounded-2xl"></div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{error || 'Cliente no encontrado'}</p>
        <button
          onClick={() => navigate('/clients')}
          className="mt-4 text-blue-500 hover:text-blue-600 text-sm font-medium"
        >
          Volver a clientes
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/clients')}
          className="p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900">{client.name}</h1>
          <p className="text-sm text-gray-400">{client.phone}</p>
        </div>
        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${statusStyles[client.status]}`}>
          {statusLabels[client.status]}
        </span>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Phone className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Telefono</p>
              <p className="text-[13px] font-medium text-gray-900">{client.phone}</p>
            </div>
          </div>
        </div>
        {client.email && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl">
                <Mail className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Email</p>
                <p className="text-[13px] font-medium text-gray-900">{client.email}</p>
              </div>
            </div>
          </div>
        )}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-xl">
              <FileText className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Deuda Total</p>
              <p className="text-[13px] font-medium text-gray-900">{formatCurrency(client.debt_total)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-xl">
              <Clock className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Ultimo Contacto</p>
              <p className="text-[13px] font-medium text-gray-900">
                {client.last_contact ? formatDate(client.last_contact) : '--'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Debts */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              Deudas ({client.debts.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-auto">
            {client.debts.length === 0 ? (
              <p className="p-5 text-sm text-gray-400 text-center">Sin deudas registradas</p>
            ) : (
              client.debts.map((debt) => (
                <div key={debt.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-gray-900">{debt.description}</p>
                      <p className="text-[11px] text-gray-400">
                        Vence: {formatDate(debt.due_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-medium text-gray-900">{formatCurrency(debt.amount)}</p>
                      <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${statusStyles[debt.status]}`}>
                        {statusLabels[debt.status]}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Conversations */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              Conversaciones ({client.conversations.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-auto">
            {client.conversations.length === 0 ? (
              <p className="p-5 text-sm text-gray-400 text-center">Sin conversaciones</p>
            ) : (
              client.conversations.map((conv) => (
                <ConversationItem key={conv.id} conversation={conv} />
              ))
            )}
          </div>
        </div>

        {/* Receipts */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-gray-400" />
              Comprobantes ({client.receipts.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-auto">
            {client.receipts.length === 0 ? (
              <p className="p-5 text-sm text-gray-400 text-center">Sin comprobantes enviados</p>
            ) : (
              client.receipts.map((receipt) => (
                <div key={receipt.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded-xl">
                        <Receipt className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-gray-900">
                          Comprobante #{receipt.id.slice(0, 8)}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {formatDate(receipt.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {receipt.amount && (
                        <p className="text-[13px] font-medium text-gray-900">
                          {formatCurrency(receipt.amount)}
                        </p>
                      )}
                      <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${statusStyles[receipt.status]}`}>
                        {receipt.status === 'pending' ? 'Pendiente' : receipt.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ConversationItem({ conversation }: { conversation: any }) {
  const { messages, loading } = useClientMessages(conversation.id)

  return (
    <div className="px-5 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[13px] font-medium text-gray-900">
          Estado: {conversation.state}
        </p>
        <p className="text-[11px] text-gray-400">
          {formatDate(conversation.last_message_at)}
        </p>
      </div>
      {loading ? (
        <div className="h-4 bg-gray-100 rounded-xl w-3/4"></div>
      ) : (
        <div className="space-y-1">
          {messages.slice(-3).map((msg: any) => (
            <div
              key={msg.id}
              className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-3 py-1.5 rounded-xl text-[11px] ${
                  msg.direction === 'outbound'
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
