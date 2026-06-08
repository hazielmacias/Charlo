import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
} from 'recharts'
import type { MonthlyCollection } from '../../types/dashboard'

interface MonthlyChartProps {
  data: MonthlyCollection[]
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
  payload?: Array<{ value: number; payload: MonthlyCollection }>
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-gray-900 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-gray-500">Recaudado:</span>
        <span className="font-medium text-gray-900">{formatCurrency(payload[0].value)}</span>
      </div>
    </div>
  )
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-900">
          Recaudación Mensual
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">Últimos 6 meses</p>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => {
                if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`
                return `$${value}`
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="none"
              fill="url(#colorAmount)"
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
