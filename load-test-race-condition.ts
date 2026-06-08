// load-test-race-condition.ts
// Verifica que no haya race conditions con el mismo cliente
// Ejecutar: deno run --allow-net load-test-race-condition.ts

const WEBHOOK_URL = Deno.env.get("WEBHOOK_URL") || "http://localhost:54321/functions/v1/whatsapp-webhook"
const RAPID_MESSAGES = 20
const TEST_PHONE = "5215559999999"

function createPayload(text: string) {
  return {
    object: "whatsapp_business_account",
    entry: [{
      id: "ENTRY_ID",
      changes: [{
        value: {
          messaging_product: "whatsapp",
          metadata: { display_phone_number: "5215551234567", phone_number_id: "1193550707176336" },
          contacts: [{ profile: { name: "Race Test User" }, wa_id: TEST_PHONE }],
          messages: [{
            from: TEST_PHONE,
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Math.floor(Date.now() / 1000).toString(),
            type: "text",
            text: { body: text },
          }],
        },
        field: "messages",
      }],
    }],
  }
}

async function sendRapidMessages() {
  console.log(`Sending ${RAPID_MESSAGES} rapid messages from same phone...`)

  const startTime = Date.now()

  const promises = Array.from({ length: RAPID_MESSAGES }, (_, i) =>
    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createPayload(`Rapid message ${i + 1}`)),
    })
  )

  const results = await Promise.allSettled(promises)
  const totalTime = Date.now() - startTime

  const successful = results.filter((r) => r.status === "fulfilled" && (r.value as Response).ok).length
  const failed = results.filter((r) => r.status === "rejected" || !(r.value as Response).ok).length

  console.log("--- Race Condition Test Results ---")
  console.log(`Total sent: ${RAPID_MESSAGES}`)
  console.log(`Successful: ${successful}`)
  console.log(`Failed: ${failed}`)
  console.log(`Total time: ${totalTime}ms`)
  console.log("")
  console.log("Verify in Supabase:")
  console.log("- Only ONE conversation should exist for phone:", TEST_PHONE)
  console.log("- All messages should be linked to that conversation")
  console.log("- No duplicate conversations with same phone")
}

sendRapidMessages()
