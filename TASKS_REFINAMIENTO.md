# CHARLÓ — Refinamiento y Corrección de Errores

> Fase 8 del proyecto. Tareas de pulido, corrección de bugs y mejora de UX.

---

## 1. Gráfica de Recaudación Mensual

**Problema:** La gráfica no muestra datos. Causas identificadas:

- La consulta busca en la tabla `receipts` con `status='approved'`, pero no hay comprobantes aprobados en la base de datos.
- El cálculo de fechas tiene un bug de timezone: las fechas se convierten a UTC con `.toISOString()`, lo que puede mover el límite del mes un día.
- El último día del mes se calcula como `new Date(year, month+1, 0)` a medianoche, excluyendo registros creados después de las 00:00.

**Tareas:**

- [1] Corregir `fetchMonthlyCollections()` en `hooks/useDashboard.ts` para usar fechas correctas con timezone.
- [1] Si no hay receipts aprobados, usar la tabla `debts` con `status='paid'` como fuente alternativa.
- [1] Agregar datos de prueba de receipts aprobados en `seed-test-data.sql`.
- [1] Verificar que la gráfica muestra datos reales después de la corrección.

**Archivos:** `hooks/useDashboard.ts`

---

## 2. Diseño de Gráficas

**Problema:** Las gráficas funcionan pero tienen problemas visuales y de contenido:

- `AgingChart`: título usa la palabra en inglés "Aging" → cambiar a "Antigüedad de Vencimiento".
- `MonthlyChart`: gradiente definido pero nunca usado (código muerto).
- Faltan acentos en títulos: "Recaudacion" → "Recaudación", "Distribucion" → "Distribución", "Exito" → "Éxito", "Dia" → "Día", "Revision" → "Revisión".
- Los tooltips muestran datos crudos, no formateados amigablemente.

**Tareas:**

- [1] Renombrar "Aging de Vencimiento" → "Antigüedad de Deudas" en `AgingChart.tsx`.
- [1] Aplicar gradiente al `Line` en `MonthlyChart.tsx` o eliminar el gradiente no usado.
- [1] Corregir todos los acentos faltantes en títulos de gráficas y KPIs.
- [1] Mejorar tooltips: formato de moneda, fechas legibles, sin datos crudos.
- [1] Añadir subtítulos descriptivos a cada gráfica.
- [1] Evaluar si las gráficas necesitan más contraste visual o colores más suaves.

**Archivos:** `components/dashboard/AgingChart.tsx`, `MonthlyChart.tsx`, `DistributionChart.tsx`, `KpiCards.tsx`

---

## 3. Pantalla de Login

**Problema:** El diseño actual es funcional pero no se ve profesional ni limpio. El logo es un SVG genérico de rayo.

**Tareas:**

- [ ] Rediseñar la página de login con un layout más limpio y profesional.
- [ ] Crear un logo SVG personalizado para Charló (no el rayo genérico).
- [ ] Eliminar los stats genéricos del panel izquierdo ("100+ Clients", "95% Success") — no son reales.
- [ ] Mejorar la paleta de colores del panel izquierdo (gradiente más sutil).
- [ ] Asegurar que el formulario sea accesible y tenga buen contraste.
- [ ] Verificar responsive en móvil.

**Archivos:** `pages/Login.tsx`, `public/favicon.svg`

---

## 4. Flujo de Recordatorios de Pago

**Problema actual:** El sistema de recordatorios existe (`send-reminders` Edge Function) pero solo envía un mensaje genérico. No hay lógica para:

- Recordar 3 días antes del vencimiento.
- Recordar 1 día antes.
- Recordar el día de vencimiento.
- Seguir contactando después del vencimiento hasta que pague.
- Personalizar los mensajes.

**Tareas:**

- [ ] Crear función/migración que genere automáticamente records en la tabla `reminders` cuando se crea una deuda:
  - 3 días antes de `due_date` → "Tu pago vence en 3 días"
  - 1 día antes → "Tu pago vence mañana"
  - Día de vencimiento → "Tu pago vence hoy"
  - Después de vencimiento → repetir cada 2 días con mensaje de "pago vencido"
- [ ] Modificar `send-reminders/index.ts` para usar mensajes diferenciados según el tipo de recordatorio.
- [ ] Crear mensajes personalizables en la tabla `settings` para cada tipo de recordatorio:
  - `reminder_3_days`
  - `reminder_1_day`
  - `reminder_due_today`
  - `reminder_overdue`
- [ ] Actualizar `BotMessagesSection.tsx` en Settings para editar estos mensajes.
- [ ] Limitar el número máximo de recordatorios post-vencimiento (configurable).
- [ ] Cuando el cliente pague (comprobante aprobado), cancelar los recordatorios pendientes de esa deuda.

**Archivos:** `supabase/functions/send-reminders/index.ts`, `hooks/useSettings.ts`, `components/settings/BotMessagesSection.tsx`, migración SQL nueva

---

## 5. Página de Conversaciones (Réplica de WhatsApp Web)

**Problema:** La página actual tiene problemas de diseño. El layout se rompe en ciertas resoluciones. No se ve como WhatsApp Web.

**Tareas:**

- [ ] Rediseñar la página completamente como réplica de WhatsApp Web:
  - Panel izquierdo: barra de búsqueda arriba, lista de chats con avatar circular, nombre, último mensaje, hora, badge de estado.
  - Panel derecho: header con avatar + nombre + estado, área de mensajes con burbujas estilo WhatsApp (colas de burbuja), barra de input abajo.
  - Fondo del chat: color verde claro sutil o pattern de WhatsApp.
