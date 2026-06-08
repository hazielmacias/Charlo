import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Get file extension from MIME type
function getFileExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
  }
  return extensions[mimeType] || "bin"
}

// Get file type category from MIME type
function getFileTypeCategory(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType === "application/pdf") return "pdf"
  return "document"
}

// Download file from WhatsApp Media URL
async function downloadMediaFile(mediaUrl: string, accessToken: string): Promise<{ buffer: ArrayBuffer; mimeType: string }> {
  // First get the media URL from WhatsApp
  const mediaResponse = await fetch(mediaUrl, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  })

  if (!mediaResponse.ok) {
    throw new Error(`Failed to get media URL: ${mediaResponse.status}`)
  }

  const mediaData = await mediaResponse.json()
  const downloadUrl = mediaData.url

  // Download the actual file
  const fileResponse = await fetch(downloadUrl, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  })

  if (!fileResponse.ok) {
    throw new Error(`Failed to download file: ${fileResponse.status}`)
  }

  const mimeType = fileResponse.headers.get("content-type") || "application/octet-stream"
  const buffer = await fileResponse.arrayBuffer()

  return { buffer, mimeType }
}

// Upload file to Supabase Storage
async function uploadToStorage(
  supabase: any,
  clientId: string,
  fileBuffer: ArrayBuffer,
  mimeType: string
): Promise<string> {
  const timestamp = Date.now()
  const extension = getFileExtension(mimeType)
  const filePath = `${clientId}/${timestamp}_receipt.${extension}`

  const { data, error } = await supabase.storage
    .from("receipts")
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    })

  if (error) throw error

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("receipts")
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

// Find or get client ID from conversation
async function getClientIdFromConversation(supabase: any, conversationId: string): Promise<string> {
  const { data, error } = await supabase
    .from("conversations")
    .select("client_id")
    .eq("id", conversationId)
    .single()

  if (error || !data) throw new Error("Conversation not found")
  return data.client_id
}

// Find active debt for client
async function getActiveDebtForClient(supabase: any, clientId: string): Promise<string | null> {
  const { data } = await supabase
    .from("debts")
    .select("id")
    .eq("client_id", clientId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  return data?.id || null
}

// Notify admins of new receipt
async function notifyAdmins(supabase: any, receiptId: string, clientPhone: string) {
  // Get active admins
  const { data: admins } = await supabase
    .from("admin_users")
    .select("id, email")
    .eq("is_active", true)

  if (!admins || admins.length === 0) return

  // Create notification records (for panel to pick up)
  for (const admin of admins) {
    await supabase
      .from("admin_notifications")
      .insert({
        admin_id: admin.id,
        type: "new_receipt",
        title: "Nuevo comprobante recibido",
        message: `Comprobante de pago recibido de ${clientPhone}`,
        metadata: { receipt_id: receiptId },
      })
      .catch(console.error) // Don't fail if notifications table doesn't exist
  }

  console.log(`Notified ${admins.length} admins about new receipt`)
}

// Send confirmation message to user
async function sendConfirmationMessage(supabase: any, conversationId: string, phone: string) {
  // Use whatsapp-send function to send confirmation
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
      content: { text: "✅ Comprobante recibido. Será revisado por un administrador." },
      conversation_id: conversationId,
    }),
  })

  if (!response.ok) {
    console.error("Failed to send confirmation message")
  }
}

// Main server
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const body = await req.json()
    const { conversation_id, media_id, media_url } = body

    if (!conversation_id) {
      return new Response(
        JSON.stringify({ error: "conversation_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (!media_id && !media_url) {
      return new Response(
        JSON.stringify({ error: "media_id or media_url is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const accessToken = Deno.env.get("META_ACCESS_TOKEN")
    if (!accessToken) {
      throw new Error("META_ACCESS_TOKEN is required")
    }

    // Get client from conversation
    const clientId = await getClientIdFromConversation(supabase, conversation_id)

    // Get active debt for this client (optional)
    const debtId = await getActiveDebtForClient(supabase, clientId)

    // Get conversation details for phone
    const { data: conversation } = await supabase
      .from("conversations")
      .select("phone")
      .eq("id", conversation_id)
      .single()

    // Download file from WhatsApp
    const fileUrl = media_url || `https://graph.facebook.com/v21.0/${media_id}`
    const { buffer, mimeType } = await downloadMediaFile(fileUrl, accessToken)

    // Upload to Supabase Storage
    const fileUrlStored = await uploadToStorage(supabase, clientId, buffer, mimeType)

    // Create receipt record
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        client_id: clientId,
        debt_id: debtId,
        conversation_id,
        file_url: fileUrlStored,
        file_type: getFileTypeCategory(mimeType),
        status: "pending",
      })
      .select()
      .single()

    if (receiptError) throw receiptError

    // Update conversation state
    await supabase
      .from("conversations")
      .update({
        state: "receipt_received",
        context: { last_receipt_id: receipt.id },
      })
      .eq("id", conversation_id)

    // Send confirmation to user
    if (conversation?.phone) {
      await sendConfirmationMessage(supabase, conversation_id, conversation.phone)
    }

    // Notify admins
    await notifyAdmins(supabase, receipt.id, conversation?.phone || "unknown")

    return new Response(
      JSON.stringify({ success: true, receipt }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Process receipt error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
