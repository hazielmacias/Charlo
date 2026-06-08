import type { RecentActivity } from '../../types/dashboard'

interface ActivityTableProps {
  activities: RecentActivity[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return 'Ahora mismo'
  if (diffMin < 60) return `Hace ${diffMin} min`
  if (diffHour < 24) return `Hace ${diffHour}h`
  if (diffDay === 1) return 'Ayer'
  if (diffDay < 7) return `Hace ${diffDay} días`
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'paid':
    case 'completed':
      return 'bg-emerald-50 text-emerald-600'
    case 'rejected':
      return 'bg-red-50 text-red-600'
    case 'pending':
    case 'awaiting_payment':
    case 'awaiting_receipt':
      return 'bg-amber-50 text-amber-600'
    case 'active':
    case 'sent':
      return 'bg-blue-50 text-blue-600'
    default:
      return 'bg-gray-50 text-gray-500'
  }
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    paid: 'Pagado',
    pending: 'Pendiente',
    active: 'Activo',
    sent: 'Enviado',
    rejected: 'Rechazado',
    awaiting_payment: 'Pago Pendiente',
    awaiting_receipt: 'Comprobante Pendiente',
    completed: 'Completado',
  }
  return labels[status] || status
}

export function ActivityTable({ activities }: ActivityTableProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Ultimas Actividades
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">Resumen de movimientos recientes</p>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          Sin actividad reciente
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-gray-900 truncate">
                  {activity.client_name}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {activity.description} · {formatRelativeTime(activity.created_at)}
                </p>
              </div>
              <div className="ml-3 flex items-center gap-2">
                {activity.amount != null && activity.amount > 0 && (
                  <span className="text-[13px] font-medium text-gray-700">
                    {formatCurrency(activity.amount)}
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${getStatusStyle(
                    activity.status
                  )}`}
                >
                  {getStatusLabel(activity.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