- [ ] Corregir el bug de `border-3` en `ConversationList.tsx` (no es clase Tailwind válida).
- [ ] Hacer que el input se habilite cuando el asesor toma el chat (modo `human_agent`).
- [ ] Mostrar indicador claro de "Modo asesor activo" cuando el bot está pausado.
- [ ] Añadir botón "Devolver al bot" para reanudar el flujo automático.
- [ ] Corregir el cálculo de altura del chat (`h-[calc(100vh-8rem)]` puede fallar).
- [ ] Asegurar que el scroll automático funcione correctamente.
- [ ] Verificar responsive: en móvil debe mostrarse solo la lista o solo el chat, no ambos.

**Archivos:** `pages/Conversations.tsx`, `components/conversations/ChatPanel.tsx`, `ConversationList.tsx`, `ChatBubble.tsx`, `MessageInput.tsx`

---

## 6. Registro de Cobros y Clientes

**Problema:** No se pueden registrar cobros (deudas) ni clientes desde el panel.

**Tareas:**

- [ ] Verificar que `ClientModal.tsx` envía correctamente los datos al crear un cliente.
- [ ] Verificar que el campo `timezone` del formulario existe en la tabla `clients` de producción (no existe — columna eliminada en producción).
- [ ] Ajustar `ClientModal.tsx` para que no envíe `timezone` si la columna no existe.
- [ ] Verificar que `DebtModal.tsx` crea deudas correctamente.
- [ ] Verificar que el hook `useClients.ts` → `createClient()` no falla por campos inexistentes.
- [ ] Verificar que el hook `useDebts.ts` → `createDebt()` funciona.
- [ ] Probar el flujo completo: crear cliente → crear deuda → verificar en BD.
- [ ] Si el problema es RLS, ajustar las políticas para permitir INSERT desde el panel autenticado.

**Archivos:** `components/clients/ClientModal.tsx`, `components/debts/DebtModal.tsx`, `hooks/useClients.ts`, `hooks/useDebts.ts`

---

## 7. Mejora General de Diseño de Interfaz

**Problema:** La interfaz se ve vacía, incompleta y poco profesional.

**Tareas generales:**

- [ ] Eliminar todos los emojis de la interfaz (no usar emojis en ningún componente).
- [ ] Revisar y mejorar el espaciado de todas las páginas (padding, margins, gaps).
- [ ] Añadir estados vacíos útiles con íconos de lucide-react (no emojis).
- [ ] Mejorar las tarjetas de KPIs con iconografía más expresiva.
- [ ] Revisar que todos los botones tengan estados hover/active/disabled consistentes.
- [ ] Asegurar que las tablas tengan filas alternas o hover states para mejor legibilidad.
- [ ] Revisar el contraste de colores en todos los textos secundarios (muchos son `text-gray-400` que puede ser muy claro).
- [ ] Añadir separadores visuales entre secciones donde sea necesario.
- [ ] Revisar que los modales tengan el mismo estilo visual en todas las páginas.
- [ ] Verificar que el sidebar no se superponga mal en resoluciones intermedias (tablet).

**Archivos:** Todos los componentes de UI.

---

## 8. Dashboard: Lenguaje y UX

**Problema:** El dashboard usa términos técnicos, palabras en inglés y lenguaje no amigable para el usuario final.

**Tareas:**

- [ ] Revisar todos los textos del dashboard y reemplazar términos técnicos:
  - "Aging de Vencimiento" → "Antigüedad de Deudas"
  - "Tasa de Exito" → "Tasa de Cobro"
  - "Clientes al Dia" → "Clientes al Corriente"
  - "Pendientes Revision" → "Pendientes de Revisión"
  - "Distribucion por Estado" → "Estado de Cobros"
  - "Actividad Reciente" → "Últimas Actividades"
  - "Ultimos registros del sistema" → "Últimos movimientos"
- [ ] Revisar que ningún texto muestre IDs de base de datos, UUIDs o nombres de tablas.
- [ ] Asegurar que todos los montos se formateen como moneda mexicana ($XX,XXX.XX).
- [ ] Revisar que las fechas se formateen de forma legible ("Hace 5 min", "Hoy", "Ayer").
- [ ] Verificar que los tooltips de las gráficas sean claros y en español correcto.
- [ ] Revisar la tabla de actividad reciente: los textos deben ser descriptivos y amigables.
- [ ] Eliminar la palabra "dashboard" de cualquier texto visible al usuario.

**Archivos:** `pages/Dashboard.tsx`, `components/dashboard/*.tsx`, `hooks/useDashboard.ts`

---

## Prioridad de Ejecución

| # | Tarea | Prioridad | Dependencias |
|---|-------|-----------|--------------|
| 6 | Registro de cobros y clientes | Alta | Ninguna |
| 5 | Conversaciones (WhatsApp Web) | Alta | Ninguna |
| 8 | Dashboard lenguaje y UX | Alta | Ninguna |
| 1 | Gráfica recaudación mensual | Alta | Ninguna |
| 4 | Flujo de recordatorios | Alta | Migración SQL |
| 7 | Mejora general de diseño | Media | Todas las anteriores |
| 2 | Diseño de gráficas | Media | #1 |
| 3 | Pantalla de login | Baja | Ninguna |
