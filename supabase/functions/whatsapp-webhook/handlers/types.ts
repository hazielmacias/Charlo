// Conversation states for the WhatsApp chatbot
export type ConversationState =
  | "menu"
  | "viewing_debt"
  | "awaiting_payment"
  | "sent_bank_details"
  | "human_agent"

// Context for conversation state
export interface ConversationContext {
  debt_id?: string
  debt_amount?: number
  debt_description?: string
  payment_method?: string
  receipt_url?: string
  [key: string]: unknown
}

// Conversation object from database
export interface Conversation {
  id: string
  phone: string
  state: ConversationState
  context: ConversationContext
  client_id: string
  created_at: string
  updated_at: string
}

// Message object from WhatsApp
export interface WhatsAppMessage {
  from: string
  id: string
  timestamp: string
  type: "text" | "image" | "document" | "interactive"
  text?: { body: string }
  image?: { id: string; caption?: string }
  document?: { id: string; caption?: string; filename?: string }
  interactive?: {
    type: "button_reply" | "list_reply"
    button_reply?: { id: string; title: string }
    list_reply?: { id: string; title: string }
  }
}
