import { useEffect, useRef } from 'react'
import { ChatBubble } from './ChatBubble'
import { MessageInput } from './MessageInput'
import { CONVERSATION_STATE_LABELS, CONVERSATION_STATE_COLORS } from '../../types/conversation'
import type { ConversationDetail } from '../../types/conversation'
import { Phone, User, ArrowLeft, Bot, UserCheck } from 'lucide-react'

interface ChatPanelProps {
  conversation: ConversationDetail | null
  loading: boolean
  onSend: (text: string) => void
  sending: boolean
  onBack?: () => void
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
}

export function ChatPanel({ conversation, loading, onSend, sending, onBack }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation?.messages])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Cargando chat...</p>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💬</span>
          </div>
          <p className="text-gray-500 font-medium">Selecciona una conversación</p>
          <p className="text-sm text-gray-400 mt-1">Elige un chat de la lista para ver los mensajes</p>
        </div>
      </div>
    )
  }

  const stateLabel = CONVERSATION_STATE_LABELS[conversation.state]
  const stateColor = CONVERSATION_STATE_COLORS[conversation.state]
  const isHumanAgent = conversation.state === 'human_agent'

  return (
    <div className="flex-1 flex flex-col bg-white min-w-0">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="lg:hidden p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
          )}
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{conversation.client.name}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Phone className="w-3 h-3" />
              <span>{conversation.phone}</span>
              <span>-</span>
              <span>{formatCurrency(conversation.client.debt_total)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${stateColor}`}>
              {isHumanAgent && <UserCheck className="w-3 h-3 inline mr-1" />}
              {!isHumanAgent && <Bot className="w-3 h-3 inline mr-1" />}
              {stateLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50/50">
        {conversation.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">No hay mensajes aún</p>
          </div>
        ) : (
          <>
            {conversation.messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <MessageInput onSend={onSend} sending={sending} disabled={isHumanAgent} />
    </div>
  )
}
