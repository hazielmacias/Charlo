import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import type { ReminderConfig } from '../../types/settings'

interface ReminderSectionProps {
  config: ReminderConfig | null
  onUpdate: (config: Partial<ReminderConfig>) => Promise<void>
}

const timezones = [
  'America/Mexico_City',
  'America/Buenos_Aires',
  'America/Santiago',
  'America/Bogota',
  'America/Lima',
  'America/Caracas',
  'America/Guayaquil',
  'America/Montevideo',
  'America/Asuncion',
  'America/La_Paz',
  'America/Guatemala',
  'America/Tegucigalpa',
  'America/Managua',
  'America/Costa_Rica',
  'America/Panama',
  'America/Sao_Paulo',
  'America/Manaus',
]

export function ReminderSection({ config, onUpdate }: ReminderSectionProps) {
  const [startHour, setStartHour] = useState(config?.start_hour || 8)
  const [endHour, setEndHour] = useState(config?.end_hour || 20)
  const [timezone, setTimezone] = useState(config?.timezone || 'America/Mexico_City')
  const [frequency, setFrequency] = useState(config?.frequency_minutes || 15)
  const [maxAttempts, setMaxAttempts] = useState(config?.max_attempts || 3)
  const [isActive, setIsActive] = useState(config?.is_active ?? true)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (config) {
      setStartHour(config.start_hour)
      setEndHour(config.end_hour)
      setTimezone(config.timezone)
      setFrequency(config.frequency_minutes)
      setMaxAttempts(config.max_attempts)
      setIsActive(config.is_active)
    }
  }, [config])

  const handleSave = async () => {
    setLoading(true)
    try {
      await onUpdate({
        start_hour: startHour,
        end_hour: endHour,
        timezone,
        frequency_minutes: frequency,
        max_attempts: maxAttempts,
        is_active: isActive,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert('Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-medium text-gray-900">Recordatorios</h3>
        <p className="text-sm text-gray-500 mt-1">Configura el envío automático de recordatorios</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Active toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Recordatorios Activos</p>
            <p className="text-xs text-gray-500">Enviar recordatorios automáticamente</p>
          </div>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isActive ? 'bg-primary-500' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hora Inicio</label>
            <input
              type="number"
              min="0"
              max="23"
              value={startHour}
              onChange={(e) => setStartHour(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-400 mt-1">Hora local (0-23)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hora Fin</label>
            <input
              type="number"
              min="0"
              max="23"
              value={endHour}
              onChange={(e) => setEndHour(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-400 mt-1">Hora local (0-23)</p>
          </div>
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Zona Horaria</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace('America/', '')}
              </option>
            ))}
          </select>
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia (minutos)</label>
          <input
            type="number"
            min="5"
            max="60"
            value={frequency}
            onChange={(e) => setFrequency(parseInt(e.target.value) || 15)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-gray-400 mt-1">Cada cuántos minutos ejecutar el scheduler</p>
        </div>

        {/* Max attempts */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Máximo de Intentos</label>
          <input
            type="number"
            min="1"
            max="10"
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 3)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-gray-400 mt-1">Veces que se intenta enviar antes de marcar como fallido</p>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3 pt-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Guardando...' : saved ? 'Guardado ✓' : 'Guardar Cambios'}
          </button>
          {saved && (
            <span className="text-sm text-emerald-600">Cambios guardados</span>
          )}
        </div>
      </div>
    </div>
  )
}
