import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Conversation, WhatsAppMessage } from "../types.ts"

// Error messages
const ERROR_MESSAGES = {
  INVALID_TEXT: "No entendí tu mensaje. Por favor, selecciona una opción del menú.",
  RECEIPT_OUT_OF_FLOW: "Para enviar un comprobante, primero selecciona 'Realizar pago' en el menú. Escribe 'menu' para ver las opciones.",
  WHATSAPP_API_ERROR: "Hubo un error al enviar tu mensaje. Por favor, intenta de nuevo.",
  TIMEOUT: "Tu conversación ha expirado por inactividad. Escribe 'menu' para comenzar de nuevo.",
}

/**
 * Check if a message is a valid menu command
 * @param message - WhatsApp message
 * @returns true if message is valid
 */
export function isValidMenuCommand(message: WhatsAppMessage): boolean {
  if (message.type !== "text") return false
  const content = message.text?.body?.toLowerCase().trim() || ""
  const validCommands = ["menu", "menú", "inicio", "hola", "opciones", "start"]
  return validCommands.some((cmd) => content.includes(cmd))
}

/**
 * Check if message is a receipt (image/document)
 * @param message - WhatsApp message
 * @returns true if message has media
 */
export function isReceiptMessage(message: WhatsAppMessage): boolean {
  return message.type === "image" || message.type === "document"
}

/**
 * Send error message with menu button
 * @param supabase - Supabase client
 * @param conversation - Conversation object
 * @param errorType - Type of error
 */
export async function sendErrorMessage(
  supabase: SupabaseClient,
  conversation: Conversation,
  errorType: keyof typeof ERROR_MESSAGES
): Promise<void> {
  const messageText = ERROR_MESSAGES[errorType] || ERROR_MESSAGES.INVALID_TEXT

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
        buttons: [
          { id: "error_back_menu", title: "Ver menú" },
        ],
      },
    }),
  })

  if (!response.ok) {
    console.error("Error sending error message:", await response.text())
  }
}

/**
 * Handle invalid text input (send menu)
 * @param supabase - Supabase client
 * @param conversation - Conversation object
 */
export async function handleInvalidText(
  supabase: SupabaseClient,
  conversation: Conversation
): Promise<void> {
  await sendErrorMessage(supabase, conversation, "INVALID_TEXT")
}

/**
 * Handle receipt out of flow
 * @param supabase - Supabase client
 * @param conversation - Conversation object
 */
export async function handleReceiptOutOfFlow(
  supabase: SupabaseClient,
  conversation: Conversation
): Promise<void> {
  await sendErrorMessage(supabase, conversation, "RECEIPT_OUT_OF_FLOW")
}

/**
 * Handle conversation timeout (24h inactivity)
 * @param supabase - Supabase client
 * @param conversationId - Conversation ID
 */
export async function handleConversationTimeout(
  supabase: SupabaseClient,
  conversationId: string
): Promise<void> {
  // Reset conversation to menu
  await supabase
    .from("conversations")
    .update({
      state: "menu",
      context: {},
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId)

  console.log(`Conversation ${conversationId} reset due to timeout`)
}

/**
 * Check if conversation has timed out (24h without messages)
 * @param supabase - Supabase client
 * @param conversationId - Conversation ID
 * @returns true if conversation has timed out
 */
export async function hasConversationTimedOut(
  supabase: SupabaseClient,
  conversationId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("conversations")
    .select("last_message_at")
    .eq("id", conversationId)
    .single()

  if (error || !data) return false

  const lastMessage = new Date(data.last_message_at)
  const now = new Date()
  const hoursSinceLastMessage = (now.getTime() - lastMessage.getTime()) / (1000 * 60 * 60)

  return hoursSinceLastMessage >= 24
}

/**
 * Handle API error with retry logic
 * @param error - Error object
 * @param retryFn - Function to retry
 * @param maxRetries - Maximum number of retries
 * @returns Result of retry or null
 */
export async function handleApiError<T>(
  error: Error,
  retryFn: () => Promise<T>,
  maxRetries = 1
): Promise<T | null> {
  console.error("API Error:", error.message)

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Retrying API call (attempt ${attempt + 1}/${maxRetries})`)
      return await retryFn()
    } catch (retryError) {
      console.error(`Retry ${attempt + 1} failed:`, (retryError as Error).message)
    }
  }

  console.error("All retries failed")
  return null
}
