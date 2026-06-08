import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Conversation, WhatsAppMessage } from "../types.ts"

// Human agent button IDs
export const HUMAN_AGENT_BUTTONS = {
  BACK_TO_MENU: "agent_back_menu",
} as const

/**
 * Send human agent notification message
 * @param supabase - Supabase client
 * @param conversation - Conversation object
 */
export async function sendHumanAgentMessage(
  supabase: SupabaseClient,
  conversation: Conversation
): Promise<void> {
  const messageText = "👤 *Un asesor se comunicará contigo pronto.*\n\nMientras tanto, puedes继续 enviando mensajes y los atenderemos lo antes posible."

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
          { id: HUMAN_AGENT_BUTTONS.BACK_TO_MENU, title: "Volver al menú" },
        ],
      },
    }),
  })

  if (!response.ok) {
    console.error("Error sending human agent message:", await response.text())
  }
}

/**
 * Notify admins about human agent request
 * @param supabase - Supabase client
 * @param conversation - Conversation object
 */
async function notifyAdminsOfAgentRequest(
  supabase: SupabaseClient,
  conversation: Conversation
): Promise<void> {
  // Get active admins
  const { data: admins } = await supabase
    .from("admin_users")
    .select("id, email")
    .eq("is_active", true)

  if (!admins || admins.length === 0) return

  // Get client info
  const { data: client } = await supabase
    .from("conversations")
    .select("client_id, clients(name, phone)")
    .eq("id", conversation.id)
    .single()

  const clientName = (client as any)?.clients?.name || "Cliente"
  const clientPhone = (client as any)?.clients?.phone || conversation.phone

  // Create notification records (for panel to pick up)
  for (const admin of admins) {
    await supabase
      .from("admin_notifications")
      .insert({
        admin_id: admin.id,
        type: "agent_request",
        title: "Solicitud de asesor",
        message: `${clientName} (${clientPhone}) solicita atención de un asesor.`,
        metadata: {
          conversation_id: conversation.id,
          client_id: (client as any)?.client_id,
          phone: conversation.phone,
        },
      })
      .catch(console.error) // Don't fail if notifications table doesn't exist
  }

  console.log(`Notified ${admins.length} admins about agent request`)
}

/**
 * Handle human agent button response
 * @param supabase - Supabase client
 * @param conversation - Conversation object
 * @param message - User's interactive message
 * @returns Next state or null if not handled
 */
export async function handleHumanAgentResponse(
  supabase: SupabaseClient,
  conversation: Conversation,
  message: WhatsAppMessage
): Promise<{ state: string; context?: Record<string, unknown> } | null> {
  const buttonId = message.interactive?.button_reply?.id

  if (!buttonId) return null

  switch (buttonId) {
    case HUMAN_AGENT_BUTTONS.BACK_TO_MENU:
      return { state: "menu" }

    default:
      return null
  }
}

/**
 * Handle human_agent state logic
 * @param supabase - Supabase client
 * @param conversation - Conversation object
 * @param message - Incoming message
 * @returns Next state or null if not handled
 */
export async function handle_human_agent_state(
  supabase: SupabaseClient,
  conversation: Conversation,
  message: WhatsAppMessage
): Promise<{ state: ConversationState; context?: Record<string, unknown> } | null> {
  // Send human agent message
  await sendHumanAgentMessage(supabase, conversation)

  // Notify admins
  await notifyAdminsOfAgentRequest(supabase, conversation)

  // Check if it's a button response
  if (message.type === "interactive") {
    const result = await handleHumanAgentResponse(supabase, conversation, message)
    if (result) {
      return { state: result.state as ConversationState, context: result.context }
    }
  }

  // Stay in human_agent state - all messages go to agent
  return null
}

// Import ConversationState type
import { ConversationState } from "../types.ts"
