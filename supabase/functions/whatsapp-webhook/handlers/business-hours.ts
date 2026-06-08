/**
 * Business hours configuration
 */
const BUSINESS_HOURS = {
  START: 8, // 8:00 AM
  END: 20, // 8:00 PM
}

/**
 * Timezone offsets from UTC (in hours)
 * Common timezones for Latin America
 */
const TIMEZONE_OFFSETS: Record<string, number> = {
  // Argentina
  "America/Argentina/Buenos_Aires": -3,
  "America/Argentina/Cordoba": -3,
  "America/Argentina/Mendoza": -3,
  
  // Chile
  "America/Santiago": -4, // Standard time
  "America/Punta_Arenas": -3,
  
  // Mexico
  "America/Mexico_City": -6, // Standard time
  "America/Tijuana": -8,
  "America/Cancun": -5,
  
  // Colombia
  "America/Bogota": -5,
  
  // Peru
  "America/Lima": -5,
  
  // Venezuela
  "America/Caracas": -4,
  
  // Ecuador
  "America/Guayaquil": -5,
  
  // Uruguay
  "America/Montevideo": -3,
  
  // Paraguay
  "America/Asuncion": -4, // Standard time
  
  // Bolivia
  "America/La_Paz": -4,
  
  // Central America
  "America/Guatemala": -6,
  "America/Tegucigalpa": -6,
  "America/Managua": -6,
  "America/Costa_Rica": -6,
  "America/Panama": -5,
  
  // Caribbean
  "America/Havana": -5,
  "America/Jamaica": -5,
  "America/Port-au-Prince": -5,
  
  // Brazil
  "America/Sao_Paulo": -3,
  "America/Manaus": -4,
  "America/Belem": -3,
  
  // USA (for reference)
  "America/New_York": -5, // EST
  "America/Chicago": -6, // CST
  "America/Denver": -7, // MST
  "America/Los_Angeles": -8, // PST
}

/**
 * Get current hour in a specific timezone
 * @param timezone - Timezone string (e.g., "America/Argentina/Buenos_Aires")
 * @returns Current hour (0-23)
 */
export function getCurrentHourInTimezone(timezone: string): number {
  try {
    // Get current time in the specified timezone
    const now = new Date()
    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: timezone,
    })
    const hour = parseInt(formatter.format(now), 10)
    return hour
  } catch (error) {
    console.error(`Error getting hour for timezone ${timezone}:`, error)
    // Fallback to UTC
    return new Date().getUTCHours()
  }
}

/**
 * Check if current time is within business hours for a timezone
 * @param timezone - Timezone string (e.g., "America/Argentina/Buenos_Aires")
 * @returns true if within business hours (8:00-20:00)
 */
export function isWithinBusinessHours(timezone: string): boolean {
  const currentHour = getCurrentHourInTimezone(timezone)
  return currentHour >= BUSINESS_HOURS.START && currentHour < BUSINESS_HOURS.END
}

/**
 * Get next business hours start time for a timezone
 * @param timezone - Timezone string
 * @returns Date object for next business hours start
 */
export function getNextBusinessHoursStart(timezone: string): Date {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    timeZone: timezone,
  })
  
  const [hourStr, minuteStr] = formatter.format(now).split(":")
  const currentHour = parseInt(hourStr, 10)
  const currentMinute = parseInt(minuteStr, 10)
  
  // Calculate next business hours start
  const nextStart = new Date(now)
  
  if (currentHour < BUSINESS_HOURS.START) {
    // Before business hours today
    nextStart.setHours(BUSINESS_HOURS.START, 0, 0, 0)
  } else {
    // After business hours today, set to tomorrow
    nextStart.setDate(nextStart.getDate() + 1)
    nextStart.setHours(BUSINESS_HOURS.START, 0, 0, 0)
  }
  
  return nextStart
}

/**
 * Get formatted business hours message
 * @param timezone - Timezone string
 * @returns Formatted message
 */
export function getBusinessHoursMessage(timezone: string): string {
  const nextStart = getNextBusinessHoursStart(timezone)
  const formatter = new Intl.DateTimeFormat("es-MX", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZone: timezone,
  })
  
  const nextStartTime = formatter.format(nextStart)
  
  return `Nuestro horario de atención es de 8:00 AM a 8:00 PM. Te atenderemos a partir de las ${nextStartTime}.`
}

/**
 * Validate timezone string
 * @param timezone - Timezone to validate
 * @returns true if valid timezone
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    // Try to use the timezone
    new Intl.DateTimeFormat("en-US", { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

/**
 * Get default timezone if not specified
 * @returns Default timezone (America/Mexico_City)
 */
export function getDefaultTimezone(): string {
  return "America/Mexico_City"
}
