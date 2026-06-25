# NovelForge - Full-stack Dockerfile for Render/Railway deployment
# Builds both client (React + Vite) and server (Hono + SQLite)

FROM node:20-alpine AS base
RUN npm install -g pnpm

# Stage 1: Build frontend
FROM base AS client-build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY packages/client/package.json ./packages/client/
RUN pnpm install --frozen-lockfile
COPY packages/client/ ./packages/client/
WORKDIR /app/packages/client
RUN npx vite build

# Stage 2: Build + run server (serves frontend static files)
FROM base AS server
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY packages/server/package.json ./packages/server/
RUN pnpm install --frozen-lockfile

COPY packages/server/ ./packages/server/
COPY --from=client-build /app/packages/client/dist ./packages/client/dist

# Set environment for production
ENV NODE_ENV=production
ENV PORT=10000

# Expose port (Render uses 10000 by default)
EXPOSE 10000

# Start server (tsx runs TypeScript directly, no build step needed)
WORKDIR /app/packages/server
CMD ["npx", "tsx", "src/index.ts"]
