import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { ConversationState } from "./types.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hub-signature-256",
}

// Lazy-loaded modules
let stateMachine: any = null
let errorHandler: any = null
let businessHours: any = null

async function loadModules() {
  if (!stateMachine) {
    stateMachine = await import("./state-machine.ts")
  }
  if (!errorHandler) {
    errorHandler = await import("./handlers/error-handling.ts")
  }
  if (!businessHours) {
    businessHours = await import("./handlers/business-hours.ts")
  }
}

// Verify webhook signature (HMAC SHA-256)
async function verifySignature(body: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature) return false

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signatureValue = signature.replace("sha256=", "")
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(body))
  const expected = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  return signatureValue === expected
}

// Find or create conversation for a phone number
async function findOrCreateConversation(supabase: any, phone: string) {
  // Look for existing active conversation
  const { data: existing } = await supabase
    .from("conversations")
    .select("id, state, context")
    .eq("phone", phone)
    .not("state", "eq", "closed")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (existing) {
    return existing
  }

  // Find or create client
  let { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("phone", phone)
    .single()

  if (!client) {
    const { data: newClient } = await supabase
      .from("clients")
      .insert({ name: `Cliente ${phone}`, phone, status: "active" })
      .select("id")
      .single()
    client = newClient
  }

  // Create new conversation
  const { data: conversation } = await supabase
    .from("conversations")
    .insert({
      client_id: client.id,
      phone,
      state: "menu",
      context: {},
    })
    .select("id, state, context")
    .single()

  return conversation
}

// Save incoming message to messages table
async function saveMessage(supabase: any, conversationId: string, message: any) {
  let messageType = "text"
  let content = ""
  let mediaUrl = null

  if (message.type === "text") {
    content = message.text.body
  } else if (message.type === "image") {
    messageType = "image"
    mediaUrl = message.image.id
    content = message.image.caption || ""
  } else if (message.type === "document") {
    messageType = "document"
    mediaUrl = message.document.id
    content = message.document.caption || ""
  } else if (message.type === "interactive") {
    messageType = "interactive"
    content = message.interactive?.button_reply?.id || message.interactive?.list_reply?.id || ""
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      direction: "inbound",
      type: messageType,
      content,
      media_url: mediaUrl,
      status: "received",
      metadata: message,
    })
    .select()
    .single()

  if (error) console.error("Error saving message:", error)
  return data
}

// State machine handler
async function handleState(supabase: any, conversation: any, message: any, clientIp: string) {
  await loadModules()
  
  const state = conversation.state as ConversationState

  // Check for conversation timeout (24h inactivity)
  const hasTimedOut = await errorHandler.hasConversationTimedOut(supabase, conversation.id)
  if (hasTimedOut) {
    await errorHandler.handleConversationTimeout(supabase, conversation.id)
    // Reset to menu state and continue processing
    conversation.state = "menu"
    conversation.context = {}
  }

  // Update last_message_at
  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversation.id)

  // Check business hours (optional - only if enabled)
  const checkBusinessHours = Deno.env.get("CHECK_BUSINESS_HOURS") === "true"
  if (checkBusinessHours) {
    const timezone = businessHours.getDefaultTimezone()
    if (!businessHours.isWithinBusinessHours(timezone)) {
      // Send business hours message (only for menu state)
      if (state === "menu") {
        const menuModule = await import("./handlers/menu.ts")
        await menuModule.sendWelcomeMenu(supabase, conversation)
        // Send business hours info
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
            content: { text: businessHours.getBusinessHoursMessage(timezone) },
          }),
        })
      }
      return
    }
  }

  // State machine logic
  switch (state) {
    case "menu": {
      const result = await stateMachine.handle_menu_state(supabase, conversation, message)
      if (result) {
        await stateMachine.update_conversation_state(supabase, conversation.phone, result.state, result.context)
      }
      break
    }

    case "viewing_debt": {
      const result = await stateMachine.handle_viewing_debt_state(supabase, conversation, message)
      if (result) {
        await stateMachine.update_conversation_state(supabase, conversation.phone, result.state, result.context)
      }
      break
    }

    case "sent_bank_details": {
      const result = await stateMachine.handle_sent_bank_details_state(supabase, conversation, message)
      if (result) {
        await stateMachine.update_conversation_state(supabase, conversation.phone, result.state, result.context)
      }
      break
    }

    case "awaiting_payment":
      break

    case "receipt_received": {
      const result = await stateMachine.handle_receipt_received_state(supabase, conversation, message)
      if (result) {
        await stateMachine.update_conversation_state(supabase, conversation.phone, result.state, result.context)
      }
      break
    }

    case "human_agent": {
      const result = await stateMachine.handle_human_agent_state(supabase, conversation, message)
      if (result) {
        await stateMachine.update_conversation_state(supabase, conversation.phone, result.state, result.context)
      }
      break
    }

    default:
      await stateMachine.reset_conversation(supabase, conversation.phone)
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const verifyToken = Deno.env.get("META_VERIFY_TOKEN")
    const appSecret = Deno.env.get("META_APP_SECRET")

    // Webhook verification (GET request from Meta)
    if (req.method === "GET") {
      const mode = url.searchParams.get("hub.mode")
      const token = url.searchParams.get("hub.verify_token")
      const challenge = url.searchParams.get("hub.challenge")

      if (mode === "subscribe" && token === verifyToken) {
        console.log("Webhook verified successfully")
        return new Response(challenge, { status: 200 })
      } else {
        console.error("Webhook verification failed")
        return new Response("Forbidden", { status: 403 })
      }
    }

    // Webhook events (POST request from Meta)
    if (req.method === "POST") {
      // Read raw body for signature verification
      const rawBody = await req.text()

      // Verify signature if app secret is configured
      if (appSecret) {
        const signature = req.headers.get("x-hub-signature-256")
        const isValid = await verifySignature(rawBody, signature, appSecret)
        if (!isValid) {
          console.error("Invalid webhook signature")
          return new Response("Unauthorized", { status: 401 })
        }
      }

      const body = JSON.parse(rawBody)

      // Initialize Supabase client
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      )

      // Process WhatsApp messages
      if (body.entry?.[0]?.changes?.[0]?.value?.messages) {
        const message = body.entry[0].changes[0].value.messages[0]
        const phone = message.from

        console.log(`Received message from ${phone}:`, message.type)

        // Find or create conversation
        const conversation = await findOrCreateConversation(supabase, phone)

        if (!conversation) {
          console.error("Could not find or create conversation")
          return new Response("OK", { status: 200, headers: corsHeaders })
        }

        // Save incoming message
        await saveMessage(supabase, conversation.id, message)

        // Execute state machine
        await handleState(supabase, conversation, message, req.headers.get("x-forwarded-for") || "unknown")
      }

      // Always respond with 200 OK immediately (no blocking)
      return new Response("OK", { status: 200, headers: corsHeaders })
    }

    return new Response("Method not allowed", { status: 405 })
  } catch (error) {
    console.error("Webhook error:", error)
    // Still return 200 to prevent Meta from retrying
    return new Response("OK", { status: 200, headers: corsHeaders })
  }
})
