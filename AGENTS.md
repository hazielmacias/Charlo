# AGENTS.md

## Project: Charló

WhatsApp debt collection chatbot + admin panel. MVP for internal use (single company).

## Stack

- **Backend/DB:** Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **WhatsApp:** Meta Cloud API (official, not Twilio)
- **Scheduler:** pg_cron (Supabase) for payment reminders

## Key Commands

```bash
# Frontend
npm run dev          # Vite dev server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check (if configured)

# Supabase
supabase init        # Initialize local project
supabase login       # Authenticate
supabase link --project-ref <ref>  # Link to remote
supabase functions serve --env-file .env.local  # Run Edge Functions locally
supabase functions deploy <name>   # Deploy single function
```

## Architecture

- `src/` — React panel (Vite)
- `supabase/functions/` — Deno Edge Functions (webhook, send, reminders, receipt processing)
- WhatsApp messages flow: Meta → webhook Edge Function → Supabase DB → panel reflects changes
- Recordatorios: pg_cron triggers send-reminders function every 15min, validates 8AM-8PM local time before sending

## Conventions

- UI: Minimalist, Apple HIG inspired. Blue tones, rounded corners, clean typography. Use shadcn/ui components.
- WhatsApp interactive buttons: max 3 per message (Reply Buttons) or 10 options (List Messages). Must send within 24h of last user message.
- Receipts stored in Supabase Storage bucket `receipts/` with path `{client_id}/{timestamp}_{filename}`
- All Edge Functions must verify webhook signatures (HMAC SHA-256) from Meta before processing.

## Gotchas

- WhatsApp 24h window: interactive messages only work within 24h of user's last message. Outside, use approved templates.
- Supabase Edge Functions use Deno, not Node. Use `import` syntax, not `require()`. npm packages via `npm:` prefix.
- pg_cron runs inside PostgreSQL. Use `pg_net` for async HTTP from triggers.
- RLS is enabled on all tables. Edge Functions use service_role key to bypass. Panel uses anon/authenticated key.
