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
  if (status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-blue-300" />
  if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-white/50" />
  if (status === 'sent') return <Check className="w-3.5 h-3.5 text-white/50" />
  return null
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isOutbound = message.direction === 'outbound'

  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-1 px-2`}>
      <div
        className={`
          relative max-w-[75%] lg:max-w-[65%] px-3 py-1.5 rounded-lg text-sm
          shadow-sm
          ${isOutbound
            ? 'bg-[#dcf8c6]'
            : 'bg-white'
          }
        `}
        style={{
          borderRadius: isOutbound ? '8px 8px 2px 12px' : '8px 8px 12px 2px',
        }}
      >
        {message.type === 'interactive' && message.content ? (
          <div className="font-medium text-blue-700">
            {message.content.startsWith('menu_') || message.content.startsWith('debt_')
              ? message.content.replace(/_/g, ' ')
              : message.content}
          </div>
        ) : message.type === 'image' ? (
          <div className="flex items-center gap-2">
            <span className={isOutbound ? 'text-[#4a9c5d]' : 'text-gray-500'}>
              {isOutbound ? 'Enviado' : 'Recibido'}
            </span>
            <span className={isOutbound ? 'text-[#4a9c5d]/70' : 'text-gray-500/70'}>
              {message.content || 'Imagen'}
            </span>
          </div>
        ) : message.type === 'document' ? (
          <div className="flex items-center gap-2">
            <span className={isOutbound ? 'text-[#4a9c5d]' : 'text-gray-500'}>
              {isOutbound ? 'Enviado' : 'Recibido'}
            </span>
            <span className={isOutbound ? 'text-[#4a9c5d]/70' : 'text-gray-500/70'}>
              {message.content || 'Documento'}
            </span>
          </div>
        ) : (
          <p className="whitespace-pre-wrap leading-relaxed text-gray-800">{message.content}</p>
        )}

        <div className={`flex items-center gap-1 mt-0.5 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-[10px] ${isOutbound ? 'text-[#4a9c5d]/60' : 'text-gray-400'}`}>
            {formatTime(message.created_at)}
          </span>
          {isOutbound && <StatusIcon status={message.status} />}
        </div>
      </div>
    </div>
  )
}