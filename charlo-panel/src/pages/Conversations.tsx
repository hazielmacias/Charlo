import { useState } from 'react'
import { useConversations, useConversation, useSendMessage } from '../hooks/useConversations'
import { ConversationList } from '../components/conversations/ConversationList'
import { ChatPanel } from '../components/conversations/ChatPanel'
import { Search, X, Filter } from 'lucide-react'
import type { ConversationFilterState } from '../types/conversation'

const STATE_FILTERS: { value: ConversationFilterState; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'menu', label: 'Menu' },
  { value: 'viewing_debt', label: 'Viendo deuda' },
  { value: 'awaiting_payment', label: 'Esperando pago' },
  { value: 'sent_bank_details', label: 'Datos bancarios' },
  { value: 'receipt_received', label: 'Comprobante' },
  { value: 'human_agent', label: 'Agente humano' },
]

export function Conversations() {
  const [filters, setFilters] = useState<{ search: string; state: ConversationFilterState }>({
    search: '',
    state: 'all',
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const { conversations, loading } = useConversations(filters)
  const { conversation, loading: convLoading } = useConversation(selectedId)
  const { sendMessage, sending } = useSendMessage()

  const handleSend = async (text: string) => {
    if (!conversation) return
    await sendMessage(conversation.id, conversation.phone, text)
  }

  return (
    <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)]">
      <div className="bg-white rounded-2xl border border-gray-100 h-full flex overflow-hidden">
        {/* Left: Conversation List */}
        <div className={`
          w-full lg:w-80 xl:w-96 flex-shrink-0 border-r border-gray-100 flex flex-col
          ${selectedId ? 'hidden lg:flex' : 'flex'}
        `}>
          {/* Header */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Conversaciones</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1.5 rounded-lg transition-colors ${showFilters ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-400'}`}
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Buscar por telefono..."
                className="w-full pl-9 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters((f) => ({ ...f, search: '' }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-100"
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>

            {/* State Filters */}
            {showFilters && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {STATE_FILTERS.map((sf) => (
                  <button
                    key={sf.value}
                    onClick={() => setFilters((f) => ({ ...f, state: sf.value }))}
                    className={`
                      px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
                      ${filters.state === sf.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                    `}
                  >
                    {sf.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* List */}
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={setSelectedId}
            loading={loading}
          />
        </div>

        {/* Right: Chat Panel */}
        <div className={`
          flex-1 flex flex-col min-w-0
          ${!selectedId ? 'hidden lg:flex' : 'flex'}
        `}>
          <ChatPanel
            conversation={conversation}
            loading={convLoading}
            onSend={handleSend}
            sending={sending}
            onBack={() => setSelectedId(null)}
          />
        </div>
      </div>
    </div>
  )
}
