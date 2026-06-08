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

export function AgingChart({ data }: AgingChartProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-900">
          Aging de Vencimiento
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">Deudas por rango de dias</p>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="range"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
              formatter={(value, name) => [
                name === 'amount' ? formatCurrency(Number(value)) : value,
                name === 'amount' ? 'Monto' : 'Cantidad',
              ]}
            />
            <Bar
              dataKey="count"
              fill="#3b82f6"
              radius={[6, 6, 0, 0]}
              name="count"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
