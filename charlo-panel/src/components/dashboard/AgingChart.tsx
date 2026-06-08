import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { AgingData } from '../../types/dashboard'

interface AgingChartProps {
  data: AgingData[]
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(value)
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: AgingData; value: number; name: string }>
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || !payload.length) return null
  const item = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-gray-900 mb-1">{item.range}</p>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500" />
        <span className="text-gray-500">Cantidad:</span>
        <span className="font-medium text-gray-900">{item.count}</span>
      </div>
      {item.amount > 0 && (
        <div className="flex items-center gap-2 mt-0.5">
          <span className="w-2 h-2 rounded-full bg-blue-300" />
          <span className="text-gray-500">Monto:</span>
          <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
        </div>
      )}
    </div>
  )
}

export function AgingChart({ data }: AgingChartProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-900">
          Antigüedad de Deudas
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">Distribución de deudas vencidas por días</p>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="range"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: '#f9fafb' }}
            />
            <Bar
              dataKey="count"
              fill="#3b82f6"
              radius={[6, 6, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
