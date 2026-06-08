import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Retry configuration
const MAX_RETRIES = 3
const BASE_DELAY = 1000

// Sleep helper
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Get Meta API configuration
function getMetaConfig() {
  const phoneNumberId = Deno.env.get("META_PHONE_NUMBER_ID")
  const accessToken = Deno.env.get("META_ACCESS_TOKEN")
  const apiVersion = Deno.env.get("WHATSAPP_API_VERSION") || "v21.0"

  if (!phoneNumberId || !accessToken) {
    throw new Error("META_PHONE_NUMBER_ID and META_ACCESS_TOKEN are required")
  }

  return { phoneNumberId, accessToken, apiVersion }
}

// Send message to Meta API with retry logic
async function sendToMetaAPI(payload: any, retries = MAX_RETRIES): Promise<any> {
  const { phoneNumberId, accessToken, apiVersion } = getMetaConfig()
  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      // Success - return response
      if (response.ok) {
        return { success: true, data, status: response.status }
      }

      // Handle specific Meta API errors
      if (data.error) {
        const error = data.error
        const errorCode = error.code
        const errorMessage = error.message

        // Don't retry on these errors (client errors)
        const noRetryCodes = [
          100,  // Invalid parameter
          190,  // Invalid OAuth access token
          368,  // Rate limit hit (wait and retry)
          131026, // Message undeliverable
        ]

        // For rate limiting, wait longer before retry
        if (errorCode === 368) {
          const delay = BASE_DELAY * Math.pow(2, attempt + 2) // Extra delay for rate limits
          console.log(`Rate limited. Waiting ${delay}ms before retry ${attempt + 1}/${retries}`)
          await sleep(delay)
          lastError = new Error(`Meta API Error ${errorCode}: ${errorMessage}`)
          continue
        }

        // For other no-retry errors, throw immediately
        if (noRetryCodes.includes(errorCode)) {
          throw new Error(`Meta API Error ${errorCode}: ${errorMessage}`)
        }
      }

      // For other errors, retry with exponential backoff
      if (attempt < retries) {
        const delay = BASE_DELAY * Math.pow(2, attempt)
        console.log(`Retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`)
        await sleep(delay)
        lastError = new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`)
      }
    } catch (error) {
      if (attempt < retries) {
        const delay = BASE_DELAY * Math.pow(2, attempt)
        console.log(`Retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`)
        await sleep(delay)
        lastError = error as Error
      } else {
        lastError = error as Error
      }
    }
  }

  throw lastError || new Error("Max retries exceeded")
}

// Save outgoing message to messages table
async function saveOutgoingMessage(
  supabase: any,
  conversationId: string,
  type: string,
  content: string,
  messageId: string
) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      direction: "outbound",
      type,
      content,
      status: "sent",
      metadata: { wa_message_id: messageId },
    })
    .select()
    .single()

  if (error) console.error("Error saving outgoing message:", error)
  return data
}

// Update message status from delivery/read webhook
async function updateMessageStatus(supabase: any, waMessageId: string, status: string) {
  const { error } = await supabase
    .from("messages")
    .update({ status })
    .eq("metadata->>'wa_message_id'", waMessageId)

  if (error) console.error("Error updating message status:", error)
  return error === null
}

// Helper: Send text message
async function sendTextMessage(to: string, text: string) {
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text },
  }
  return await sendToMetaAPI(payload)
}

// Helper: Send interactive buttons (Reply Buttons)
async function sendInteractiveButtons(
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>
) {
  if (buttons.length > 3) {
    throw new Error("Maximum 3 buttons allowed")
  }

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: {
        buttons: buttons.map((btn) => ({
          type: "reply",
          reply: { id: btn.id, title: btn.title },
        })),
      },
    },
  }
  return await sendToMetaAPI(payload)
}

// Helper: Send list message (menu)
async function sendListMessage(
  to: string,
  bodyText: string,
  buttonText: string,
  sections: Array<{
    title: string
    rows: Array<{ id: string; title: string; description?: string }>
  }>
) {
  if (sections.reduce((acc, s) => acc + s.rows.length, 0) > 10) {
    throw new Error("Maximum 10 options allowed")
  }

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: bodyText },
      action: { button: buttonText, sections },
    },
  }
  return await sendToMetaAPI(payload)
}

// Helper: Send image
async function sendImage(to: string, imageUrl: string, caption?: string) {
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "image",
    image: { link: imageUrl, caption: caption || "" },
  }
  return await sendToMetaAPI(payload)
}

// Helper: Send document
async function sendDocument(to: string, documentUrl: string, filename: string, caption?: string) {
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "document",
    document: { link: documentUrl, filename, caption: caption || "" },
  }
  return await sendToMetaAPI(payload)
}

// Main server
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get("action") || "send"

    // Handle message status updates (from whatsapp-webhook)
    if (action === "status" && req.method === "POST") {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      )

      const { wa_message_id, status } = await req.json()
      const updated = await updateMessageStatus(supabase, wa_message_id, status)

      return new Response(
        JSON.stringify({ success: updated }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Send message
    if (req.method === "POST") {
      const body = await req.json()
      const { to, type, conversation_id, content } = body

      if (!to || !type) {
        return new Response(
          JSON.stringify({ error: "to and type are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      // Initialize Supabase client
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      )

      let result: any

      // Send based on type
      switch (type) {
        case "text":
          result = await sendTextMessage(to, content.text)
          break

        case "buttons":
          result = await sendInteractiveButtons(to, content.body, content.buttons)
          break

        case "list":
          result = await sendListMessage(to, content.body, content.button, content.sections)
          break

        case "image":
          result = await sendImage(to, content.image_url, content.caption)
          break

        case "document":
          result = await sendDocument(to, content.document_url, content.filename, content.caption)
          break

        default:
          return new Response(
            JSON.stringify({ error: `Unsupported type: ${type}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          )
      }

      // Save to messages table if conversation_id provided and send was successful
      if (conversation_id && result.success && result.data?.messages?.[0]?.id) {
        await saveOutgoingMessage(
          supabase,
          conversation_id,
          type,
          content.text || content.body || "",
          result.data.messages[0].id
        )
      }

      return new Response(
        JSON.stringify(result),
        { status: result.success ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response("Method not allowed", { status: 405 })
  } catch (error) {
    console.error("Send message error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
