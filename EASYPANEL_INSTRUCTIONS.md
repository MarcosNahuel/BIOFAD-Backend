# Instrucciones de Despliegue en EasyPanel para el Backend

## 1. Configuración del Servicio

Al crear el servicio en EasyPanel (App), utiliza la siguiente configuración:

- **Source (Fuente)**: GitHub (selecciona tu repositorio `FLOR`)
- **Build Path (Ruta de construcción)**: `/backend`
- **DockerfilePath**: `Dockerfile` (o déjalo en blanco si detecta automáticamente)
- **Port (Puerto)**: `3001`

## 2. Variables de Entorno

Copia y pega las siguientes variables en la sección "Environment" de tu servicio en EasyPanel.
Nota: Asegúrate de que `DATABASE_URL` sea correcta.

```env
DATABASE_URL=postgresql://postgres.zaqpiuwacinvebfttygm:2Bmd8vhY9*F*35q@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
SUPABASE_URL=https://zaqpiuwacinvebfttygm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphcXBpdXdhY2ludmViZnR0eWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzOTczMDYsImV4cCI6MjA2MTk3MzMwNn0.RFqwSfGOapP8hMjpUNSQMMf8tNcDEfjsj2oyJwv6GM0
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://tu-dominio-frontend.com
GEMINI_API_KEY=AIzaSyAYjpMzAvF4-zjv3mmILo_aTxgjQlGVyn0
```

> **Importante**: Cambia `CORS_ORIGIN` por la URL real de tu frontend una vez lo tengas desplegado (ej. `https://flor-frontend.easypanel.host`). Si estás probando y el frontend también está en EasyPanel, usa su URL pública.

## 3. Base de Datos y Migraciones

Tu `DATABASE_URL` usa **PgBouncer** (indicado por `pgbouncer=true` y el puerto `6543`).
Prisma Client funciona bien con esto para consultas normales.

Sin embargo, para **migraciones** (`prisma migrate` o `prisma db push`), Prisma necesita una conexión directa.
Si necesitas correr migraciones desde EasyPanel, deberás agregar una variable `DIRECT_URL` que apunte al puerto 5432 de Supabase (sin pgbouncer) y configurar `schema.prisma` para usarla.

**Recomendación**: Corre las migraciones (`npx prisma db push`) desde tu computadora local antes de desplegar, usando la URL de conexión directa en tu `.env` local.

## 4. Verificar Despliegue

Una vez desplegado, revisa los logs en EasyPanel. Deberías ver algo como:
`Server running on port 3001`
