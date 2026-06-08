import { DollarSign, TrendingUp, Users, AlertCircle } from 'lucide-react'
import type { DashboardStats } from '../../types/dashboard'

interface KpiCardsProps {
  stats: DashboardStats
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const cards = [
  {
    key: 'totalCollected' as const,
    label: 'Total Recaudado',
    icon: DollarSign,
    format: (value: number) => formatCurrency(value),
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
  },
  {
    key: 'successRate' as const,
    label: 'Tasa de Exito',
    icon: TrendingUp,
    format: (value: number) => `${value}%`,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  {
    key: 'clientsUpToDate' as const,
    label: 'Clientes al Dia',
    icon: Users,
    format: (value: number) => value.toString(),
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-500',
  },
  {
    key: 'pendingReview' as const,
    label: 'Pendientes Revision',
    icon: AlertCircle,
    format: (value: number) => value.toString(),
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    badge: true,
  },
]

export function KpiCards({ stats }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.key}
          className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-gray-200 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center`}>
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
            {card.badge && stats[card.key] > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[10px] font-semibold bg-red-100 text-red-600 rounded-full">
                {stats[card.key]}
              </span>
            )}
          </div>
          <p className="text-[13px] text-gray-400">{card.label}</p>
          <p className="text-xl font-semibold text-gray-900 mt-0.5">
            {card.format(stats[card.key])}
          </p>
        </div>
      ))}
    </div>
  )
}
