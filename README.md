# Charló - WhatsApp Debt Collection Chatbot

Sistema de cobranza automatizada por WhatsApp con panel de administración.

## Arquitectura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Meta WhatsApp │────▶│  Supabase Edge   │────▶│    PostgreSQL   │
│   Cloud API     │     │  Functions       │     │    Database     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                         │
                               ▼                         ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │  Vercel (React)  │     │  Supabase Auth  │
                        │  Admin Panel     │     │  (Login)        │
                        └──────────────────┘     └─────────────────┘
```

## Stack

| Componente | Tecnología |
|------------|------------|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Backend | Supabase Edge Functions (Deno) |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| WhatsApp | Meta Cloud API |
| Scheduler | pg_cron + pg_net |
| Deploy | Vercel (frontend) + Supabase (backend) |

---

## Variables de Entorno

### Frontend (`charlo-panel/.env.local`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Anon key de Supabase | `eyJhbG...` |

### Edge Functions (Supabase Secrets)

| Variable | Descripción |
|----------|-------------|
| `META_PHONE_NUMBER_ID` | ID del número de WhatsApp Business |
| `META_ACCESS_TOKEN` | Token de acceso de Meta |
| `META_VERIFY_TOKEN` | Token de verificación del webhook |
| `META_APP_SECRET` | Secret de la app de Meta |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | ID de la cuenta de WhatsApp Business |

---

## Estructura de Base de Datos

### Tablas

| Tabla | Descripción |
|-------|-------------|
| `clients` | Clientes/deudores |
| `debts` | Deudas individuales |
| `conversations` | Conversaciones de WhatsApp |
| `messages` | Historial de mensajes |
| `receipts` | Comprobantes de pago |
| `reminders` | Recordatorios programados |
| `bank_config` | Datos bancarios |
| `settings` | Configuración del sistema |
| `admin_users` | Usuarios del panel |

### Diagrama ER

```
clients ──┬── debts (1:N)
          ├── conversations (1:N)
          ├── receipts (1:N)
          └── reminders (1:N)

conversations ── messages (1:N)
conversations ── receipts (1:N)

debts ── reminders (1:N)
debts ── receipts (1:N)
```

### Funciones y Triggers

| Función | Trigger | Descripción |
|---------|---------|-------------|
| `update_updated_at()` | `SET UPDATED AT` en clients, debts | Auto-actualiza `updated_at` |
| `calculate_client_debt_total()` | `UPDATE CLIENT DEBT TOTAL` en debts | Calcula total de deudas pendientes |

### Cron Jobs

| Job | Schedule | Función |
|-----|----------|---------|
| `send-reminders` | `*/15 * * * *` | Envía recordatorios cada 15 minutos |

---

## Edge Functions Endpoints

### 1. `whatsapp-webhook`

Recibe eventos de WhatsApp de Meta.

**URL:** `https://xxx.supabase.co/functions/v1/whatsapp-webhook`

**Métodos:**
- `GET` - Verificación del webhook (Meta)
- `POST` - Recibir mensajes de WhatsApp

**GET Parameters:**
```
hub.mode=subscribe
hub.verify_token=<token>
hub.challenge=<challenge>
```

**POST Body:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "5215551234567",
          "type": "text",
          "text": { "body": "Hola" }
        }]
      }
    }]
  }]
}
```

**Respuesta:** `200 OK` con body `OK` o challenge

---

### 2. `whatsapp-send`

Envía mensajes de WhatsApp.

**URL:** `https://xxx.supabase.co/functions/v1/whatsapp-send`

**Método:** `POST`

**Headers:**
```
Authorization: Bearer <service_role_key>
Content-Type: application/json
```

**Body:**
```json
{
  "to": "5215551234567",
  "type": "text",
  "content": { "text": "Hola, este es un mensaje" }
}
```

**Tipos de mensaje:**
- `text` - Mensaje de texto
- `image` - Imagen
- `document` - Documento
- `interactive` - Botones interactivos

---

### 3. `process-receipt`

Procesa comprobantes de pago.

**URL:** `https://xxx.supabase.co/functions/v1/process-receipt`

**Método:** `POST`

**Body:**
```json
{
  "conversation_id": "uuid",
  "client_id": "uuid",
  "media_id": "whatsapp_media_id",
  "file_type": "image"
}
```

---

### 4. `send-reminders`

Envía recordatorios pendientes.

