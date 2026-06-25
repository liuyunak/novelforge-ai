# NovelForge Server Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript (if needed)
RUN pnpm run build 2>/dev/null || true

# Expose port
EXPOSE 3000

# Start command
CMD ["npx", "tsx", "src/index.ts"]
