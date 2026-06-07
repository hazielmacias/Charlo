# TASKS.md — Charló MVP

> Última actualización: 2026-06-07

---

## FASE 0: CONFIGURACIÓN INICIAL

### 0.1 Supabase
- [1] Crear cuenta en Supabase
- [1] Crear nuevo proyecto (nombre: charlo-cobranza)
- [1] Guardar credenciales: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [1] Habilitar extensión `pg_cron` (scheduler de recordatorios)
- [1] Habilitar extensión `pg_net` (webhooks HTTP asíncronos)

### 0.2 Meta Business Suite
- [ ] Crear Meta Business Account (o usar existente)
- [ ] Crear WhatsApp Business Account
- [ ] Obtener Phone Number ID desde Meta Developer Dashboard
- [ ] Obtener Permanent Access Token (System User Token)
- [ ] Registrar número de teléfono verificado
- [ ] Configurar webhook URL en Meta Dashboard (placeholder temporal)

### 0.3 Frontend - React
- [ ] Inicializar proyecto con Vite: `npm create vite@latest charlo-panel -- --template react-ts`
- [ ] Instalar dependencias base:
  - [ ] `tailwindcss` + `postcss` + `autoprefixer`
  - [ ] `@supabase/supabase-js`
  - [ ] `react-router-dom`
  - [ ] `lucide-react` (iconos)
  - [ ] `recharts` (gráficos dashboard)
  - [ ] `papaparse` (parseo CSV)
  - [ ] `xlsx` (lectura Excel)
  - [ ] `date-fns` (manejo de fechas)
  - [ ] `react-hook-form` (formularios)
  - [ ] `zod` (validación de schemas)
- [ ] Configurar Tailwind con paleta de colores azules
- [ ] Configurar estructura de carpetas:
  ```
  src/
  ├── components/
  ├── pages/
  ├── hooks/
  ├── lib/
  ├── types/
  └── styles/
  ```

### 0.4 Git y Control de Versiones
- [ ] Inicializar repositorio Git
- [ ] Crear `.gitignore` completo
- [ ] Crear primer commit con estructura base
- [ ] Conectar a repositorio remoto (GitHub/GitLab)

### 0.5 Variables de Entorno
- [ ] Crear archivo `.env.local` en frontend
- [ ] Crear archivo `.env` en Supabase Edge Functions
- [ ] Documentar variables requeridas:
  ```
  VITE_SUPABASE_URL=
  VITE_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  META_ACCESS_TOKEN=
  META_PHONE_NUMBER_ID=
  META_VERIFY_TOKEN=
  WHATSAPP_API_VERSION=v21.0
  ```

---

## FASE 1: BASE DE DATOS

### 1.1 Tablas Principales
- [ ] Crear tabla `clients` (deudores)
- [ ] Crear tabla `debts` (deudas individuales)
- [ ] Crear tabla `conversations` (conversaciones WhatsApp)
- [ ] Crear tabla `messages` (historial de mensajes)
- [ ] Crear tabla `receipts` (comprobantes de pago)
- [ ] Crear tabla `reminders` (recordatorios programados)
- [ ] Crear tabla `bank_config` (datos bancarios)
- [ ] Crear tabla `settings` (configuración del sistema)
- [ ] Crear tabla `admin_users` (usuarios del panel)

### 1.2 Índices
- [ ] Índice en `clients.phone`
- [ ] Índice en `debts.client_id`
- [ ] Índice en `debts.status`
- [ ] Índice en `conversations.phone`
- [ ] Índice en `receipts.status`
- [ ] Índice parcial en `reminders` WHERE status = 'pending'

### 1.3 Row Level Security (RLS)
- [ ] Habilitar RLS en tabla `clients`
- [ ] Habilitar RLS en tabla `debts`
- [ ] Habilitar RLS en tabla `receipts`
- [ ] Habilitar RLS en tabla `conversations`
- [ ] Habilitar RLS en tabla `messages`
- [ ] Crear policies para usuarios autenticados (panel)
- [ ] Crear policy para Edge Functions (service_role bypass)

### 1.4 Functions y Triggers
- [ ] Crear function `update_updated_at()` para auto-actualizar timestamps
- [ ] Crear trigger en `clients` para llamar `update_updated_at`
- [ ] Crear trigger en `debts` para llamar `update_updated_at`
- [ ] Crear function `calculate_client_debt_total()` que sume deudas pendientes
- [ ] Crear trigger en `debts` que actualice `clients.debt_total` al insertar/actualizar/delete

