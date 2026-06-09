import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Home,
  Users,
  CreditCard,
  MessageSquare,
  FileText,
  Settings,
  X,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/clients', label: 'Clientes', icon: Users },
  { to: '/conversations', label: 'Conversaciones', icon: MessageSquare },
  { to: '/debts', label: 'Cobros', icon: CreditCard },
  { to: '/receipts', label: 'Comprobantes', icon: FileText, showBadge: true },
  { to: '/settings', label: 'Configuracion', icon: Settings },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [pendingCount, setPendingCount] = useState(0)
  const [activeConversations, setActiveConversations] = useState(0)

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const { count } = await supabase
          .from('receipts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
        setPendingCount(count || 0)
      } catch {
        // Ignore error
      }
    }

    const fetchActiveConversations = async () => {
      try {
        const { count } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .neq('state', 'closed')
        setActiveConversations(count || 0)
      } catch {
        // Ignore error
      }
    }

    // Initial fetch
    fetchPending()
    fetchActiveConversations()

    // Realtime subscription for receipts (instant badge updates)
    const receiptsChannel = supabase
      .channel('sidebar-receipts-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'receipts' },
        () => {
          fetchPending()
        }
      )
      .subscribe()

    // Realtime subscription for conversations
    const conversationsChannel = supabase
      .channel('sidebar-conversations-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => {
          fetchActiveConversations()
        }
      )
      .subscribe()

    // Fallback polling every 30 seconds
    const interval = setInterval(() => {
      fetchPending()
      fetchActiveConversations()
    }, 30000)

    return () => {
      clearInterval(interval)
      supabase.removeChannel(receiptsChannel)
      supabase.removeChannel(conversationsChannel)
    }
  }, [])

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - iOS style */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50
          transform transition-transform duration-300 ease-out
          lg:static lg:translate-x-0 lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-100">
          <img
            src="/favicon.svg"
            alt="Charlo"
            className="w-9 h-9"
          />
          <div>
            <span className="text-lg font-semibold text-gray-900 tracking-tight">Charlo</span>
            <p className="text-[11px] text-gray-400 leading-none mt-0.5">Cobranza</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
              onClick={onClose}
            >
              <item.icon className="w-[18px] h-[18px]" />
              <span className="flex-1">{item.label}</span>
              {item.showBadge && pendingCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-semibold bg-red-500 text-white rounded-full">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
              {item.to === '/conversations' && activeConversations > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-semibold bg-green-500 text-white rounded-full">
                  {activeConversations > 99 ? '99+' : activeConversations}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
