import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Conversation, WhatsAppMessage } from "../types.ts"

// Payment button IDs
export const PAYMENT_BUTTONS = {
  CONFIRM_PAYMENT: "payment_confirm",
  CANCEL: "payment_cancel",
} as const

// Bank config interface
interface BankConfig {
  id: string
  bank_name: string
  account_type: string
  cbu: string
  alias: string
  account_holder: string
}

// Account type display names
const ACCOUNT_TYPE_NAMES: Record<string, string> = {
  savings: "Cuenta de Ahorro",
  checking: "Cuenta Corriente",
  wallet: "Monedero",
}

/**
 * Get active bank configuration
 * @param supabase - Supabase client
 * @returns Active bank config or null
 */
async function getActiveBankConfig(
  supabase: SupabaseClient
): Promise<BankConfig | null> {
  const { data, error } = await supabase
    .from("bank_config")
    .select("id, bank_name, account_type, cbu, alias, account_holder")
    .eq("is_active", true)
    .limit(1)
    .single()

  if (error) {
    console.error("Error fetching bank config:", error)
    return null
  }

  return data as BankConfig
}

/**
 * Get pending debt total for client
 * @param supabase - Supabase client
 * @param clientId - Client ID
 * @returns Total pending amount
 */
async function getPendingDebtTotal(
  supabase: SupabaseClient,
  clientId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("debts")
    .select("amount")
    .eq("client_id", clientId)
    .in("status", ["pending", "overdue"])

  if (error) {
    console.error("Error fetching debt total:", error)
    return 0
  }

  return (data || []).reduce((sum, debt) => sum + debt.amount, 0)
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
 * Build bank details message
 * @param bank - Bank config
 * @param total - Total pending amount
 * @returns Formatted message string
 */
function buildBankDetailsMessage(bank: BankConfig, total: number): string {
  const accountType = ACCOUNT_TYPE_NAMES[bank.account_type] || bank.account_type

  let message = "🏦 *Datos para realizar tu pago:*\n\n"
  message += `🏦 Banco: ${bank.bank_name}\n`
  message += `💳 Tipo de cuenta: ${accountType}\n`
  message += `🔑 CBU: ${bank.cbu}\n`
  message += `📝 Alias: ${bank.alias}\n`
  message += `👤 Titular: ${bank.account_holder}\n\n`
  message += `💵 *Monto a pagar: ${formatCurrency(total)}*\n\n`
  message += "⚠️ *Importante:*\n"
  message += "• Una vez realizado el pago, envía tu comprobante\n"
  message += "• El comprobante debe ser legible\n"
  message += "• Aceptamos imágenes (JPG, PNG) o PDF"

  return message
}

/**
 * Send bank details to user
 * @param supabase - Supabase client
 * @param conversation - Conversation object
 */
export async function sendBankDetails(
  supabase: SupabaseClient,
  conversation: Conversation
): Promise<void> {
  // Get active bank config
  const bank = await getActiveBankConfig(supabase)
  if (!bank) {
    console.error("No active bank config found")
    return
  }

  // Get pending debt total
  const total = await getPendingDebtTotal(supabase, conversation.client_id)

  // Build message
  const messageText = buildBankDetailsMessage(bank, total)

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
      type: "text",
      conversation_id: conversation.id,
      content: {
        text: messageText,
      },
    }),
  })

  if (!response.ok) {
    console.error("Error sending bank details:", await response.text())
  }
}

/**
 * Handle payment button response
 * @param supabase - Supabase client
 * @param conversation - Conversation object
 * @param message - User's interactive message
 * @returns Next state or null if not handled
 */
export async function handlePaymentResponse(
  supabase: SupabaseClient,
  conversation: Conversation,
  message: WhatsAppMessage
): Promise<{ state: string; context?: Record<string, unknown> } | null> {
  const buttonId = message.interactive?.button_reply?.id

  if (!buttonId) return null

  switch (buttonId) {
    case PAYMENT_BUTTONS.CONFIRM_PAYMENT:
      return { state: "awaiting_payment" }

    case PAYMENT_BUTTONS.CANCEL:
      return { state: "menu" }

    default:
      return null
  }
}

/**
 * Handle sent_bank_details state logic
 * @param supabase - Supabase client
 * @param conversation - Conversation object
 * @param message - Incoming message
 * @returns Next state or null if not handled
 */
export async function handle_sent_bank_details_state(
  supabase: SupabaseClient,
  conversation: Conversation,
  message: WhatsAppMessage
): Promise<{ state: ConversationState; context?: Record<string, unknown> } | null> {
  // Send bank details
  await sendBankDetails(supabase, conversation)

  // Check if it's a button response
  if (message.type === "interactive") {
    const result = await handlePaymentResponse(supabase, conversation, message)
    if (result) {
      return { state: result.state as ConversationState, context: result.context }
    }
  }

  // Check if it's a receipt (image or document)
  if (message.type === "image" || message.type === "document") {
    // Process receipt - will be handled by process-receipt function
    return { state: "receipt_received" }
  }

  // Stay in sent_bank_details state for other messages
  return null
}

// Import ConversationState type
import { ConversationState } from "../types.ts"
