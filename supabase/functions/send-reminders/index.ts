import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const REMINDER_START_HOUR = 8
const REMINDER_END_HOUR = 20
const DEFAULT_TIMEZONE = "America/Mexico_City"

const DEFAULT_REMINDER_MESSAGES: Record<string, string> = {
  "3_days": "Tu pago vence en 3 dias. {description} - Monto: ${amount}",
  "1_day": "Tu pago vence mañana. {description} - Monto: ${amount}",
  "due_today": "Tu pago vence hoy. {description} - Monto: ${amount}",
  "overdue": "Tu pago esta vencido. {description} - Monto: ${amount}. Por favor realiza tu pago lo antes posible.",
}

function getLocalHour(date: Date, timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: timezone,
    })
    return parseInt(formatter.format(date))
  } catch {
    return new Date().getHours()
  }
}

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

  const parts = formatter.formatToParts(now)
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0")

  const nextDate = new Date(now)
  if (hour >= REMINDER_END_HOUR) {
    nextDate.setDate(nextDate.getDate() + 1)
  }
  nextDate.setHours(REMINDER_START_HOUR, 0, 0, 0)

  const timezoneDate = new Date(nextDate.toLocaleString("en-US", { timeZone: timezone }))
  const utcDate = new Date(nextDate.toLocaleString("en-US", { timeZone: "UTC" }))
  const offset = timezoneDate.getTime() - utcDate.getTime()

  return new Date(nextDate.getTime() + offset)
}

async function getReminderMessages(supabase: any): Promise<Record<string, string>> {
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "reminder_messages")
    .single()

  if (data?.value) {
    try {
      return { ...DEFAULT_REMINDER_MESSAGES, ...data.value }
    } catch {
      return DEFAULT_REMINDER_MESSAGES
    }
  }
  return DEFAULT_REMINDER_MESSAGES
}

function buildReminderMessage(
  reminderType: string,
  clientName: string,
  debtDescription: string,
  amount: number,
  messages: Record<string, string>
): string {
  const template = messages[reminderType] || messages["due_today"] || ""
  return `Hola ${clientName}, te recordamos que tienes un pago pendiente:\n\n${template.replace("{description}", debtDescription).replace("${amount}", amount.toLocaleString("es-MX"))}\n\n¿Ya realizaste el pago? Responde con *SI* para enviarnos tu comprobante.`
}

async function sendReminderMessage(
  supabase: any,
  phone: string,
  message: string
): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

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

async function processReminder(
  supabase: any,
  reminder: any,
  messages: Record<string, string>
): Promise<string> {
  const { id, reminder_type, client_id, debt_id, attempts } = reminder
  const client = reminder.clients
  const debt = reminder.debts

  const maxAttempts = reminder.max_attempts || 3
  if (attempts >= maxAttempts) {
    await supabase
      .from("reminders")
      .update({ status: "failed" })
      .eq("id", id)
    return "failed"
  }

  const timezone = DEFAULT_TIMEZONE
  const localHour = getLocalHour(new Date(), timezone)

  if (localHour < REMINDER_START_HOUR || localHour >= REMINDER_END_HOUR) {
    const nextValidTime = getNextValidTime(timezone)

    await supabase
      .from("reminders")
      .update({
        status: "pending",
        scheduled_at: nextValidTime.toISOString(),
        attempts: attempts + 1,
      })
      .eq("id", id)

    return "rescheduled"
  }

  const message = buildReminderMessage(
    reminder_type,
    client.name,
    debt.description,
    debt.amount,
    messages
  )

  const sent = await sendReminderMessage(supabase, client.phone, message)

  if (sent) {
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
    const newAttempts = attempts + 1
    const newStatus = newAttempts >= maxAttempts ? "failed" : "pending"

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

async function generateOverdueReminders(supabase: any): Promise<void> {
  try {
    await supabase.rpc("generate_overdue_reminders")
  } catch (err) {
    console.error("Error generating overdue reminders:", err)
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

    const reminderMessages = await getReminderMessages(supabase)

    const { data: reminders, error: remindersError } = await supabase
      .from("reminders")
      .select(`
        id,
        reminder_type,
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
      await generateOverdueReminders(supabase)

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

    for (const reminder of reminders) {
      const result = await processReminder(supabase, reminder, reminderMessages)
      results[result as keyof typeof results]++
    }

    await generateOverdueReminders(supabase)

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