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
- [1] Crear Meta Business Account (o usar existente)
- [1] Crear WhatsApp Business Account
- [1] Obtener Phone Number ID desde Meta Developer Dashboard
- [1] Obtener Permanent Access Token (System User Token)
- [1] Registrar número de teléfono verificado
- [1] Configurar webhook URL en Meta Dashboard (placeholder temporal)

### 0.3 Frontend - React
- [1] Inicializar proyecto con Vite: `npm create vite@latest charlo-panel -- --template react-ts`
- [1] Instalar dependencias base:
  - [1] `tailwindcss` + `postcss` + `autoprefixer`
  - [1] `@supabase/supabase-js`
  - [1] `react-router-dom`
  - [1] `lucide-react` (iconos)
  - [1] `recharts` (gráficos dashboard)
  - [1] `papaparse` (parseo CSV)
  - [1] `xlsx` (lectura Excel)
  - [1] `date-fns` (manejo de fechas)
  - [1] `react-hook-form` (formularios)
  - [1] `zod` (validación de schemas)
- [1] Configurar Tailwind con paleta de colores azules
- [1] Configurar estructura de carpetas:
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
- [1] Inicializar repositorio Git
- [1] Crear `.gitignore` completo
- [1] Crear primer commit con estructura base
- [1] Conectar a repositorio remoto (GitHub/GitLab)

### 0.5 Variables de Entorno
- [1] Crear archivo `.env.local` en frontend
- [1] Crear archivo `.env` en Supabase Edge Functions
- [1] Documentar variables requeridas:
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
- [1] Crear tabla `clients` (deudores)
- [1] Crear tabla `debts` (deudas individuales)
- [1] Crear tabla `conversations` (conversaciones WhatsApp)
- [1] Crear tabla `messages` (historial de mensajes)
- [1] Crear tabla `receipts` (comprobantes de pago)
- [1] Crear tabla `reminders` (recordatorios programados)
- [1] Crear tabla `bank_config` (datos bancarios)
- [1] Crear tabla `settings` (configuración del sistema)
- [1] Crear tabla `admin_users` (usuarios del panel)

### 1.2 Índices
- [1] Índice en `clients.phone`
- [1] Índice en `debts.client_id`
- [1] Índice en `debts.status`
- [1] Índice en `conversations.phone`
- [1] Índice en `receipts.status`
- [1] Índice parcial en `reminders` WHERE status = 'pending'

### 1.3 Row Level Security (RLS)
- [1] Habilitar RLS en tabla `clients`
- [1] Habilitar RLS en tabla `debts`
- [1] Habilitar RLS en tabla `receipts`
- [1] Habilitar RLS en tabla `conversations`
- [1] Habilitar RLS en tabla `messages`
- [1] Crear policies para usuarios autenticados (panel)
- [1] Crear policy para Edge Functions (service_role bypass)

### 1.4 Functions y Triggers
- [1] Crear function `update_updated_at()` para auto-actualizar timestamps
- [1] Crear trigger en `clients` para llamar `update_updated_at`
- [1] Crear trigger en `debts` para llamar `update_updated_at`
- [1] Crear function `calculate_client_debt_total()` que sume deudas pendientes
- [1] Crear trigger en `debts` que actualice `clients.debt_total` al insertar/actualizar/delete

### 1.5 Datos Iniciales
- [1] Insertar registro en `bank_config` con datos bancarios de prueba
- [1] Insertar settings iniciales (horario recordatorios 8-20, timezone default)
- [1] Crear usuario admin de prueba en Supabase Auth

---

## FASE 2: EDGE FUNCTIONS - BACKEND

### 2.1 Setup Edge Functions
- [1] Instalar Supabase CLI globally
- [1] Ejecutar `supabase init` en el proyecto
- [1] Ejecutar `supabase login`
- [1] Ejecutar `supabase link --project-ref <ref>`
- [1] Crear estructura de funciones:
  ```
  supabase/functions/
  ├── whatsapp-webhook/
  ├── whatsapp-send/
  ├── process-receipt/
  ├── send-reminders/
  └── admin-notify/
  ```

### 2.2 Función: `whatsapp-webhook`
- [1] Crear endpoint POST para recibir webhooks de Meta
- [1] Implementar verificación de firma del webhook (HMAC SHA-256)
- [1] Implementar handling del payload de verificación GET (hub.mode, hub.challenge)
- [1] Parsear mensajes entrantes (texto, imagen, documento, interactivo)
- [1] Identificar remitente por número de teléfono
- [1] Buscar o crear `conversation` activa para el teléfono
- [1] Guardar mensaje entrante en tabla `messages`
- [1] Ejecutar máquina de estados según `conversation.state`
- [1] Responder con 200 OK inmediatamente (no bloquear)

