import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import {
  Conversation,
  ConversationState,
  ConversationContext,
  WhatsAppMessage,
} from "./types.ts"
import {
  isStartMessage,
  sendWelcomeMenu,
  handleMenuResponse,
} from "./handlers/menu.ts"
import {
  sendDebtInfo,
  handleDebtResponse,
} from "./handlers/debt.ts"
import {
  sendBankDetails,
  handlePaymentResponse,
} from "./handlers/payment.ts"
import {
  sendReceiptConfirmation,
  handleReceiptResponse,
  handle_receipt_received_state,
} from "./handlers/receipt.ts"
import {
  sendHumanAgentMessage,
  handleHumanAgentResponse,
  handle_human_agent_state,
} from "./handlers/human-agent.ts"
import {
  handleInvalidText,
  handleReceiptOutOfFlow,
  handleConversationTimeout,
  hasConversationTimedOut,
  isValidMenuCommand,
  isReceiptMessage,
} from "./handlers/error-handling.ts"
import {
  isWithinBusinessHours,
  getBusinessHoursMessage,
  getCurrentHourInTimezone,
  getDefaultTimezone,
} from "./handlers/business-hours.ts"

// Valid states for the conversation state machine
export const VALID_STATES: ConversationState[] = [
  "menu",
  "viewing_debt",
  "awaiting_payment",
  "sent_bank_details",
  "human_agent",
]

/**
 * Get the current state of a conversation by phone number
 * @param supabase - Supabase client
 * @param phone - Phone number to look up
 * @returns Conversation object or null if not found
 */
export async function get_conversation_state(
  supabase: SupabaseClient,
  phone: string
): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, phone, state, context, client_id, created_at, updated_at")
    .eq("phone", phone)
    .not("state", "eq", "closed")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error("Error getting conversation state:", error)
    return null
  }

  return data as Conversation
}

/**
 * Update the state of a conversation
 * @param supabase - Supabase client
 * @param phone - Phone number of the conversation
 * @param newState - New state to set
 * @param context - Optional context to merge with existing context
 * @returns Updated conversation or null on error
 */
export async function update_conversation_state(
  supabase: SupabaseClient,
  phone: string,
  newState: ConversationState,
  context?: Partial<ConversationContext>
): Promise<Conversation | null> {
  // Validate state
  if (!VALID_STATES.includes(newState)) {
    console.error(`Invalid state: ${newState}`)
    return null
  }

  // First get current conversation to merge context
  const current = await get_conversation_state(supabase, phone)
  if (!current) {
    console.error(`No active conversation found for phone: ${phone}`)
    return null
  }

  // Merge context (new values override old ones)
  const updatedContext = {
    ...current.context,
    ...(context || {}),
  }

  const { data, error } = await supabase
    .from("conversations")
    .update({
      state: newState,
      context: updatedContext,
      updated_at: new Date().toISOString(),
    })
    .eq("id", current.id)
    .select("id, phone, state, context, client_id, created_at, updated_at")
    .single()

  if (error) {
    console.error("Error updating conversation state:", error)
    return null
  }

  console.log(`Conversation ${current.id} state updated: ${current.state} -> ${newState}`)
  return data as Conversation
}

/**
 * Reset conversation to menu state (clear context)
 * @param supabase - Supabase client
 * @param phone - Phone number of the conversation
 * @returns Updated conversation or null on error
 */
export async function reset_conversation(
  supabase: SupabaseClient,
  phone: string
): Promise<Conversation | null> {
  const current = await get_conversation_state(supabase, phone)
  if (!current) {
    console.error(`No active conversation found for phone: ${phone}`)
    return null
  }

  const { data, error } = await supabase
    .from("conversations")
    .update({
      state: "menu",
      context: {},
      updated_at: new Date().toISOString(),
    })
    .eq("id", current.id)
    .select("id, phone, state, context, client_id, created_at, updated_at")
    .single()

  if (error) {
    console.error("Error resetting conversation:", error)
    return null
  }

  console.log(`Conversation ${current.id} reset to menu state`)
  return data as Conversation
}

/**
 * Close a conversation (set state to 'closed')
 * @param supabase - Supabase client
 * @param phone - Phone number of the conversation
 * @returns true if successful, false otherwise
 */
export async function close_conversation(
  supabase: SupabaseClient,
  phone: string
): Promise<boolean> {
  const current = await get_conversation_state(supabase, phone)
  if (!current) {
    return false
  }

  const { error } = await supabase
    .from("conversations")
    .update({
      state: "closed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", current.id)

  if (error) {
    console.error("Error closing conversation:", error)
    return false
  }

  console.log(`Conversation ${current.id} closed`)
  return true
}

/**
 * Handle menu state logic
 * @param supabase - Supabase client
 * @param conversation - Conversation object
 * @param message - Incoming message
 * @returns Next state or null if not handled
 */
export async function handle_menu_state(
  supabase: SupabaseClient,
  conversation: Conversation,
  message: WhatsAppMessage
): Promise<{ state: ConversationState; context?: Record<string, unknown> } | null> {
  // Check if it's a start message (hola, menu, etc.)
  if (isStartMessage(message)) {
    // Send welcome menu
    await sendWelcomeMenu(supabase, conversation)
    return null // Stay in menu state
  }

  // Check if it's a button response
  if (message.type === "interactive") {
    const result = await handleMenuResponse(supabase, conversation, message)
    if (result) {
      return { state: result.state as ConversationState, context: result.context }
    }
  }

  // Check if it's a receipt out of flow
  if (isReceiptMessage(message)) {
    await handleReceiptOutOfFlow(supabase, conversation)
    return null
  }

  // Unknown input - send error message with menu
  await handleInvalidText(supabase, conversation)
  return null
}

/**
 * Handle viewing_debt state logic
 * @param supabase - Supabase client
 * @param conversation - Conversation object
 * @param message - Incoming message
 * @returns Next state or null if not handled
 */
export async function handle_viewing_debt_state(
  supabase: SupabaseClient,
  conversation: Conversation,
  message: WhatsAppMessage
): Promise<{ state: ConversationState; context?: Record<string, unknown> } | null> {
  // Send debt information
  await sendDebtInfo(supabase, conversation)

  // Check if it's a button response
  if (message.type === "interactive") {
    const result = await handleDebtResponse(supabase, conversation, message)
    if (result) {
      return { state: result.state as ConversationState, context: result.context }
    }
  }

  // Stay in viewing_debt state for text messages
  return null
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
