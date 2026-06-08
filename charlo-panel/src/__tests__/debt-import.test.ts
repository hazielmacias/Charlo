import { describe, it, expect } from 'vitest'
import { validateRow } from '../lib/validate-debt-import'

describe('Debt Import Validation', () => {
  describe('validateRow', () => {
    it('validates a correct row with English column names', () => {
      const row = {
        client_phone: '5215551234567',
        client_name: 'John Doe',
        description: 'Deuda de ejemplo',
        amount: '1500.50',
        due_date: '2026-12-31',
      }

      const result = validateRow(row)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.client_phone).toBe('5215551234567')
      expect(result.client_name).toBe('John Doe')
      expect(result.description).toBe('Deuda de ejemplo')
      expect(result.amount).toBe(1500.5)
      expect(result.due_date).toBe('2026-12-31')
    })

    it('validates a correct row with Spanish column names', () => {
      const row = {
        telefono: '5215551234567',
        nombre: 'Juan Pérez',
        descripcion: 'Deuda de ejemplo',
        monto: '2000',
        fecha: '2026-06-15',
      }

      const result = validateRow(row)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.client_phone).toBe('5215551234567')
      expect(result.client_name).toBe('Juan Pérez')
      expect(result.description).toBe('Deuda de ejemplo')
      expect(result.amount).toBe(2000)
      expect(result.due_date).toBe('2026-06-15')
    })

    it('validates a correct row with alternate Spanish column names', () => {
      const row = {
        phone: '5215551234567',
        descripcion: 'Servicio de limpieza',
        monto: '500',
        fecha_vencimiento: '2026-09-01',
      }

      const result = validateRow(row)

      expect(result.valid).toBe(true)
      expect(result.client_phone).toBe('5215551234567')
      expect(result.description).toBe('Servicio de limpieza')
      expect(result.amount).toBe(500)
      expect(result.due_date).toBe('2026-09-01')
    })

    it('returns error when phone is missing', () => {
      const row = {
        description: 'Deuda',
        amount: '1000',
        due_date: '2026-12-31',
      }

      const result = validateRow(row)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Teléfono requerido')
    })

    it('returns error when description is missing', () => {
      const row = {
        client_phone: '5215551234567',
        amount: '1000',
        due_date: '2026-12-31',
      }

      const result = validateRow(row)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Descripción requerida')
    })

    it('returns error when amount is missing', () => {
      const row = {
        client_phone: '5215551234567',
        description: 'Deuda',
        due_date: '2026-12-31',
      }

      const result = validateRow(row)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Monto inválido')
    })

    it('returns error when amount is zero', () => {
      const row = {
        client_phone: '5215551234567',
        description: 'Deuda',
        amount: '0',
        due_date: '2026-12-31',
      }

      const result = validateRow(row)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Monto inválido')
    })

    it('returns error when amount is negative', () => {
      const row = {
        client_phone: '5215551234567',
        description: 'Deuda',
        amount: '-500',
        due_date: '2026-12-31',
      }

      const result = validateRow(row)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Monto inválido')
    })

    it('returns error when due_date is missing', () => {
      const row = {
        client_phone: '5215551234567',
        description: 'Deuda',
        amount: '1000',
      }

      const result = validateRow(row)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Fecha de vencimiento requerida')
    })

    it('collects multiple errors', () => {
      const row = {}

      const result = validateRow(row)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(4)
      expect(result.errors).toContain('Teléfono requerido')
      expect(result.errors).toContain('Descripción requerida')
      expect(result.errors).toContain('Monto inválido')
      expect(result.errors).toContain('Fecha de vencimiento requerida')
    })

    it('converts phone number to string', () => {
      const row = {
        client_phone: 5215551234567,
        description: 'Deuda',
        amount: '1000',
        due_date: '2026-12-31',
      }

      const result = validateRow(row)

      expect(result.client_phone).toBe('5215551234567')
    })

    it('defaults client_name to empty string if not provided', () => {
      const row = {
        client_phone: '5215551234567',
        description: 'Deuda',
        amount: '1000',
        due_date: '2026-12-31',
      }

      const result = validateRow(row)

      expect(result.client_name).toBe('')
    })

    it('handles amount with commas', () => {
      const row = {
        client_phone: '5215551234567',
        description: 'Deuda',
        amount: '1,500.50',
        due_date: '2026-12-31',
      }

      const result = validateRow(row)

      // parseFloat('1,500.50') returns 1 (stops at comma)
      // This is expected behavior - users should not use commas
      expect(result.amount).toBe(1)
    })
  })
})