### 1.5 Datos Iniciales
- [ ] Insertar registro en `bank_config` con datos bancarios de prueba
- [ ] Insertar settings iniciales (horario recordatorios 8-20, timezone default)
- [ ] Crear usuario admin de prueba en Supabase Auth

---

## FASE 2: EDGE FUNCTIONS - BACKEND

### 2.1 Setup Edge Functions
- [ ] Instalar Supabase CLI globally
- [ ] Ejecutar `supabase init` en el proyecto
- [ ] Ejecutar `supabase login`
- [ ] Ejecutar `supabase link --project-ref <ref>`
- [ ] Crear estructura de funciones:
  ```
  supabase/functions/
  ├── whatsapp-webhook/
  ├── whatsapp-send/
  ├── process-receipt/
  ├── send-reminders/
  └── admin-notify/
  ```

### 2.2 Función: `whatsapp-webhook`
- [ ] Crear endpoint POST para recibir webhooks de Meta
- [ ] Implementar verificación de firma del webhook (HMAC SHA-256)
- [ ] Implementar handling del payload de verificación GET (hub.mode, hub.challenge)
- [ ] Parsear mensajes entrantes (texto, imagen, documento, interactivo)
- [ ] Identificar remitente por número de teléfono
- [ ] Buscar o crear `conversation` activa para el teléfono
- [ ] Guardar mensaje entrante en tabla `messages`
- [ ] Ejecutar máquina de estados según `conversation.state`
- [ ] Responder con 200 OK inmediatamente (no bloquear)

### 2.3 Función: `whatsapp-send`
- [ ] Crear helper para enviar mensajes de texto
- [ ] Crear helper para enviar botones interactivos (Reply Buttons)
- [ ] Crear helper para enviar List Messages (menú de opciones)
- [ ] Crear helper para enviar imágenes/documentos
- [ ] Implementar manejo de errores de la API de Meta
- [ ] Implementar retry logic con backoff exponencial
- [ ] Guardar mensaje enviado en tabla `messages` con status 'sent'
- [ ] Actualizar status del mensaje cuando llegue webhook de delivery/read

### 2.4 Función: `process-receipt`
- [ ] Recibir payload con URL del archivo multimedia de WhatsApp
- [ ] Descargar archivo desde Media URL de WhatsApp API
- [ ] Determinar tipo de archivo (imagen, pdf, screenshot)
- [ ] Subir archivo a Supabase Storage bucket `receipts`
- [ ] Crear registro en tabla `receipts` con file_url y metadata
- [ ] Actualizar estado de conversación a 'receipt_received'
- [ ] Enviar confirmación al usuario
- [ ] Notificar al admin (trigger para panel o email)

### 2.5 Función: `send-reminders`
- [ ] Consultar `reminders` con status = 'pending' y `scheduled_at` <= NOW()
- [ ] Para cada reminder, obtener datos del cliente
- [ ] Calcular hora local del cliente según su timezone
- [ ] Validar que hora local está entre 8:00 y 20:00
- [ ] Si en horario: enviar mensaje de recordatorio via `whatsapp-send`
- [ ] Si fuera de horario: reprogramar para mañana a las 8:00 AM
- [ ] Actualizar status del reminder a 'sent' o 'rescheduled'
- [ ] Manejar errores y marcar como 'failed' después de 3 intentos

### 2.6 Función: `admin-notify`
- [ ] Crear endpoint para obtener notificaciones del panel
- [ ] Contar comprobantes pendientes de revisión
- [ ] Retornar badges/contadores para el dashboard

### 2.7 Cron Jobs (pg_cron)
- [ ] Crear cron job para `send-reminders` cada 15 minutos
- [ ] Verificar formato de expresión cron correcto
- [ ] Testear ejecución manual del cron

---

## FASE 3: CHATBOT - FLUJO WHATSAPP

### 3.1 Máquina de Estados
- [ ] Definir estados posibles:
  - `menu` — Menú principal
  - `viewing_debt` — Consultando deuda
  - `awaiting_payment` — Esperando comprobante
  - `sent_bank_details` — Datos bancarios enviados
  - `human_agent` — Transferido a agente
