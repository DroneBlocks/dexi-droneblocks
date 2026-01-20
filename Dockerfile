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
