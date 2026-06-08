import { useDashboard } from '../hooks/useDashboard'
import { KpiCards } from '../components/dashboard/KpiCards'
import { AgingChart } from '../components/dashboard/AgingChart'
import { MonthlyChart } from '../components/dashboard/MonthlyChart'
import { DistributionChart } from '../components/dashboard/DistributionChart'
import { ActivityTable } from '../components/dashboard/ActivityTable'
import { RefreshCw } from 'lucide-react'

export function Dashboard() {
  const { data, loading, error, refetch } = useDashboard()

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
              <div className="w-10 h-10 bg-gray-100 rounded-xl mb-4"></div>
              <div className="h-3 bg-gray-100 rounded w-20 mb-2"></div>
              <div className="h-6 bg-gray-100 rounded w-16"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-28 mb-5"></div>
              <div className="h-56 bg-gray-50 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <span className="text-red-500 text-sm font-bold">!</span>
          </div>
          <div>
            <p className="text-sm font-medium text-red-800">Error al cargar</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Bienvenido, Alebrijes Teotihuacan
          </h1>
<p className="text-sm text-gray-500 mt-0.5">
             Resumen de tu actividad de cobranza
           </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* KPI Cards */}
      <KpiCards stats={data.stats} />

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AgingChart data={data.aging} />
        <MonthlyChart data={data.monthly} />
      </div>

      {/* Charts row 2 + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <DistributionChart data={data.distribution} />
        </div>
        <div className="lg:col-span-2">
          <ActivityTable activities={data.activities} />
        </div>
      </div>
    </div>
  )
}
