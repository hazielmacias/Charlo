import type { Message } from '../../types/conversation'
import { Check, CheckCheck } from 'lucide-react'

interface ChatBubbleProps {
  message: Message
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function StatusIcon({ status }: { status: Message['status'] }) {
  if (status === 'failed') return <span className="text-red-400 text-xs">!</span>
  if (status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
  if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
  if (status === 'sent') return <Check className="w-3.5 h-3.5 text-gray-400" />
  return null
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isOutbound = message.direction === 'outbound'

  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`
          max-w-[80%] lg:max-w-[65%] px-3.5 py-2 rounded-2xl text-sm
          ${isOutbound
            ? 'bg-blue-500 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
          }
        `}
      >
        {message.type === 'interactive' && message.content ? (
          <div className={`font-medium ${isOutbound ? 'text-white' : 'text-blue-600'}`}>
            {message.content.startsWith('menu_') || message.content.startsWith('debt_')
              ? message.content.replace(/_/g, ' ')
              : message.content}
          </div>
        ) : message.type === 'image' ? (
          <div className="flex items-center gap-2">
            <span className="text-lg">{isOutbound ? '📤' : '📥'}</span>
            <span className={isOutbound ? 'text-white/90' : 'text-gray-500'}>
              {message.content || 'Imagen'}
            </span>
          </div>
        ) : message.type === 'document' ? (
          <div className="flex items-center gap-2">
            <span className="text-lg">📄</span>
            <span className={isOutbound ? 'text-white/90' : 'text-gray-500'}>
              {message.content || 'Documento'}
            </span>
          </div>
        ) : (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        )}

        <div className={`flex items-center gap-1 mt-1 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-[10px] ${isOutbound ? 'text-white/60' : 'text-gray-400'}`}>
            {formatTime(message.created_at)}
          </span>
          {isOutbound && <StatusIcon status={message.status} />}
        </div>
      </div>
    </div>
  )
}
