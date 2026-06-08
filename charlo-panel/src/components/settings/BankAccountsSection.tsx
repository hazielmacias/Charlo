import { useState } from 'react'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import type { BankAccount } from '../../types/settings'

interface BankAccountsSectionProps {
  accounts: BankAccount[]
  onCreate: (data: Omit<BankAccount, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  onUpdate: (id: string, data: Partial<BankAccount>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onToggle: (id: string, is_active: boolean) => Promise<void>
}

export function BankAccountsSection({
  accounts,
  onCreate,
  onUpdate,
  onDelete,
  onToggle,
}: BankAccountsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [loading, setLoading] = useState(false)

  const handleCreate = () => {
    setEditingAccount(null)
    setIsModalOpen(true)
  }

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account)
    setIsModalOpen(true)
  }

  const handleDelete = async (account: BankAccount) => {
    if (confirm(`Eliminar cuenta ${account.bank_name}?`)) {
      await onDelete(account.id)
    }
  }

  const handleToggle = async (account: BankAccount) => {
    await onToggle(account.id, !account.is_active)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      bank_name: formData.get('bank_name') as string,
      cbu: formData.get('cbu') as string,
      alias: (formData.get('alias') as string) || undefined,
      account_holder: formData.get('account_holder') as string,
      account_type: formData.get('account_type') as 'checking' | 'savings',
      is_active: true,
    }

    try {
      if (editingAccount) {
        await onUpdate(editingAccount.id, data)
      } else {
        await onCreate(data)
      }
      setIsModalOpen(false)
    } catch (err) {
      alert('Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Datos Bancarios</h3>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {accounts.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            No hay cuentas bancarias configuradas
          </div>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-600">
                    {(account.bank_name || '?').charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{account.bank_name}</p>
                  <p className="text-xs text-gray-500">
                    {account.account_type === 'checking' ? 'Cuenta Corriente' : 'Cuenta de Ahorro'} - CBU: {(account.cbu || '').slice(-4) || 'N/A'}
                  </p>
                  {account.alias && (
                    <p className="text-xs text-gray-400">Alias: {account.alias}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(account)}
                  className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                  title={account.is_active ? 'Desactivar' : 'Activar'}
                >
                  {account.is_active ? (
                    <ToggleRight className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() => handleEdit(account)}
                  className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => handleDelete(account)}
                  className="p-1.5 rounded-xl hover:bg-red-50 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-medium text-gray-900">
                {editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banco *</label>
                <input
                  name="bank_name"
                  defaultValue={editingAccount?.bank_name}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CBU / CLABE *</label>
                <input
                  name="cbu"
                  defaultValue={editingAccount?.cbu}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alias</label>
                <input
                  name="alias"
                  defaultValue={editingAccount?.alias}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titular *</label>
                <input
                  name="account_holder"
                  defaultValue={editingAccount?.account_holder}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select
                  name="account_type"
                  defaultValue={editingAccount?.account_type || 'checking'}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="checking">Cuenta Corriente</option>
                  <option value="savings">Cuenta de Ahorro</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
