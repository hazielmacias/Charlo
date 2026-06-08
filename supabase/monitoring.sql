-- ============================================
-- CHARLÓ MONITORING DASHBOARD
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. RESUMEN GENERAL
SELECT 
  (SELECT COUNT(*) FROM clients) as total_clients,
  (SELECT COUNT(*) FROM clients WHERE status = 'active') as active_clients,
  (SELECT COUNT(*) FROM debts WHERE status = 'pending') as pending_debts,
  (SELECT COUNT(*) FROM debts WHERE status = 'overdue') as overdue_debts,
  (SELECT COALESCE(SUM(amount), 0) FROM debts WHERE status = 'pending') as total_pending_amount,
  (SELECT COUNT(*) FROM conversations WHERE state != 'closed') as active_conversations,
  (SELECT COUNT(*) FROM receipts WHERE status = 'pending') as pending_receipts,
  (SELECT COUNT(*) FROM reminders WHERE status = 'pending') as pending_reminders;

-- 2. ACTIVIDAD RECIENTE (últimas 24h)
SELECT 
  (SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL '24 hours') as messages_24h,
  (SELECT COUNT(*) FROM conversations WHERE created_at > NOW() - INTERVAL '24 hours') as new_conversations_24h,
  (SELECT COUNT(*) FROM receipts WHERE created_at > NOW() - INTERVAL '24 hours') as receipts_24h,
  (SELECT COUNT(*) FROM reminders WHERE created_at > NOW() - INTERVAL '24 hours') as reminders_created_24h;

-- 3. ERRORES RECIENTES
SELECT 
  'messages' as table_name,
  COUNT(*) as error_count
FROM messages 
WHERE status = 'failed' 
AND created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
  'reminders' as table_name,
  COUNT(*) as error_count
FROM reminders 
WHERE status = 'failed' 
AND created_at > NOW() - INTERVAL '24 hours';

-- 4. CONVERSACIONES POR ESTADO
SELECT 
  state,
  COUNT(*) as count,
  MAX(last_message_at) as last_activity
FROM conversations 
WHERE state != 'closed'
GROUP BY state
ORDER BY count DESC;

-- 5. DEUDAS POR STATUS
SELECT 
  status,
  COUNT(*) as count,
  COALESCE(SUM(amount), 0) as total_amount,
  MIN(due_date) as oldest_due,
  MAX(due_date) as newest_due
FROM debts
GROUP BY status
ORDER BY total_amount DESC;

-- 6. MÉTRICAS DE REMINDERS
SELECT 
  status,
  COUNT(*) as count,
  AVG(attempts) as avg_attempts,
  MAX(attempts) as max_attempts
FROM reminders
GROUP BY status;

-- 7. TOP CLIENTES CON MÁS DEUDAS
SELECT 
  c.name,
  c.phone,
  c.debt_total,
  COUNT(d.id) as debt_count,
  MAX(d.due_date) as latest_due
FROM clients c
JOIN debts d ON c.id = d.client_id
WHERE d.status = 'pending'
GROUP BY c.id, c.name, c.phone, c.debt_total
ORDER BY c.debt_total DESC
LIMIT 10;

-- 8. COMPROBANTES PENDIENTES DE REVISIÓN
SELECT 
  r.id,
  c.name as client_name,
  c.phone,
  r.file_type,
  r.created_at,
  EXTRACT(EPOCH FROM (NOW() - r.created_at))/3600 as hours_waiting
FROM receipts r
JOIN clients c ON r.client_id = c.id
WHERE r.status = 'pending'
ORDER BY r.created_at ASC;

-- 9. CRON JOB STATUS
SELECT 
  jobname,
  schedule,
  active,
  (SELECT COUNT(*) FROM cron.job_run_details WHERE jobid = j.jobid AND status = 'succeeded') as successful_runs,
  (SELECT COUNT(*) FROM cron.job_run_details WHERE jobid = j.jobid AND status = 'failed') as failed_runs,
  (SELECT MAX(start_time) FROM cron.job_run_details WHERE jobid = j.jobid) as last_run
FROM cron.job j;
