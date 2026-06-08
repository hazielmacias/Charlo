# 6.3 Tests Manuales — Guía de Verificación

> **Prerequisitos:** Functions desplegadas, webhook configurado en Meta, número de WhatsApp activo.

---

## Pre-Deploy Checklist

Antes de ejecutar los tests, verificar:

- [ ] Functions desplegadas: `supabase functions deploy whatsapp-webhook`
- [ ] Variables de entorno configuradas:
  ```bash
  supabase secrets set META_ACCESS_TOKEN=...
  supabase secrets set META_PHONE_NUMBER_ID=...
  supabase secrets set META_VERIFY_TOKEN=...
  supabase secrets set META_APP_SECRET=...
  ```
- [ ] Webhook URL configurado en Meta Dashboard: `https://<project-ref>.supabase.co/functions/v1/whatsapp-webhook`
- [ ] Verify token coincide con `META_VERIFY_TOKEN`
- [ ] Bucket `receipts` creado en Storage

---

## Test 1: Enviar Mensaje de Prueba desde WhatsApp

### Pasos
1. Abrir WhatsApp en el teléfono registrado
2. Enviar mensaje de texto: `hola`

### Resultado Esperado
- Mensaje aparece en WhatsApp como enviado
- En Supabase Dashboard → Tabla `messages`: registro con `direction: 'inbound'`
- En Supabase Dashboard → Tabla `conversations`: nueva conversación o existente actualizada

### Verificar
```sql
-- En Supabase SQL Editor
SELECT * FROM messages ORDER BY created_at DESC LIMIT 5;
SELECT * FROM conversations ORDER BY created_at DESC LIMIT 5;
```

---

## Test 2: Verificar Recepción del Webhook en Supabase

### Pasos
1. Enviar mensaje `hola` desde WhatsApp
2. Ir a Supabase Dashboard → Edge Functions → Logs
3. Buscar función `whatsapp-webhook`

### Resultado Esperado
- Log muestra: `Received message from 521...: text`
- Status code: 200
- No errores en logs

### Verificar
```bash
# Opcional: revisar logs via CLI
supabase functions logs whatsapp-webhook
```

---

## Test 3: Verificar Guardado del Mensaje en BD

### Pasos
1. Enviar mensaje `hola` desde WhatsApp
2. Esperar respuesta del bot (menú con botones)

### Resultado Esperado en `messages`:
| Campo | Valor Esperado |
|-------|----------------|
| `direction` | `inbound` |
| `type` | `text` |
| `content` | `hola` |
| `status` | `received` |

### Resultado Esperado en `conversations`:
| Campo | Valor Esperado |
|-------|----------------|
| `state` | `menu` |
| `phone` | `521555...` |
| `client_id` | UUID válido |

### Verificar
```sql
SELECT m.*, c.state, c.phone 
FROM messages m 
JOIN conversations c ON m.conversation_id = c.id 
ORDER BY m.created_at DESC 
LIMIT 5;
```

---

## Test 4: Verificar Envío de Respuesta con Botones

### Pasos
1. Enviar `hola` desde WhatsApp
2. Observar respuesta del bot

### Resultado Esperado
- Mensaje de bienvenida: `¡Hola [Nombre]! Bienvenido a Charló.`
- 3 botones interactivos:
  - `Ver mi deuda`
  - `Realizar pago`
  - `Hablar con asesor`

### Verificar
```sql
-- Mensaje enviado (outbound)
SELECT * FROM messages 
WHERE direction = 'outbound' 
ORDER BY created_at DESC 
LIMIT 3;
```

### Probar cada botón
1. **Ver mi deuda** → Debería mostrar deudas pendientes o "No tienes deudas pendientes"
2. **Realizar pago** → Debería mostrar datos bancarios (CBU, alias, monto)
3. **Hablar con asesor** → Debería mostrar "Un asesor se comunicará contigo pronto"

---

## Test 5: Enviar Comprobante (Imagen) y Verificar Storage

### Pasos
1. Enviar `hola` → hacer clic en "Realizar pago"
2. Recibir datos bancarios
3. Enviar una imagen (foto de comprobante)
4. Esperar confirmación

### Resultado Esperado
- Bot responde: `✅ Comprobante recibido. Será revisado por un administrador.`
- En Supabase Storage → bucket `receipts`: archivo guardado
- En tabla `receipts`: nuevo registro

### Verificar Storage
```sql
-- Verificar registro en receipts
SELECT * FROM receipts ORDER BY created_at DESC LIMIT 5;

-- Verificar en Storage (dashboard o CLI)
-- Bucket: receipts
-- Path: {client_id}/{timestamp}_receipt.jpg
```

