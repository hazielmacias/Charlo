import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { StatusDistribution } from '../../types/dashboard'

interface DistributionChartProps {
  data: StatusDistribution[]
}

export function DistributionChart({ data }: DistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-900">
          Distribucion por Estado
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">Deudas totales</p>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
              formatter={(value, name) => [
                `${value} (${total > 0 ? Math.round((Number(value) / total) * 100) : 0}%)`,
                name,
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={32}
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span className="text-[11px] text-gray-500">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
