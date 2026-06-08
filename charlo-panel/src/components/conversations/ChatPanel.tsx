import { useEffect, useRef } from 'react'
import { ChatBubble } from './ChatBubble'
import { MessageInput } from './MessageInput'
import { CONVERSATION_STATE_LABELS, CONVERSATION_STATE_COLORS } from '../../types/conversation'
import type { ConversationDetail } from '../../types/conversation'
import { Phone, User, ArrowLeft, Bot, UserCheck, Circle } from 'lucide-react'

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
    const timeout = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
    return () => clearTimeout(timeout)
  }, [conversation?.messages])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#e5ddd5]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#25d366] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Cargando chat...</p>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#e5ddd5]">
        <div className="text-center">
          <div className="w-20 h-20 bg-[#dfefdb] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-[#25d366]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L2 22l5.77-.96A11.38 11.38 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.29 0-2.53-.31-3.63-.86-.15-.07-.33-.12-.5-.12-.17 0-.34.05-.49.15l-.82.52-1.24 1.03 1.23-1.03.76-.52c.15-.1.24-.27.24-.45 0-.18-.07-.35-.2-.48-.55-.55-.97-1.27-.97-2.09 0-1.39 1.13-2.52 2.52-2.52 1.39 0 2.52 1.13 2.52 2.52 0 .47-.13.91-.35 1.29-.06.1-.09.21-.09.33 0 .12.03.23.09.33.22.39.35.83.35 1.29 0 .47-.13.91-.35 1.29-.06.1-.09.21-.09.33 0 .12.03.23.09.33.22.39.35.83.35 1.29 0 1.54-.89 2.86-2.21 3.47-.15.07-.33.12-.5.12-.17 0-.34-.05-.49-.15-.55-.35-1.17-.56-1.81-.56z"/>
            </svg>
          </div>
          <p className="text-gray-600 font-medium text-base">Selecciona una conversación</p>
          <p className="text-sm text-gray-400 mt-1">Elige un chat de la lista para ver los mensajes</p>
        </div>
      </div>
    )
  }

  const stateLabel = CONVERSATION_STATE_LABELS[conversation.state]
  const stateColor = CONVERSATION_STATE_COLORS[conversation.state]
  const isHumanAgent = conversation.state === 'human_agent'

  return (
    <div className="flex-1 flex flex-col min-w-0" style={{ background: '#e5ddd5' }}>
      {/* WhatsApp-style Header */}
      <div className="flex-shrink-0 bg-[#f0f2f5] border-b border-[#d1d7db] px-4 py-2">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1.5 rounded-full hover:bg-[#d1d7db] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#54656f]" />
            </button>
          )}
          <div className="w-10 h-10 bg-[#d1d7db] rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-[#54656f]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[#111b21] truncate">{conversation.client.name}</h3>
            <div className="flex items-center gap-1.5 text-xs text-[#667781]">
              <Phone className="w-3 h-3" />
              <span>{conversation.phone}</span>
              <span>-</span>
              <span className="font-medium">{formatCurrency(conversation.client.debt_total)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isHumanAgent && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${stateColor}`}>
                <Bot className="w-3 h-3" />
                {stateLabel}
              </span>
            )}
            {isHumanAgent && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${stateColor}`}>
                <UserCheck className="w-3 h-3" />
                {stateLabel}
              </span>
            )}
          </div>
        </div>

        {/* Human Agent Mode Banner */}
        {isHumanAgent && (
          <div className="mt-2 px-3 py-2 bg-[#ffeeba] rounded-lg flex items-center gap-2">
            <Circle className="w-2 h-2 fill-green-500 text-green-500" />
            <span className="text-xs font-medium text-[#856404]">Modo Asesor Activo - Puedes responder directamente</span>
          </div>
        )}
      </div>

      {/* Messages Area with WhatsApp background pattern */}
      <div
        className="flex-1 overflow-y-auto px-2 py-2"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cpath d='M 100 0 Q 150 100 100 200 Q 50 100 100 0' fill='%23d4cdc4' opacity='0.4'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }}
      >
        {conversation.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[#667781]">No hay mensajes aún</p>
          </div>
        ) : (
          <div className="flex flex-col justify-end min-h-full">
            {conversation.messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Input - enabled in human agent mode, or any mode */}
      <MessageInput
        onSend={onSend}
        sending={sending}
        disabled={false}
      />
    </div>
  )
}