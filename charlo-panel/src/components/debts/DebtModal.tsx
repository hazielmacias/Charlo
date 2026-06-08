import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Search, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const debtSchema = z.object({
  client_id: z.string().min(1, 'Selecciona un cliente'),
  description: z.string().min(1, 'Descripción requerida'),
  amount: z.number().min(0.01, 'Monto inválido'),
  due_date: z.string().min(1, 'Fecha de vencimiento requerida'),
})

type DebtForm = z.infer<typeof debtSchema>

interface DebtModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: DebtForm) => Promise<void>
}

interface Client {
  id: string
  name: string
  phone: string
}

export function DebtModal({ isOpen, onClose, onSubmit }: DebtModalProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DebtForm>({
    resolver: zodResolver(debtSchema),
  })

  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, name, phone')
        .order('name')
      setClients(data || [])
    }
    if (isOpen) fetchClients()
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  )

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client)
    setValue('client_id', client.id)
    setSearchTerm(client.name)
    setShowDropdown(false)
  }

  if (!isOpen) return null

  const handleFormSubmit = async (data: DebtForm) => {
    await onSubmit(data)
    reset()
    setSelectedClient(null)
    setSearchTerm('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Nueva Deuda</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          {/* Client autocomplete */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowDropdown(true)
                  if (selectedClient) {
                    setSelectedClient(null)
                    setValue('client_id', '')
                  }
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Buscar por nombre o teléfono..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            {showDropdown && filteredClients.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {filteredClients.map(client => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleSelectClient(client)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{client.name}</p>
                      <p className="text-xs text-gray-500">{client.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <input type="hidden" {...register('client_id')} />
            {errors.client_id && (
              <p className="mt-1 text-sm text-red-600">{errors.client_id.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción *
            </label>
            <input
              {...register('description')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ej: Servicio de hosting mensual"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto (MXN) *
            </label>
            <input
              {...register('amount', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {/* Due date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Vencimiento *
            </label>
            <input
              {...register('due_date')}
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {errors.due_date && (
              <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creando...' : 'Crear Deuda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
