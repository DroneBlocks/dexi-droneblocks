# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:20-slim AS runner

WORKDIR /app

# Install runtime utilities:
#   - iw + network-manager: WiFi SSID detection + connection management
#   - procps: provides `top` for /api/system-status Top Processes panel
RUN apt-get update && apt-get install -y --no-install-recommends iw network-manager procps && rm -rf /var/lib/apt/lists/*

# Copy built output
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./

# Set environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

# Run the server
CMD ["node", ".output/server/index.mjs"]
