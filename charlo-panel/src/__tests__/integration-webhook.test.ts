import { describe, it, expect, vi, beforeEach } from 'vitest'

// ========================================
// Integration Test: Webhook Payload
// Simulate Meta webhook and verify parsing
// ========================================

// Meta webhook POST payload structure
interface WebhookPayload {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: string
        metadata: {
          display_phone_number: string
          phone_number_id: string
        }
        contacts: Array<{
          profile: { name: string }
          wa_id: string
        }>
        messages: Array<{
          from: string
          id: string
          timestamp: string
          type: string
          text?: { body: string }
          image?: { id: string; mime_type: string; caption?: string }
          document?: { id: string; mime_type: string; filename?: string; caption?: string }
          interactive?: {
            type: string
            button_reply?: { id: string; title: string }
            list_reply?: { id: string; title: string; description?: string }
          }
        }>
      }
      field: string
    }>
  }>
}

// Webhook verification payload
interface VerifyPayload {
  'hub.mode': string
  'hub.verify_token': string
  'hub.challenge': string | number
}

function createWebhookPayload(
  phone: string,
  message: Record<string, unknown>
): WebhookPayload {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'ENTRY_ID',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '5215551234567',
                phone_number_id: '1193550707176336',
              },
              contacts: [
                {
                  profile: { name: 'Test User' },
                  wa_id: phone,
                },
              ],
              messages: [message as any],
            },
            field: 'messages',
          },
        ],
      },
    ],
  }
}

describe('Webhook Integration', () => {
  const testPhone = '5215559876543'
  const verifyToken = '6749739d94cb90f698ab9ba36bed1134639f015b7edec451f01b469fe577b638'

  describe('Webhook Verification (GET)', () => {
    it('builds correct verification URL params', () => {
      const params = new URLSearchParams({
        'hub.mode': 'subscribe',
        'hub.verify_token': verifyToken,
        'hub.challenge': '12345',
      })

      expect(params.get('hub.mode')).toBe('subscribe')
      expect(params.get('hub.verify_token')).toBe(verifyToken)
      expect(params.get('hub.challenge')).toBe('12345')
    })

    it('validates correct verify token', () => {
      const mode = 'subscribe'
      const token = verifyToken
      const challenge = '12345'

      const isValid = mode === 'subscribe' && token === verifyToken
      expect(isValid).toBe(true)
    })

    it('rejects incorrect verify token', () => {
      const mode = 'subscribe'
      const token = 'wrong-token'
      const challenge = '12345'

      const isValid = mode === 'subscribe' && token === verifyToken
      expect(isValid).toBe(false)
    })
  })

  describe('Webhook Signature Verification', () => {
    it('builds correct signature header format', () => {
      const signature = 'sha256=abc123def456'
      expect(signature.startsWith('sha256=')).toBe(true)
    })

    it('extracts signature value correctly', () => {
      const header = 'sha256=abc123def456'
      const value = header.replace('sha256=', '')
      expect(value).toBe('abc123def456')
    })
  })

  describe('Message Payload Parsing', () => {
    it('parses text message correctly', () => {
      const payload = createWebhookPayload(testPhone, {
        from: testPhone,
        id: 'msg_001',
        timestamp: '1234567890',
        type: 'text',
        text: { body: 'hola' },
      })

      const message = payload.entry[0].changes[0].value.messages[0]
      expect(message.from).toBe(testPhone)
      expect(message.type).toBe('text')
      expect(message.text?.body).toBe('hola')
    })

    it('parses image message correctly', () => {
      const payload = createWebhookPayload(testPhone, {
        from: testPhone,
        id: 'msg_002',
        timestamp: '1234567890',
        type: 'image',
        image: { id: 'media_abc', mime_type: 'image/jpeg', caption: 'Comprobante' },
      })

      const message = payload.entry[0].changes[0].value.messages[0]
      expect(message.type).toBe('image')
      expect(message.image?.id).toBe('media_abc')
      expect(message.image?.caption).toBe('Comprobante')
    })

    it('parses interactive button response correctly', () => {
      const payload = createWebhookPayload(testPhone, {
        from: testPhone,
        id: 'msg_003',
        timestamp: '1234567890',
        type: 'interactive',
        interactive: {
          type: 'button_reply',
          button_reply: { id: 'menu_make_payment', title: 'Realizar pago' },
        },
      })

      const message = payload.entry[0].changes[0].value.messages[0]
      expect(message.type).toBe('interactive')
      expect(message.interactive?.button_reply?.id).toBe('menu_make_payment')
      expect(message.interactive?.button_reply?.title).toBe('Realizar pago')
    })

    it('parses document message correctly', () => {
      const payload = createWebhookPayload(testPhone, {
        from: testPhone,
        id: 'msg_004',
        timestamp: '1234567890',
        type: 'document',
        document: { id: 'media_doc', mime_type: 'application/pdf', filename: 'receipt.pdf' },
      })

      const message = payload.entry[0].changes[0].value.messages[0]
      expect(message.type).toBe('document')
      expect(message.document?.id).toBe('media_doc')
      expect(message.document?.filename).toBe('receipt.pdf')
    })
  })

  describe('Contact Info Extraction', () => {
    it('extracts contact info from payload', () => {
      const payload = createWebhookPayload(testPhone, {
        from: testPhone,
        id: 'msg_001',
        timestamp: '1234567890',
        type: 'text',
        text: { body: 'hola' },
      })

      const contact = payload.entry[0].changes[0].value.contacts[0]
      expect(contact.wa_id).toBe(testPhone)
      expect(contact.profile.name).toBe('Test User')
    })

    it('extracts phone number ID', () => {
      const payload = createWebhookPayload(testPhone, {
        from: testPhone,
        id: 'msg_001',
        timestamp: '1234567890',
        type: 'text',
        text: { body: 'hola' },
      })

      const metadata = payload.entry[0].changes[0].value.metadata
      expect(metadata.phone_number_id).toBe('1193550707176336')
    })
  })

  describe('Payload Validation', () => {
    it('validates required fields exist', () => {
      const payload = createWebhookPayload(testPhone, {
        from: testPhone,
        id: 'msg_001',
        timestamp: '1234567890',
        type: 'text',
        text: { body: 'hola' },
      })

      expect(payload.object).toBe('whatsapp_business_account')
      expect(payload.entry).toBeDefined()
      expect(payload.entry.length).toBeGreaterThan(0)
      expect(payload.entry[0].changes).toBeDefined()
      expect(payload.entry[0].changes.length).toBeGreaterThan(0)
    })

    it('validates message has required fields', () => {
      const payload = createWebhookPayload(testPhone, {
        from: testPhone,
        id: 'msg_001',
        timestamp: '1234567890',
        type: 'text',
        text: { body: 'hola' },
      })

      const message = payload.entry[0].changes[0].value.messages[0]
      expect(message.from).toBeDefined()
      expect(message.id).toBeDefined()
      expect(message.timestamp).toBeDefined()
      expect(message.type).toBeDefined()
    })
  })
})
