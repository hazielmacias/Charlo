import { describe, it, expect } from 'vitest'

// Valid states for the conversation state machine
const VALID_STATES = [
  'menu',
  'viewing_debt',
  'awaiting_payment',
  'sent_bank_details',
  'human_agent',
] as const

type ConversationState = (typeof VALID_STATES)[number]

function isValidState(state: string): state is ConversationState {
  return VALID_STATES.includes(state as ConversationState)
}

describe('State Machine Validation', () => {
  describe('VALID_STATES constant', () => {
    it('contains all expected states', () => {
      expect(VALID_STATES).toContain('menu')
      expect(VALID_STATES).toContain('viewing_debt')
      expect(VALID_STATES).toContain('awaiting_payment')
      expect(VALID_STATES).toContain('sent_bank_details')
      expect(VALID_STATES).toContain('human_agent')
    })

    it('has exactly 5 states', () => {
      expect(VALID_STATES.length).toBe(5)
    })

    it('does not contain invalid states', () => {
      expect(VALID_STATES).not.toContain('closed')
      expect(VALID_STATES).not.toContain('receipt_received')
      expect(VALID_STATES).not.toContain('idle')
    })
  })

  describe('isValidState', () => {
    it('returns true for all valid states', () => {
      expect(isValidState('menu')).toBe(true)
      expect(isValidState('viewing_debt')).toBe(true)
      expect(isValidState('awaiting_payment')).toBe(true)
      expect(isValidState('sent_bank_details')).toBe(true)
      expect(isValidState('human_agent')).toBe(true)
    })

    it('returns false for invalid states', () => {
      expect(isValidState('closed')).toBe(false)
      expect(isValidState('receipt_received')).toBe(false)
      expect(isValidState('')).toBe(false)
      expect(isValidState('random_state')).toBe(false)
    })

    it('is case-sensitive', () => {
      expect(isValidState('Menu')).toBe(false)
      expect(isValidState('MENU')).toBe(false)
      expect(isValidState('Viewing_Debt')).toBe(false)
    })
  })

  describe('State transitions', () => {
    // Simulate valid state transitions
    const validTransitions: Record<ConversationState, ConversationState[]> = {
      menu: ['viewing_debt', 'sent_bank_details', 'human_agent'],
      viewing_debt: ['menu', 'sent_bank_details', 'human_agent'],
      awaiting_payment: ['menu', 'sent_bank_details'],
      sent_bank_details: ['menu', 'human_agent'],
      human_agent: ['menu'],
    }

    it('defines transitions for all states', () => {
      for (const state of VALID_STATES) {
        expect(validTransitions[state]).toBeDefined()
        expect(Array.isArray(validTransitions[state])).toBe(true)
      }
    })

    it('allows menu -> viewing_debt', () => {
      expect(validTransitions.menu).toContain('viewing_debt')
    })

    it('allows menu -> sent_bank_details', () => {
      expect(validTransitions.menu).toContain('sent_bank_details')
    })

    it('allows menu -> human_agent', () => {
      expect(validTransitions.menu).toContain('human_agent')
    })

    it('allows human_agent -> menu (reset)', () => {
      expect(validTransitions.human_agent).toContain('menu')
    })

    it('does not allow human_agent -> viewing_debt', () => {
      expect(validTransitions.human_agent).not.toContain('viewing_debt')
    })

    it('does not allow sent_bank_details -> viewing_debt', () => {
      expect(validTransitions.sent_bank_details).not.toContain('viewing_debt')
    })
  })
})