### 2.3 Función: `whatsapp-send`
- [1] Crear helper para enviar mensajes de texto
- [1] Crear helper para enviar botones interactivos (Reply Buttons)
- [1] Crear helper para enviar List Messages (menú de opciones)
- [1] Crear helper para enviar imágenes/documentos
- [1] Implementar manejo de errores de la API de Meta
- [1] Implementar retry logic con backoff exponencial
- [1] Guardar mensaje enviado en tabla `messages` con status 'sent'
- [1] Actualizar status del mensaje cuando llegue webhook de delivery/read

### 2.4 Función: `process-receipt`
- [1] Recibir payload con URL del archivo multimedia de WhatsApp
- [1] Descargar archivo desde Media URL de WhatsApp API
- [1] Determinar tipo de archivo (imagen, pdf, screenshot)
- [1] Subir archivo a Supabase Storage bucket `receipts`
- [1] Crear registro en tabla `receipts` con file_url y metadata
- [1] Actualizar estado de conversación a 'receipt_received'
- [1] Enviar confirmación al usuario
- [1] Notificar al admin (trigger para panel o email)

### 2.5 Función: `send-reminders`
- [1] Consultar `reminders` con status = 'pending' y `scheduled_at` <= NOW()
- [1] Para cada reminder, obtener datos del cliente
- [1] Calcular hora local del cliente según su timezone
- [1] Validar que hora local está entre 8:00 y 20:00
- [1] Si en horario: enviar mensaje de recordatorio via `whatsapp-send`
- [1] Si fuera de horario: reprogramar para mañana a las 8:00 AM
- [1] Actualizar status del reminder a 'sent' o 'rescheduled'
- [1] Manejar errores y marcar como 'failed' después de 3 intentos

### 2.6 Función: `admin-notify`
- [1] Crear endpoint para obtener notificaciones del panel
- [1] Contar comprobantes pendientes de revisión
- [1] Retornar badges/contadores para el dashboard

### 2.7 Cron Jobs (pg_cron)
- [1] Crear cron job para `send-reminders` cada 15 minutos
- [1] Verificar formato de expresión cron correcto
- [1] Testear ejecución manual del cron

---

## FASE 3: CHATBOT - FLUJO WHATSAPP

### 3.1 Máquina de Estados
- [1] Definir estados posibles:
  - `menu` — Menú principal
  - `viewing_debt` — Consultando deuda
  - `awaiting_payment` — Esperando comprobante
  - `sent_bank_details` — Datos bancarios enviados
  - `human_agent` — Transferido a agente
- [1] Crear función `get_conversation_state(phone)`
- [1] Crear función `update_conversation_state(phone, newState, context)`
- [1] Crear función `reset_conversation(phone)` para volver al menú

### 3.2 Estado: Menú Principal
- [1] Detectar mensaje de inicio ("hola", "menu", inicio de conversación)
- [1] Enviar mensaje de bienvenida con nombre del cliente
- [1] Enviar botones interactivos:
  ```
  [Ver mi deuda] [Realizar pago] [Hablar con asesor]
  ```
- [1] Manejar respuesta del usuario según botón seleccionado

### 3.3 Estado: Ver Deuda
- [1] Obtener deudas pendientes del cliente desde BD
- [1] Si no tiene deudas: responder "No tienes deudas pendientes"
- [1] Si tiene deudas, formatear mensaje con detalle y total
- [1] Enviar botón adicional: [Realizar pago] [Volver al menú]
- [1] Actualizar estado a 'viewing_debt'

### 3.4 Estado: Realizar Pago
- [1] Obtener datos bancarios activos desde `bank_config`
- [1] Enviar mensaje con datos bancarios (CBU, alias, titular, monto)
- [1] Actualizar estado a 'sent_bank_details'
- [1] Esperar siguiente mensaje del usuario

### 3.5 Estado: Recibir Comprobante
- [1] Detectar si el mensaje contiene imagen, documento o multimedia
- [1] Llamar a función `process-receipt` para guardar el archivo
- [1] Confirmar al usuario: "Recibimos tu comprobante. Lo revisaremos."
- [1] Enviar botón: [Volver al menú] [Hablar con asesor]
- [1] Actualizar estado a 'receipt_received'