### Verificar Structure del Archivo
```
receipts/
└── {client_id}/
    └── 1717812345678_receipt.jpg
```

---

## Test 6: Verificar Notificación en Panel de Comprobante Pendiente

### Pasos
1. Completar Test 5 (enviar comprobante)
2. Abrir el panel de administración (`/receipts`)
3. Verificar badge de pendientes en sidebar

### Resultado Esperado
- Badge muestra count de comprobantes pendientes
- Tabla muestra nuevo comprobante con status `pending`
- Vista detalle muestra preview de imagen

### Verificar
```sql
-- Contar pendientes
SELECT COUNT(*) FROM receipts WHERE status = 'pending';

-- Verificar notificación
SELECT * FROM admin_notifications 
WHERE type = 'new_receipt' 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## Test 7: Testear Recordatorio en Horario Permitido

### Pasos
1. Asegurarse de estar en horario (8:00 AM - 8:00 PM hora local)
2. Crear un recordatorio manual en la BD:
```sql
INSERT INTO reminders (client_id, debt_id, status, scheduled_at, attempts)
VALUES (
  (SELECT id FROM clients LIMIT 1),
  (SELECT id FROM debts WHERE status = 'pending' LIMIT 1),
  'pending',
  NOW(),
  0
);
```
3. Ejecutar manualmente la function:
```bash
supabase functions invoke send-reminders
```

### Resultado Esperado
- Function retorna: `{ processed: 1, results: { sent: 1 } }`
- Cliente recibe mensaje de recordatorio por WhatsApp
- Status del reminder cambia a `sent`
- `sent_at` tiene timestamp

### Verificar
```sql
SELECT r.*, c.phone, c.name, d.description, d.amount
FROM reminders r
JOIN clients c ON r.client_id = c.id
JOIN debts d ON r.debt_id = d.id
WHERE r.status = 'sent'
ORDER BY r.sent_at DESC
LIMIT 5;
```

---

## Test 8: Testear Recordatorio Fuera de Horario

### Pasos
1. Modificar temporalmente la hora del sistema o usar timezone que esté fuera de horario
2. O ejecutar manualmente con un cliente cuyo timezone esté fuera de 8AM-8PM
3. Crear reminder y ejecutar:
```sql
-- Crear reminder para un timezone fuera de horario
INSERT INTO reminders (client_id, debt_id, status, scheduled_at, attempts)
VALUES (
  (SELECT id FROM clients WHERE timezone = 'America/New_York' LIMIT 1),
  (SELECT id FROM debts WHERE status = 'pending' LIMIT 1),
  'pending',
  NOW(),
  0
);
```
4. Ejecutar:
```bash
supabase functions invoke send-reminders
```

### Resultado Esperado
- Function retorna: `{ processed: 1, results: { rescheduled: 1 } }`
- Status del reminder sigue siendo `pending`
- `scheduled_at` actualizado a mañana 8:00 AM en timezone del cliente
- `attempts` incrementado en 1

### Verificar
```sql
SELECT r.*, c.phone, c.name, c.timezone
FROM reminders r
JOIN clients c ON r.client_id = c.id
WHERE r.status = 'pending' 
  AND r.attempts > 0
ORDER BY r.updated_at DESC
LIMIT 5;
```

---

## Troubleshooting

### Webhook no recibe mensajes
- Verificar URL en Meta Dashboard: `https://<ref>.supabase.co/functions/v1/whatsapp-webhook`
- Verificar `META_VERIFY_TOKEN` coincide
- Verificar logs en Supabase: Edge Functions → Logs

### Respuesta no llega a WhatsApp
- Verificar `META_ACCESS_TOKEN` es válido
- Verificar `META_PHONE_NUMBER_ID` es correcto
- Verificar que el número está dentro de la ventana de 24h

### Storage no guarda archivos
- Verificar bucket `receipts` existe y es público
- Verificar RLS policies están configuradas
- Verificar `SUPABASE_SERVICE_ROLE_KEY` está en secrets

### Recordatorios no se envían
- Verificar tabla `reminders` tiene registros pending
- Verificar `scheduled_at` es <= NOW()
- Verificar tabla `clients` tiene `phone` y `timezone`
- Verificar tabla `debts` tiene `description` y `amount`

---

## Comandos Útiles

```bash
# Desplegar functions
supabase functions deploy whatsapp-webhook
supabase functions deploy whatsapp-send
supabase functions deploy process-receipt
supabase functions deploy send-reminders

# Ver logs
supabase functions logs whatsapp-webhook

# Invocar function manualmente
supabase functions invoke send-reminders

# Ver secrets
supabase secrets list

# Resetear secrets
supabase secrets set KEY=value

# Verificar storage
supabase storage ls receipts/
```
