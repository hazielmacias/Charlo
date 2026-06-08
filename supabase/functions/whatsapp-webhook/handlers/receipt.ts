import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { Conversation, WhatsAppMessage, ConversationState } from "../types.ts"

// Receipt button IDs
export const RECEIPT_BUTTONS = {
  BACK_TO_MENU: "receipt_back_menu",
  TALK_AGENT: "receipt_talk_agent",
} as const

/**
 * Check if message contains media (image or document)
 * @param message - WhatsApp message
 * @returns true if message has media
 */
export function hasMedia(message: WhatsAppMessage): boolean {
  return message.type === "image" || message.type === "document"
}

/**
 * Get media ID from message
 * @param message - WhatsApp message
 * @returns Media ID or null
 */
function getMediaId(message: WhatsAppMessage): string | null {
  if (message.type === "image") {
    return message.image?.id || null
  }
  if (message.type === "document") {
    return message.document?.id || null
  }
  return null
}

/**
 * Call process-receipt Edge Function
 * @param supabase - Supabase client
 * @param conversationId - Conversation ID
 * @param mediaId - WhatsApp media ID
 * @returns Process receipt result
 */
async function callProcessReceipt(
  supabase: SupabaseClient,
  conversationId: string,
  mediaId: string
): Promise<{ success: boolean; error?: string }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

  const response = await fetch(`${supabaseUrl}/functions/v1/process-receipt`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversation_id: conversationId,
      media_id: mediaId,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error("Error calling process-receipt:", error)
    return { success: false, error }
  }

  return { success: true }
}

/**
 * Send receipt confirmation message with buttons
 * @param supabase - Supabase client
 * @param conversation - Conversation object
 */
export async function sendReceiptConfirmation(
  supabase: SupabaseClient,
  conversation: Conversation
): Promise<void> {
  const confirmationText = "✅ *Comprobante recibido.*\n\nSerá revisado por un administrador. Te notificaremos cuando sea aprobado."

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
        body: confirmationText,
        buttons: [
          { id: RECEIPT_BUTTONS.BACK_TO_MENU, title: "Volver al menú" },
          { id: RECEIPT_BUTTONS.TALK_AGENT, title: "Hablar con asesor" },
        ],
      },
    }),
  })

  if (!response.ok) {
    console.error("Error sending receipt confirmation:", await response.text())
  }
}

/**
 * Handle receipt button response
 * @param supabase - Supabase client
 * @param conversation - Conversation object
 * @param message - User's interactive message
 * @returns Next state or null if not handled
 */
export async function handleReceiptResponse(
  supabase: SupabaseClient,
  conversation: Conversation,
  message: WhatsAppMessage
): Promise<{ state: string; context?: Record<string, unknown> } | null> {
  const buttonId = message.interactive?.button_reply?.id

  if (!buttonId) return null

  switch (buttonId) {
    case RECEIPT_BUTTONS.BACK_TO_MENU:
      return { state: "menu" }

    case RECEIPT_BUTTONS.TALK_AGENT:
      return { state: "human_agent" }

    default:
      return null
  }
}

/**
 * Handle receipt_received state logic
 * @param supabase - Supabase client
 * @param conversation - Conversation object
 * @param message - Incoming message
 * @returns Next state or null if not handled
 */
export async function handle_receipt_received_state(
  supabase: SupabaseClient,
  conversation: Conversation,
  message: WhatsAppMessage
): Promise<{ state: ConversationState; context?: Record<string, unknown> } | null> {
  // Check if message has media (receipt)
  if (hasMedia(message)) {
    const mediaId = getMediaId(message)
    if (mediaId) {
      // Call process-receipt function
      const result = await callProcessReceipt(supabase, conversation.id, mediaId)
      
      if (result.success) {
        // Send confirmation with buttons
        await sendReceiptConfirmation(supabase, conversation)
      } else {
        // Send error message
        const supabaseUrl = Deno.env.get("SUPABASE_URL")
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
        
        await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
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
              text: "❌ Hubo un error al procesar tu comprobante. Por favor, intenta de nuevo.",
            },
          }),
        })
      }
    }
  }

  // Check if it's a button response
  if (message.type === "interactive") {
    const result = await handleReceiptResponse(supabase, conversation, message)
    if (result) {
      return { state: result.state as ConversationState, context: result.context }
    }
  }

  // Stay in receipt_received state for other messages
  return null
}
