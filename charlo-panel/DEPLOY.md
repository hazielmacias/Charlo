# Deploy Charló Panel a Vercel

## Pré-requisitos
- Cuenta en [vercel.com](https://vercel.com)
- Repositorio en GitHub (ya creado: `https://github.com/hazielmacias/Charlo.git`)

## Paso 1: Conectar repositorio

1. Ir a [vercel.com/new](https://vercel.com/new)
2. Importar el repositorio `hazielmacias/Charlo`
3. Framework: **Vite**
4. Root Directory: `charlo-panel`
5. Build Command: `npm run build`
6. Output Directory: `dist`

## Paso 2: Variables de entorno

Agregar en Vercel Dashboard → Settings → Environment Variables:

| Variable | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://oqhoebtjqvbgwhdxszmk.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xaG9lYnRqcXZiZ3doZHhzem1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MDIxMDQsImV4cCI6MjA5NjM3ODEwNH0.nb-jzuCTV4p-G7LccFnUoZNkyaOHmLExT7inoISKfJY` |

## Paso 3: Deploy

### Opción A: Deploy automático (recomendado)
- Push a `main` branch → Vercel deploy automáticamente
- PRs → Deploy de preview

### Opción B: Deploy manual
```bash
npm i -g vercel
vercel login
cd charlo-panel
vercel --prod
```

## Paso 4: Dominio personalizado (opcional)

1. Vercel Dashboard → Settings → Domains
2. Agregar dominio personalizado
3. Configurar DNS:
   - Tipo: CNAME
   - Nombre: `@` o `www`
   - Valor: `cname.vercel-dns.com`

## Paso 5: Verificar

- [ ] Site carga correctamente
- [ ] Login funciona
- [ ] Dashboard muestra datos
- [ ] HTTPS activo (automático en Vercel)

## Variables de entorno (producción)

```
VITE_SUPABASE_URL=https://oqhoebtjqvbgwhdxszmk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Notas

- Vercel ag automáticamente SSL (HTTPS)
- Deploy previews se generan para cada PR
- Edge Functions de Supabase ya están en producción
- Webhook URL de Meta apuntará a la URL de Vercel
