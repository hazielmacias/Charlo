import type { ConversationListItem } from '../../types/conversation'
import { CONVERSATION_STATE_LABELS, CONVERSATION_STATE_COLORS } from '../../types/conversation'
import { User, UserCheck } from 'lucide-react'

interface ConversationListProps {
  conversations: ConversationListItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  loading: boolean
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)

  if (diffMin < 1) return 'Ahora'
  if (diffMin < 60) return `${diffMin}m`
  if (diffHour < 24) return `${diffHour}h`
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.substring(0, maxLen) + '...'
}

export function ConversationList({ conversations, selectedId, onSelect, loading }: ConversationListProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm text-gray-400">No hay conversaciones activas</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conv) => {
        const isSelected = conv.id === selectedId
        const stateLabel = CONVERSATION_STATE_LABELS[conv.state]
        const stateColor = CONVERSATION_STATE_COLORS[conv.state]
        const isHumanAgent = conv.state === 'human_agent'

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`
              w-full text-left px-4 py-3 border-b border-gray-100 transition-colors
              ${isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-gray-50 border-l-2 border-l-transparent'}
            `}
          >
            <div className="flex items-start gap-3">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                ${isHumanAgent ? 'bg-red-100' : 'bg-blue-100'}
              `}>
                {isHumanAgent ? (
                  <UserCheck className="w-5 h-5 text-red-600" />
                ) : (
                  <User className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {conv.client.name}
                  </span>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">
                    {formatRelativeTime(conv.last_message_at)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {conv.lastMessage && (
                    <p className="text-xs text-gray-500 truncate flex-1">
                      {conv.lastMessage.direction === 'outbound' && 'Tú: '}
                      {truncate(conv.lastMessage.content, 40)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${stateColor}`}>
                    {stateLabel}
                  </span>
                  {conv.client.debt_total > 0 && (
                    <span className="text-[10px] text-gray-400">
                      ${conv.client.debt_total.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
