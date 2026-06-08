import { describe, it, expect } from 'vitest'
import type { WhatsAppMessage } from '../../../supabase/functions/whatsapp-webhook/types'

// Re-implement the pure helper functions for testing
// (Edge Functions use Deno imports, so we extract the logic)

const START_KEYWORDS = ['hola', 'menu', 'inicio', 'empezar', 'comenzar', 'opciones']
const VALID_MENU_COMMANDS = ['menu', 'menú', 'inicio', 'hola', 'opciones', 'start']

function isStartMessage(message: WhatsAppMessage): boolean {
  if (message.type !== 'text') return false
  const content = message.text?.body?.toLowerCase().trim() || ''
  return START_KEYWORDS.some((keyword) => content.includes(keyword))
}

function isValidMenuCommand(message: WhatsAppMessage): boolean {
  if (message.type !== 'text') return false
  const content = message.text?.body?.toLowerCase().trim() || ''
  return VALID_MENU_COMMANDS.some((cmd) => content.includes(cmd))
}

function isReceiptMessage(message: WhatsAppMessage): boolean {
  return message.type === 'image' || message.type === 'document'
}

// Helper to create a WhatsApp message
function createMessage(type: WhatsAppMessage['type'], overrides?: Partial<WhatsAppMessage>): WhatsAppMessage {
  return {
    from: '5215551234567',
    id: 'msg_001',
    timestamp: '1234567890',
    type,
    ...overrides,
  }
}

describe('Menu Helpers', () => {
  describe('isStartMessage', () => {
    it('returns true for "hola"', () => {
      const msg = createMessage('text', { text: { body: 'hola' } })
      expect(isStartMessage(msg)).toBe(true)
    })

    it('returns true for "menu"', () => {
      const msg = createMessage('text', { text: { body: 'menu' } })
      expect(isStartMessage(msg)).toBe(true)
    })

    it('returns true for "inicio"', () => {
      const msg = createMessage('text', { text: { body: 'inicio' } })
      expect(isStartMessage(msg)).toBe(true)
    })

    it('returns true for "empezar"', () => {
      const msg = createMessage('text', { text: { body: 'empezar' } })
      expect(isStartMessage(msg)).toBe(true)
    })

    it('returns true for "comenzar"', () => {
      const msg = createMessage('text', { text: { body: 'comenzar' } })
      expect(isStartMessage(msg)).toBe(true)
    })

    it('returns true for "opciones"', () => {
      const msg = createMessage('text', { text: { body: 'opciones' } })
      expect(isStartMessage(msg)).toBe(true)
    })

    it('returns true for text containing start keyword', () => {
      const msg = createMessage('text', { text: { body: 'Quiero ver el menu por favor' } })
      expect(isStartMessage(msg)).toBe(true)
    })

    it('returns true case-insensitive', () => {
      const msg = createMessage('text', { text: { body: 'HOLA' } })
      expect(isStartMessage(msg)).toBe(true)
    })

    it('returns false for non-start text', () => {
      const msg = createMessage('text', { text: { body: 'Quiero pagar mi deuda' } })
      expect(isStartMessage(msg)).toBe(false)
    })

    it('returns false for image messages', () => {
      const msg = createMessage('image', { image: { id: 'img_001' } })
      expect(isStartMessage(msg)).toBe(false)
    })

    it('returns false for document messages', () => {
      const msg = createMessage('document', { document: { id: 'doc_001', filename: 'receipt.pdf' } })
      expect(isStartMessage(msg)).toBe(false)
    })

    it('returns false for interactive messages', () => {
      const msg = createMessage('interactive', {
        interactive: { type: 'button_reply', button_reply: { id: 'btn_1', title: 'Option 1' } },
      })
      expect(isStartMessage(msg)).toBe(false)
    })
  })

  describe('isValidMenuCommand', () => {
    it('returns true for "menu"', () => {
      const msg = createMessage('text', { text: { body: 'menu' } })
      expect(isValidMenuCommand(msg)).toBe(true)
    })

    it('returns true for "menú"', () => {
      const msg = createMessage('text', { text: { body: 'menú' } })
      expect(isValidMenuCommand(msg)).toBe(true)
    })

    it('returns true for "hola"', () => {
      const msg = createMessage('text', { text: { body: 'hola' } })
      expect(isValidMenuCommand(msg)).toBe(true)
    })

    it('returns true for "start"', () => {
      const msg = createMessage('text', { text: { body: 'start' } })
      expect(isValidMenuCommand(msg)).toBe(true)
    })

    it('returns true case-insensitive', () => {
      const msg = createMessage('text', { text: { body: 'MENU' } })
      expect(isValidMenuCommand(msg)).toBe(true)
    })

    it('returns false for non-menu text', () => {
      const msg = createMessage('text', { text: { body: 'quiero ver mi deuda' } })
      expect(isValidMenuCommand(msg)).toBe(false)
    })

    it('returns false for image messages', () => {
      const msg = createMessage('image', { image: { id: 'img_001' } })
      expect(isValidMenuCommand(msg)).toBe(false)
    })
  })

  describe('isReceiptMessage', () => {
    it('returns true for image messages', () => {
      const msg = createMessage('image', { image: { id: 'img_001' } })
      expect(isReceiptMessage(msg)).toBe(true)
    })

    it('returns true for document messages', () => {
      const msg = createMessage('document', { document: { id: 'doc_001', filename: 'receipt.pdf' } })
      expect(isReceiptMessage(msg)).toBe(true)
    })

    it('returns false for text messages', () => {
      const msg = createMessage('text', { text: { body: 'hola' } })
      expect(isReceiptMessage(msg)).toBe(false)
    })

    it('returns false for interactive messages', () => {
      const msg = createMessage('interactive', {
        interactive: { type: 'button_reply', button_reply: { id: 'btn_1', title: 'Option 1' } },
      })
      expect(isReceiptMessage(msg)).toBe(false)
    })
  })
})
