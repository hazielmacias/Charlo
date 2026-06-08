import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { Conversation, WhatsAppMessage } from "./types.ts"

// Menu button IDs
export const MENU_BUTTONS = {
  VIEW_DEBT: "menu_view_debt",
  MAKE_PAYMENT: "menu_make_payment",
  TALK_AGENT: "menu_talk_agent",
} as const

// Start message keywords
const START_KEYWORDS = ["hola", "menu", "inicio", "empezar", "comenzar", "opciones"]

/**
 * Check if a message is a start/init message
 * @param message - WhatsApp message object
 * @returns true if it's a start message
 */
export function isStartMessage(message: WhatsAppMessage): boolean {
  if (message.type !== "text") return false
  const content = message.text?.body?.toLowerCase().trim() || ""
  return START_KEYWORDS.some((keyword) => content.includes(keyword))
}

/**
 * Get client name by conversation ID
 * @param supabase - Supabase client
 * @param clientId - Client ID from conversation
 * @returns Client name or generic greeting
 */
async function getClientName(supabase: SupabaseClient, clientId: string): Promise<string> {
  const { data, error } = await supabase
    .from("clients")
    .select("name")
    .eq("id", clientId)
    .single()

  if (error || !data) {
    return "Cliente"
  }

  return data.name || "Cliente"
}

/**
 * Send welcome menu with interactive buttons
 * @param supabase - Supabase client
 * @param conversation - Conversation object
 */
export async function sendWelcomeMenu(
  supabase: SupabaseClient,
  conversation: Conversation
): Promise<void> {
  // Get client name
  const clientName = await getClientName(supabase, conversation.client_id)
  const firstName = clientName.split(" ")[0] || "Cliente"

  // Welcome message
  const welcomeText = `¡Hola ${firstName}! 👋 Bienvenido a Charló.\n\n¿En qué puedo ayudarte hoy?`

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
        body: welcomeText,
        buttons: [
          { id: MENU_BUTTONS.VIEW_DEBT, title: "Ver mi deuda" },
          { id: MENU_BUTTONS.MAKE_PAYMENT, title: "Realizar pago" },
          { id: MENU_BUTTONS.TALK_AGENT, title: "Hablar con asesor" },
        ],
      },
    }),
  })

  if (!response.ok) {
    console.error("Error sending welcome menu:", await response.text())
  }
}

/**
 * Handle menu button response
 * @param supabase - Supabase client
 * @param conversation - Conversation object
 * @param message - User's interactive message
 * @returns Next state or null if not handled
 */
export async function handleMenuResponse(
  supabase: SupabaseClient,
  conversation: Conversation,
  message: WhatsAppMessage
): Promise<{ state: string; context?: Record<string, unknown> } | null> {
  const buttonId = message.interactive?.button_reply?.id

  if (!buttonId) return null

  switch (buttonId) {
    case MENU_BUTTONS.VIEW_DEBT:
      return { state: "viewing_debt" }

    case MENU_BUTTONS.MAKE_PAYMENT:
      return { state: "sent_bank_details" }

    case MENU_BUTTONS.TALK_AGENT:
      return { state: "human_agent" }

    default:
      return null
  }
}