- [ ] Crear función `get_conversation_state(phone)`
- [ ] Crear función `update_conversation_state(phone, newState, context)`
- [ ] Crear función `reset_conversation(phone)` para volver al menú

### 3.2 Estado: Menú Principal
- [ ] Detectar mensaje de inicio ("hola", "menu", inicio de conversación)
- [ ] Enviar mensaje de bienvenida con nombre del cliente
- [ ] Enviar botones interactivos:
  ```
  [Ver mi deuda] [Realizar pago] [Hablar con asesor]
  ```
- [ ] Manejar respuesta del usuario según botón seleccionado

### 3.3 Estado: Ver Deuda
- [ ] Obtener deudas pendientes del cliente desde BD
- [ ] Si no tiene deudas: responder "No tienes deudas pendientes"
- [ ] Si tiene deudas, formatear mensaje con detalle y total
- [ ] Enviar botón adicional: [Realizar pago] [Volver al menú]
- [ ] Actualizar estado a 'viewing_debt'

### 3.4 Estado: Realizar Pago
- [ ] Obtener datos bancarios activos desde `bank_config`
- [ ] Enviar mensaje con datos bancarios (CBU, alias, titular, monto)
- [ ] Actualizar estado a 'sent_bank_details'
- [ ] Esperar siguiente mensaje del usuario

### 3.5 Estado: Recibir Comprobante
- [ ] Detectar si el mensaje contiene imagen, documento o multimedia
- [ ] Llamar a función `process-receipt` para guardar el archivo
- [ ] Confirmar al usuario: "Recibimos tu comprobante. Lo revisaremos."
- [ ] Enviar botón: [Volver al menú] [Hablar con asesor]
- [ ] Actualizar estado a 'receipt_received'

### 3.6 Estado: Hablar con Asesor
- [ ] Enviar mensaje: "Un asesor se comunicará contigo pronto."
- [ ] Actualizar estado a 'human_agent'

### 3.7 Manejo de Errores
- [ ] Si usuario envía texto no válido: reenviar menú con opciones
- [ ] Si API de WhatsApp falla: log error y reintentar una vez
- [ ] Si usuario no responde en 24h: resetear conversación a 'menu'
- [ ] Si usuario envía comprobante fuera del flujo: indicar "Escribí 'menu'"

### 3.8 Restricción de Horario
- [ ] Implementar función `isWithinBusinessHours(timezone)` (8:00-20:00)
- [ ] Integrar en `send-reminders` antes de enviar cada mensaje
- [ ] Soportar timezone de clientes (Argentina, Chile, etc.)

---

## FASE 4: PANEL DE CONTROL - REACT

### 4.1 Autenticación
- [ ] Crear página de Login (`/login`)
- [ ] Implementar formulario con email + password
- [ ] Integrar `supabase.auth.signInWithPassword()`
- [ ] Crear Protected Route wrapper
- [ ] Implementar logout
- [ ] Guardar sesión en localStorage
- [ ] Redirigir a dashboard si ya está autenticado

### 4.2 Layout del Panel
- [ ] Crear componente `Layout` con sidebar y área de contenido
- [ ] Diseñar sidebar minimalista (Apple HIG):
  ```
  ┌─────────────┐
  │ Inicio      │
  │ Clientes    │
  │ Cobros      │
  │ Comprobantes│
  │ Config      │
  └─────────────┘
  ```
- [ ] Header con avatar del usuario y botón logout
- [ ] Diseño responsive (colapsar sidebar en mobile)

### 4.3 Dashboard
- [ ] Crear página Dashboard (`/`)
- [ ] Tarjetas KPI (4 columnas desktop, 2 mobile):
  - [ ] Total Recaudado
  - [ ] Tasa de Éxito (porcentaje)
  - [ ] Clientes al Día
  - [ ] Pendientes Revisión (badge)
- [ ] Gráfico Aging de Vencimiento (Bar Chart):
  - Eje X: rangos (0-30, 31-60, 61-90, 90+ días)
  - Eje Y: cantidad de deudas o monto
- [ ] Gráfico Recaudación Mensual (Line Chart):
  - Últimos 6 meses, monto recaudado por mes
- [ ] Gráfico Distribución por Estado (Donut Chart):
  - Pendiente / Pagado / Vencido
- [ ] Tabla de "Últimas Actividades"
- [ ] Obtener datos desde Supabase con queries optimizadas

