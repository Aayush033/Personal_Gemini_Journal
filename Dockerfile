# Stage 1: Build Frontend and Server Bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source tree and configuration
COPY . .

# Compile Vite client assets and esbuild server CJS bundle
RUN npm run build

# Stage 2: Minimal Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled bundles and assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json

# Expose standard Cloud Run port
EXPOSE 8080

# Run Express production server
CMD ["node", "dist/server.cjs"]
