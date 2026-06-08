import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useAccount } from '../../hooks/useSettings'
import { Save, Mail, Lock } from 'lucide-react'

export function AccountSection() {
  const { user } = useAuth()
  const { updateEmail, updatePassword } = useAccount()

  const [email, setEmail] = useState(user?.email || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [emailSaved, setEmailSaved] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)

  const handleUpdateEmail = async () => {
    if (!email || email === user?.email) return

    setEmailLoading(true)
    try {
      await updateEmail(email)
      setEmailSaved(true)
      setTimeout(() => setEmailSaved(false), 2000)
    } catch (err: any) {
      alert(err.message || 'Error al actualizar email')
    } finally {
      setEmailLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!newPassword) return

    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden')
      return
    }

    if (newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setPasswordLoading(true)
    try {
      await updatePassword(newPassword)
      setPasswordSaved(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSaved(false), 2000)
    } catch (err: any) {
      alert(err.message || 'Error al actualizar contraseña')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-medium text-gray-900">Mi Cuenta</h3>
        <p className="text-sm text-gray-500 mt-1">Gestiona tu información personal</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Current user info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-lg font-medium text-primary-700">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-500">Miembro desde {new Date(user?.created_at || '').toLocaleDateString('es-MX')}</p>
            </div>
          </div>
        </div>

        {/* Update email */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-4 h-4 text-gray-500" />
            <h4 className="text-sm font-medium text-gray-900">Actualizar Email</h4>
          </div>
          <div className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="nuevo@email.com"
            />
            <button
              onClick={handleUpdateEmail}
              disabled={emailLoading || email === user?.email}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {emailLoading ? 'Guardando...' : emailSaved ? 'Guardado ✓' : 'Actualizar'}
            </button>
          </div>
        </div>

        {/* Update password */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-gray-500" />
            <h4 className="text-sm font-medium text-gray-900">Cambiar Contraseña</h4>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Nueva contraseña (mínimo 6 caracteres)"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Confirmar contraseña"
            />
            <button
              onClick={handleUpdatePassword}
              disabled={passwordLoading || !newPassword}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              <Lock className="w-4 h-4" />
              {passwordLoading ? 'Guardando...' : passwordSaved ? 'Contraseña Actualizada ✓' : 'Cambiar Contraseña'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
