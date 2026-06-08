import { useState, useEffect } from 'react'
import { Save, RotateCcw } from 'lucide-react'
import type { BotMessages } from '../../types/settings'

interface BotMessagesSectionProps {
  messages: BotMessages | null
  onUpdate: (messages: Partial<BotMessages>) => Promise<void>
}

const defaultMessages: Omit<BotMessages, 'id'> = {
  welcome: '¡Hola {name}! Soy Charló, tu asistente de cobranza. ¿En qué puedo ayudarte?',
  menu: 'Por favor, selecciona una opción:',
  debt_info: 'Estas son tus deudas pendientes:',
  payment_instructions: 'Aquí tienes los datos para realizar tu pago:',
  receipt_confirmation: 'Hemos recibido tu comprobante. Lo revisaremos pronto.',
  agent_transfer: 'Un agente se pondrá en contacto contigo.',
  outside_hours: 'Nuestro horario de atención es de 8:00 AM a 8:00 PM.',
  error: 'Lo siento, hubo un error. Por favor, intenta de nuevo.',
}

const messageLabels: Record<string, { label: string; description: string; placeholder?: string }> = {
  welcome: {
    label: 'Mensaje de Bienvenida',
    description: 'Se envía cuando el cliente inicia conversación',
    placeholder: 'Usa {name} para el nombre del cliente',
  },
  menu: {
    label: 'Menú Principal',
    description: 'Texto del menú de opciones',
  },
  debt_info: {
    label: 'Información de Deuda',
    description: 'Se envía al consultar deudas',
  },
  payment_instructions: {
    label: 'Instrucciones de Pago',
    description: 'Datos bancarios y monto a pagar',
  },
  receipt_confirmation: {
    label: 'Confirmación de Comprobante',
    description: 'Al recibir un comprobante de pago',
  },
  agent_transfer: {
    label: 'Transferencia a Agente',
    description: 'Al transferir a un agente humano',
  },
  outside_hours: {
    label: 'Fuera de Horario',
    description: 'Cuando el cliente escribe fuera del horario laboral',
  },
  error: {
    label: 'Mensaje de Error',
    description: 'Error general del bot',
  },
}

export function BotMessagesSection({ messages, onUpdate }: BotMessagesSectionProps) {
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
      await onUpdate(editedMessages as Partial<BotMessages>)
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
        <h3 className="text-lg font-medium text-gray-900">Mensajes del Bot</h3>
        <p className="text-sm text-gray-500 mt-1">Personaliza los mensajes que envía Charló</p>
      </div>

      <div className="p-6 space-y-6">
        {Object.entries(messageLabels).map(([key, { label, description, placeholder }]) => (
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
              placeholder={placeholder}
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
            {loading ? 'Guardando...' : saved ? 'Guardado ✓' : 'Guardar Mensajes'}
          </button>
          {saved && (
            <span className="text-sm text-emerald-600">Mensajes actualizados</span>
          )}
        </div>
      </div>
    </div>
  )
}
