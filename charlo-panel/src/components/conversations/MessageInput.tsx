import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

interface MessageInputProps {
  onSend: (text: string) => void
  disabled?: boolean
  sending?: boolean
}

export function MessageInput({ onSend, disabled, sending }: MessageInputProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [text])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled || sending) return
    onSend(trimmed)
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-[#f0f2f5] px-4 py-2">
      <div className="flex items-end gap-2">
        <div className="flex-1 flex items-end bg-white rounded-lg px-3 py-1.5 shadow-sm">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm focus:outline-none disabled:opacity-50 py-1"
            style={{ minHeight: '24px', maxHeight: '120px' }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled || sending}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-[#25d366] text-white hover:bg-[#1da851] active:bg-[#1b8f4a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  )
}