### 4.4 Gestión de Clientes
- [ ] Crear página Clientes (`/clients`)
- [ ] Tabla con columnas: Nombre, Teléfono, Deuda Total, Estado, Último Contacto, Acciones
- [ ] Búsqueda por nombre o teléfono
- [ ] Filtros por estado
- [ ] Modal/página de Crear Cliente (nombre, teléfono, email)
- [ ] Modal/página de Editar Cliente
- [ ] Vista de detalle de Cliente:
  - [ ] Datos personales
  - [ ] Lista de deudas
  - [ ] Historial de conversación WhatsApp
  - [ ] Comprobantes enviados
- [ ] Paginación

### 4.5 Gestión de Deudas
- [ ] Crear página Cobros (`/debts`)
- [ ] Vista de lista de todas las deudas
- [ ] Filtros: cliente, estado, rango de fechas, rango de montos
- [ ] Formulario de Nueva Deuda:
  - Seleccionar cliente (autocomplete)
  - Descripción, monto, fecha de vencimiento
- [ ] Carga masiva CSV/Excel:
  - [ ] Botón "Cargar archivo"
  - [ ] Componente para subir archivo
  - [ ] Parsear CSV (`papaparse`) o Excel (`xlsx`)
  - [ ] Validar columnas requeridas
  - [ ] Preview de datos antes de importar
  - [ ] Confirmar importación
  - [ ] Crear deudas en batch
  - [ ] Mostrar resultado: X creadas, Y errores
- [ ] Acción para marcar deuda como pagada
- [ ] Acción para eliminar deuda

### 4.6 Revisión de Comprobantes
- [ ] Crear página Comprobantes (`/receipts`)
- [ ] Tabla con filtros: estado, cliente, fecha
- [ ] Vista de detalle del comprobante:
  - [ ] Preview de imagen/PDF
  - [ ] Datos del cliente y deuda asociada
  - [ ] Fecha de envío
- [ ] Botones de acción:
  - [ ] Aprobar → status 'approved', marcar deuda como pagada
  - [ ] Rechazar → status 'rejected', agregar notas
  - [ ] Pedir aclaración → enviar mensaje WhatsApp al cliente
- [ ] Contador de pendientes en sidebar/badge

### 4.7 Configuración
- [ ] Crear página Configuración (`/settings`)
- [ ] Sección: Datos Bancarios
  - [ ] Lista de cuentas bancarias configuradas
  - [ ] Formulario agregar/editar cuenta
  - [ ] Toggle activar/desactivar
- [ ] Sección: Recordatorios
  - [ ] Configurar horario envío (hora inicio, hora fin)
  - [ ] Configurar timezone
  - [ ] Configurar frecuencia
- [ ] Sección: Mensajes del Bot
  - [ ] Editar textos de bienvenida
  - [ ] Editar textos de recordatorio
  - [ ] Editar textos de confirmación
- [ ] Sección: Mi Cuenta
  - [ ] Cambiar contraseña
  - [ ] Actualizar email

---

## FASE 5: INTEGRACIONES

### 5.1 Conexión Frontend ↔ Supabase
- [ ] Crear archivo `lib/supabase.ts` con cliente Supabase
- [ ] Crear hooks personalizados:
  - [ ] `useClients()` — obtener lista de clientes
  - [ ] `useClient(id)` — obtener cliente específico
  - [ ] `useDebts(filters)` — obtener deudas con filtros
  - [ ] `useReceipts(filters)` — obtener comprobantes
  - [ ] `useDashboardStats()` — obtener métricas del dashboard
- [ ] Implementar real-time subscriptions (opcional):
  - [ ] Escuchar nuevos comprobantes recibidos
  - [ ] Actualizar dashboard en tiempo real

### 5.2 Webhook Verification
- [ ] Configurar endpoint de verificación en Meta Dashboard
- [ ] Implementar lógica de verificación GET:
  ```typescript
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return new Response(challenge);
    }
  }
  ```

### 5.3 Firma de Webhooks
- [ ] Implementar verificación HMAC SHA-256
- [ ] Obtener `APP_SECRET` de Meta Dashboard
- [ ] Validar header `x-hub-signature-256`
- [ ] Rechazar webhooks con firma inválida

