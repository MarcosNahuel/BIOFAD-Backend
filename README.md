# BIOFAD Backend

API Backend para Sistema de Laboratorio de Análisis Clínicos BIOFAD.

## 🚀 Tecnologías

- **Node.js** 20+
- **Express** - Framework web
- **TypeScript** - Tipado estático
- **Prisma** - ORM para PostgreSQL
- **Supabase** - Base de datos PostgreSQL + Auth
- **Puppeteer** - Generación de PDFs

## 📋 Requisitos Previos

- Node.js 20 o superior
- npm o yarn
- Cuenta en Supabase
- PostgreSQL (vía Supabase)

## 🛠️ Instalación Local

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma
npx prisma generate

# Modo desarrollo
npm run dev
```

El servidor correrá en `http://localhost:3001`

## 🔐 Variables de Entorno

Crear archivo `.env` en la raíz:

```env
DATABASE_URL="postgresql://user:password@host:5432/database"
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="eyJhbGc..."
PORT=3001
CORS_ORIGIN="http://localhost:3000"
```

## 📦 Scripts Disponibles

```bash
npm run dev          # Servidor desarrollo con hot-reload
npm run build        # Compilar TypeScript a JavaScript
npm start            # Ejecutar versión compilada
npm run prisma:generate  # Generar cliente Prisma
npm run prisma:push      # Sincronizar schema con DB
npm run prisma:studio    # Abrir Prisma Studio
```

## 🐳 Docker

```bash
# Construir imagen
docker build -t biofad-backend .

# Ejecutar contenedor
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://..." \
  -e SUPABASE_URL="https://..." \
  -e SUPABASE_ANON_KEY="..." \
  biofad-backend
```

## 🌐 Deploy en Producción

### EasyPanel

1. Crear servicio en EasyPanel
2. Conectar este repositorio Git
3. Configurar Dockerfile path: `Dockerfile`
4. Agregar variables de entorno
5. Deploy

### VPS Manual

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/BIOFAD-Backend.git
cd BIOFAD-Backend

# Instalar dependencias
npm ci

# Generar Prisma
npx prisma generate

# Compilar
npm run build

# Ejecutar con PM2
pm2 start dist/index.js --name biofad-backend
pm2 save
```

## 📚 API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/pacientes?dni=X` | Buscar paciente por DNI |
| GET | `/api/ordenes` | Listar todas las órdenes |
| GET | `/api/ordenes/:id` | Obtener detalle de orden |
| POST | `/api/ordenes` | Crear nueva orden |
| PUT | `/api/ordenes/:id/resultados` | Guardar resultados |
| GET | `/api/determinaciones` | Listar determinaciones |
| POST | `/api/determinaciones` | Crear determinación |
| PUT | `/api/determinaciones/:id` | Actualizar determinación |
| DELETE | `/api/determinaciones/:id` | Eliminar determinación |

## 🔗 Repositorio Frontend

[BIOFAD-Frontend](https://github.com/tu-usuario/BIOFAD-Frontend)

## 📄 Licencia

MIT
