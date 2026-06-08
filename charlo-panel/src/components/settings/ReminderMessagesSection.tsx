import { useState, useEffect } from 'react'
import { Save, RotateCcw } from 'lucide-react'
import type { ReminderMessages } from '../../types/settings'

interface ReminderMessagesSectionProps {
  messages: ReminderMessages | null
  onUpdate: (messages: Partial<ReminderMessages>) => Promise<void>
}

const defaultMessages = {
  '3_days': 'Tu pago vence en 3 dias. {description} - Monto: ${amount}',
  '1_day': 'Tu pago vence mañana. {description} - Monto: ${amount}',
  due_today: 'Tu pago vence hoy. {description} - Monto: ${amount}',
  overdue: 'Tu pago esta vencido. {description} - Monto: ${amount}. Por favor realiza tu pago lo antes posible.',
}

const messageLabels: Record<string, { label: string; description: string }> = {
  '3_days': {
    label: '3 Días Antes',
    description: 'Se envía 3 días antes de la fecha de vencimiento',
  },
  '1_day': {
    label: '1 Día Antes',
    description: 'Se envía 1 día antes de la fecha de vencimiento',
  },
  due_today: {
    label: 'Día de Vencimiento',
    description: 'Se envía el día que vence la deuda',
  },
  overdue: {
    label: 'Recordatorio Vencido',
    description: 'Se envía después de la fecha de vencimiento',
  },
}

export function ReminderMessagesSection({ messages, onUpdate }: ReminderMessagesSectionProps) {
  const [editedMessages, setEditedMessages] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (messages) {
      const msgs: Record<string, string> = {}
      Object.keys(defaultMessages).forEach((key) => {
        msgs[key] = (messages as any)[key] || (defaultMessages as any)[key]
      })
      setEditedMessages(msgs)
    }
  }, [messages])

  const handleChange = (key: string, value: string) => {
    setEditedMessages((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await onUpdate(editedMessages as Partial<ReminderMessages>)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert('Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = (key: string) => {
    setEditedMessages((prev) => ({
      ...prev,
      [key]: (defaultMessages as any)[key],
    }))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-medium text-gray-900">Mensajes de Recordatorios</h3>
        <p className="text-sm text-gray-500 mt-1">Personaliza los mensajes según el tipo de recordatorio</p>
      </div>

      <div className="p-6 space-y-6">
        {Object.entries(messageLabels).map(([key, { label, description }]) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">{label}</label>
              <button
                onClick={() => handleReset(key)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Restablecer
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-2">{description}</p>
            <textarea
              value={editedMessages[key] || ''}
              onChange={(e) => handleChange(key, e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Usa {description} para la descripción y ${amount} para el monto"
            />
          </div>
        ))}

        <div className="flex items-center gap-3 pt-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Guardando...' : saved ? 'Guardado' : 'Guardar Mensajes'}
          </button>
          {saved && (
            <span className="text-sm text-emerald-600">Mensajes actualizados</span>
          )}
        </div>
      </div>
    </div>
  )
}