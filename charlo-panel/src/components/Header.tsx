import { useNavigate } from 'react-router-dom'
import { Menu, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Left side - menu button (mobile) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* Spacer for desktop */}
      <div className="hidden lg:block" />

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[13px] font-medium text-gray-900 leading-none">
              Alebrijes Teotihuacan
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Administrador
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <span className="text-sm font-semibold text-white">AT</span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-2"></div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
          title="Cerrar sesion"
        >
          <LogOut className="w-[18px] h-[18px] text-gray-400" />
        </button>
      </div>
    </header>
  )
}
