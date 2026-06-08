import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Count pending receipts
async function countPendingReceipts(supabase: any): Promise<number> {
  const { count, error } = await supabase
    .from("receipts")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

  if (error) {
    console.error("Error counting pending receipts:", error)
    return 0
  }
  return count || 0
}

// Count active conversations
async function countActiveConversations(supabase: any): Promise<number> {
  const { count, error } = await supabase
    .from("conversations")
    .select("*", { count: "exact", head: true })
    .not("state", "eq", "closed")

  if (error) {
    console.error("Error counting active conversations:", error)
    return 0
  }
  return count || 0
}

// Count pending reminders
async function countPendingReminders(supabase: any): Promise<number> {
  const { count, error } = await supabase
    .from("reminders")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

  if (error) {
    console.error("Error counting pending reminders:", error)
    return 0
  }
  return count || 0
}

// Count overdue debts
async function countOverdueDebts(supabase: any): Promise<number> {
  const { count, error } = await supabase
    .from("debts")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .lt("due_date", new Date().toISOString())

  if (error) {
    console.error("Error counting overdue debts:", error)
    return 0
  }
  return count || 0
}

// Get recent notifications for admin
async function getRecentNotifications(supabase: any, limit = 10) {
  const { data, error } = await supabase
    .from("admin_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error getting notifications:", error)
    return []
  }
  return data || []
}

// Mark notification as read
async function markNotificationAsRead(supabase: any, notificationId: string) {
  const { error } = await supabase
    .from("admin_notifications")
    .update({ read: true })
    .eq("id", notificationId)

  return !error
}

// Create a new notification
async function createNotification(
  supabase: any,
  adminId: string,
  type: string,
  title: string,
  message: string,
  metadata?: any
) {
  const { data, error } = await supabase
    .from("admin_notifications")
    .insert({
      admin_id: adminId,
      type,
      title,
      message,
      metadata: metadata || {},
      read: false,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating notification:", error)
    return null
  }
  return data
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

    const url = new URL(req.url)
    const action = url.searchParams.get("action") || "dashboard"

    // Dashboard counters
    if (action === "dashboard" && req.method === "GET") {
      const [pendingReceipts, activeConversations, pendingReminders, overdueDebts] = await Promise.all([
        countPendingReceipts(supabase),
        countActiveConversations(supabase),
        countPendingReminders(supabase),
        countOverdueDebts(supabase),
      ])

      return new Response(
        JSON.stringify({
          pendingReceipts,
          activeConversations,
          pendingReminders,
          overdueDebts,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Get notifications list
    if (action === "notifications" && req.method === "GET") {
      const limit = parseInt(url.searchParams.get("limit") || "10")
      const notifications = await getRecentNotifications(supabase, limit)

      return new Response(
        JSON.stringify({ notifications }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Mark notification as read
    if (action === "mark-read" && req.method === "POST") {
      const { notification_id } = await req.json()
      const success = await markNotificationAsRead(supabase, notification_id)

      return new Response(
        JSON.stringify({ success }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Create notification (internal use)
    if (action === "create" && req.method === "POST") {
      const { admin_id, type, title, message, metadata } = await req.json()
      const notification = await createNotification(supabase, admin_id, type, title, message, metadata)

      return new Response(
        JSON.stringify({ notification }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response("Method not allowed", { status: 405 })
  } catch (error) {
    console.error("Admin notify error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
