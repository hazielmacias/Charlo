// load-test-rate-limit.ts
// Verifica que el sistema maneja correctamente los errores de rate limiting
// Ejecutar: deno run --allow-net load-test-rate-limit.ts

const WEBHOOK_URL = Deno.env.get("WEBHOOK_URL") || "http://localhost:54321/functions/v1/whatsapp-webhook"
const BURST_SIZE = 50

function createPayload(phone: string, index: number) {
  return {
    object: "whatsapp_business_account",
    entry: [{
      id: "ENTRY_ID",
      changes: [{
        value: {
          messaging_product: "whatsapp",
          metadata: { display_phone_number: "5215551234567", phone_number_id: "1193550707176336" },
          contacts: [{ profile: { name: "Rate Limit Test" }, wa_id: phone }],
          messages: [{
            from: phone,
            id: `msg_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Math.floor(Date.now() / 1000).toString(),
            type: "text",
            text: { body: `Rate limit test message ${index}` },
          }],
        },
        field: "messages",
      }],
    }],
  }
}

async function testRateLimit() {
  console.log(`Sending ${BURST_SIZE} messages to test rate limiting behavior...`)
  console.log("Note: Webhook accepts immediately, Meta API calls happen async")
  console.log("")

  const startTime = Date.now()

  const promises = Array.from({ length: BURST_SIZE }, (_, i) => {
    const phone = `521555${String(i % 10).padStart(7, "0")}`
    return fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createPayload(phone, i)),
    })
  })

  const results = await Promise.allSettled(promises)
  const totalTime = Date.now() - startTime

  const successful = results.filter((r) => r.status === "fulfilled" && (r.value as Response).ok).length
  const failed = results.filter((r) => r.status === "rejected" || !(r.value as Response).ok).length

  console.log("--- Rate Limit Test Results ---")
  console.log(`Total sent: ${BURST_SIZE}`)
  console.log(`Successful (webhook accepted): ${successful}`)
  console.log(`Failed: ${failed}`)
  console.log(`Total time: ${totalTime}ms`)
  console.log(`Avg time per request: ${(totalTime / BURST_SIZE).toFixed(2)}ms`)
  console.log("")
  console.log("Expected behavior:")
  console.log("- Webhook returns 200 immediately (no blocking)")
  console.log("- Actual Meta API calls happen async in whatsapp-send")
  console.log("- whatsapp-send has retry logic with exponential backoff")
  console.log("- Rate limit errors (368) trigger longer delays")
  console.log("")
  console.log("Check whatsapp-send logs:")
  console.log("  supabase functions logs whatsapp-send")
  console.log("")
  console.log("Look for messages like:")
  console.log('  "Rate limited. Waiting Xms before retry"')
  console.log('  "Retrying in Xms (attempt X/3)"')
}

testRateLimit()
