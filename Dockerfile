# NovelForge - Full-stack Dockerfile for Render deployment
# Builds client (React+Vite) and runs server (Hono+SQLite) serving frontend

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
WORKDIR /app/packages/server

# Install server dependencies first (cached layer)
COPY packages/server/package.json ./
RUN npm install --omit=dev

# Copy server source
COPY packages/server/ ./

# Copy built frontend (path matches server/src/index.ts: ../../client/dist)
COPY --from=client-build /app/packages/client/dist /app/packages/client/dist

ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000

CMD ["npx", "tsx", "src/index.ts"]
