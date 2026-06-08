# 6.4 Pruebas de Carga — Load Testing Guide

> **Objetivo:** Verificar que el sistema maneja múltiples clientes simultáneos sin race conditions y respeta los límites de Meta API.

---

## Meta API Rate Limits

| Nivel | Límite | Window |
|-------|--------|--------|
| Messages | 100 messages | per second (per phone number) |
| Business | 50 messages | per second (per WABA) |
| HSM | 100 messages | per second (per phone number) |

**Documentación:** https://developers.facebook.com/docs/whatsapp/cloud-api/overview#rate-limits

---

## Test 1: Simular Múltiples Clientes Simultáneos

### Script de Prueba

Crear archivo `load-test-webhook.ts`:

```typescript
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

  // Send messages concurrently
  const promises: Promise<TestResult>[] = []

  for (let clientId = 1; clientId <= CONCURRENT_CLIENTS; clientId++) {
    for (let messageId = 1; messageId <= MESSAGES_PER_CLIENT; messageId++) {
      promises.push(sendWebhook(clientId, messageId))
    }
  }

  const results = await Promise.all(promises)
  allResults.push(...results)

  const totalTime = Date.now() - startTime

  // Analyze results
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

  // Status code distribution
  const statusCounts: Record<number, number> = {}
  allResults.forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1
  })
  console.log("\nStatus codes:", statusCounts)
}

runLoadTest()
```

### Ejecutar

```bash
# Instalar Deno si no está
curl -fsSL https://deno.land/install.sh | sh

# Ejecutar load test
deno run --allow-net load-test-webhook.ts
```

### Resultado Esperado
- Success rate > 95%
- No timeouts
- Avg response time < 2000ms
- Todos los mensajes reciben 200 OK

---

## Test 2: Verificar Race Conditions

### Escenario: Mismo cliente envía mensajes rápidos

```typescript
// load-test-race-condition.ts
// Verifica que no haya race conditions con el mismo cliente

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

  const promises = Array.from({ length: RAPID_MESSAGES }, (_, i) =>
    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createPayload(`Rapid message ${i + 1}`)),
    })
  )

  const results = await Promise.allSettled(promises)
  const successful = results.filter((r) => r.status === "fulfilled" && r.value.ok).length
  const failed = results.filter((r) => r.status === "rejected" || !(r.value as Response).ok).length

  console.log(`Successful: ${successful}`)
  console.log(`Failed: ${failed}`)
  console.log("Check Supabase: only ONE conversation should exist for this phone")
}

sendRapidMessages()
```

### Verificar
```sql
-- Debería haber UNA sola conversación para el teléfono de prueba
SELECT COUNT(*) FROM conversations WHERE phone = '5215559999999';

-- Todos los mensajes deberían estar asociados a esa conversación
SELECT COUNT(*) FROM messages m
JOIN conversations c ON m.conversation_id = c.id
WHERE c.phone = '5215559999999';
```

---

## Test 3: Verificar Rate Limiting de Meta API

### Script de Prueba

```typescript
// load-test-rate-limit.ts
// Verifica que el sistema maneja correctamente los errores 368 (rate limit)

const WEBHOOK_URL = Deno.env.get("WEBHOOK_URL") || "http://localhost:54321/functions/v1/whatsapp-webhook"
const BURST_SIZE = 150  // Exceed Meta's 100/sec limit

function createPayload(phone: string) {
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
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Math.floor(Date.now() / 1000).toString(),
            type: "text",
            text: { body: "Rate limit test" },
          }],
        },
        field: "messages",
      }],
    }],
  }
}

async function testRateLimit() {
  console.log(`Sending ${BURST_SIZE} messages to trigger rate limiting...`)

  const startTime = Date.now()

  // Send all at once to exceed rate limit
  const promises = Array.from({ length: BURST_SIZE }, (_, i) => {
    const phone = `521555${String(i % 10).padStart(7, "0")}`
    return fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createPayload(phone)),
    })
  })

  const results = await Promise.allSettled(promises)
  const totalTime = Date.now() - startTime

  const successful = results.filter((r) => r.status === "fulfilled" && (r.value as Response).ok).length
  const failed = results.filter((r) => r.status === "rejected" || !(r.value as Response).ok).length

  console.log("--- Rate Limit Test Results ---")
  console.log(`Total sent: ${BURST_SIZE}`)
  console.log(`Successful: ${successful}`)
  console.log(`Failed: ${failed}`)
  console.log(`Total time: ${totalTime}ms`)
  console.log("")
  console.log("Expected behavior:")
  console.log("- Most should succeed (webhook returns 200 immediately)")
  console.log("- Actual Meta API calls happen async in whatsapp-send")
  console.log("- whatsapp-send has retry logic with exponential backoff")
  console.log("- Check whatsapp-send logs for rate limit handling")
}

testRateLimit()
```

