-- Migration: Enhanced Reminder System
-- Adds reminder_type column, auto-generate trigger, and overdue reminder generation

-- 1. Add reminder_type column to reminders table
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS reminder_type VARCHAR(20) DEFAULT 'due_today'
CHECK (reminder_type IN ('3_days', '1_day', 'due_today', 'overdue'));

-- Update existing reminders to have a type
UPDATE public.reminders SET reminder_type = 'due_today' WHERE reminder_type IS NULL OR reminder_type = 'due_today';

-- Add overdue_index for tracking post-due reminder count
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS overdue_index INTEGER DEFAULT 0;

-- 2. Create function to auto-generate reminders when a debt is created
CREATE OR REPLACE FUNCTION public.generate_debt_reminders()
RETURNS TRIGGER AS $$
DECLARE
  reminder_date TIMESTAMPTZ;
  reminder_config JSONB;
  max_overdue_reminders INTEGER := 5;
  overdue_interval_days INTEGER := 2;
  i INTEGER;
BEGIN
  -- Get reminder config from settings (default values if not set)
  reminder_config := '{"max_overdue_reminders": 5, "overdue_interval_days": 2}'::JSONB;
  
  SELECT value::JSONB INTO reminder_config
  FROM public.settings
  WHERE key = 'reminder_config'
  LIMIT 1;

  IF reminder_config IS NULL THEN
    reminder_config := '{"max_overdue_reminders": 5, "overdue_interval_days": 2}'::JSONB;
  END IF;

  max_overdue_reminders := COALESCE((reminder_config->>'max_overdue_reminders')::INT, 5);
  overdue_interval_days := COALESCE((reminder_config->>'overdue_interval_days')::INT, 2);

  -- Only create reminders for active debts
  IF NEW.status = 'active' OR NEW.status = 'pending' THEN
    -- Create 3-day reminder (3 days before due_date at 8 AM Mexico City)
    reminder_date := (NEW.due_date - INTERVAL '3 days')::TIMESTAMPTZ;
    reminder_date := reminder_date + INTERVAL '8 hours';
    reminder_date := reminder_date AT TIME ZONE 'America/Mexico_City';
    reminder_date := reminder_date AT TIME ZONE 'UTC';

    INSERT INTO public.reminders (client_id, debt_id, reminder_type, scheduled_at, status)
    VALUES (
      NEW.client_id,
      NEW.id,
      '3_days',
      reminder_date,
      CASE WHEN reminder_date > now() THEN 'pending' ELSE 'pending' END
    );

    -- Create 1-day reminder
    reminder_date := (NEW.due_date - INTERVAL '1 day')::TIMESTAMPTZ;
    reminder_date := reminder_date + INTERVAL '8 hours';
    reminder_date := reminder_date AT TIME ZONE 'America/Mexico_City';
    reminder_date := reminder_date AT TIME ZONE 'UTC';

    INSERT INTO public.reminders (client_id, debt_id, reminder_type, scheduled_at, status)
    VALUES (
      NEW.client_id,
      NEW.id,
      '1_day',
      reminder_date,
      'pending'
    );

    -- Create due_today reminder (at 8 AM on due_date)
    reminder_date := NEW.due_date::TIMESTAMPTZ + INTERVAL '8 hours';
    reminder_date := reminder_date AT TIME ZONE 'America/Mexico_City';
    reminder_date := reminder_date AT TIME ZONE 'UTC';

    INSERT INTO public.reminders (client_id, debt_id, reminder_type, scheduled_at, status)
    VALUES (
      NEW.client_id,
      NEW.id,
      'due_today',
      reminder_date,
      'pending'
    );

    -- Create initial overdue reminder (1 day after due_date)
    reminder_date := (NEW.due_date + INTERVAL '1 day')::TIMESTAMPTZ;
    reminder_date := reminder_date + INTERVAL '8 hours';
    reminder_date := reminder_date AT TIME ZONE 'America/Mexico_City';
    reminder_date := reminder_date AT TIME ZONE 'UTC';

    INSERT INTO public.reminders (client_id, debt_id, reminder_type, scheduled_at, status, overdue_index)
    VALUES (
      NEW.client_id,
      NEW.id,
      'overdue',
      reminder_date,
      'pending',
      1
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger to auto-generate reminders on debt insert
DROP TRIGGER IF EXISTS trg_generate_debt_reminders ON public.debts;
CREATE TRIGGER trg_generate_debt_reminders
  AFTER INSERT ON public.debts
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_debt_reminders();

-- 4. Create function to generate additional overdue reminders (called by pg_cron or edge function)
CREATE OR REPLACE FUNCTION public.generate_overdue_reminders()
RETURNS void AS $$
DECLARE
  reminder_config JSONB;
  max_overdue_reminders INTEGER := 5;
  overdue_interval_days INTEGER := 2;
  pending_debt RECORD;
  last_overdue_reminder RECORD;
  next_reminder_date TIMESTAMPTZ;
  new_overdue_index INTEGER;
BEGIN
  -- Get reminder config
  SELECT value::JSONB INTO reminder_config
  FROM public.settings
  WHERE key = 'reminder_config'
  LIMIT 1;

  IF reminder_config IS NULL THEN
    reminder_config := '{"max_overdue_reminders": 5, "overdue_interval_days": 2}'::JSONB;
  END IF;

  max_overdue_reminders := COALESCE((reminder_config->>'max_overdue_reminders')::INT, 5);
  overdue_interval_days := COALESCE((reminder_config->>'overdue_interval_days')::INT, 2);

  -- Find debts that need overdue reminders generated
  FOR pending_debt IN
    SELECT d.id, d.client_id, d.due_date
    FROM public.debts d
    WHERE d.status IN ('active', 'pending')
    AND d.due_date < now()::DATE
    AND NOT EXISTS (
      SELECT 1 FROM public.reminders r
      WHERE r.debt_id = d.id
      AND r.reminder_type = 'overdue'
      AND r.status IN ('sent', 'pending')
    )
  LOOP
    -- Find the last overdue reminder for this debt
    SELECT r.scheduled_at, r.overdue_index INTO last_overdue_reminder
    FROM public.reminders r
    WHERE r.debt_id = pending_debt.id AND r.reminder_type = 'overdue'
    ORDER BY r.overdue_index DESC
    LIMIT 1;

    IF last_overdue_reminder IS NOT NULL THEN
      -- Check if we can generate more
      IF last_overdue_reminder.overdue_index < max_overdue_reminders THEN
        -- Calculate next reminder date (overdue_interval_days after last)
        next_reminder_date := last_overdue_reminder.scheduled_at + (overdue_interval_days || ' days')::INTERVAL;
        next_reminder_date := next_reminder_date + INTERVAL '8 hours';
        next_reminder_date := next_reminder_date AT TIME ZONE 'America/Mexico_City';
        next_reminder_date := next_reminder_date AT TIME ZONE 'UTC';

        new_overdue_index := last_overdue_reminder.overdue_index + 1;

        INSERT INTO public.reminders (client_id, debt_id, reminder_type, scheduled_at, status, overdue_index)
        VALUES (
          pending_debt.client_id,
          pending_debt.id,
          'overdue',
          next_reminder_date,
          'pending',
          new_overdue_index
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to cancel reminders when debt is paid (called when receipt approved)
CREATE OR REPLACE FUNCTION public.cancel_debt_reminders(p_debt_id UUID)
RETURNS void AS $$
BEGIN
  -- Cancel all pending reminders for this debt
  UPDATE public.reminders
  SET status = 'cancelled'
  WHERE debt_id = p_debt_id
  AND status = 'pending';

  -- Also cancel any future overdue reminders that might be generated
  -- (they won't be created if debt status changes to 'paid')
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to cancel reminders when debt status changes to paid
CREATE OR REPLACE FUNCTION public.handle_debt_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If debt is now paid/cancelled/inactive, cancel pending reminders
  IF NEW.status IN ('paid', 'cancelled', 'inactive') AND OLD.status IN ('active', 'pending') THEN
    PERFORM cancel_debt_reminders(NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_handle_debt_status_change ON public.debts;
CREATE TRIGGER trg_handle_debt_status_change
  AFTER UPDATE ON public.debts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_debt_status_change();

-- 7. Update reminders status check constraint to include 'cancelled'
ALTER TABLE public.reminders DROP CONSTRAINT IF EXISTS reminders_status_check;
ALTER TABLE public.reminders ADD CONSTRAINT reminders_status_check
  CHECK (status IN ('pending', 'sent', 'rescheduled', 'failed', 'cancelled'));

-- 8. Add overdue_reminder_messages to settings (if not exists)
INSERT INTO public.settings (key, value, description)
VALUES ('reminder_messages', '{"3_days": "Tu pago vence en 3 dias. {description} - Monto: ${amount}", "1_day": "Tu pago vence mañana. {description} - Monto: ${amount}", "due_today": "Tu pago vence hoy. {description} - Monto: ${amount}", "overdue": "Tu pago esta vencido. {description} - Monto: ${amount}. Por favor realiza tu pago lo antes posible."}', 'Mensajes personalizados para cada tipo de recordatorio')
ON CONFLICT (key) DO NOTHING;

-- 9. Update reminder_config to include new settings
UPDATE public.settings
SET value = value::JSONB || '{"max_overdue_reminders": 5, "overdue_interval_days": 2}'::JSONB
WHERE key = 'reminder_config'
AND value::JSONB ? 'max_overdue_reminders' = false;

-- 10. Create index on reminder_type for faster lookups
CREATE INDEX IF NOT EXISTS idx_reminders_reminder_type ON public.reminders(reminder_type);
CREATE INDEX IF NOT EXISTS idx_reminders_debt_id ON public.reminders(debt_id);