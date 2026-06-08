-- ============================================
-- CHARLÓ TEST DATA
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. CLIENTS
INSERT INTO clients (id, name, phone, email, debt_total, status, created_at, updated_at) VALUES
('c0000000-0000-0000-0000-000000000001', 'Juan Pérez García', '5215551234567', 'juan.perez@email.com', 15000.00, 'active', NOW() - INTERVAL '30 days', NOW()),
('c0000000-0000-0000-0000-000000000002', 'María López Hernández', '5215559876543', 'maria.lopez@email.com', 8500.00, 'active', NOW() - INTERVAL '25 days', NOW()),
('c0000000-0000-0000-0000-000000000003', 'Carlos Rodríguez Martínez', '5215551112223', 'carlos.rod@email.com', 22000.00, 'active', NOW() - INTERVAL '20 days', NOW()),
('c0000000-0000-0000-0000-000000000004', 'Ana Martínez Sánchez', '5215554445556', 'ana.mtz@email.com', 5000.00, 'active', NOW() - INTERVAL '15 days', NOW()),
('c0000000-0000-0000-0000-000000000005', 'Roberto Díaz Ramírez', '5215557778889', 'roberto.diaz@email.com', 35000.00, 'active', NOW() - INTERVAL '10 days', NOW()),
('c0000000-0000-0000-0000-000000000006', 'Laura Fernández Gómez', '5215553334445', 'laura.fe@email.com', 12000.00, 'active', NOW() - INTERVAL '8 days', NOW()),
('c0000000-0000-0000-0000-000000000007', 'Miguel Ángel Torres', '5215556667778', 'miguel.torres@email.com', 0.00, 'inactive', NOW() - INTERVAL '45 days', NOW()),
('c0000000-0000-0000-0000-000000000008', 'Patricia Ruiz Flores', '5215559990001', 'paty.ruiz@email.com', 18000.00, 'active', NOW() - INTERVAL '5 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. DEBTS
INSERT INTO debts (id, client_id, description, amount, status, due_date, created_at, updated_at) VALUES
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Servicio de catering evento', 10000.00, 'pending', '2026-06-15', NOW() - INTERVAL '30 days', NOW()),
('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Decoración floral', 5000.00, 'pending', '2026-06-20', NOW() - INTERVAL '25 days', NOW()),
('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'Alquiler de mesas y sillas', 4500.00, 'overdue', '2026-05-30', NOW() - INTERVAL '40 days', NOW()),
('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'Servicio de barman', 4000.00, 'pending', '2026-06-18', NOW() - INTERVAL '20 days', NOW()),
('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003', 'Paquete completo boda', 15000.00, 'overdue', '2026-05-25', NOW() - INTERVAL '45 days', NOW()),
('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000003', 'Fotografía y video', 7000.00, 'pending', '2026-06-22', NOW() - INTERVAL '15 days', NOW()),
('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000004', 'Servicio de catering', 5000.00, 'paid', '2026-06-10', NOW() - INTERVAL '35 days', NOW()),
('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000005', 'Evento corporativo completo', 25000.00, 'pending', '2026-06-25', NOW() - INTERVAL '10 days', NOW()),
('d0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000005', 'Equipo de sonido', 10000.00, 'overdue', '2026-05-28', NOW() - INTERVAL '42 days', NOW()),
('d0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000006', 'Decoración infantil', 6000.00, 'pending', '2026-06-17', NOW() - INTERVAL '8 days', NOW()),
('d0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000006', 'Piñatas y globos', 3000.00, 'pending', '2026-06-17', NOW() - INTERVAL '8 days', NOW()),
('d0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000006', 'Pastel personalizado', 3000.00, 'pending', '2026-06-17', NOW() - INTERVAL '8 days', NOW()),
('d0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000007', 'Servicio completo', 12000.00, 'paid', '2026-05-20', NOW() - INTERVAL '60 days', NOW()),
('d0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000008', 'Boda completa', 20000.00, 'overdue', '2026-05-20', NOW() - INTERVAL '50 days', NOW()),
('d0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000008', 'Música en vivo', 5000.00, 'pending', '2026-06-30', NOW() - INTERVAL '5 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. CONVERSATIONS
INSERT INTO conversations (id, client_id, phone, state, context, created_at, updated_at, last_message_at) VALUES
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '5215551234567', 'menu', '{}', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '10 minutes'),
('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', '5215559876543', 'viewing_debt', '{"selected_debt_id": "d0000000-0000-0000-0000-000000000003"}', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes'),
('a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', '5215551112223', 'sent_bank_details', '{}', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '3 minutes', NOW() - INTERVAL '3 minutes'),
('a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000005', '5215557778889', 'receipt_received', '{}', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '2 minutes', NOW() - INTERVAL '2 minutes'),
('a0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000006', '5215553334445', 'human_agent', '{}', NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '1 minute', NOW() - INTERVAL '1 minute'),
('a0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000008', '5215559990001', 'menu', '{}', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '20 minutes')
ON CONFLICT (id) DO NOTHING;

-- 4. MESSAGES (inbound status='sent' due to DB constraint)
-- Juan Pérez conversation
INSERT INTO messages (conversation_id, direction, type, content, status, created_at) VALUES
('a0000000-0000-0000-0000-000000000001', 'inbound', 'text', 'Hola', 'sent', NOW() - INTERVAL '2 hours'),
('a0000000-0000-0000-0000-000000000001', 'outbound', 'interactive', 'Hola! Soy Charló, tu asistente de cobranza. ¿En qué puedo ayudarte?', 'sent', NOW() - INTERVAL '2 hours' + INTERVAL '2 seconds'),
('a0000000-0000-0000-0000-000000000001', 'inbound', 'interactive', 'menu_view_debt', 'sent', NOW() - INTERVAL '1 hour 55 minutes'),
('a0000000-0000-0000-0000-000000000001', 'outbound', 'text', 'Tus deudas pendientes son:\n\n1. Servicio de catering evento - $10,000 (vence 15 Jun)\n2. Decoración floral - $5,000 (vence 20 Jun)\n\nTotal: $15,000\n\n¿Qué deseas hacer?', 'sent', NOW() - INTERVAL '1 hour 55 minutes' + INTERVAL '2 seconds'),
('a0000000-0000-0000-0000-000000000001', 'inbound', 'interactive', 'menu_make_payment', 'sent', NOW() - INTERVAL '10 minutes'),
('a0000000-0000-0000-0000-000000000001', 'outbound', 'text', 'Para realizar el pago, depósito a:\n\nBanco: Azteca\nCBU: 5263540165817087\nAlias: Alebrijes Teotihuacan\n\nUna vez realizado, envía tu comprobante.', 'sent', NOW() - INTERVAL '10 minutes' + INTERVAL '2 seconds');

-- María López conversation
INSERT INTO messages (conversation_id, direction, type, content, status, created_at) VALUES
('a0000000-0000-0000-0000-000000000002', 'inbound', 'text', 'Necesito ver mis deudas', 'sent', NOW() - INTERVAL '1 hour'),
('a0000000-0000-0000-0000-000000000002', 'outbound', 'interactive', 'Aquí tienes tus deudas:', 'sent', NOW() - INTERVAL '1 hour' + INTERVAL '2 seconds'),
('a0000000-0000-0000-0000-000000000002', 'inbound', 'interactive', 'debt_details_d0000000-0000-0000-0000-000000000003', 'sent', NOW() - INTERVAL '55 minutes'),
('a0000000-0000-0000-0000-000000000002', 'outbound', 'text', 'Detalle de deuda:\n\nAlquiler de mesas y sillas\nMonto: $4,500\nVencimiento: 30 May 2026\nEstado: Vencida\n\n¿Qué deseas hacer?', 'sent', NOW() - INTERVAL '55 minutes' + INTERVAL '2 seconds');

-- Carlos Rodríguez conversation
INSERT INTO messages (conversation_id, direction, type, content, status, created_at) VALUES
('a0000000-0000-0000-0000-000000000003', 'inbound', 'text', 'Quiero pagar', 'sent', NOW() - INTERVAL '30 minutes'),
('a0000000-0000-0000-0000-000000000003', 'outbound', 'text', 'Perfecto! Para realizar el pago:\n\nBanco: Azteca\nCBU: 5263540165817087\nAlias: Alebrijes Teotihuacan\n\nMonto total: $22,000\n\nEnvía tu comprobante cuando lo realices.', 'sent', NOW() - INTERVAL '30 minutes' + INTERVAL '2 seconds');

-- Roberto Díaz conversation (receipt received)
INSERT INTO messages (conversation_id, direction, type, content, status, created_at) VALUES
('a0000000-0000-0000-0000-000000000004', 'inbound', 'text', 'Ya hice el depósito', 'sent', NOW() - INTERVAL '15 minutes'),
('a0000000-0000-0000-0000-000000000004', 'outbound', 'text', 'Recibido! Por favor envía tu comprobante de pago.', 'sent', NOW() - INTERVAL '15 minutes' + INTERVAL '2 seconds'),
('a0000000-0000-0000-0000-000000000004', 'inbound', 'image', 'comprobante_pago.jpg', 'sent', NOW() - INTERVAL '12 minutes'),
('a0000000-0000-0000-0000-000000000004', 'outbound', 'text', 'Gracias! Hemos recibido tu comprobante. Lo revisaremos y te confirmaremos el pago.', 'sent', NOW() - INTERVAL '12 minutes' + INTERVAL '2 seconds');

-- Laura Fernández conversation (human agent)
INSERT INTO messages (conversation_id, direction, type, content, status, created_at) VALUES
('a0000000-0000-0000-0000-000000000005', 'inbound', 'text', 'Tengo una duda sobre mi evento', 'sent', NOW() - INTERVAL '45 minutes'),
('a0000000-0000-0000-0000-000000000005', 'outbound', 'interactive', 'Hola! Soy Charló. ¿En qué puedo ayudarte?', 'sent', NOW() - INTERVAL '45 minutes' + INTERVAL '2 seconds'),
('a0000000-0000-0000-0000-000000000005', 'inbound', 'interactive', 'menu_talk_agent', 'sent', NOW() - INTERVAL '40 minutes'),
('a0000000-0000-0000-0000-000000000005', 'outbound', 'text', 'Entendido. Un asesor te atenderá en breve. Por favor describe tu duda.', 'sent', NOW() - INTERVAL '40 minutes' + INTERVAL '2 seconds'),
('a0000000-0000-0000-0000-000000000005', 'inbound', 'text', 'Quiero cambiar la fecha de mi fiesta de 17 a 20 de junio', 'sent', NOW() - INTERVAL '1 minute'),
('a0000000-0000-0000-0000-000000000005', 'outbound', 'text', 'Asesor: Entendido, Laura. Voy a verificar la disponibilidad para el 20 de junio. Un momento por favor.', 'sent', NOW() - INTERVAL '1 minute' + INTERVAL '2 seconds');

-- Patricia Ruiz conversation
INSERT INTO messages (conversation_id, direction, type, content, status, created_at) VALUES
('a0000000-0000-0000-0000-000000000006', 'inbound', 'text', 'Buenos dias', 'sent', NOW() - INTERVAL '3 hours'),
('a0000000-0000-0000-0000-000000000006', 'outbound', 'interactive', 'Buenos días! Soy Charló, tu asistente de cobranza. ¿En qué puedo ayudarte?', 'sent', NOW() - INTERVAL '3 hours' + INTERVAL '2 seconds'),
('a0000000-0000-0000-0000-000000000006', 'inbound', 'interactive', 'menu_view_debt', 'sent', NOW() - INTERVAL '2 hours 50 minutes'),
('a0000000-0000-0000-0000-000000000006', 'outbound', 'text', 'Tus deudas pendientes son:\n\n1. Boda completa - $20,000 (vence 20 May) - VENCIDA\n2. Música en vivo - $5,000 (vence 30 Jun)\n\nTotal: $25,000\n\n¿Qué deseas hacer?', 'sent', NOW() - INTERVAL '2 hours 50 minutes' + INTERVAL '2 seconds'),
('a0000000-0000-0000-0000-000000000006', 'inbound', 'interactive', 'menu_make_payment', 'sent', NOW() - INTERVAL '20 minutes'),
('a0000000-0000-0000-0000-000000000006', 'outbound', 'text', 'Para realizar el pago, depósito a:\n\nBanco: Azteca\nCBU: 5263540165817087\nAlias: Alebrijes Teotihuacan\n\nUna vez realizado, envía tu comprobante.', 'sent', NOW() - INTERVAL '20 minutes' + INTERVAL '2 seconds');