### 3.6 Estado: Hablar con Asesor
- [1] Enviar mensaje: "Un asesor se comunicará contigo pronto."
- [1] Actualizar estado a 'human_agent'

### 3.7 Manejo de Errores
- [1] Si usuario envía texto no válido: reenviar menú con opciones
- [1] Si API de WhatsApp falla: log error y reintentar una vez
- [1] Si usuario no responde en 24h: resetear conversación a 'menu'
- [1] Si usuario envía comprobante fuera del flujo: indicar "Escribí 'menu'"

### 3.8 Restricción de Horario
- [1] Implementar función `isWithinBusinessHours(timezone)` (8:00-20:00)
- [1] Integrar en `send-reminders` antes de enviar cada mensaje
- [1] Soportar timezone de clientes (Argentina, Chile, etc.)

---

## FASE 4: PANEL DE CONTROL - REACT

### 4.1 Autenticación
- [1] Crear página de Login (`/login`)
- [1] Implementar formulario con email + password
- [1] Integrar `supabase.auth.signInWithPassword()`
- [1] Crear Protected Route wrapper
- [1] Implementar logout
- [1] Guardar sesión en localStorage
- [1] Redirigir a dashboard si ya está autenticado

### 4.2 Layout del Panel
- [1] Crear componente `Layout` con sidebar y área de contenido
- [1] Diseñar sidebar minimalista (Apple HIG):
  ```
  ┌─────────────┐
  │ Inicio      │
  │ Clientes    │
  │ Cobros      │
  │ Comprobantes│
  │ Config      │
  └─────────────┘
  ```
- [1] Header con avatar del usuario y botón logout
- [1] Diseño responsive (colapsar sidebar en mobile)

### 4.3 Dashboard
- [1] Crear página Dashboard (`/`)
- [1] Tarjetas KPI (4 columnas desktop, 2 mobile):
  - [1] Total Recaudado
  - [1] Tasa de Éxito (porcentaje)
  - [1] Clientes al Día
  - [1] Pendientes Revisión (badge)
- [1] Gráfico Aging de Vencimiento (Bar Chart):
  - Eje X: rangos (0-30, 31-60, 61-90, 90+ días)
  - Eje Y: cantidad de deudas o monto
- [1] Gráfico Recaudación Mensual (Line Chart):
  - Últimos 6 meses, monto recaudado por mes
- [1] Gráfico Distribución por Estado (Donut Chart):
  - Pendiente / Pagado / Vencido
- [1] Tabla de "Últimas Actividades"
- [1] Obtener datos desde Supabase con queries optimizadas

### 4.4 Gestión de Clientes
- [1] Crear página Clientes (`/clients`)
- [1] Tabla con columnas: Nombre, Teléfono, Deuda Total, Estado, Último Contacto, Acciones
- [1] Búsqueda por nombre o teléfono
- [1] Filtros por estado
- [1] Modal/página de Crear Cliente (nombre, teléfono, email)
- [1] Modal/página de Editar Cliente
- [1] Vista de detalle de Cliente:
  - [1] Datos personales
  - [1] Lista de deudas
  - [1] Historial de conversación WhatsApp
  - [1] Comprobantes enviados
- [1] Paginación

### 4.5 Gestión de Deudas
- [1] Crear página Cobros (`/debts`)
- [1] Vista de lista de todas las deudas
- [1] Filtros: cliente, estado, rango de fechas, rango de montos
- [1] Formulario de Nueva Deuda:
  - Seleccionar cliente (autocomplete)
  - Descripción, monto, fecha de vencimiento
- [1] Carga masiva CSV/Excel:
  - [1] Botón "Cargar archivo"
  - [1] Componente para subir archivo
  - [1] Parsear CSV (`papaparse`) o Excel (`xlsx`)
  - [1] Validar columnas requeridas
  - [1] Preview de datos antes de importar
  - [1] Confirmar importación
  - [1] Crear deudas en batch
  - [1] Mostrar resultado: X creadas, Y errores
- [1] Acción para marcar deuda como pagada
- [1] Acción para eliminar deuda

### 4.6 Revisión de Comprobantes
- [1] Crear página Comprobantes (`/receipts`)
- [1] Tabla con filtros: estado, cliente, fecha
- [1] Vista de detalle del comprobante:
  - [1] Preview de imagen/PDF
  - [1] Datos del cliente y deuda asociada
  - [1] Fecha de envío
- [1] Botones de acción:
  - [1] Aprobar → status 'approved', marcar deuda como pagada
  - [1] Rechazar → status 'rejected', agregar notas
  - [1] Pedir aclaración → enviar mensaje WhatsApp al cliente
