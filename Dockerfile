# NovelForge - Full-stack Dockerfile for Render deployment
# Builds client (React+Vite) and runs server (Hono+SQLite) serving frontend

FROM node:20-alpine AS base
RUN npm install -g pnpm

# ---- Stage 1: Build frontend ----
FROM base AS client-build
WORKDIR /app

# Copy workspace config + all package.json files first (for pnpm install)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/client/package.json ./packages/client/

# Install client dependencies (including devDependencies for build)
RUN pnpm install --filter client --frozen-lockfile

# Copy client source code
COPY packages/client/ ./packages/client/

# Build frontend
WORKDIR /app/packages/client
RUN npx vite build

# ---- Stage 2: Production server ----
FROM base AS server
WORKDIR /app

# Copy workspace config + server package.json
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/server/package.json ./packages/server/

# Install server dependencies (prod only)
RUN pnpm install --filter server --prod --frozen-lockfile

# Copy server source code
COPY packages/server/ ./packages/server/

# Copy built frontend from stage 1
COPY --from=client-build /app/packages/client/dist ./packages/client/dist

# Set environment
ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

WORKDIR /app/packages/server
CMD ["npx", "tsx", "src/index.ts"]
