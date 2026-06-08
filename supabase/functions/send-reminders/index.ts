import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const MAX_ATTEMPTS = 3
const REMINDER_START_HOUR = 8
const REMINDER_END_HOUR = 20
const DEFAULT_TIMEZONE = "America/Mexico_City"

// Get current hour in a timezone
function getLocalHour(date: Date, timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: timezone,
    })
    return parseInt(formatter.format(date))
  } catch {
    return new Date().getHours() // Fallback to UTC
  }
}

// Get next valid send time (8:00 AM in timezone)
function getNextValidTime(timezone: string): Date {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: timezone,
  })

  // Get current time in timezone
  const parts = formatter.formatToParts(now)
  const year = parseInt(parts.find((p) => p.type === "year")?.value || "0")
  const month = parseInt(parts.find((p) => p.type === "month")?.value || "1")
  const day = parseInt(parts.find((p) => p.type === "day")?.value || "1")
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0")

  // Create date for tomorrow 8:00 AM if past 20:00, or today 8:00 AM if before 8:00
  const nextDate = new Date(now)
  if (hour >= REMINDER_END_HOUR) {
    nextDate.setDate(nextDate.getDate() + 1)
  }
  nextDate.setHours(REMINDER_START_HOUR, 0, 0, 0)

  // Adjust for timezone offset
  const timezoneDate = new Date(nextDate.toLocaleString("en-US", { timeZone: timezone }))
  const utcDate = new Date(nextDate.toLocaleString("en-US", { timeZone: "UTC" }))
  const offset = timezoneDate.getTime() - utcDate.getTime()

  return new Date(nextDate.getTime() + offset)
}

// Send reminder message via whatsapp-send
async function sendReminderMessage(
  supabase: any,
  phone: string,
  clientName: string,
  debtDescription: string,
  amount: number
): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

  const message = `Hola ${clientName}, te recordamos que tienes un pago pendiente:\n\n📝 ${debtDescription}\n💰 Monto: $${amount.toLocaleString("es-MX")}\n\n¿Ya realizaste el pago? Responde con *SÍ* para enviarnos tu comprobante.`

  const response = await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: phone,
      type: "text",
      content: { text: message },
    }),
  })

  return response.ok
}

// Process a single reminder
async function processReminder(supabase: any, reminder: any): Promise<string> {
  const { id, client_id, debt_id, attempts } = reminder
  const client = reminder.clients
  const debt = reminder.debts

  // Check max attempts
  if (attempts >= MAX_ATTEMPTS) {
    await supabase
      .from("reminders")
      .update({ status: "failed" })
      .eq("id", id)
    return "failed"
  }

  // Get client timezone (default to Mexico City)
  const timezone = DEFAULT_TIMEZONE
  const localHour = getLocalHour(new Date(), timezone)

  // Check if within allowed hours (8:00 - 20:00)
  if (localHour < REMINDER_START_HOUR || localHour >= REMINDER_END_HOUR) {
    // Reprocess for next valid time
    const nextValidTime = getNextValidTime(timezone)

    const { error } = await supabase
      .from("reminders")
      .update({
        status: "pending",
        scheduled_at: nextValidTime.toISOString(),
        attempts: attempts + 1,
      })
      .eq("id", id)

    if (error) console.error("Error rescheduling reminder:", error)
    return "rescheduled"
  }

  // Send reminder message
  const sent = await sendReminderMessage(
    supabase,
    client.phone,
    client.name,
    debt.description,
    debt.amount
  )

  if (sent) {
    // Update to sent
    await supabase
      .from("reminders")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        attempts: attempts + 1,
      })
      .eq("id", id)
    return "sent"
  } else {
    // Increment attempts, mark as failed if max reached
    const newAttempts = attempts + 1
    const newStatus = newAttempts >= MAX_ATTEMPTS ? "failed" : "pending"

    await supabase
      .from("reminders")
      .update({
        status: newStatus,
        attempts: newAttempts,
      })
      .eq("id", id)

    return newStatus
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // Get pending reminders that are due
    const { data: reminders, error: remindersError } = await supabase
      .from("reminders")
      .select(`
        id,
        client_id,
        debt_id,
        status,
        scheduled_at,
        attempts,
        max_attempts,
        clients!inner(id, name, phone),
        debts!inner(id, description, amount)
      `)
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(50)

    if (remindersError) throw remindersError

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: "No pending reminders" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const results = {
      sent: 0,
      rescheduled: 0,
      failed: 0,
    }

    // Process each reminder
    for (const reminder of reminders) {
      const result = await processReminder(supabase, reminder)
      results[result as keyof typeof results]++
    }

    console.log(`Reminders processed: ${JSON.stringify(results)}`)

    return new Response(
      JSON.stringify({
        processed: reminders.length,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Send reminders error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