### Verificar en Logs
```bash
# Ver logs de whatsapp-send para ver retry logic
supabase functions logs whatsapp-send

# Buscar mensajes como:
# "Rate limited. Waiting Xms before retry"
# "Retrying in Xms (attempt X/3)"
```

---

## Test 4: Verificar Integridad de Datos bajo Carga

### Script de Verificación

```typescript
// load-test-verify-data.ts
// Verifica que los datos sean consistentes después de carga

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
)

async function verifyDataIntegrity() {
  console.log("Verifying data integrity after load test...")

  // 1. Check for orphaned messages
  const { data: orphanedMessages } = await supabase
    .rpc("check_orphaned_messages")  // Need to create this function

  if (orphanedMessages && orphanedMessages > 0) {
    console.error(`FAIL: ${orphanedMessages} orphaned messages found`)
  } else {
    console.log("PASS: No orphaned messages")
  }

  // 2. Check conversation consistency
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, phone, state")
    .order("created_at", { ascending: false })
    .limit(100)

  const phoneCounts: Record<string, number> = {}
  conversations?.forEach((c) => {
    phoneCounts[c.phone] = (phoneCounts[c.phone] || 0) + 1
  })

  const duplicatePhones = Object.entries(phoneCounts).filter(([_, count]) => count > 1)
  if (duplicatePhones.length > 0) {
    console.error("FAIL: Duplicate conversations found:", duplicatePhones)
  } else {
    console.log("PASS: No duplicate conversations")
  }

  // 3. Check message count matches
  const { count: totalMessages } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })

  const { count: totalConversations } = await supabase
    .from("conversations")
    .select("*", { count: "exact", head: true })

  console.log(`Total messages: ${totalMessages}`)
  console.log(`Total conversations: ${totalConversations}`)

  // 4. Check for failed receipts
  const { data: failedReceipts } = await supabase
    .from("receipts")
    .select("id, status")
    .eq("status", "pending")
    .gte("created_at", new Date(Date.now() - 3600000).toISOString())  // Last hour

  console.log(`Pending receipts (last hour): ${failedReceipts?.length || 0}`)

  console.log("\nData integrity check complete!")
}

verifyDataIntegrity()
```

---

## Test 5: Stress Test con Conexiones Reales

### Requiere
- Número de WhatsApp Business activo
- Múltiples dispositivos o herramientas de envío

### Pasos
1. Preparar 5-10 dispositivos con WhatsApp
2. Enviar mensajes simultáneos al número de Charló
3. Verificar que todos reciben respuesta
4. Verificar que no hay mensajes perdidos

### Verificar
```sql
-- Contar mensajes por teléfono en los últimos 5 minutos
SELECT 
  c.phone,
  COUNT(m.id) as message_count,
  MIN(m.created_at) as first_message,
  MAX(m.created_at) as last_message
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
WHERE m.created_at > NOW() - INTERVAL '5 minutes'
GROUP BY c.phone
ORDER BY message_count DESC;
```

---

## Métricas Clave a Monitorear

| Métrica | Objetivo | Alerta si |
|---------|----------|-----------|
| Webhook response time | < 2000ms | > 5000ms |
| Success rate | > 99% | < 95% |
| Messages/sec handled | > 10 | < 5 |
| Duplicate conversations | 0 | > 0 |
| Orphaned messages | 0 | > 0 |
| Meta API retries | < 5% | > 20% |
| Receipt processing time | < 10000ms | > 30000ms |

---

## Comandos de Monitoreo

```sql
-- Mensajes por minuto (última hora)
SELECT 
  DATE_TRUNC('minute', created_at) as minute,
  COUNT(*) as messages
FROM messages
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY minute
ORDER BY minute DESC;

-- Conversaciones activas
SELECT COUNT(*) FROM conversations WHERE state != 'closed';

-- Receipts pendientes
SELECT COUNT(*) FROM receipts WHERE status = 'pending';

-- Errores recientes
SELECT * FROM messages 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## Troubleshooting

### Alto tiempo de respuesta
- Verificar que Supabase no está en modo free (limitado)
- Verificar que las Edge Functions no están en cold start
- Considerar usar Reserved Instances

### Race conditions
- La tabla `conversations` tiene ÚNICO constraint en `phone` WHERE `state != 'closed'`
- Verificar que la función `findOrCreateConversation` usa transacciones
- Revisar logs para errores de duplicación

### Rate limiting excesivo
- Reducir número de clientes simultáneos en tests
- Aumentar delay entre mensajes
- Verificar que `whatsapp-send` tiene backoff exponencial
