import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Conversation, WhatsAppMessage } from "../types.ts"

// Debt button IDs
export const DEBT_BUTTONS = {
  MAKE_PAYMENT: "debt_make_payment",
  BACK_TO_MENU: "debt_back_menu",
} as const

// Debt status display names
const DEBT_STATUS_NAMES: Record<string, string> = {
  pending: "Pendiente",
  overdue: "Vencida",
  paid: "Pagada",
  cancelled: "Cancelada",
}

// Debt interface
interface Debt {
  id: string
  description: string
  amount: number
  status: string
  due_date: string
  created_at: string
}

/**
 * Get pending debts for a client
 * @param supabase - Supabase client
 * @param clientId - Client ID
 * @returns Array of pending debts
 */
async function getPendingDebts(
  supabase: SupabaseClient,
  clientId: string
): Promise<Debt[]> {
  const { data, error } = await supabase
    .from("debts")
    .select("id, description, amount, status, due_date, created_at")
    .eq("client_id", clientId)
    .in("status", ["pending", "overdue"])
    .order("due_date", { ascending: true })

  if (error) {
    console.error("Error fetching debts:", error)
    return []
  }

  return data || []
}

/**
 * Format currency amount
 * @param amount - Amount to format
 * @returns Formatted string (e.g., "$1,500.00")
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount)
}

/**
 * Format date to local string
 * @param dateStr - ISO date string
 * @returns Formatted date (e.g., "15/03/2026")
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

/**
 * Build debt message with details
 * @param debts - Array of debts
 * @returns Formatted message string
 */
function buildDebtMessage(debts: Debt[]): string {
  if (debts.length === 0) {
    return "✅ No tienes deudas pendientes. ¡Estás al día!"
  }

  let message = "📋 *Tus deudas pendientes:*\n\n"

  debts.forEach((debt, index) => {
    const statusName = DEBT_STATUS_NAMES[debt.status] || debt.status
    const dueDate = formatDate(debt.due_date)
    const isOverdue = debt.status === "overdue"

    message += `${index + 1}. ${debt.description}\n`
    message += `   💰 Monto: ${formatCurrency(debt.amount)}\n`
    message += `   📅 Fecha límite: ${dueDate}\n`
    message += `   📌 Estado: ${isOverdue ? "⚠️ " : ""}${statusName}\n\n`
  })

  // Calculate total
  const total = debts.reduce((sum, debt) => sum + debt.amount, 0)
  message += `💵 *Total:* ${formatCurrency(total)}`

  return message
}

/**
 * Send debt information to user
 * @param supabase - Supabase client
 * @param conversation - Conversation object
 */
export async function sendDebtInfo(
  supabase: SupabaseClient,
  conversation: Conversation
): Promise<void> {
  // Get pending debts
  const debts = await getPendingDebts(supabase, conversation.client_id)

  // Build message
  const messageText = buildDebtMessage(debts)

  // Determine buttons based on debt status
  const hasDebts = debts.length > 0
  const buttons = hasDebts
    ? [
        { id: DEBT_BUTTONS.MAKE_PAYMENT, title: "Realizar pago" },
        { id: DEBT_BUTTONS.BACK_TO_MENU, title: "Volver al menú" },
      ]
    : [
        { id: DEBT_BUTTONS.BACK_TO_MENU, title: "Volver al menú" },
      ]

  // Send via whatsapp-send function
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

  const response = await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: conversation.phone,
      type: "buttons",
      conversation_id: conversation.id,
      content: {
        body: messageText,
        buttons,
      },
    }),
  })

  if (!response.ok) {
    console.error("Error sending debt info:", await response.text())
  }
}

/**
 * Handle debt viewing button response
 * @param supabase - Supabase client
 * @param conversation - Conversation object
 * @param message - User's interactive message
 * @returns Next state or null if not handled
 */
export async function handleDebtResponse(
  supabase: SupabaseClient,
  conversation: Conversation,
  message: WhatsAppMessage
): Promise<{ state: string; context?: Record<string, unknown> } | null> {
  const buttonId = message.interactive?.button_reply?.id

  if (!buttonId) return null

  switch (buttonId) {
    case DEBT_BUTTONS.MAKE_PAYMENT:
      return { state: "sent_bank_details" }

    case DEBT_BUTTONS.BACK_TO_MENU:
      return { state: "menu" }

    default:
      return null
  }
}
