# NovelForge - Full-stack Dockerfile for Render deployment
# Builds client (React+Vite) and runs server (Hono+SQLite) serving frontend
# Uses npm to avoid pnpm version compatibility issues with Node 20

FROM node:20-alpine AS base

# ---- Stage 1: Build frontend ----
FROM base AS client-build
WORKDIR /app/packages/client

COPY packages/client/package.json ./
RUN npm install

COPY packages/client/ ./
RUN npx vite build

# ---- Stage 2: Production server ----
FROM base AS server
WORKDIR /app

# Copy server
COPY packages/server/ ./packages/server/

# Copy built frontend (matches path resolved by server/src/index.ts)
COPY --from=client-build /app/packages/client/dist ./packages/client/dist

ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000

WORKDIR /app/packages/server
CMD ["npx", "tsx", "src/index.ts"]
