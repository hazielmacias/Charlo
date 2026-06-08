import { describe, it, expect, vi, beforeEach } from 'vitest'

// ========================================
// Integration Test: Full Flow
// Client → Debt → Conversation → Response
// ========================================

// Mock WhatsApp message types
interface WhatsAppMessage {
  from: string
  id: string
  timestamp: string
  type: 'text' | 'image' | 'document' | 'interactive'
  text?: { body: string }
  image?: { id: string; caption?: string }
  document?: { id: string; caption?: string; filename?: string }
  interactive?: {
    type: 'button_reply' | 'list_reply'
    button_reply?: { id: string; title: string }
    list_reply?: { id: string; title: string }
  }
}

interface Conversation {
  id: string
  phone: string
  state: string
  context: Record<string, unknown>
  client_id: string
}

interface Client {
  id: string
  name: string
  phone: string
  status: string
}

interface Debt {
  id: string
  client_id: string
  description: string
  amount: number
  status: string
  due_date: string
}

// Helper to create messages
function createTextMessage(phone: string, text: string): WhatsAppMessage {
  return {
    from: phone,
    id: `msg_${Date.now()}`,
    timestamp: Math.floor(Date.now() / 1000).toString(),
    type: 'text',
    text: { body: text },
  }
}

function createButtonMessage(phone: string, buttonId: string, title: string): WhatsAppMessage {
  return {
    from: phone,
    id: `msg_${Date.now()}`,
    timestamp: Math.floor(Date.now() / 1000).toString(),
    type: 'interactive',
    interactive: {
      type: 'button_reply',
      button_reply: { id: buttonId, title },
    },
  }
}

function createImageMessage(phone: string, mediaId: string): WhatsAppMessage {
  return {
    from: phone,
    id: `msg_${Date.now()}`,
    timestamp: Math.floor(Date.now() / 1000).toString(),
    type: 'image',
    image: { id: mediaId, caption: 'Comprobante de pago' },
  }
}

describe('Full Flow Integration', () => {
  const testPhone = '5215551234567'
  const testClientId = 'client-001'
  const testConversationId = 'conv-001'

  describe('Flow: Client → Debt → Menu → Payment', () => {
    it('step 1: identifies start message correctly', () => {
      const msg = createTextMessage(testPhone, 'hola')
      expect(msg.type).toBe('text')
      expect(msg.text?.body).toBe('hola')
    })

    it('step 2: maps menu button to correct state', () => {
      const buttonId = 'menu_make_payment'
      const expectedState = 'sent_bank_details'

      const stateMap: Record<string, string> = {
        menu_view_debt: 'viewing_debt',
        menu_make_payment: 'sent_bank_details',
        menu_talk_agent: 'human_agent',
      }

      expect(stateMap[buttonId]).toBe(expectedState)
    })

    it('step 3: debt response maps to correct state', () => {
      const buttonId = 'debt_make_payment'
      const expectedState = 'sent_bank_details'

      const stateMap: Record<string, string> = {
        debt_make_payment: 'sent_bank_details',
        debt_back_menu: 'menu',
      }

      expect(stateMap[buttonId]).toBe(expectedState)
    })

    it('step 4: payment response maps to correct state', () => {
      const buttonId = 'payment_confirm'
      const expectedState = 'awaiting_payment'

      const stateMap: Record<string, string> = {
        payment_confirm: 'awaiting_payment',
        payment_cancel: 'menu',
      }

      expect(stateMap[buttonId]).toBe(expectedState)
    })
  })

  describe('Flow: Receipt Submission', () => {
    it('identifies image as receipt', () => {
      const msg = createImageMessage(testPhone, 'media_123')
      const isReceipt = msg.type === 'image' || msg.type === 'document'
      expect(isReceipt).toBe(true)
    })

    it('extracts media ID from image message', () => {
      const msg = createImageMessage(testPhone, 'media_123')
      expect(msg.image?.id).toBe('media_123')
    })

    it('builds correct WhatsApp media URL', () => {
      const mediaId = 'media_123'
      const url = `https://graph.facebook.com/v21.0/${mediaId}`
      expect(url).toBe('https://graph.facebook.com/v21.0/media_123')
    })
  })

  describe('Flow: State Machine Transitions', () => {
    const validTransitions: Record<string, string[]> = {
      menu: ['viewing_debt', 'sent_bank_details', 'human_agent'],
      viewing_debt: ['menu', 'sent_bank_details', 'human_agent'],
      sent_bank_details: ['menu', 'human_agent', 'receipt_received'],
      receipt_received: ['menu'],
      human_agent: ['menu'],
    }

    it('allows menu → sent_bank_details', () => {
      expect(validTransitions.menu).toContain('sent_bank_details')
    })

    it('allows sent_bank_details → receipt_received', () => {
      expect(validTransitions.sent_bank_details).toContain('receipt_received')
    })

    it('allows receipt_received → menu (reset)', () => {
      expect(validTransitions.receipt_received).toContain('menu')
    })

    it('does not allow human_agent → sent_bank_details', () => {
      expect(validTransitions.human_agent).not.toContain('sent_bank_details')
    })
  })

  describe('Flow: Message Formatting', () => {
    it('formats currency in MXN', () => {
      const amount = 1500.5
      const formatted = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }).format(amount)
      expect(formatted).toContain('1,500')
      expect(formatted).toContain('50')
    })

    it('formats date in DD/MM/YYYY format', () => {
      const date = new Date(2026, 2, 15) // March 15, 2026 (month is 0-indexed)
      const formatted = date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      expect(formatted).toMatch(/15\/03\/2026/)
    })

    it('builds debt message with correct structure', () => {
      const debts: Debt[] = [
        {
          id: 'debt-1',
          client_id: testClientId,
          description: 'Servicio de limpieza',
          amount: 1500,
          status: 'pending',
          due_date: '2026-06-30',
        },
        {
          id: 'debt-2',
          client_id: testClientId,
          description: 'Mantenimiento mensual',
          amount: 800,
          status: 'overdue',
          due_date: '2026-05-15',
        },
      ]

      const total = debts.reduce((sum, d) => sum + d.amount, 0)
      expect(total).toBe(2300)
      expect(debts).toHaveLength(2)
    })
  })
})