### 5.4 Gestión de Archivos Multimedia
- [ ] Crear bucket `receipts` en Supabase Storage
- [ ] Configurar políticas de acceso al bucket
- [ ] Implementar descarga de media desde WhatsApp API:
  ```typescript
  // 1. Obtener media_id del mensaje
  // 2. GET https://graph.facebook.com/{version}/{media_id}
  // 3. Obtener URL de descarga
  // 4. Descargar archivo
  // 5. Subir a Supabase Storage
  ```

---

## FASE 6: TESTING

### 6.1 Tests Unitarios
- [ ] Configurar testing framework (Vitest o Jest)
- [ ] Testear funciones helper de WhatsApp:
  - [ ] Formateo de mensajes
  - [ ] Validación de estados
  - [ ] Cálculo de deudas
- [ ] Testear validación de horario (8AM-8PM)
- [ ] Testear parseo de CSV/Excel

### 6.2 Tests de Integración
- [ ] Test flujo completo: crear cliente → crear deuda → simular conversación
- [ ] Test webhook: simular payload de Meta y verificar guardado
- [ ] Test receipt: simular envío de imagen y verificar storage

### 6.3 Tests Manuales
- [ ] Enviar mensaje de prueba desde WhatsApp
- [ ] Verificar recepción del webhook en Supabase
- [ ] Verificar guardado del mensaje en BD
- [ ] Verificar envío de respuesta con botones
- [ ] Enviar comprobante (imagen) y verificar storage
- [ ] Verificar notificación en panel de comprobante pendiente
- [ ] Testear recordatorio en horario permitido
- [ ] Testear recordatorio fuera de horario

### 6.4 Pruebas de Carga
- [ ] Simular múltiples clientes simultáneos
- [ ] Verificar no haya race conditions
- [ ] Verificar límites de rate limiting de Meta API

---

## FASE 7: DEPLOY Y PRODUCCIÓN

### 7.1 Supabase Production
- [ ] Verificar todas las migraciones aplicadas
- [ ] Verificar RLS habilitado en todas las tablas
- [ ] Verificar cron jobs activos
- [ ] Configurar backups automáticos
- [ ] Revisar logs de Edge Functions

### 7.2 Frontend Deploy
- [ ] Build de producción: `npm run build`
- [ ] Deploy en Vercel o Netlify
- [ ] Configurar dominio personalizado (opcional)
- [ ] Verificar variables de entorno en plataforma de deploy
- [ ] Verificar SSL activo

### 7.3 Meta Production
- [ ] Cambiar de número de prueba a producción
- [ ] Verificar webhook URL apunta a producción
- [ ] Verificar access token es de producción
- [ ] Enviar solicitud de verificación de negocio
- [ ] Configurar mensaje de bienvenida de WhatsApp Business

### 7.4 Monitoreo
- [ ] Configurar alertas de error en Supabase
- [ ] Revisar métricas de uso de Edge Functions
- [ ] Monitorear costo de Meta Cloud API
- [ ] Configurar logging estructurado

### 7.5 Documentación
- [ ] Documentar endpoints de Edge Functions
- [ ] Documentar estructura de BD
- [ ] Documentar variables de entorno requeridas
- [ ] Documentar proceso de deploy
- [ ] Crear README con instrucciones de setup local

---

## FASE 8: MEJORAS POST-MVP (Futuro)

### 8.1 Funcionalidades Adicionales
- [ ] Dashboard analytics avanzados (exportar PDF/Excel)
- [ ] Notificaciones push para admins
- [ ] Integración con sistema contable existente
- [ ] Multi-tenant (múltiples empresas)
- [ ] App móvil para admins (React Native)
- [ ] Chatbot con IA para preguntas frecuentes
- [ ] Soporte multi-idioma

### 8.2 Optimizaciones
- [ ] Cachear datos de dashboard
- [ ] Optimistic updates en UI
- [ ] Lazy loading de páginas
- [ ] Vistas materializadas para queries pesadas

---

## Resumen

| Fase | Completadas | Pendientes | Total |
|------|-------------|------------|-------|
| Fase 0 | 0 | 25 | 25 |
| Fase 1 | 0 | 25 | 25 |
| Fase 2 | 0 | 35 | 35 |
| Fase 3 | 0 | 30 | 30 |
| Fase 4 | 0 | 45 | 45 |
| Fase 5 | 0 | 15 | 15 |
| Fase 6 | 0 | 18 | 18 |
| Fase 7 | 0 | 17 | 17 |
| Fase 8 | 0 | 11 | 11 |
| **TOTAL** | **0** | **221** | **221** |
