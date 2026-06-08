-- Charló Database Schema Migration
-- Extracted from production database

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA extensions;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Calculate client debt total on debt changes
CREATE OR REPLACE FUNCTION public.calculate_client_debt_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE clients
  SET debt_total = (
    SELECT COALESCE(SUM(amount), 0)
    FROM debts
    WHERE client_id = COALESCE(NEW.client_id, OLD.client_id)
    AND status = 'pending'
  )
  WHERE id = COALESCE(NEW.client_id, OLD.client_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- ============================================================
-- TABLES
-- ============================================================

-- Clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  phone VARCHAR NOT NULL UNIQUE,
  email VARCHAR,
  debt_total NUMERIC DEFAULT 0,
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'contacted')),
  last_contact_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Debts table
CREATE TABLE IF NOT EXISTS public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  phone VARCHAR NOT NULL,
  state VARCHAR DEFAULT 'menu' CHECK (state IN ('menu', 'viewing_debt', 'awaiting_payment', 'sent_bank_details', 'receipt_received', 'human_agent')),
  context JSONB DEFAULT '{}',
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  direction VARCHAR NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  type VARCHAR NOT NULL CHECK (type IN ('text', 'image', 'document', 'interactive', 'template')),
  content TEXT NOT NULL,
  media_url TEXT,
  status VARCHAR DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Receipts table
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  debt_id UUID REFERENCES debts(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR NOT NULL CHECK (file_type IN ('image', 'pdf', 'document')),
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reminders table
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'rescheduled', 'failed')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bank config table
CREATE TABLE IF NOT EXISTS public.bank_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name VARCHAR NOT NULL,
  account_type VARCHAR CHECK (account_type IN ('savings', 'checking', 'wallet')),
  cbu VARCHAR NOT NULL,
  alias VARCHAR,
  account_holder VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Admin users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR NOT NULL,
  full_name VARCHAR,
  role VARCHAR DEFAULT 'admin' CHECK (role IN ('admin', 'manager', 'agent')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations(phone);
CREATE INDEX IF NOT EXISTS idx_conversations_state ON conversations(state);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_debts_client_id ON debts(client_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
CREATE INDEX IF NOT EXISTS idx_receipts_client_id ON receipts(client_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_at ON reminders(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at on clients
CREATE OR REPLACE TRIGGER set_updated_at_clients
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-update updated_at on debts
CREATE OR REPLACE TRIGGER set_updated_at_debts
  BEFORE UPDATE ON debts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Calculate debt total on debt changes
CREATE OR REPLACE TRIGGER update_client_debt_total
  AFTER INSERT OR UPDATE OR DELETE ON debts
  FOR EACH ROW
  EXECUTE FUNCTION calculate_client_debt_total();

-- ============================================================
-- RLS POLICIES (using TO authenticated instead of auth.role())
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop old policies that use auth.role()
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['clients','debts','conversations','messages','receipts','reminders','bank_config','settings','admin_users'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_all_%s" ON %s', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "service_role_all_%s" ON %s', t, t);
  END LOOP;
END $$;

-- Create new policies with TO authenticated/service_role
-- Clients
CREATE POLICY "authenticated_all_clients" ON clients FOR ALL TO authenticated USING (true);
CREATE POLICY "service_role_all_clients" ON clients FOR ALL TO service_role USING (true);

-- Debts
CREATE POLICY "authenticated_all_debts" ON debts FOR ALL TO authenticated USING (true);
CREATE POLICY "service_role_all_debts" ON debts FOR ALL TO service_role USING (true);

-- Conversations
CREATE POLICY "authenticated_all_conversations" ON conversations FOR ALL TO authenticated USING (true);
CREATE POLICY "service_role_all_conversations" ON conversations FOR ALL TO service_role USING (true);

-- Messages
CREATE POLICY "authenticated_all_messages" ON messages FOR ALL TO authenticated USING (true);
CREATE POLICY "service_role_all_messages" ON messages FOR ALL TO service_role USING (true);

-- Receipts
CREATE POLICY "authenticated_all_receipts" ON receipts FOR ALL TO authenticated USING (true);
CREATE POLICY "service_role_all_receipts" ON receipts FOR ALL TO service_role USING (true);

-- Reminders
CREATE POLICY "authenticated_all_reminders" ON reminders FOR ALL TO authenticated USING (true);
CREATE POLICY "service_role_all_reminders" ON reminders FOR ALL TO service_role USING (true);

-- Bank config
CREATE POLICY "authenticated_all_bank_config" ON bank_config FOR ALL TO authenticated USING (true);
CREATE POLICY "service_role_all_bank_config" ON bank_config FOR ALL TO service_role USING (true);

-- Settings
CREATE POLICY "authenticated_all_settings" ON settings FOR ALL TO authenticated USING (true);
CREATE POLICY "service_role_all_settings" ON settings FOR ALL TO service_role USING (true);

-- Admin users
CREATE POLICY "authenticated_all_admin_users" ON admin_users FOR ALL TO authenticated USING (true);
CREATE POLICY "service_role_all_admin_users" ON admin_users FOR ALL TO service_role USING (true);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default bank config (Banco Azteca)
INSERT INTO bank_config (bank_name, account_type, cbu, alias, account_holder, is_active)
VALUES ('Banco Azteca', 'savings', '5263540165817087', 'Alebrijes Teotihuacan', 'Alebrijes Teotihuacan', true)
ON CONFLICT DO NOTHING;

-- Default settings
INSERT INTO settings (key, value, description) VALUES
  ('business_hours', '{"start": 8, "end": 20, "timezone": "America/Mexico_City"}', 'Horario de atención'),
  ('reminder_interval_minutes', '15', 'Intervalo entre recordatorios'),
  ('max_reminder_attempts', '3', 'Máximo de intentos de recordatorio'),
  ('welcome_message', '"¡Hola! Soy Charló de Alebrijes Teotihuacan. ¿En qué puedo ayudarte?"', 'Mensaje de bienvenida'),
  ('menu_message', '"1️⃣ Ver mis deudas\n2️⃣ Enviar comprobante\n3️⃣ Hablar con un asesor"', 'Menú principal'),
  ('bank_details_message', '"Banco Azteca\nCBU: 5263540165817087\nAlias: Alebrijes Teotihuacan\nTitular: Alebrijes Teotihuacan\n\nPor favor enviar comprobante después del pago."', 'Datos bancarios'),
  ('payment_instructions', '"Para pagar, transferí al CBU que te enviamos y enviá el comprobante aquí."', 'Instrucciones de pago'),
  ('timeout_message', '"Tu sesión ha expirado. Escribí \"menu\" para empezar de nuevo."', 'Mensaje de timeout')
ON CONFLICT (key) DO NOTHING;

-- Default admin user
INSERT INTO admin_users (id, email, full_name, role, is_active)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', 'Admin'), 'admin', true
FROM auth.users
WHERE email = 'charlobusinessoficial@gmail.com'
ON CONFLICT (id) DO NOTHING;