- [1] Contador de pendientes en sidebar/badge

### 4.7 Configuración
- [1] Crear página Configuración (`/settings`)
- [1] Sección: Datos Bancarios
  - [1] Lista de cuentas bancarias configuradas
  - [1] Formulario agregar/editar cuenta
  - [1] Toggle activar/desactivar
- [1] Sección: Recordatorios
  - [1] Configurar horario envío (hora inicio, hora fin)
  - [1] Configurar timezone
  - [1] Configurar frecuencia
- [1] Sección: Mensajes del Bot
  - [1] Editar textos de bienvenida
  - [1] Editar textos de recordatorio
  - [1] Editar textos de confirmación
- [1] Sección: Mi Cuenta
  - [1] Cambiar contraseña
  - [1] Actualizar email

---

## FASE 5: INTEGRACIONES

### 5.1 Conexión Frontend ↔ Supabase
- [1] Crear archivo `lib/supabase.ts` con cliente Supabase
- [1] Crear hooks personalizados:
  - [1] `useClients()` — obtener lista de clientes
  - [1] `useClient(id)` — obtener cliente específico
  - [1] `useDebts(filters)` — obtener deudas con filtros
  - [1] `useReceipts(filters)` — obtener comprobantes
  - [1] `useDashboardStats()` — obtener métricas del dashboard
- [1] Implementar real-time subscriptions (opcional):
  - [1] Escuchar nuevos comprobantes recibidos
  - [1] Actualizar dashboard en tiempo real

### 5.2 Webhook Verification
- [1] Configurar endpoint de verificación en Meta Dashboard
- [1] Implementar lógica de verificación GET:
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
- [1] Implementar verificación HMAC SHA-256
- [1] Obtener `APP_SECRET` de Meta Dashboard
- [1] Validar header `x-hub-signature-256`
- [1] Rechazar webhooks con firma inválida

### 5.4 Gestión de Archivos Multimedia
- [1] Crear bucket `receipts` en Supabase Storage
- [1] Configurar políticas de acceso al bucket
- [1] Implementar descarga de media desde WhatsApp API:
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
- [1] Configurar testing framework (Vitest o Jest)
- [1] Testear funciones helper de WhatsApp:
  - [1] Formateo de mensajes
  - [1] Validación de estados
  - [1] Cálculo de deudas
- [1] Testear validación de horario (8AM-8PM)
- [1] Testear parseo de CSV/Excel

### 6.2 Tests de Integración
- [1] Test flujo completo: crear cliente → crear deuda → simular conversación
- [1] Test webhook: simular payload de Meta y verificar guardado
- [1] Test receipt: simular envío de imagen y verificar storage

### 6.3 Tests Manuales
- [1] Enviar mensaje de prueba desde WhatsApp
- [1] Verificar recepción del webhook en Supabase
- [1] Verificar guardado del mensaje en BD
- [1] Verificar envío de respuesta con botones
- [1] Enviar comprobante (imagen) y verificar storage
- [1] Verificar notificación en panel de comprobante pendiente
- [1] Testear recordatorio en horario permitido
- [1] Testear recordatorio fuera de horario

### 6.4 Pruebas de Carga
- [1] Simular múltiples clientes simultáneos
- [1] Verificar no haya race conditions
- [1] Verificar límites de rate limiting de Meta API

---

## FASE 7: DEPLOY Y PRODUCCIÓN

### 7.1 Supabase Production
- [1] Verificar todas las migraciones aplicadas
- [1] Verificar RLS habilitado en todas las tablas
- [1] Verificar cron jobs activos
- [1] Configurar backups automáticos
- [1] Revisar logs de Edge Functions

### 7.2 Frontend Deploy
- [1] Build de producción: `npm run build`
- [1] Deploy en Vercel o Netlify
- [1] Configurar dominio personalizado (opcional)
- [1] Verificar variables de entorno en plataforma de deploy
- [1] Verificar SSL activo

### 7.3 Meta Production
- [x] Cambiar de número de prueba a producción
- [x] Verificar webhook URL apunta a producción
- [x] Verificar access token es de producción
- [x] Enviar solicitud de verificación de negocio
- [x] Configurar mensaje de bienvenida de WhatsApp Business

### 7.4 Monitoreo
- [x] Configurar alertas de error en Supabase
- [x] Revisar métricas de uso de Edge Functions
- [x] Monitorear costo de Meta Cloud API
- [x] Configurar logging estructurado

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