# Usar Node.js 20 Alpine (imagen ligera)
FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias (todas, incluyendo devDependencies para el build)
RUN npm ci

# Generar cliente Prisma
RUN npx prisma generate

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Limpiar devDependencies para reducir tamaño
RUN npm prune --production

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3001

# Exponer puerto
EXPOSE 3001

# Comando de inicio
CMD ["node", "dist/index.js"]
