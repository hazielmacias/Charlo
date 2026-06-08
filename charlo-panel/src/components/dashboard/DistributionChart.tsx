import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { StatusDistribution } from '../../types/dashboard'

interface DistributionChartProps {
  data: StatusDistribution[]
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; name: string; payload: StatusDistribution }>
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || !payload.length) return null
  const item = payload[0]
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-gray-900 mb-1">{item.name}</p>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.payload?.color || '#6b7280' }} />
        <span className="text-gray-500">Cantidad:</span>
        <span className="font-medium text-gray-900">{item.value}</span>
      </div>
    </div>
  )
}

function renderLegend(props: any) {
  const payload = props.payload as Array<{ value: string; color: string }> | undefined
  if (!payload) return null
  return (
    <div className="flex items-center justify-center gap-4 mt-2">
      {payload.map((entry, index) => (
        <div key={`legend-${index}`} className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[11px] text-gray-500">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function DistributionChart({ data }: DistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-900">
          Estado de Cobros
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">Distribución actual de deudas</p>
      </div>
      <div className="h-56 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderLegend} verticalAlign="bottom" />
          </PieChart>
        </ResponsiveContainer>
        {total > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: '40px' }}>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">{total}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Total</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
