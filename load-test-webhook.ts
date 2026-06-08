// load-test-webhook.ts
// Ejecutar: deno run --allow-net load-test-webhook.ts

const WEBHOOK_URL = Deno.env.get("WEBHOOK_URL") || "http://localhost:54321/functions/v1/whatsapp-webhook"
const CONCURRENT_CLIENTS = 10
const MESSAGES_PER_CLIENT = 5

interface TestResult {
  clientId: number
  messageId: number
  status: number
  duration: number
  success: boolean
}

function createWebhookPayload(phone: string, text: string) {
  return {
    object: "whatsapp_business_account",
    entry: [{
      id: "ENTRY_ID",
      changes: [{
        value: {
          messaging_product: "whatsapp",
          metadata: {
            display_phone_number: "5215551234567",
            phone_number_id: "1193550707176336",
          },
          contacts: [{
            profile: { name: `Test User ${phone}` },
            wa_id: phone,
          }],
          messages: [{
            from: phone,
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

async function sendWebhook(clientId: number, messageId: number): Promise<TestResult> {
  const phone = `521555${String(clientId).padStart(7, "0")}`
  const text = `Test message ${messageId} from client ${clientId}`
  const payload = createWebhookPayload(phone, text)

  const start = Date.now()

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature-256": "sha256=mock_signature",
      },
      body: JSON.stringify(payload),
    })

    const duration = Date.now() - start

    return {
      clientId,
      messageId,
      status: response.status,
      duration,
      success: response.ok,
    }
  } catch (error) {
    const duration = Date.now() - start
    return {
      clientId,
      messageId,
      status: 0,
      duration,
      success: false,
    }
  }
}

async function runLoadTest() {
  console.log(`Starting load test: ${CONCURRENT_CLIENTS} clients, ${MESSAGES_PER_CLIENT} messages each`)
  console.log(`Target: ${WEBHOOK_URL}`)
  console.log("---")

  const allResults: TestResult[] = []
  const startTime = Date.now()

  const promises: Promise<TestResult>[] = []

  for (let clientId = 1; clientId <= CONCURRENT_CLIENTS; clientId++) {
    for (let messageId = 1; messageId <= MESSAGES_PER_CLIENT; messageId++) {
      promises.push(sendWebhook(clientId, messageId))
    }
  }

  const results = await Promise.all(promises)
  allResults.push(...results)

  const totalTime = Date.now() - startTime

  const successful = allResults.filter((r) => r.success).length
  const failed = allResults.filter((r) => !r.success).length
  const avgDuration = allResults.reduce((sum, r) => sum + r.duration, 0) / allResults.length
  const maxDuration = Math.max(...allResults.map((r) => r.duration))
  const minDuration = Math.min(...allResults.map((r) => r.duration))

  console.log("--- Results ---")
  console.log(`Total messages: ${allResults.length}`)
  console.log(`Successful: ${successful}`)
  console.log(`Failed: ${failed}`)
  console.log(`Success rate: ${((successful / allResults.length) * 100).toFixed(2)}%`)
  console.log(`Total time: ${totalTime}ms`)
  console.log(`Avg response time: ${avgDuration.toFixed(2)}ms`)
  console.log(`Min response time: ${minDuration}ms`)
  console.log(`Max response time: ${maxDuration}ms`)
  console.log(`Messages/sec: ${((allResults.length / totalTime) * 1000).toFixed(2)}`)

  const statusCounts: Record<number, number> = {}
  allResults.forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1
  })
  console.log("\nStatus codes:", statusCounts)
}

runLoadTest()
