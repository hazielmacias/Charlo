import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getCurrentHourInTimezone,
  isWithinBusinessHours,
  getNextBusinessHoursStart,
  getBusinessHoursMessage,
  isValidTimezone,
  getDefaultTimezone,
  getTimezoneOffset,
} from '../lib/business-hours'

describe('Business Hours', () => {
  describe('getCurrentHourInTimezone', () => {
    it('returns a number between 0 and 23', () => {
      const hour = getCurrentHourInTimezone('America/Mexico_City')
      expect(hour).toBeGreaterThanOrEqual(0)
      expect(hour).toBeLessThanOrEqual(23)
    })

    it('returns correct hour for known timezone', () => {
      const hour = getCurrentHourInTimezone('America/New_York')
      expect(typeof hour).toBe('number')
      expect(hour).toBeGreaterThanOrEqual(0)
      expect(hour).toBeLessThanOrEqual(23)
    })

    it('falls back to UTC for invalid timezone', () => {
      const hour = getCurrentHourInTimezone('Invalid/Timezone')
      expect(hour).toBeGreaterThanOrEqual(0)
      expect(hour).toBeLessThanOrEqual(23)
    })
  })

  describe('isWithinBusinessHours', () => {
    it('returns a boolean', () => {
      const result = isWithinBusinessHours('America/Mexico_City')
      expect(typeof result).toBe('boolean')
    })

    it('returns true during business hours (8-20)', () => {
      // Get current hour and test that the function returns correct results
      // based on actual current time (we can't mock Intl.DateTimeFormat easily)
      const currentHour = getCurrentHourInTimezone('UTC')
      const result = isWithinBusinessHours('UTC')

      if (currentHour >= 8 && currentHour < 20) {
        expect(result).toBe(true)
      } else {
        expect(result).toBe(false)
      }
    })

    it('correctly identifies outside business hours', () => {
      const currentHour = getCurrentHourInTimezone('UTC')
      const result = isWithinBusinessHours('UTC')

      if (currentHour < 8 || currentHour >= 20) {
        expect(result).toBe(false)
      } else {
        expect(result).toBe(true)
      }
    })
  })

  describe('getNextBusinessHoursStart', () => {
    it('returns a Date object', () => {
      const nextStart = getNextBusinessHoursStart('America/Mexico_City')
      expect(nextStart).toBeInstanceOf(Date)
    })

    it('returns hour 8 in local time', () => {
      const nextStart = getNextBusinessHoursStart('UTC')
      expect(nextStart.getHours()).toBe(8)
      expect(nextStart.getMinutes()).toBe(0)
    })

    it('returns a date with hour set to 8', () => {
      const nextStart = getNextBusinessHoursStart('America/New_York')
      expect(nextStart.getHours()).toBe(8)
    })
  })

  describe('getBusinessHoursMessage', () => {
    it('returns a string containing business hours info', () => {
      const message = getBusinessHoursMessage('America/Mexico_City')
      expect(typeof message).toBe('string')
      expect(message).toContain('8:00')
    })

    it('returns a message in Spanish', () => {
      const message = getBusinessHoursMessage('America/Mexico_City')
      expect(message).toContain('horario de atención')
    })
  })

  describe('isValidTimezone', () => {
    it('returns true for valid timezones', () => {
      expect(isValidTimezone('America/Mexico_City')).toBe(true)
      expect(isValidTimezone('America/New_York')).toBe(true)
      expect(isValidTimezone('UTC')).toBe(true)
      expect(isValidTimezone('Europe/London')).toBe(true)
    })

    it('returns false for invalid timezones', () => {
      expect(isValidTimezone('Invalid/Timezone')).toBe(false)
      expect(isValidTimezone('NotATimezone')).toBe(false)
      expect(isValidTimezone('')).toBe(false)
    })
  })

  describe('getDefaultTimezone', () => {
    it('returns America/Mexico_City', () => {
      expect(getDefaultTimezone()).toBe('America/Mexico_City')
    })
  })

  describe('getTimezoneOffset', () => {
    it('returns offset for known timezones', () => {
      expect(getTimezoneOffset('America/Mexico_City')).toBe(-6)
      expect(getTimezoneOffset('America/New_York')).toBe(-5)
      expect(getTimezoneOffset('America/Argentina/Buenos_Aires')).toBe(-3)
      expect(getTimezoneOffset('America/Bogota')).toBe(-5)
    })

    it('returns undefined for unknown timezones', () => {
      expect(getTimezoneOffset('Unknown/Timezone')).toBeUndefined()
    })
  })
})
