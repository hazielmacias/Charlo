/**
 * Business hours helper — extracted from Edge Function for testing
 * Original: supabase/functions/whatsapp-webhook/handlers/business-hours.ts
 */

const BUSINESS_HOURS = {
  START: 8,
  END: 20,
}

const TIMEZONE_OFFSETS: Record<string, number> = {
  'America/Argentina/Buenos_Aires': -3,
  'America/Argentina/Cordoba': -3,
  'America/Argentina/Mendoza': -3,
  'America/Santiago': -4,
  'America/Punta_Arenas': -3,
  'America/Mexico_City': -6,
  'America/Tijuana': -8,
  'America/Cancun': -5,
  'America/Bogota': -5,
  'America/Lima': -5,
  'America/Caracas': -4,
  'America/Guayaquil': -5,
  'America/Montevideo': -3,
  'America/Asuncion': -4,
  'America/La_Paz': -4,
  'America/Guatemala': -6,
  'America/Tegucigalpa': -6,
  'America/Managua': -6,
  'America/Costa_Rica': -6,
  'America/Panama': -5,
  'America/Havana': -5,
  'America/Jamaica': -5,
  'America/Port-au-Prince': -5,
  'America/Sao_Paulo': -3,
  'America/Manaus': -4,
  'America/Belem': -3,
  'America/New_York': -5,
  'America/Chicago': -6,
  'America/Denver': -7,
  'America/Los_Angeles': -8,
}

export function getCurrentHourInTimezone(timezone: string): number {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: timezone,
    })
    const hour = parseInt(formatter.format(now), 10)
    return hour
  } catch (error) {
    console.error(`Error getting hour for timezone ${timezone}:`, error)
    return new Date().getUTCHours()
  }
}

export function isWithinBusinessHours(timezone: string): boolean {
  const currentHour = getCurrentHourInTimezone(timezone)
  return currentHour >= BUSINESS_HOURS.START && currentHour < BUSINESS_HOURS.END
}

export function getNextBusinessHoursStart(timezone: string): Date {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    timeZone: timezone,
  })

  const [hourStr] = formatter.format(now).split(':')
  const currentHour = parseInt(hourStr, 10)

  const nextStart = new Date(now)

  if (currentHour < BUSINESS_HOURS.START) {
    nextStart.setHours(BUSINESS_HOURS.START, 0, 0, 0)
  } else {
    nextStart.setDate(nextStart.getDate() + 1)
    nextStart.setHours(BUSINESS_HOURS.START, 0, 0, 0)
  }

  return nextStart
}

export function getBusinessHoursMessage(timezone: string): string {
  const nextStart = getNextBusinessHoursStart(timezone)
  const formatter = new Intl.DateTimeFormat('es-MX', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    timeZone: timezone,
  })

  const nextStartTime = formatter.format(nextStart)

  return `Nuestro horario de atención es de 8:00 AM a 8:00 PM. Te atenderemos a partir de las ${nextStartTime}.`
}

export function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

export function getDefaultTimezone(): string {
  return 'America/Mexico_City'
}

export function getTimezoneOffset(timezone: string): number | undefined {
  return TIMEZONE_OFFSETS[timezone]
}