**URL:** `https://xxx.supabase.co/functions/v1/send-reminders`

**Método:** `POST`

**Body:** `{}` (empty)

**Respuesta:**
```json
{
  "processed": 5,
  "results": {
    "sent": 3,
    "rescheduled": 1,
    "failed": 1
  }
}
```

---

### 5. `admin-notify`

Obtiene notificaciones del panel.

**URL:** `https://xxx.supabase.co/functions/v1/admin-notify`

**Método:** `GET`

**Headers:**
```
Authorization: Bearer <service_role_key>
```

**Respuesta:**
```json
{
  "pendingReceipts": 2,
  "activeConversations": 5,
  "pendingReminders": 10,
  "overdueDebts": 3
}
```

---

## Flujo del Chatbot

```
 Usuario envía mensaje
         │
         ▼
┌─────────────────┐
│  whatsapp-      │
│  webhook        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  findOrCreate   │
│  Conversation   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  saveMessage    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  handleState    │◀─── state-machine.ts
│  (switch)       │
└────────┬────────┘
         │
    ┌────┴────┬────────┬──────────┬──────────┐
    ▼         ▼        ▼          ▼          ▼
  menu    viewing   sent_bank  receipt   human
          _debt     _details  _received  _agent
```

---

## Setup Local

### Requisitos

- Node.js 18+
- npm o yarn
- Git
- Supabase CLI (`npm install -g supabase`)

### 1. Clonar repositorio

```bash
git clone https://github.com/hazielmacias/Charlo.git
cd Charlo
```

### 2. Frontend

```bash
cd charlo-panel
npm install
cp .env.example .env.local  # Configurar variables
npm run dev                  # http://localhost:5173
```

### 3. Edge Functions (opcional)

```bash
# Login a Supabase
supabase login

# Link al proyecto
supabase link --project-ref oqhoebtjqvbgwhdxszmk

# Ejecutar funciones localmente
supabase functions serve --env-file .env.local
```

### 4. Variables de entorno del frontend

```env
VITE_SUPABASE_URL=https://oqhoebtjqvbgwhdxszmk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

---

## Deploy

### Frontend (Vercel)

```bash
# Opción 1: CLI
cd charlo-panel
vercel --prod

# Opción 2: Git push (automático)
git push origin main
```

### Edge Functions (Supabase)

```bash
# Deploy individual
supabase functions deploy whatsapp-webhook --no-verify-jwt
supabase functions deploy whatsapp-send --no-verify-jwt
supabase functions deploy process-receipt --no-verify-jwt
supabase functions deploy send-reminders --no-verify-jwt
supabase functions deploy admin-notify --no-verify-jwt

# Deploy todas
for fn in whatsapp-webhook whatsapp-send process-receipt send-reminders admin-notify; do
  supabase functions deploy $fn --no-verify-jwt
done

# Configurar secrets
supabase secrets set META_PHONE_NUMBER_ID=xxx
supabase secrets set META_ACCESS_TOKEN=xxx
```

### Database Migrations

```bash
# Aplicar migración
supabase db push

# Verificar migraciones
supabase migration list
```

---

## Monitoreo

### Dashboard SQL

Ejecutar `supabase/monitoring.sql` en Supabase SQL Editor para ver:

- Resumen general
- Actividad reciente
- Errores
- Métricas de reminders
- Top clientes

### Logs

```bash
# Ver logs de Edge Functions
supabase functions logs whatsapp-webhook
supabase functions logs send-reminders

# Ver logs recientes
supabase functions logs --limit 50
```

### Métricas Clave

| Métrica | Objetivo |
|---------|----------|
| Webhook response time | < 2s |
| Success rate | > 99% |
| Messages/sec | > 10 |
| Cron job success rate | 100% |

---

## Troubleshooting

### BOOT_ERROR en Edge Functions

Causa: Imports de Deno incompatible.

Solución: Usar `Deno.serve()` en lugar de `serve()`, y imports con versión específica:
```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
```

### Webhook no recibe mensajes

1. Verificar URL del webhook en Meta Dashboard
2. Verificar `META_VERIFY_TOKEN` coincide
3. Verificar que el webhook esté verificado

### Send-reminders falla

1. Verificar que la tabla `reminders` tenga datos
2. Verificar que `scheduled_at` sea <= NOW()
3. Verificar que los clientes tengan teléfono válido

---

## Licencia

Uso interno - Alebrijes Teotihuacan
